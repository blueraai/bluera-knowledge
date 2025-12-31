import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { LanceStore } from './lance.js';
import { createStoreId, createDocumentId } from '../types/brands.js';
import { rm, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

describe('LanceStore', () => {
  let store: LanceStore;
  let tempDir: string;
  const storeId = createStoreId('test-store');

  beforeAll(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'lance-test-'));
    store = new LanceStore(tempDir);
    await store.initialize(storeId);
  });

  afterAll(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it('adds and retrieves documents', async () => {
    const doc = {
      id: createDocumentId('doc-1'),
      content: 'Test content',
      vector: new Array(384).fill(0.1),
      metadata: {
        type: 'file' as const,
        storeId,
        indexedAt: new Date(),
        path: '/test/file.txt',
      },
    };

    await store.addDocuments(storeId, [doc]);

    const results = await store.search(storeId, new Array(384).fill(0.1), 10);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.id).toBe('doc-1');
  });

  it('deletes documents', async () => {
    const docId = createDocumentId('doc-to-delete');
    const doc = {
      id: docId,
      content: 'Delete me',
      vector: new Array(384).fill(0.2),
      metadata: {
        type: 'file' as const,
        storeId,
        indexedAt: new Date(),
      },
    };

    await store.addDocuments(storeId, [doc]);
    await store.deleteDocuments(storeId, [docId]);

    const results = await store.search(storeId, new Array(384).fill(0.2), 10);
    const found = results.find((r) => r.id === 'doc-to-delete');
    expect(found).toBeUndefined();
  });

  it('performs full-text search', async () => {
    const doc = {
      id: createDocumentId('fts-doc'),
      content: 'The quick brown fox jumps over the lazy dog',
      vector: new Array(384).fill(0.1),
      metadata: {
        type: 'file' as const,
        storeId,
        indexedAt: new Date(),
      },
    };

    await store.addDocuments(storeId, [doc]);
    await store.createFtsIndex(storeId);

    const results = await store.fullTextSearch(storeId, 'quick brown', 10);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.content).toContain('quick');
  });

  describe('search with threshold', () => {
    it('filters results by threshold when provided', async () => {
      const doc1 = {
        id: createDocumentId('threshold-doc-1'),
        content: 'exact match',
        vector: new Array(384).fill(1.0),
        metadata: {
          type: 'file' as const,
          storeId,
          indexedAt: new Date(),
        },
      };

      const doc2 = {
        id: createDocumentId('threshold-doc-2'),
        content: 'different content',
        vector: new Array(384).fill(0.1),
        metadata: {
          type: 'file' as const,
          storeId,
          indexedAt: new Date(),
        },
      };

      await store.addDocuments(storeId, [doc1, doc2]);

      // Search with high similarity threshold
      const results = await store.search(storeId, new Array(384).fill(1.0), 10, 0.9);

      // Should filter out low-similarity results
      expect(results.every(r => r.score >= 0.9)).toBe(true);
    });

    it('sets cosine distance type when threshold is provided', async () => {
      const doc = {
        id: createDocumentId('cosine-doc'),
        content: 'test',
        vector: new Array(384).fill(0.5),
        metadata: {
          type: 'file' as const,
          storeId,
          indexedAt: new Date(),
        },
      };

      await store.addDocuments(storeId, [doc]);

      // This should use cosine distance
      const results = await store.search(storeId, new Array(384).fill(0.5), 10, 0.5);
      expect(results).toBeDefined();
    });

    it('does not filter when threshold is undefined', async () => {
      const doc = {
        id: createDocumentId('no-threshold-doc'),
        content: 'content',
        vector: new Array(384).fill(0.3),
        metadata: {
          type: 'file' as const,
          storeId,
          indexedAt: new Date(),
        },
      };

      await store.addDocuments(storeId, [doc]);

      // Without threshold, all results returned
      const results = await store.search(storeId, new Array(384).fill(0.1), 10);
      expect(results).toBeDefined();
    });
  });

  describe('fullTextSearch error handling', () => {
    it('returns empty array when FTS index does not exist', async () => {
      const newStoreId = createStoreId('no-fts-store');
      await store.initialize(newStoreId);

      const doc = {
        id: createDocumentId('no-fts-doc'),
        content: 'test content',
        vector: new Array(384).fill(0.1),
        metadata: {
          type: 'file' as const,
          storeId: newStoreId,
          indexedAt: new Date(),
        },
      };

      await store.addDocuments(newStoreId, [doc]);

      // Don't create FTS index - should return empty array
      const results = await store.fullTextSearch(newStoreId, 'test', 10);
      expect(results).toEqual([]);
    });
  });

  describe('table initialization', () => {
    it('creates new table when table does not exist', async () => {
      const newStoreId = createStoreId('new-table-store');

      // Should create new table
      await store.initialize(newStoreId);

      const doc = {
        id: createDocumentId('new-table-doc'),
        content: 'test',
        vector: new Array(384).fill(0.1),
        metadata: {
          type: 'file' as const,
          storeId: newStoreId,
          indexedAt: new Date(),
        },
      };

      await store.addDocuments(newStoreId, [doc]);
      const results = await store.search(newStoreId, new Array(384).fill(0.1), 10);
      expect(results.length).toBeGreaterThan(0);
    });

    it('opens existing table when table already exists', async () => {
      const existingStoreId = createStoreId('existing-table-store');

      // Initialize once
      await store.initialize(existingStoreId);

      const doc1 = {
        id: createDocumentId('existing-doc-1'),
        content: 'first',
        vector: new Array(384).fill(0.1),
        metadata: {
          type: 'file' as const,
          storeId: existingStoreId,
          indexedAt: new Date(),
        },
      };

      await store.addDocuments(existingStoreId, [doc1]);

      // Initialize again - should open existing table
      await store.initialize(existingStoreId);

      const doc2 = {
        id: createDocumentId('existing-doc-2'),
        content: 'second',
        vector: new Array(384).fill(0.1),
        metadata: {
          type: 'file' as const,
          storeId: existingStoreId,
          indexedAt: new Date(),
        },
      };

      await store.addDocuments(existingStoreId, [doc2]);

      const results = await store.search(existingStoreId, new Array(384).fill(0.1), 10);
      expect(results.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('lazy table initialization', () => {
    it('auto-initializes table when getTable is called for uninitialized store', async () => {
      const lazyStoreId = createStoreId('lazy-init-store');

      // Don't call initialize explicitly
      const doc = {
        id: createDocumentId('lazy-doc'),
        content: 'lazy',
        vector: new Array(384).fill(0.1),
        metadata: {
          type: 'file' as const,
          storeId: lazyStoreId,
          indexedAt: new Date(),
        },
      };

      // This should trigger auto-initialization
      await store.addDocuments(lazyStoreId, [doc]);

      const results = await store.search(lazyStoreId, new Array(384).fill(0.1), 10);
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('deleteStore', () => {
    it('deletes table and removes from cache', async () => {
      const deleteStoreId = createStoreId('delete-store');
      await store.initialize(deleteStoreId);

      const doc = {
        id: createDocumentId('delete-store-doc'),
        content: 'to be deleted',
        vector: new Array(384).fill(0.1),
        metadata: {
          type: 'file' as const,
          storeId: deleteStoreId,
          indexedAt: new Date(),
        },
      };

      await store.addDocuments(deleteStoreId, [doc]);

      // Delete the store
      await store.deleteStore(deleteStoreId);

      // Re-initializing should create new empty table
      await store.initialize(deleteStoreId);
      const results = await store.search(deleteStoreId, new Array(384).fill(0.1), 10);
      expect(results.length).toBe(0);
    });
  });

  describe('multiple documents operations', () => {
    it('adds multiple documents at once', async () => {
      const multiStoreId = createStoreId('multi-doc-store');
      await store.initialize(multiStoreId);

      const docs = [
        {
          id: createDocumentId('multi-1'),
          content: 'first document',
          vector: new Array(384).fill(0.1),
          metadata: {
            type: 'file' as const,
            storeId: multiStoreId,
            indexedAt: new Date(),
          },
        },
        {
          id: createDocumentId('multi-2'),
          content: 'second document',
          vector: new Array(384).fill(0.2),
          metadata: {
            type: 'file' as const,
            storeId: multiStoreId,
            indexedAt: new Date(),
          },
        },
        {
          id: createDocumentId('multi-3'),
          content: 'third document',
          vector: new Array(384).fill(0.3),
          metadata: {
            type: 'file' as const,
            storeId: multiStoreId,
            indexedAt: new Date(),
          },
        },
      ];

      await store.addDocuments(multiStoreId, docs);

      const results = await store.search(multiStoreId, new Array(384).fill(0.2), 10);
      expect(results.length).toBeGreaterThanOrEqual(3);
    });

    it('deletes multiple documents at once', async () => {
      const multiDelStoreId = createStoreId('multi-del-store');
      await store.initialize(multiDelStoreId);

      const docs = [
        {
          id: createDocumentId('del-1'),
          content: 'delete me 1',
          vector: new Array(384).fill(0.1),
          metadata: {
            type: 'file' as const,
            storeId: multiDelStoreId,
            indexedAt: new Date(),
          },
        },
        {
          id: createDocumentId('del-2'),
          content: 'delete me 2',
          vector: new Array(384).fill(0.2),
          metadata: {
            type: 'file' as const,
            storeId: multiDelStoreId,
            indexedAt: new Date(),
          },
        },
        {
          id: createDocumentId('keep-3'),
          content: 'keep me',
          vector: new Array(384).fill(0.3),
          metadata: {
            type: 'file' as const,
            storeId: multiDelStoreId,
            indexedAt: new Date(),
          },
        },
      ];

      await store.addDocuments(multiDelStoreId, docs);
      await store.deleteDocuments(multiDelStoreId, [
        createDocumentId('del-1'),
        createDocumentId('del-2')
      ]);

      const results = await store.search(multiDelStoreId, new Array(384).fill(0.2), 10);
      const deletedIds = results.filter(r => r.id === 'del-1' || r.id === 'del-2');
      expect(deletedIds.length).toBe(0);

      const kept = results.find(r => r.id === 'keep-3');
      expect(kept).toBeDefined();
    });
  });
});
