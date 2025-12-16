import type { StoreId, DocumentId } from './brands.js';
import type { DocumentMetadata } from './document.js';

export type SearchMode = 'vector' | 'fts' | 'hybrid';

export interface SearchQuery {
  readonly query: string;
  readonly stores?: readonly StoreId[];
  readonly mode?: SearchMode;
  readonly limit?: number;
  readonly threshold?: number;
  readonly filter?: Record<string, unknown>;
  readonly includeContent?: boolean;
  readonly contextLines?: number;
}

export interface SearchResult {
  readonly id: DocumentId;
  readonly score: number;
  readonly content: string;
  readonly highlight?: string;
  readonly metadata: DocumentMetadata;
}

export interface SearchResponse {
  readonly query: string;
  readonly mode: SearchMode;
  readonly stores: readonly StoreId[];
  readonly results: readonly SearchResult[];
  readonly totalResults: number;
  readonly timeMs: number;
}
