import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { join, extname, basename } from 'node:path';
import { ChunkingService } from './chunking.service.js';
import { DriftService } from './drift.service.js';
import { createLogger } from '../logging/index.js';
import { createDocumentId } from '../types/brands.js';
import { ok, err } from '../types/result.js';
import type { CodeGraphService } from './code-graph.service.js';
import type { ManifestService } from './manifest.service.js';
import type { EmbeddingEngine } from '../db/embeddings.js';
import type { LanceStore } from '../db/lance.js';
import type { DocumentId } from '../types/brands.js';
import type { Document } from '../types/document.js';
import type { TypedStoreManifest, TypedFileState } from '../types/manifest.js';
import type { ProgressCallback } from '../types/progress.js';
import type { Result } from '../types/result.js';
import type { Store, FileStore, RepoStore } from '../types/store.js';

const logger = createLogger('index-service');

interface IndexResult {
  filesIndexed: number;
  chunksCreated: number;
  timeMs: number;
}

interface IndexOptions {
  chunkSize?: number;
  chunkOverlap?: number;
  codeGraphService?: CodeGraphService;
  concurrency?: number;
  manifestService?: ManifestService;
  ignorePatterns?: readonly string[];
}

interface IncrementalIndexResult extends IndexResult {
  filesAdded: number;
  filesModified: number;
  filesDeleted: number;
  filesUnchanged: number;
}

const TEXT_EXTENSIONS = new Set([
  '.txt',
  '.md',
  '.js',
  '.ts',
  '.jsx',
  '.tsx',
  '.json',
  '.yaml',
  '.yml',
  '.html',
  '.css',
  '.scss',
  '.less',
  '.py',
  '.rb',
  '.go',
  '.rs',
  '.java',
  '.c',
  '.cpp',
  '.h',
  '.hpp',
  '.sh',
  '.bash',
  '.zsh',
  '.sql',
  '.xml',
]);

/** Default directories to always ignore (in addition to config patterns) */
const DEFAULT_IGNORE_DIRS = ['node_modules', '.git', '.bluera', 'dist', 'build'];

/**
 * Parse ignore patterns into directory names and file extension patterns.
 * Supports: 'dirname/**', 'dirname', '*.ext'
 */
function parseIgnorePatterns(patterns: readonly string[]): {
  dirs: Set<string>;
  filePatterns: Array<(filename: string) => boolean>;
} {
  const dirs = new Set<string>(DEFAULT_IGNORE_DIRS);
  const filePatterns: Array<(filename: string) => boolean> = [];

  for (const pattern of patterns) {
    if (pattern.endsWith('/**')) {
      // Directory pattern: 'node_modules/**' -> 'node_modules'
      dirs.add(pattern.slice(0, -3));
    } else if (pattern.startsWith('*.')) {
      // Extension pattern: '*.min.js' -> matches files ending with '.min.js'
      const ext = pattern.slice(1); // Remove leading '*'
      filePatterns.push((filename) => filename.endsWith(ext));
    } else if (!pattern.includes('/') && !pattern.includes('*')) {
      // Simple directory name: 'node_modules' -> treat as directory
      dirs.add(pattern);
    }
  }

  return { dirs, filePatterns };
}

export class IndexService {
  private readonly lanceStore: LanceStore;
  private readonly embeddingEngine: EmbeddingEngine;
  private readonly chunker: ChunkingService;
  private readonly codeGraphService: CodeGraphService | undefined;
  private readonly manifestService: ManifestService | undefined;
  private readonly driftService: DriftService;
  private readonly concurrency: number;
  private readonly ignoreDirs: Set<string>;
  private readonly ignoreFilePatterns: Array<(filename: string) => boolean>;

  constructor(
    lanceStore: LanceStore,
    embeddingEngine: EmbeddingEngine,
    options: IndexOptions = {}
  ) {
    this.lanceStore = lanceStore;
    this.embeddingEngine = embeddingEngine;
    this.chunker = new ChunkingService({
      chunkSize: options.chunkSize ?? 768,
      chunkOverlap: options.chunkOverlap ?? 100,
    });
    this.codeGraphService = options.codeGraphService;
    this.manifestService = options.manifestService;
    this.driftService = new DriftService();
    this.concurrency = options.concurrency ?? 4;

    const parsed = parseIgnorePatterns(options.ignorePatterns ?? []);
    this.ignoreDirs = parsed.dirs;
    this.ignoreFilePatterns = parsed.filePatterns;
  }

  async indexStore(store: Store, onProgress?: ProgressCallback): Promise<Result<IndexResult>> {
    logger.info(
      {
        storeId: store.id,
        storeName: store.name,
        storeType: store.type,
      },
      'Starting store indexing'
    );

    try {
      if (store.type === 'file' || store.type === 'repo') {
        return await this.indexFileStore(store, onProgress);
      }

      logger.error(
        { storeId: store.id, storeType: store.type },
        'Unsupported store type for indexing'
      );
      return err(new Error(`Indexing not supported for store type: ${store.type}`));
    } catch (error) {
      logger.error(
        {
          storeId: store.id,
          error: error instanceof Error ? error.message : String(error),
        },
        'Store indexing failed'
      );
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Incrementally index a store, only processing changed files.
   * Requires manifestService to be configured.
   *
   * @param store - The store to index
   * @param onProgress - Optional progress callback
   * @returns Result with incremental index statistics
   */
  async indexStoreIncremental(
    store: Store,
    onProgress?: ProgressCallback
  ): Promise<Result<IncrementalIndexResult>> {
    if (this.manifestService === undefined) {
      return err(new Error('ManifestService required for incremental indexing'));
    }

    if (store.type !== 'file' && store.type !== 'repo') {
      return err(new Error(`Incremental indexing not supported for store type: ${store.type}`));
    }

    logger.info(
      {
        storeId: store.id,
        storeName: store.name,
        storeType: store.type,
      },
      'Starting incremental store indexing'
    );

    const startTime = Date.now();

    try {
      // Load manifest
      const manifest = await this.manifestService.load(store.id);

      // Scan current files
      const filePaths = await this.scanDirectory(store.path);
      const currentFiles = await Promise.all(
        filePaths.map((path) => this.driftService.getFileState(path))
      );

      // Detect changes
      const drift = await this.driftService.detectChanges(manifest, currentFiles);

      logger.debug(
        {
          storeId: store.id,
          added: drift.added.length,
          modified: drift.modified.length,
          deleted: drift.deleted.length,
          unchanged: drift.unchanged.length,
        },
        'Drift detection complete'
      );

      // Collect document IDs to delete (from modified and deleted files)
      const documentIdsToDelete: DocumentId[] = [];
      for (const path of [...drift.modified, ...drift.deleted]) {
        const fileState = manifest.files[path];
        if (fileState !== undefined) {
          documentIdsToDelete.push(...fileState.documentIds);
        }
      }

      // Delete old documents
      if (documentIdsToDelete.length > 0) {
        await this.lanceStore.deleteDocuments(store.id, documentIdsToDelete);
        logger.debug(
          { storeId: store.id, count: documentIdsToDelete.length },
          'Deleted old documents'
        );
      }

      // Process new and modified files
      const filesToProcess = [...drift.added, ...drift.modified];
      const totalFiles = filesToProcess.length;

      onProgress?.({
        type: 'start',
        current: 0,
        total: totalFiles,
        message: `Processing ${String(totalFiles)} changed files`,
      });

      const documents: Document[] = [];
      const newManifestFiles: Record<string, TypedFileState> = {};
      let filesProcessed = 0;

      // Keep unchanged files in manifest
      for (const path of drift.unchanged) {
        const existingState = manifest.files[path];
        if (existingState !== undefined) {
          newManifestFiles[path] = existingState;
        }
      }

      // Process changed files in parallel batches
      for (let i = 0; i < filesToProcess.length; i += this.concurrency) {
        const batch = filesToProcess.slice(i, i + this.concurrency);

        const batchResults = await Promise.all(
          batch.map(async (filePath) => {
            const result = await this.processFile(filePath, store);
            const documentIds = result.documents.map((d) => d.id);

            // Create file state for manifest
            const { state } = await this.driftService.createFileState(filePath, documentIds);

            return {
              filePath,
              documents: result.documents,
              fileState: state,
            };
          })
        );

        // Collect results
        for (const result of batchResults) {
          documents.push(...result.documents);
          newManifestFiles[result.filePath] = result.fileState;
        }

        filesProcessed += batch.length;

        onProgress?.({
          type: 'progress',
          current: filesProcessed,
          total: totalFiles,
          message: `Processed ${String(filesProcessed)}/${String(totalFiles)} files`,
        });
      }

      // Add new documents
      if (documents.length > 0) {
        await this.lanceStore.addDocuments(store.id, documents);
        // Recreate FTS index
        await this.lanceStore.createFtsIndex(store.id);
      }

      // Save updated manifest
      const updatedManifest: TypedStoreManifest = {
        version: 1,
        storeId: store.id,
        indexedAt: new Date().toISOString(),
        files: newManifestFiles,
      };
      await this.manifestService.save(updatedManifest);

      onProgress?.({
        type: 'complete',
        current: totalFiles,
        total: totalFiles,
        message: 'Incremental indexing complete',
      });

      const timeMs = Date.now() - startTime;

      logger.info(
        {
          storeId: store.id,
          storeName: store.name,
          filesAdded: drift.added.length,
          filesModified: drift.modified.length,
          filesDeleted: drift.deleted.length,
          filesUnchanged: drift.unchanged.length,
          chunksCreated: documents.length,
          timeMs,
        },
        'Incremental indexing complete'
      );

      return ok({
        filesIndexed: filesToProcess.length,
        chunksCreated: documents.length,
        timeMs,
        filesAdded: drift.added.length,
        filesModified: drift.modified.length,
        filesDeleted: drift.deleted.length,
        filesUnchanged: drift.unchanged.length,
      });
    } catch (error) {
      logger.error(
        {
          storeId: store.id,
          error: error instanceof Error ? error.message : String(error),
        },
        'Incremental indexing failed'
      );
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  private async indexFileStore(
    store: FileStore | RepoStore,
    onProgress?: ProgressCallback
  ): Promise<Result<IndexResult>> {
    const startTime = Date.now();

    // Clear existing documents before full re-index to prevent duplicates
    await this.lanceStore.clearAllDocuments(store.id);

    // Clear stale manifest to ensure fresh incremental indexing later
    if (this.manifestService) {
      await this.manifestService.delete(store.id);
    }

    const files = await this.scanDirectory(store.path);
    const documents: Document[] = [];
    let filesProcessed = 0;

    logger.debug(
      {
        storeId: store.id,
        path: store.path,
        fileCount: files.length,
        concurrency: this.concurrency,
      },
      'Files scanned for indexing'
    );

    // Collect source files for code graph building
    const sourceFiles: Array<{ path: string; content: string }> = [];

    // Emit start event
    onProgress?.({
      type: 'start',
      current: 0,
      total: files.length,
      message: 'Starting index',
    });

    // Process files in parallel batches
    for (let i = 0; i < files.length; i += this.concurrency) {
      const batch = files.slice(i, i + this.concurrency);

      const batchResults = await Promise.all(
        batch.map((filePath) => this.processFile(filePath, store))
      );

      // Collect results from batch
      for (const result of batchResults) {
        documents.push(...result.documents);
        if (result.sourceFile !== undefined) {
          sourceFiles.push(result.sourceFile);
        }
      }

      filesProcessed += batch.length;

      // Emit progress event after each batch
      onProgress?.({
        type: 'progress',
        current: filesProcessed,
        total: files.length,
        message: `Indexed ${String(filesProcessed)}/${String(files.length)} files`,
      });
    }

    if (documents.length > 0) {
      await this.lanceStore.addDocuments(store.id, documents);
      // Create FTS index for full-text search
      await this.lanceStore.createFtsIndex(store.id);
    }

    // Build and save code graph if service is available and we have source files
    if (this.codeGraphService && sourceFiles.length > 0) {
      const graph = await this.codeGraphService.buildGraph(sourceFiles);
      await this.codeGraphService.saveGraph(store.id, graph);
    }

    // Emit complete event
    onProgress?.({
      type: 'complete',
      current: files.length,
      total: files.length,
      message: 'Indexing complete',
    });

    const timeMs = Date.now() - startTime;

    logger.info(
      {
        storeId: store.id,
        storeName: store.name,
        filesIndexed: filesProcessed,
        chunksCreated: documents.length,
        sourceFilesForGraph: sourceFiles.length,
        timeMs,
      },
      'Store indexing complete'
    );

    return ok({
      filesIndexed: filesProcessed,
      chunksCreated: documents.length,
      timeMs,
    });
  }

  /**
   * Process a single file: read, chunk, embed, and return documents.
   * Extracted for parallel processing.
   */
  private async processFile(
    filePath: string,
    store: FileStore | RepoStore
  ): Promise<{
    documents: Document[];
    sourceFile: { path: string; content: string } | undefined;
  }> {
    const content = await readFile(filePath, 'utf-8');
    const fileHash = createHash('md5').update(content).digest('hex');
    const chunks = this.chunker.chunk(content, filePath);

    const ext = extname(filePath).toLowerCase();
    const fileName = basename(filePath).toLowerCase();
    const fileType = this.classifyFileType(ext, fileName, filePath);

    // Track source file for code graph (supports JS/TS, Python, Rust, Go)
    const sourceFile = ['.ts', '.tsx', '.js', '.jsx', '.py', '.rs', '.go'].includes(ext)
      ? { path: filePath, content }
      : undefined;

    // Skip files with no chunks (empty files)
    if (chunks.length === 0) {
      return { documents: [], sourceFile };
    }

    // Batch embed all chunks from this file
    const chunkContents = chunks.map((c) => c.content);
    const vectors = await this.embeddingEngine.embedBatch(chunkContents);

    const documents: Document[] = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const vector = vectors[i];

      // Fail fast if chunk/vector mismatch (should never happen)
      if (chunk === undefined || vector === undefined) {
        throw new Error(
          `Chunk/vector mismatch at index ${String(i)}: chunk=${String(chunk !== undefined)}, vector=${String(vector !== undefined)}`
        );
      }

      const chunkId =
        chunks.length > 1
          ? `${store.id}-${fileHash}-${String(chunk.chunkIndex)}`
          : `${store.id}-${fileHash}`;

      documents.push({
        id: createDocumentId(chunkId),
        content: chunk.content,
        vector,
        metadata: {
          type: chunks.length > 1 ? 'chunk' : 'file',
          storeId: store.id,
          path: filePath,
          indexedAt: new Date().toISOString(),
          fileHash,
          chunkIndex: chunk.chunkIndex,
          totalChunks: chunk.totalChunks,
          fileType,
          sectionHeader: chunk.sectionHeader,
          functionName: chunk.functionName,
          hasDocComments: /\/\*\*[\s\S]*?\*\//.test(chunk.content),
          docSummary: chunk.docSummary,
        },
      });
    }

    return { documents, sourceFile };
  }

  private async scanDirectory(dir: string): Promise<string[]> {
    const files: string[] = [];
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        // Skip directories matching ignore patterns
        if (!this.ignoreDirs.has(entry.name)) {
          files.push(...(await this.scanDirectory(fullPath)));
        }
      } else if (entry.isFile()) {
        // Skip files matching ignore patterns (e.g., *.min.js, *.map)
        const shouldIgnore = this.ignoreFilePatterns.some((matcher) => matcher(entry.name));
        if (shouldIgnore) {
          continue;
        }

        const ext = extname(entry.name).toLowerCase();
        if (TEXT_EXTENSIONS.has(ext)) {
          files.push(fullPath);
        }
      }
    }

    return files;
  }

  /**
   * Classify file type for ranking purposes.
   * Documentation files rank higher than source code for documentation queries.
   * Phase 4: Enhanced to detect internal implementation files.
   */
  private classifyFileType(ext: string, fileName: string, filePath: string): string {
    // Documentation files
    if (ext === '.md') {
      // CHANGELOG files get their own category for intent-based penalties
      if (fileName === 'changelog.md' || fileName === 'changes.md' || /changelog/i.test(fileName)) {
        return 'changelog';
      }
      // Special doc files get highest priority
      if (['readme.md', 'migration.md', 'contributing.md'].includes(fileName)) {
        return 'documentation-primary';
      }
      // Check path for documentation indicators
      if (/\/(docs?|documentation|guides?|tutorials?|articles?)\//i.test(filePath)) {
        return 'documentation';
      }
      return 'documentation';
    }

    // Test files
    if (/\.(test|spec)\.[jt]sx?$/.test(fileName) || /\/__tests__\//.test(filePath)) {
      return 'test';
    }

    // Example files
    if (/\/examples?\//.test(filePath) || fileName.includes('example')) {
      return 'example';
    }

    // Config files
    if (/^(tsconfig|package|\.eslint|\.prettier|vite\.config|next\.config)/i.test(fileName)) {
      return 'config';
    }

    // Source code - distinguish between internal and public-facing
    if (['.ts', '.tsx', '.js', '.jsx', '.py', '.go', '.rs', '.java'].includes(ext)) {
      // Internal implementation files (monorepo packages, lib internals)
      // These patterns indicate internal/core implementation code
      if (this.isInternalImplementation(filePath, fileName)) {
        return 'source-internal';
      }
      return 'source';
    }

    return 'other';
  }

  /**
   * Detect if a source file is internal implementation code.
   * Internal code should rank lower than public-facing APIs and docs.
   */
  private isInternalImplementation(filePath: string, fileName: string): boolean {
    const pathLower = filePath.toLowerCase();
    const fileNameLower = fileName.toLowerCase();

    // Monorepo internal packages (like Vue's packages/*/src/)
    if (/\/packages\/[^/]+\/src\//.test(pathLower)) {
      // Exception: index files often export public APIs
      if (fileNameLower === 'index.ts' || fileNameLower === 'index.js') {
        return false;
      }
      return true;
    }

    // Internal/core directories
    if (/\/(internal|lib\/core|core\/src|_internal|private)\//.test(pathLower)) {
      return true;
    }

    // Compiler/transform internals (often not what users want)
    if (
      /\/(compiler|transforms?|parse|codegen)\//.test(pathLower) &&
      !fileNameLower.includes('readme') &&
      !fileNameLower.includes('index')
    ) {
      return true;
    }

    return false;
  }
}

/**
 * Classify web content type based on URL patterns and page title.
 * Used for ranking boosts similar to local file classification.
 */
export function classifyWebContentType(url: string, title?: string): string {
  const urlLower = url.toLowerCase();
  const titleLower = (title ?? '').toLowerCase();

  // API reference documentation → documentation-primary (1.8x boost)
  if (
    /\/api[-/]?(ref|reference|docs?)?\//i.test(urlLower) ||
    /api\s*(reference|documentation)/i.test(titleLower)
  ) {
    return 'documentation-primary';
  }

  // Getting started / tutorials → documentation-primary (1.8x boost)
  if (
    /\/(getting[-_]?started|quickstart|tutorial|setup)\b/i.test(urlLower) ||
    /(getting started|quickstart|tutorial)/i.test(titleLower)
  ) {
    return 'documentation-primary';
  }

  // General docs paths → documentation (1.5x boost)
  if (/\/(docs?|documentation|reference|learn|manual|guide)/i.test(urlLower)) {
    return 'documentation';
  }

  // Examples and demos → example (1.4x boost)
  if (/\/(examples?|demos?|samples?|cookbook)/i.test(urlLower)) {
    return 'example';
  }

  // Changelog → changelog (special handling in intent boosts)
  if (/changelog|release[-_]?notes/i.test(urlLower)) {
    return 'changelog';
  }

  // Blog posts → lower priority
  if (/\/blog\//i.test(urlLower)) {
    return 'other';
  }

  // Web content without specific path indicators is treated as documentation
  return 'documentation';
}
