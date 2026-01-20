import { readFile, access, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { createDocumentId } from '../types/brands.js';
import { StoreManifestSchema, createEmptyManifest } from '../types/manifest.js';
import { atomicWriteFile } from '../utils/atomic-write.js';
import type { StoreId } from '../types/brands.js';
import type { TypedStoreManifest, TypedFileState } from '../types/manifest.js';

/**
 * Service for managing store manifests.
 *
 * Manifests track the state of indexed files to enable incremental re-indexing.
 * They are stored in the data directory under manifests/{storeId}.manifest.json.
 */
export class ManifestService {
  private readonly manifestsDir: string;

  constructor(dataDir: string) {
    this.manifestsDir = join(dataDir, 'manifests');
  }

  /**
   * Initialize the manifests directory.
   */
  async initialize(): Promise<void> {
    await mkdir(this.manifestsDir, { recursive: true });
  }

  /**
   * Get the file path for a store's manifest.
   */
  getManifestPath(storeId: StoreId): string {
    return join(this.manifestsDir, `${storeId}.manifest.json`);
  }

  /**
   * Load a store's manifest.
   * Returns an empty manifest if one doesn't exist.
   * Throws on parse/validation errors (fail fast).
   */
  async load(storeId: StoreId): Promise<TypedStoreManifest> {
    const manifestPath = this.getManifestPath(storeId);

    const exists = await this.fileExists(manifestPath);
    if (!exists) {
      return createEmptyManifest(storeId);
    }

    const content = await readFile(manifestPath, 'utf-8');
    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch (error) {
      throw new Error(
        `Failed to parse manifest at ${manifestPath}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }

    const result = StoreManifestSchema.safeParse(parsed);
    if (!result.success) {
      throw new Error(`Invalid manifest at ${manifestPath}: ${result.error.message}`);
    }

    // Convert to typed manifest with branded types
    return this.toTypedManifest(result.data, storeId);
  }

  /**
   * Save a store's manifest atomically.
   */
  async save(manifest: TypedStoreManifest): Promise<void> {
    const manifestPath = this.getManifestPath(manifest.storeId);

    // Update indexedAt timestamp
    const toSave = {
      ...manifest,
      indexedAt: new Date().toISOString(),
    };

    await atomicWriteFile(manifestPath, JSON.stringify(toSave, null, 2));
  }

  /**
   * Delete a store's manifest.
   * Called when a store is deleted or during full re-index.
   */
  async delete(storeId: StoreId): Promise<void> {
    const manifestPath = this.getManifestPath(storeId);
    const { unlink } = await import('node:fs/promises');

    const exists = await this.fileExists(manifestPath);
    if (exists) {
      await unlink(manifestPath);
    }
  }

  /**
   * Check if a file exists.
   */
  private async fileExists(path: string): Promise<boolean> {
    try {
      await access(path);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Convert a parsed manifest to a typed manifest with branded types.
   */
  private toTypedManifest(
    data: { version: 1; storeId: string; indexedAt: string; files: Record<string, FileStateRaw> },
    storeId: StoreId
  ): TypedStoreManifest {
    const files: Record<string, TypedFileState> = {};

    for (const [path, state] of Object.entries(data.files)) {
      files[path] = {
        mtime: state.mtime,
        size: state.size,
        hash: state.hash,
        documentIds: state.documentIds.map((id) => createDocumentId(id)),
      };
    }

    return {
      version: 1,
      storeId,
      indexedAt: data.indexedAt,
      files,
    };
  }
}

/** Raw file state from parsed JSON (matches FileStateSchema) */
interface FileStateRaw {
  mtime: number;
  size: number;
  hash: string;
  documentIds: string[];
}
