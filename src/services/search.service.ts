import type { LanceStore } from '../db/lance.js';
import type { EmbeddingEngine } from '../db/embeddings.js';
import type { SearchQuery, SearchResponse, SearchResult } from '../types/search.js';
import type { StoreId } from '../types/brands.js';

export class SearchService {
  private readonly lanceStore: LanceStore;
  private readonly embeddingEngine: EmbeddingEngine;

  constructor(lanceStore: LanceStore, embeddingEngine: EmbeddingEngine) {
    this.lanceStore = lanceStore;
    this.embeddingEngine = embeddingEngine;
  }

  async search(query: SearchQuery): Promise<SearchResponse> {
    const startTime = Date.now();
    const mode = query.mode ?? 'hybrid';
    const limit = query.limit ?? 10;
    const stores = query.stores ?? [];

    let allResults: SearchResult[] = [];

    if (mode === 'vector' || mode === 'hybrid') {
      const queryVector = await this.embeddingEngine.embed(query.query);

      for (const storeId of stores) {
        const results = await this.lanceStore.search(
          storeId,
          queryVector,
          limit,
          query.threshold
        );

        allResults.push(
          ...results.map((r) => ({
            id: r.id,
            score: r.score,
            content: r.content,
            metadata: r.metadata,
          }))
        );
      }
    }

    // Sort by score descending
    allResults.sort((a, b) => b.score - a.score);

    // Limit results
    allResults = allResults.slice(0, limit);

    return {
      query: query.query,
      mode,
      stores,
      results: allResults,
      totalResults: allResults.length,
      timeMs: Date.now() - startTime,
    };
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
