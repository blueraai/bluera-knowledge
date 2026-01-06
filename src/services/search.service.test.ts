import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest';
import { SearchService } from './search.service.js';
import { LanceStore } from '../db/lance.js';
import { EmbeddingEngine } from '../db/embeddings.js';
import { createStoreId, createDocumentId } from '../types/brands.js';
import { rm, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { SearchResult } from '../types/search.js';

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

  it('performs hybrid search combining vector and FTS', async () => {
    // First create FTS index
    await lanceStore.createFtsIndex(storeId);

    const results = await searchService.search({
      query: 'JavaScript programming',
      stores: [storeId],
      mode: 'hybrid',
      limit: 10,
    });

    expect(results.mode).toBe('hybrid');
    expect(results.results.length).toBeGreaterThan(0);
    // Hybrid should have RRF scores that differ from pure vector scores
    expect(results.results[0]?.score).toBeGreaterThan(0);
  });
});

describe('SearchService - RRF Ranking Algorithm', () => {
  let mockLanceStore: LanceStore;
  let mockEmbeddingEngine: EmbeddingEngine;
  let searchService: SearchService;
  const storeId = createStoreId('test-store');

  beforeEach(() => {
    mockLanceStore = {
      search: vi.fn(),
      fullTextSearch: vi.fn(),
    } as unknown as LanceStore;

    mockEmbeddingEngine = {
      embed: vi.fn().mockResolvedValue([0.1, 0.2, 0.3]),
    } as unknown as EmbeddingEngine;

    searchService = new SearchService(mockLanceStore, mockEmbeddingEngine);
  });

  it('combines vector and FTS results with RRF', async () => {
    const vectorResults = [
      { id: createDocumentId('doc1'), score: 0.9, content: 'result 1', metadata: { type: 'file' as const, storeId, indexedAt: new Date() } },
      { id: createDocumentId('doc2'), score: 0.8, content: 'result 2', metadata: { type: 'file' as const, storeId, indexedAt: new Date() } },
    ];

    const ftsResults = [
      { id: createDocumentId('doc2'), score: 0.95, content: 'result 2', metadata: { type: 'file' as const, storeId, indexedAt: new Date() } },
      { id: createDocumentId('doc3'), score: 0.85, content: 'result 3', metadata: { type: 'file' as const, storeId, indexedAt: new Date() } },
    ];

    vi.mocked(mockLanceStore.search).mockResolvedValue(vectorResults);
    vi.mocked(mockLanceStore.fullTextSearch).mockResolvedValue(ftsResults);

    const results = await searchService.search({
      query: 'test query',
      stores: [storeId],
      mode: 'hybrid',
      limit: 10,
    });

    expect(results.results.length).toBeGreaterThan(0);
    // doc2 should rank higher as it appears in both results
    expect(results.results.some(r => r.id === createDocumentId('doc2'))).toBe(true);
  });

  it('uses web RRF preset for web content (url metadata)', async () => {
    // Web content has url in metadata - should use web preset (k=30)
    vi.mocked(mockLanceStore.search).mockResolvedValue([
      { id: createDocumentId('doc1'), score: 0.9, content: 'result 1', metadata: { type: 'web' as const, storeId, indexedAt: new Date(), url: 'https://example.com/docs' } },
    ]);
    vi.mocked(mockLanceStore.fullTextSearch).mockResolvedValue([
      { id: createDocumentId('doc1'), score: 0.95, content: 'result 1', metadata: { type: 'web' as const, storeId, indexedAt: new Date(), url: 'https://example.com/docs' } },
    ]);

    const results = await searchService.search({
      query: 'test query',
      stores: [storeId],
      mode: 'hybrid',
      limit: 10,
    });

    expect(results.results.length).toBe(1);
    expect(results.results[0]?.score).toBeGreaterThan(0);
  });

  it('uses code RRF preset for file content (path metadata)', async () => {
    // File content has path, no url - should use code preset (k=20)
    vi.mocked(mockLanceStore.search).mockResolvedValue([
      { id: createDocumentId('doc1'), score: 0.9, content: 'function test() {}', metadata: { type: 'file' as const, storeId, indexedAt: new Date(), path: '/src/test.ts' } },
    ]);
    vi.mocked(mockLanceStore.fullTextSearch).mockResolvedValue([
      { id: createDocumentId('doc2'), score: 0.95, content: 'class Example {}', metadata: { type: 'file' as const, storeId, indexedAt: new Date(), path: '/src/example.ts' } },
    ]);

    const results = await searchService.search({
      query: 'test query',
      stores: [storeId],
      mode: 'hybrid',
      limit: 10,
    });

    expect(results.results.length).toBeGreaterThan(0);
  });

  it('handles documents appearing only in vector results', async () => {
    vi.mocked(mockLanceStore.search).mockResolvedValue([
      { id: createDocumentId('doc1'), score: 0.9, content: 'vector only', metadata: { type: 'file' as const, storeId, indexedAt: new Date() } },
    ]);
    vi.mocked(mockLanceStore.fullTextSearch).mockResolvedValue([]);

    const results = await searchService.search({
      query: 'test query',
      stores: [storeId],
      mode: 'hybrid',
      limit: 10,
    });

    expect(results.results.length).toBe(1);
    expect(results.results[0]?.id).toBe(createDocumentId('doc1'));
  });

  it('handles documents appearing only in FTS results', async () => {
    vi.mocked(mockLanceStore.search).mockResolvedValue([]);
    vi.mocked(mockLanceStore.fullTextSearch).mockResolvedValue([
      { id: createDocumentId('doc1'), score: 0.9, content: 'fts only', metadata: { type: 'file' as const, storeId, indexedAt: new Date() } },
    ]);

    const results = await searchService.search({
      query: 'test query',
      stores: [storeId],
      mode: 'hybrid',
      limit: 10,
    });

    expect(results.results.length).toBe(1);
    expect(results.results[0]?.id).toBe(createDocumentId('doc1'));
  });

  it('normalizes scores to 0-1 range', async () => {
    vi.mocked(mockLanceStore.search).mockResolvedValue([
      { id: createDocumentId('doc1'), score: 0.9, content: 'result 1', metadata: { type: 'file' as const, storeId, indexedAt: new Date() } },
      { id: createDocumentId('doc2'), score: 0.5, content: 'result 2', metadata: { type: 'file' as const, storeId, indexedAt: new Date() } },
    ]);
    vi.mocked(mockLanceStore.fullTextSearch).mockResolvedValue([
      { id: createDocumentId('doc1'), score: 0.95, content: 'result 1', metadata: { type: 'file' as const, storeId, indexedAt: new Date() } },
    ]);

    const results = await searchService.search({
      query: 'test query',
      stores: [storeId],
      mode: 'hybrid',
      limit: 10,
    });

    // Scores should be normalized
    results.results.forEach(r => {
      expect(r.score).toBeGreaterThanOrEqual(0);
      expect(r.score).toBeLessThanOrEqual(1);
    });
  });

  it('handles identical scores correctly', async () => {
    vi.mocked(mockLanceStore.search).mockResolvedValue([
      { id: createDocumentId('doc1'), score: 0.9, content: 'result 1', metadata: { type: 'file' as const, storeId, indexedAt: new Date() } },
      { id: createDocumentId('doc2'), score: 0.9, content: 'result 2', metadata: { type: 'file' as const, storeId, indexedAt: new Date() } },
    ]);
    vi.mocked(mockLanceStore.fullTextSearch).mockResolvedValue([]);

    const results = await searchService.search({
      query: 'test query',
      stores: [storeId],
      mode: 'hybrid',
      limit: 10,
    });

    expect(results.results.length).toBe(2);
    // Should handle identical scores without errors
    expect(results.results[0]?.score).toBeDefined();
  });
});

describe('SearchService - Query Intent Classification', () => {
  let mockLanceStore: LanceStore;
  let mockEmbeddingEngine: EmbeddingEngine;
  let searchService: SearchService;
  const storeId = createStoreId('test-store');

  beforeEach(() => {
    mockLanceStore = {
      search: vi.fn(),
      fullTextSearch: vi.fn(),
    } as unknown as LanceStore;

    mockEmbeddingEngine = {
      embed: vi.fn().mockResolvedValue([0.1, 0.2, 0.3]),
    } as unknown as EmbeddingEngine;

    searchService = new SearchService(mockLanceStore, mockEmbeddingEngine);
  });

  it('classifies "how to" queries correctly', async () => {
    const howToQueries = [
      'how to use React hooks',
      'how do I create a component',
      'show me how to configure',
      "what's the best way to implement",
    ];

    for (const query of howToQueries) {
      vi.mocked(mockLanceStore.search).mockResolvedValue([
        {
          id: createDocumentId('doc1'),
          score: 0.9,
          content: 'example code',
          metadata: {
            type: 'file' as const,
            storeId,
            indexedAt: new Date(),
            fileType: 'example'
          }
        },
      ]);
      vi.mocked(mockLanceStore.fullTextSearch).mockResolvedValue([]);

      const results = await searchService.search({
        query,
        stores: [storeId],
        mode: 'hybrid',
        limit: 10,
      });

      // Should boost example files for how-to queries
      expect(results.results.length).toBeGreaterThan(0);
    }
  });

  it('classifies "implementation" queries correctly', async () => {
    const implQueries = [
      'how is React implemented',
      'source code for useState',
      'implementation details of router',
      'under the hood of Vue',
    ];

    for (const query of implQueries) {
      vi.mocked(mockLanceStore.search).mockResolvedValue([
        {
          id: createDocumentId('doc1'),
          score: 0.9,
          content: 'internal implementation',
          metadata: {
            type: 'file' as const,
            storeId,
            indexedAt: new Date(),
            fileType: 'source-internal'
          }
        },
      ]);
      vi.mocked(mockLanceStore.fullTextSearch).mockResolvedValue([]);

      const results = await searchService.search({
        query,
        stores: [storeId],
        mode: 'hybrid',
        limit: 10,
      });

      expect(results.results.length).toBeGreaterThan(0);
    }
  });

  it('classifies "conceptual" queries correctly', async () => {
    const conceptQueries = [
      'what is a React hook',
      'explain virtual DOM',
      'what does reconciliation mean',
      'how does routing work',
    ];

    for (const query of conceptQueries) {
      vi.mocked(mockLanceStore.search).mockResolvedValue([
        {
          id: createDocumentId('doc1'),
          score: 0.9,
          content: 'concept explanation',
          metadata: {
            type: 'file' as const,
            storeId,
            indexedAt: new Date(),
            fileType: 'documentation'
          }
        },
      ]);
      vi.mocked(mockLanceStore.fullTextSearch).mockResolvedValue([]);

      const results = await searchService.search({
        query,
        stores: [storeId],
        mode: 'hybrid',
        limit: 10,
      });

      expect(results.results.length).toBeGreaterThan(0);
    }
  });

  it('classifies "comparison" queries correctly', async () => {
    const comparisonQueries = [
      'React vs Vue',
      'difference between hooks and classes',
      'should I use Redux or Context',
      'when to use useMemo',
    ];

    for (const query of comparisonQueries) {
      vi.mocked(mockLanceStore.search).mockResolvedValue([
        {
          id: createDocumentId('doc1'),
          score: 0.9,
          content: 'comparison guide',
          metadata: {
            type: 'file' as const,
            storeId,
            indexedAt: new Date(),
            fileType: 'documentation-primary'
          }
        },
      ]);
      vi.mocked(mockLanceStore.fullTextSearch).mockResolvedValue([]);

      const results = await searchService.search({
        query,
        stores: [storeId],
        mode: 'hybrid',
        limit: 10,
      });

      expect(results.results.length).toBeGreaterThan(0);
    }
  });

  it('classifies "debugging" queries correctly', async () => {
    const debugQueries = [
      'error: cannot read property',
      'React component not rendering',
      'why is my hook not working',
      'how to fix TypeScript error',
    ];

    for (const query of debugQueries) {
      vi.mocked(mockLanceStore.search).mockResolvedValue([
        {
          id: createDocumentId('doc1'),
          score: 0.9,
          content: 'troubleshooting guide',
          metadata: {
            type: 'file' as const,
            storeId,
            indexedAt: new Date(),
            fileType: 'test'
          }
        },
      ]);
      vi.mocked(mockLanceStore.fullTextSearch).mockResolvedValue([]);

      const results = await searchService.search({
        query,
        stores: [storeId],
        mode: 'hybrid',
        limit: 10,
      });

      expect(results.results.length).toBeGreaterThan(0);
    }
  });

  it('defaults to "how-to" for ambiguous queries', async () => {
    vi.mocked(mockLanceStore.search).mockResolvedValue([
      {
        id: createDocumentId('doc1'),
        score: 0.9,
        content: 'generic content',
        metadata: {
          type: 'file' as const,
          storeId,
          indexedAt: new Date(),
          fileType: 'documentation'
        }
      },
    ]);
    vi.mocked(mockLanceStore.fullTextSearch).mockResolvedValue([]);

    const results = await searchService.search({
      query: 'React components',
      stores: [storeId],
      mode: 'hybrid',
      limit: 10,
    });

    expect(results.results.length).toBeGreaterThan(0);
  });
});

describe('SearchService - Framework Context Boosting', () => {
  let mockLanceStore: LanceStore;
  let mockEmbeddingEngine: EmbeddingEngine;
  let searchService: SearchService;
  const storeId = createStoreId('test-store');

  beforeEach(() => {
    mockLanceStore = {
      search: vi.fn(),
      fullTextSearch: vi.fn(),
    } as unknown as LanceStore;

    mockEmbeddingEngine = {
      embed: vi.fn().mockResolvedValue([0.1, 0.2, 0.3]),
    } as unknown as EmbeddingEngine;

    searchService = new SearchService(mockLanceStore, mockEmbeddingEngine);
  });

  it('boosts React-related results when query mentions React', async () => {
    vi.mocked(mockLanceStore.search).mockResolvedValue([
      {
        id: createDocumentId('react-doc'),
        score: 0.8,
        content: 'React component documentation',
        metadata: {
          type: 'file' as const,
          storeId,
          indexedAt: new Date(),
          path: '/docs/react/components.md'
        }
      },
      {
        id: createDocumentId('vue-doc'),
        score: 0.8,
        content: 'Vue component documentation',
        metadata: {
          type: 'file' as const,
          storeId,
          indexedAt: new Date(),
          path: '/docs/vue/components.md'
        }
      },
    ]);
    vi.mocked(mockLanceStore.fullTextSearch).mockResolvedValue([]);

    const results = await searchService.search({
      query: 'React hooks usage',
      stores: [storeId],
      mode: 'hybrid',
      limit: 10,
    });

    // React doc should rank higher
    expect(results.results[0]?.id).toBe(createDocumentId('react-doc'));
  });

  it('recognizes Express framework patterns', async () => {
    vi.mocked(mockLanceStore.search).mockResolvedValue([
      {
        id: createDocumentId('express-doc'),
        score: 0.8,
        content: 'Express middleware guide',
        metadata: {
          type: 'file' as const,
          storeId,
          indexedAt: new Date(),
          path: '/node_modules/express/README.md'
        }
      },
    ]);
    vi.mocked(mockLanceStore.fullTextSearch).mockResolvedValue([]);

    const results = await searchService.search({
      query: 'Express routing',
      stores: [storeId],
      mode: 'hybrid',
      limit: 10,
    });

    expect(results.results.length).toBeGreaterThan(0);
  });

  it('recognizes Vue framework patterns', async () => {
    vi.mocked(mockLanceStore.search).mockResolvedValue([
      {
        id: createDocumentId('vue-doc'),
        score: 0.8,
        content: 'Vue3 composition API',
        metadata: {
          type: 'file' as const,
          storeId,
          indexedAt: new Date(),
          path: '/docs/vue3/api.md'
        }
      },
    ]);
    vi.mocked(mockLanceStore.fullTextSearch).mockResolvedValue([]);

    const results = await searchService.search({
      query: 'Vue computed properties',
      stores: [storeId],
      mode: 'hybrid',
      limit: 10,
    });

    expect(results.results.length).toBeGreaterThan(0);
  });

  it('recognizes TypeScript framework patterns', async () => {
    vi.mocked(mockLanceStore.search).mockResolvedValue([
      {
        id: createDocumentId('ts-doc'),
        score: 0.8,
        content: 'TypeScript generics guide',
        metadata: {
          type: 'file' as const,
          storeId,
          indexedAt: new Date(),
          path: '/docs/typescript/generics.md'
        }
      },
    ]);
    vi.mocked(mockLanceStore.fullTextSearch).mockResolvedValue([]);

    const results = await searchService.search({
      query: 'TypeScript type inference',
      stores: [storeId],
      mode: 'hybrid',
      limit: 10,
    });

    expect(results.results.length).toBeGreaterThan(0);
  });

  it('handles queries without framework mentions', async () => {
    vi.mocked(mockLanceStore.search).mockResolvedValue([
      {
        id: createDocumentId('doc1'),
        score: 0.8,
        content: 'generic programming guide',
        metadata: {
          type: 'file' as const,
          storeId,
          indexedAt: new Date(),
          path: '/docs/general.md'
        }
      },
    ]);
    vi.mocked(mockLanceStore.fullTextSearch).mockResolvedValue([]);

    const results = await searchService.search({
      query: 'programming patterns',
      stores: [storeId],
      mode: 'hybrid',
      limit: 10,
    });

    expect(results.results.length).toBeGreaterThan(0);
  });
});

describe('SearchService - Deduplication Logic', () => {
  let mockLanceStore: LanceStore;
  let mockEmbeddingEngine: EmbeddingEngine;
  let searchService: SearchService;
  const storeId = createStoreId('test-store');

  beforeEach(() => {
    mockLanceStore = {
      search: vi.fn(),
      fullTextSearch: vi.fn(),
    } as unknown as LanceStore;

    mockEmbeddingEngine = {
      embed: vi.fn().mockResolvedValue([0.1, 0.2, 0.3]),
    } as unknown as EmbeddingEngine;

    searchService = new SearchService(mockLanceStore, mockEmbeddingEngine);
  });

  it('deduplicates chunks from same source file', async () => {
    vi.mocked(mockLanceStore.search).mockResolvedValue([
      {
        id: createDocumentId('chunk1'),
        score: 0.9,
        content: 'first chunk with query term',
        metadata: {
          type: 'chunk' as const,
          storeId,
          indexedAt: new Date(),
          path: '/src/file.ts',
          chunkIndex: 0,
          totalChunks: 2
        }
      },
      {
        id: createDocumentId('chunk2'),
        score: 0.85,
        content: 'second chunk with query term',
        metadata: {
          type: 'chunk' as const,
          storeId,
          indexedAt: new Date(),
          path: '/src/file.ts',
          chunkIndex: 1,
          totalChunks: 2
        }
      },
    ]);
    vi.mocked(mockLanceStore.fullTextSearch).mockResolvedValue([]);

    const results = await searchService.search({
      query: 'query term',
      stores: [storeId],
      mode: 'hybrid',
      limit: 10,
    });

    // Should only return one result per source file
    expect(results.results.length).toBe(1);
  });

  it('keeps chunk with more query term matches', async () => {
    vi.mocked(mockLanceStore.search).mockResolvedValue([
      {
        id: createDocumentId('chunk1'),
        score: 0.9,
        content: 'test content',
        metadata: {
          type: 'chunk' as const,
          storeId,
          indexedAt: new Date(),
          path: '/src/file.ts',
          chunkIndex: 0,
          totalChunks: 2
        }
      },
      {
        id: createDocumentId('chunk2'),
        score: 0.85,
        content: 'test content with React hooks and components',
        metadata: {
          type: 'chunk' as const,
          storeId,
          indexedAt: new Date(),
          path: '/src/file.ts',
          chunkIndex: 1,
          totalChunks: 2
        }
      },
    ]);
    vi.mocked(mockLanceStore.fullTextSearch).mockResolvedValue([]);

    const results = await searchService.search({
      query: 'React hooks components',
      stores: [storeId],
      mode: 'hybrid',
      limit: 10,
    });

    // Should keep chunk2 as it has more query term matches
    expect(results.results[0]?.id).toBe(createDocumentId('chunk2'));
  });

  it('keeps different source files separate', async () => {
    vi.mocked(mockLanceStore.search).mockResolvedValue([
      {
        id: createDocumentId('file1'),
        score: 0.9,
        content: 'content from file 1',
        metadata: {
          type: 'file' as const,
          storeId,
          indexedAt: new Date(),
          path: '/src/file1.ts'
        }
      },
      {
        id: createDocumentId('file2'),
        score: 0.85,
        content: 'content from file 2',
        metadata: {
          type: 'file' as const,
          storeId,
          indexedAt: new Date(),
          path: '/src/file2.ts'
        }
      },
    ]);
    vi.mocked(mockLanceStore.fullTextSearch).mockResolvedValue([]);

    const results = await searchService.search({
      query: 'test query',
      stores: [storeId],
      mode: 'hybrid',
      limit: 10,
    });

    // Should keep both results as they're from different files
    expect(results.results.length).toBe(2);
  });
});

describe('SearchService - Progressive Context Enhancement', () => {
  let mockLanceStore: LanceStore;
  let mockEmbeddingEngine: EmbeddingEngine;
  let searchService: SearchService;
  const storeId = createStoreId('test-store');

  beforeEach(() => {
    mockLanceStore = {
      search: vi.fn(),
      fullTextSearch: vi.fn(),
    } as unknown as LanceStore;

    mockEmbeddingEngine = {
      embed: vi.fn().mockResolvedValue([0.1, 0.2, 0.3]),
    } as unknown as EmbeddingEngine;

    searchService = new SearchService(mockLanceStore, mockEmbeddingEngine);
  });

  it('provides minimal detail level by default', async () => {
    vi.mocked(mockLanceStore.search).mockResolvedValue([
      {
        id: createDocumentId('doc1'),
        score: 0.9,
        content: 'function example() { return 42; }',
        metadata: {
          type: 'file' as const,
          storeId,
          indexedAt: new Date(),
          path: '/src/example.ts'
        }
      },
    ]);
    vi.mocked(mockLanceStore.fullTextSearch).mockResolvedValue([]);

    const results = await searchService.search({
      query: 'example function',
      stores: [storeId],
      mode: 'vector',
      limit: 10,
    });

    // Should have summary but not context or full
    expect(results.results[0]?.summary).toBeDefined();
    expect(results.results[0]?.context).toBeUndefined();
    expect(results.results[0]?.full).toBeUndefined();
  });

  it('provides contextual detail when requested', async () => {
    vi.mocked(mockLanceStore.search).mockResolvedValue([
      {
        id: createDocumentId('doc1'),
        score: 0.9,
        content: 'import React from "react";\n\nfunction Component() { return <div>Test</div>; }',
        metadata: {
          type: 'file' as const,
          storeId,
          indexedAt: new Date(),
          path: '/src/Component.tsx'
        }
      },
    ]);
    vi.mocked(mockLanceStore.fullTextSearch).mockResolvedValue([]);

    const results = await searchService.search({
      query: 'Component',
      stores: [storeId],
      mode: 'vector',
      limit: 10,
      detail: 'contextual',
    });

    // Should have summary and context but not full
    expect(results.results[0]?.summary).toBeDefined();
    expect(results.results[0]?.context).toBeDefined();
    expect(results.results[0]?.context?.keyImports).toBeDefined();
    expect(results.results[0]?.full).toBeUndefined();
  });

  it('provides full detail when requested', async () => {
    vi.mocked(mockLanceStore.search).mockResolvedValue([
      {
        id: createDocumentId('doc1'),
        score: 0.9,
        content: '/** Documentation */\nfunction example() { return 42; }',
        metadata: {
          type: 'file' as const,
          storeId,
          indexedAt: new Date(),
          path: '/src/example.ts'
        }
      },
    ]);
    vi.mocked(mockLanceStore.fullTextSearch).mockResolvedValue([]);

    const results = await searchService.search({
      query: 'example',
      stores: [storeId],
      mode: 'vector',
      limit: 10,
      detail: 'full',
    });

    // Should have summary, context, and full
    expect(results.results[0]?.summary).toBeDefined();
    expect(results.results[0]?.context).toBeDefined();
    expect(results.results[0]?.full).toBeDefined();
    expect(results.results[0]?.full?.completeCode).toBeDefined();
  });

  it('extracts function names correctly', async () => {
    vi.mocked(mockLanceStore.search).mockResolvedValue([
      {
        id: createDocumentId('doc1'),
        score: 0.9,
        content: 'export async function fetchData() { return data; }',
        metadata: {
          type: 'file' as const,
          storeId,
          indexedAt: new Date(),
          path: '/src/api.ts'
        }
      },
    ]);
    vi.mocked(mockLanceStore.fullTextSearch).mockResolvedValue([]);

    const results = await searchService.search({
      query: 'fetchData',
      stores: [storeId],
      mode: 'vector',
      limit: 10,
    });

    expect(results.results[0]?.summary?.name).toBe('fetchData');
  });

  it('extracts class names correctly', async () => {
    vi.mocked(mockLanceStore.search).mockResolvedValue([
      {
        id: createDocumentId('doc1'),
        score: 0.9,
        content: 'export class MyComponent { constructor() {} }',
        metadata: {
          type: 'file' as const,
          storeId,
          indexedAt: new Date(),
          path: '/src/Component.ts'
        }
      },
    ]);
    vi.mocked(mockLanceStore.fullTextSearch).mockResolvedValue([]);

    const results = await searchService.search({
      query: 'MyComponent',
      stores: [storeId],
      mode: 'vector',
      limit: 10,
    });

    expect(results.results[0]?.summary?.name).toBe('MyComponent');
  });
});

describe('SearchService - Edge Cases', () => {
  let mockLanceStore: LanceStore;
  let mockEmbeddingEngine: EmbeddingEngine;
  let searchService: SearchService;
  const storeId = createStoreId('test-store');

  beforeEach(() => {
    mockLanceStore = {
      search: vi.fn(),
      fullTextSearch: vi.fn(),
    } as unknown as LanceStore;

    mockEmbeddingEngine = {
      embed: vi.fn().mockResolvedValue([0.1, 0.2, 0.3]),
    } as unknown as EmbeddingEngine;

    searchService = new SearchService(mockLanceStore, mockEmbeddingEngine);
  });

  it('handles empty query gracefully', async () => {
    vi.mocked(mockLanceStore.search).mockResolvedValue([]);
    vi.mocked(mockLanceStore.fullTextSearch).mockResolvedValue([]);

    const results = await searchService.search({
      query: '',
      stores: [storeId],
      mode: 'vector',
      limit: 10,
    });

    expect(results.results.length).toBe(0);
  });

  it('handles no results gracefully', async () => {
    vi.mocked(mockLanceStore.search).mockResolvedValue([]);
    vi.mocked(mockLanceStore.fullTextSearch).mockResolvedValue([]);

    const results = await searchService.search({
      query: 'nonexistent term',
      stores: [storeId],
      mode: 'hybrid',
      limit: 10,
    });

    expect(results.results.length).toBe(0);
    expect(results.totalResults).toBe(0);
  });

  it('respects limit parameter', async () => {
    const manyResults = Array.from({ length: 20 }, (_, i) => ({
      id: createDocumentId(`doc${i}`),
      score: 0.9 - i * 0.01,
      content: `result ${i}`,
      metadata: {
        type: 'file' as const,
        storeId,
        indexedAt: new Date(),
        path: `/src/file${i}.ts`
      }
    }));

    vi.mocked(mockLanceStore.search).mockResolvedValue(manyResults);
    vi.mocked(mockLanceStore.fullTextSearch).mockResolvedValue([]);

    const results = await searchService.search({
      query: 'test',
      stores: [storeId],
      mode: 'vector',
      limit: 5,
    });

    expect(results.results.length).toBeLessThanOrEqual(5);
  });

  it('handles multiple stores correctly', async () => {
    const store1 = createStoreId('store1');
    const store2 = createStoreId('store2');

    vi.mocked(mockLanceStore.search).mockImplementation(async (storeId) => {
      if (storeId === store1) {
        return [{
          id: createDocumentId('doc1'),
          score: 0.9,
          content: 'from store 1',
          metadata: { type: 'file' as const, storeId: store1, indexedAt: new Date() }
        }];
      }
      return [{
        id: createDocumentId('doc2'),
        score: 0.8,
        content: 'from store 2',
        metadata: { type: 'file' as const, storeId: store2, indexedAt: new Date() }
      }];
    });
    vi.mocked(mockLanceStore.fullTextSearch).mockResolvedValue([]);

    const results = await searchService.search({
      query: 'test',
      stores: [store1, store2],
      mode: 'vector',
      limit: 10,
    });

    expect(results.results.length).toBe(2);
  });

  it('returns timing information', async () => {
    vi.mocked(mockLanceStore.search).mockResolvedValue([]);
    vi.mocked(mockLanceStore.fullTextSearch).mockResolvedValue([]);

    const results = await searchService.search({
      query: 'test',
      stores: [storeId],
      mode: 'vector',
      limit: 10,
    });

    expect(results.timeMs).toBeGreaterThanOrEqual(0);
  });

  it('handles threshold parameter for vector search', async () => {
    vi.mocked(mockLanceStore.search).mockResolvedValue([
      {
        id: createDocumentId('doc1'),
        score: 0.95,
        content: 'high score',
        metadata: { type: 'file' as const, storeId, indexedAt: new Date() }
      },
    ]);

    const results = await searchService.search({
      query: 'test',
      stores: [storeId],
      mode: 'vector',
      limit: 10,
      threshold: 0.9,
    });

    expect(vi.mocked(mockLanceStore.search)).toHaveBeenCalledWith(
      storeId,
      expect.anything(),
      expect.anything(),
      0.9
    );
  });
});

describe('SearchService - Path Keyword Boosting', () => {
  let mockLanceStore: LanceStore;
  let mockEmbeddingEngine: EmbeddingEngine;
  let searchService: SearchService;
  const storeId = createStoreId('test-store');

  beforeEach(() => {
    mockLanceStore = {
      search: vi.fn(),
      fullTextSearch: vi.fn(),
    } as unknown as LanceStore;

    mockEmbeddingEngine = {
      embed: vi.fn().mockResolvedValue([0.1, 0.2, 0.3]),
    } as unknown as EmbeddingEngine;

    searchService = new SearchService(mockLanceStore, mockEmbeddingEngine);
  });

  it('boosts results when path contains query keywords', async () => {
    // Two files with same base score, but one has "dispatcher" in the path
    vi.mocked(mockLanceStore.search).mockResolvedValue([
      {
        id: createDocumentId('generic-file'),
        score: 0.85,
        content: 'handles async operations',
        metadata: {
          type: 'file' as const,
          storeId,
          indexedAt: new Date(),
          path: '/src/utils/helpers.py'
        }
      },
      {
        id: createDocumentId('dispatcher-file'),
        score: 0.85,
        content: 'handles async operations',
        metadata: {
          type: 'file' as const,
          storeId,
          indexedAt: new Date(),
          path: '/src/async_dispatcher.py'
        }
      },
    ]);
    vi.mocked(mockLanceStore.fullTextSearch).mockResolvedValue([]);

    const results = await searchService.search({
      query: 'dispatcher',
      stores: [storeId],
      mode: 'hybrid',
      limit: 10,
    });

    // dispatcher-file should rank higher due to path keyword match
    expect(results.results[0]?.id).toBe(createDocumentId('dispatcher-file'));
  });

  it('boosts results with multiple path keyword matches', async () => {
    vi.mocked(mockLanceStore.search).mockResolvedValue([
      {
        id: createDocumentId('single-match'),
        score: 0.85,
        content: 'crawler implementation',
        metadata: {
          type: 'file' as const,
          storeId,
          indexedAt: new Date(),
          path: '/src/crawler.py'
        }
      },
      {
        id: createDocumentId('double-match'),
        score: 0.85,
        content: 'crawler implementation',
        metadata: {
          type: 'file' as const,
          storeId,
          indexedAt: new Date(),
          path: '/src/deep_crawling/crawler.py'
        }
      },
    ]);
    vi.mocked(mockLanceStore.fullTextSearch).mockResolvedValue([]);

    const results = await searchService.search({
      query: 'deep crawler',
      stores: [storeId],
      mode: 'hybrid',
      limit: 10,
    });

    // double-match should rank higher (both "deep" and "crawler" in path)
    expect(results.results[0]?.id).toBe(createDocumentId('double-match'));
  });

  it('ignores stop words when matching path keywords', async () => {
    vi.mocked(mockLanceStore.search).mockResolvedValue([
      {
        id: createDocumentId('doc1'),
        score: 0.85,
        content: 'configuration guide',
        metadata: {
          type: 'file' as const,
          storeId,
          indexedAt: new Date(),
          path: '/src/config.ts'
        }
      },
    ]);
    vi.mocked(mockLanceStore.fullTextSearch).mockResolvedValue([]);

    const results = await searchService.search({
      query: 'how to configure',
      stores: [storeId],
      mode: 'hybrid',
      limit: 10,
    });

    // Should match "config" from "configure", not boost from "how" or "to"
    expect(results.results.length).toBeGreaterThan(0);
  });

  it('does not boost when path has no matching keywords', async () => {
    vi.mocked(mockLanceStore.search).mockResolvedValue([
      {
        id: createDocumentId('unrelated-path'),
        score: 0.9,
        content: 'dispatcher implementation details',
        metadata: {
          type: 'file' as const,
          storeId,
          indexedAt: new Date(),
          path: '/src/utils/helpers.ts'
        }
      },
    ]);
    vi.mocked(mockLanceStore.fullTextSearch).mockResolvedValue([]);

    const results = await searchService.search({
      query: 'dispatcher',
      stores: [storeId],
      mode: 'hybrid',
      limit: 10,
    });

    // Should still return result (content matches), just no path boost
    expect(results.results.length).toBe(1);
  });
});
