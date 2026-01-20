import { createHash } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import type { TypedStoreManifest, TypedFileState, DriftResult } from '../types/manifest.js';

/**
 * Current state of a file on disk.
 * Used for comparison against manifest.
 */
export interface CurrentFileState {
  path: string;
  mtime: number;
  size: number;
}

/**
 * Service for detecting file changes between disk state and manifest.
 *
 * Uses two-phase detection for efficiency:
 * - Phase 1 (fast): Compare mtime and size
 * - Phase 2 (deep): Compute hash for files that changed in phase 1
 *
 * This approach minimizes disk I/O by avoiding hash computation for unchanged files.
 */
export class DriftService {
  /**
   * Detect changes between current files and manifest.
   *
   * @param manifest - The stored manifest from last index
   * @param currentFiles - Current files on disk with mtime/size
   * @returns Classification of files into added, modified, deleted, unchanged
   */
  async detectChanges(
    manifest: TypedStoreManifest,
    currentFiles: CurrentFileState[]
  ): Promise<DriftResult> {
    const result: DriftResult = {
      added: [],
      modified: [],
      deleted: [],
      unchanged: [],
    };

    // Build a set of current file paths for quick lookup
    const currentPathSet = new Set(currentFiles.map((f) => f.path));
    const manifestPaths = new Set(Object.keys(manifest.files));

    // Find deleted files (in manifest but not on disk)
    for (const path of manifestPaths) {
      if (!currentPathSet.has(path)) {
        result.deleted.push(path);
      }
    }

    // Process current files
    const potentiallyModified: CurrentFileState[] = [];

    for (const file of currentFiles) {
      const manifestState = manifest.files[file.path];

      if (manifestState === undefined) {
        // New file (not in manifest)
        result.added.push(file.path);
      } else {
        // Phase 1: Fast check - compare mtime and size
        if (file.mtime === manifestState.mtime && file.size === manifestState.size) {
          // Same mtime and size - assume unchanged
          result.unchanged.push(file.path);
        } else {
          // mtime or size changed - need phase 2 check
          potentiallyModified.push(file);
        }
      }
    }

    // Phase 2: Deep check - compute hash for potentially modified files
    for (const file of potentiallyModified) {
      const manifestState = manifest.files[file.path];
      if (manifestState === undefined) {
        // Should not happen, but handle gracefully
        result.added.push(file.path);
        continue;
      }

      const currentHash = await this.computeFileHash(file.path);

      if (currentHash === manifestState.hash) {
        // Hash matches - file content unchanged (only metadata changed)
        result.unchanged.push(file.path);
      } else {
        // Hash differs - file actually modified
        result.modified.push(file.path);
      }
    }

    return result;
  }

  /**
   * Get the current state of a file on disk.
   */
  async getFileState(path: string): Promise<CurrentFileState> {
    const stats = await stat(path);
    return {
      path,
      mtime: stats.mtimeMs,
      size: stats.size,
    };
  }

  /**
   * Compute MD5 hash of a file.
   */
  async computeFileHash(path: string): Promise<string> {
    const content = await readFile(path);
    return createHash('md5').update(content).digest('hex');
  }

  /**
   * Create a file state entry for the manifest after indexing.
   *
   * @param path - File path
   * @param documentIds - Document IDs created from this file
   * @returns File state for manifest
   */
  async createFileState(
    path: string,
    documentIds: string[]
  ): Promise<{ state: TypedFileState; hash: string }> {
    const stats = await stat(path);
    const content = await readFile(path);
    const hash = createHash('md5').update(content).digest('hex');

    // Import createDocumentId dynamically to avoid circular deps
    const { createDocumentId } = await import('../types/brands.js');

    return {
      state: {
        mtime: stats.mtimeMs,
        size: stats.size,
        hash,
        documentIds: documentIds.map((id) => createDocumentId(id)),
      },
      hash,
    };
  }
}
