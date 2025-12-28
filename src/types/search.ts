import type { StoreId, DocumentId } from './brands.js';
import type { DocumentMetadata } from './document.js';

export type SearchMode = 'vector' | 'fts' | 'hybrid';

export interface CodeUnit {
  type: 'function' | 'class' | 'interface' | 'type' | 'const' | 'documentation' | 'example';
  name: string;
  signature: string;
  fullContent: string;
  startLine: number;
  endLine: number;
  language: string;
}

export interface SearchQuery {
  readonly query: string;
  readonly stores?: readonly StoreId[] | undefined;
  readonly mode?: SearchMode | undefined;
  readonly limit?: number | undefined;
  readonly threshold?: number | undefined;
  readonly filter?: Record<string, unknown> | undefined;
  readonly includeContent?: boolean | undefined;
  readonly contextLines?: number | undefined;
}

export interface SearchResult {
  readonly id: DocumentId;
  readonly score: number;
  readonly content: string;
  readonly highlight?: string | undefined;
  readonly metadata: DocumentMetadata;

  // NEW: Structured code unit for AI agents
  readonly codeUnit?: CodeUnit | undefined;
}

export interface SearchResponse {
  readonly query: string;
  readonly mode: SearchMode;
  readonly stores: readonly StoreId[];
  readonly results: readonly SearchResult[];
  readonly totalResults: number;
  readonly timeMs: number;
}
