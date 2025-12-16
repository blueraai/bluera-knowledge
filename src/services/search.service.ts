import type { LanceStore } from '../db/lance.js';
import type { EmbeddingEngine } from '../db/embeddings.js';
import type { SearchQuery, SearchResponse, SearchResult } from '../types/search.js';
import type { StoreId } from '../types/brands.js';

interface RRFConfig {
  k: number;
  vectorWeight: number;
  ftsWeight: number;
}

export class SearchService {
  private readonly lanceStore: LanceStore;
  private readonly embeddingEngine: EmbeddingEngine;
  private readonly rrfConfig: RRFConfig;

  constructor(
    lanceStore: LanceStore,
    embeddingEngine: EmbeddingEngine,
    rrfConfig: RRFConfig = { k: 60, vectorWeight: 0.7, ftsWeight: 0.3 }
  ) {
    this.lanceStore = lanceStore;
    this.embeddingEngine = embeddingEngine;
    this.rrfConfig = rrfConfig;
  }

  async search(query: SearchQuery): Promise<SearchResponse> {
    const startTime = Date.now();
    const mode = query.mode ?? 'hybrid';
    const limit = query.limit ?? 10;
    const stores = query.stores ?? [];

    let allResults: SearchResult[] = [];

    if (mode === 'vector') {
      allResults = await this.vectorSearch(query.query, stores, limit, query.threshold);
    } else if (mode === 'fts') {
      allResults = await this.ftsSearch(query.query, stores, limit);
    } else {
      // Hybrid: combine vector and FTS with RRF
      allResults = await this.hybridSearch(query.query, stores, limit, query.threshold);
    }

    return {
      query: query.query,
      mode,
      stores,
      results: allResults,
      totalResults: allResults.length,
      timeMs: Date.now() - startTime,
    };
  }

  private async vectorSearch(
    query: string,
    stores: readonly StoreId[],
    limit: number,
    threshold?: number
  ): Promise<SearchResult[]> {
    const queryVector = await this.embeddingEngine.embed(query);
    const results: SearchResult[] = [];

    for (const storeId of stores) {
      const hits = await this.lanceStore.search(storeId, queryVector, limit, threshold);
      results.push(...hits.map(r => ({
        id: r.id,
        score: r.score,
        content: r.content,
        metadata: r.metadata,
      })));
    }

    return results.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  private async ftsSearch(
    query: string,
    stores: readonly StoreId[],
    limit: number
  ): Promise<SearchResult[]> {
    const results: SearchResult[] = [];

    for (const storeId of stores) {
      const hits = await this.lanceStore.fullTextSearch(storeId, query, limit);
      results.push(...hits.map(r => ({
        id: r.id,
        score: r.score,
        content: r.content,
        metadata: r.metadata,
      })));
    }

    return results.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  private async hybridSearch(
    query: string,
    stores: readonly StoreId[],
    limit: number,
    threshold?: number
  ): Promise<SearchResult[]> {
    // Get both result sets
    const [vectorResults, ftsResults] = await Promise.all([
      this.vectorSearch(query, stores, limit * 2, threshold),
      this.ftsSearch(query, stores, limit * 2),
    ]);

    // Build rank maps
    const vectorRanks = new Map<string, number>();
    const ftsRanks = new Map<string, number>();
    const allDocs = new Map<string, SearchResult>();

    vectorResults.forEach((r, i) => {
      vectorRanks.set(r.id, i + 1);
      allDocs.set(r.id, r);
    });

    ftsResults.forEach((r, i) => {
      ftsRanks.set(r.id, i + 1);
      if (!allDocs.has(r.id)) {
        allDocs.set(r.id, r);
      }
    });

    // Calculate RRF scores
    const rrfScores: Array<{ id: string; score: number; result: SearchResult }> = [];
    const { k, vectorWeight, ftsWeight } = this.rrfConfig;

    for (const [id, result] of allDocs) {
      const vectorRank = vectorRanks.get(id) ?? Infinity;
      const ftsRank = ftsRanks.get(id) ?? Infinity;

      const vectorRRF = vectorRank !== Infinity ? vectorWeight / (k + vectorRank) : 0;
      const ftsRRF = ftsRank !== Infinity ? ftsWeight / (k + ftsRank) : 0;

      rrfScores.push({
        id,
        score: vectorRRF + ftsRRF,
        result,
      });
    }

    // Sort by RRF score and return
    return rrfScores
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(r => ({ ...r.result, score: r.score }));
  }

  async searchAllStores(
    query: SearchQuery,
    storeIds: StoreId[]
  ): Promise<SearchResponse> {
    return this.search({
      ...query,
      stores: storeIds,
    });
  }
}
