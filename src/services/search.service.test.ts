import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { SearchService } from './search.service.js';
import { LanceStore } from '../db/lance.js';
import { EmbeddingEngine } from '../db/embeddings.js';
import { createStoreId, createDocumentId } from '../types/brands.js';
import { rm, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

describe('SearchService', () => {
  let searchService: SearchService;
  let lanceStore: LanceStore;
  let embeddingEngine: EmbeddingEngine;
  let tempDir: string;
  const storeId = createStoreId('test-store');

  beforeAll(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'search-test-'));
    lanceStore = new LanceStore(tempDir);
    embeddingEngine = new EmbeddingEngine();

    await embeddingEngine.initialize();
    await lanceStore.initialize(storeId);

    // Add test documents
    const texts = [
      'TypeScript is a typed superset of JavaScript',
      'Python is great for machine learning',
      'React is a JavaScript library for building user interfaces',
    ];

    for (let i = 0; i < texts.length; i++) {
      const text = texts[i]!;
      const vector = await embeddingEngine.embed(text);
      await lanceStore.addDocuments(storeId, [
        {
          id: createDocumentId(`doc-${i}`),
          content: text,
          vector,
          metadata: {
            type: 'file',
            storeId,
            indexedAt: new Date(),
          },
        },
      ]);
    }

    searchService = new SearchService(lanceStore, embeddingEngine);
  }, 120000);

  afterAll(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it('searches with vector mode', async () => {
    const results = await searchService.search({
      query: 'JavaScript programming',
      stores: [storeId],
      mode: 'vector',
      limit: 10,
    });

    expect(results.results.length).toBeGreaterThan(0);
    expect(results.mode).toBe('vector');
  });

  it('returns results with scores', async () => {
    const results = await searchService.search({
      query: 'machine learning Python',
      stores: [storeId],
      mode: 'vector',
      limit: 10,
    });

    expect(results.results[0]?.score).toBeGreaterThan(0);
    expect(results.results[0]?.content).toContain('Python');
  });
});
