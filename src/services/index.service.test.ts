import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { IndexService } from './index.service.js';
import { LanceStore } from '../db/lance.js';
import { EmbeddingEngine } from '../db/embeddings.js';
import { createStoreId } from '../types/brands.js';
import { rm, mkdtemp, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { FileStore } from '../types/store.js';

describe('IndexService', () => {
  let indexService: IndexService;
  let lanceStore: LanceStore;
  let embeddingEngine: EmbeddingEngine;
  let tempDir: string;
  let testFilesDir: string;
  const storeId = createStoreId('test-store');

  beforeAll(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'index-test-'));
    testFilesDir = join(tempDir, 'files');
    await mkdir(testFilesDir, { recursive: true });

    // Create test files
    await writeFile(join(testFilesDir, 'test1.txt'), 'Hello world, this is a test file.');
    await writeFile(join(testFilesDir, 'test2.md'), '# Heading\n\nSome markdown content here.');

    lanceStore = new LanceStore(tempDir);
    embeddingEngine = new EmbeddingEngine();

    await embeddingEngine.initialize();
    await lanceStore.initialize(storeId);

    indexService = new IndexService(lanceStore, embeddingEngine);
  }, 120000);

  afterAll(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it('indexes a file store', async () => {
    const store: FileStore = {
      type: 'file',
      id: storeId,
      name: 'Test Store',
      path: testFilesDir,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await indexService.indexStore(store);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.documentsIndexed).toBeGreaterThan(0);
    }
  });

  it('chunks large files', async () => {
    // Create a large test file
    const largeContent = 'This is test content. '.repeat(100); // ~2200 chars
    await writeFile(join(testFilesDir, 'large.txt'), largeContent);

    const store: FileStore = {
      type: 'file',
      id: storeId,
      name: 'Test Store',
      path: testFilesDir,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await indexService.indexStore(store);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.chunksCreated).toBeGreaterThan(result.data.documentsIndexed);
    }
  });
});
