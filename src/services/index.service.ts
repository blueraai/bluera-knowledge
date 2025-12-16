import { readFile, readdir, stat } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { createHash } from 'node:crypto';
import type { LanceStore } from '../db/lance.js';
import type { EmbeddingEngine } from '../db/embeddings.js';
import type { Store, FileStore, RepoStore } from '../types/store.js';
import type { Document } from '../types/document.js';
import { createDocumentId } from '../types/brands.js';
import type { Result } from '../types/result.js';
import { ok, err } from '../types/result.js';

interface IndexResult {
  documentsIndexed: number;
  chunksCreated: number;
  timeMs: number;
}

const TEXT_EXTENSIONS = new Set([
  '.txt', '.md', '.js', '.ts', '.jsx', '.tsx', '.json', '.yaml', '.yml',
  '.html', '.css', '.scss', '.less', '.py', '.rb', '.go', '.rs', '.java',
  '.c', '.cpp', '.h', '.hpp', '.sh', '.bash', '.zsh', '.sql', '.xml',
]);

export class IndexService {
  private readonly lanceStore: LanceStore;
  private readonly embeddingEngine: EmbeddingEngine;

  constructor(lanceStore: LanceStore, embeddingEngine: EmbeddingEngine) {
    this.lanceStore = lanceStore;
    this.embeddingEngine = embeddingEngine;
  }

  async indexStore(store: Store): Promise<Result<IndexResult>> {
    const startTime = Date.now();

    try {
      if (store.type === 'file' || store.type === 'repo') {
        return await this.indexFileStore(store);
      }

      return err(new Error(`Indexing not supported for store type: ${store.type}`));
    } catch (error) {
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  private async indexFileStore(store: FileStore | RepoStore): Promise<Result<IndexResult>> {
    const startTime = Date.now();
    const files = await this.scanDirectory(store.path);
    const documents: Document[] = [];

    for (const filePath of files) {
      const content = await readFile(filePath, 'utf-8');
      const vector = await this.embeddingEngine.embed(content);
      const fileHash = createHash('md5').update(content).digest('hex');

      const doc: Document = {
        id: createDocumentId(`${store.id}-${fileHash}`),
        content,
        vector,
        metadata: {
          type: 'file',
          storeId: store.id,
          path: filePath,
          indexedAt: new Date(),
          fileHash,
        },
      };

      documents.push(doc);
    }

    if (documents.length > 0) {
      await this.lanceStore.addDocuments(store.id, documents);
    }

    return ok({
      documentsIndexed: documents.length,
      chunksCreated: documents.length, // Simplified - no chunking yet
      timeMs: Date.now() - startTime,
    });
  }

  private async scanDirectory(dir: string): Promise<string[]> {
    const files: string[] = [];
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        // Skip common ignored directories
        if (!['node_modules', '.git', 'dist', 'build'].includes(entry.name)) {
          files.push(...(await this.scanDirectory(fullPath)));
        }
      } else if (entry.isFile()) {
        const ext = extname(entry.name).toLowerCase();
        if (TEXT_EXTENSIONS.has(ext)) {
          files.push(fullPath);
        }
      }
    }

    return files;
  }
}
