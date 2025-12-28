import type { DocumentId, StoreId } from './brands.js';

export type DocumentType = 'file' | 'chunk' | 'web';

export interface DocumentMetadata {
  readonly path?: string | undefined;
  readonly url?: string | undefined;
  readonly type: DocumentType;
  readonly storeId: StoreId;
  readonly indexedAt: Date;
  readonly fileHash?: string | undefined;
  readonly chunkIndex?: number | undefined;
  readonly totalChunks?: number | undefined;
  readonly [key: string]: unknown;
}

export interface Document {
  readonly id: DocumentId;
  readonly content: string;
  readonly vector: readonly number[];
  readonly metadata: DocumentMetadata;
}

export interface DocumentChunk {
  readonly id: DocumentId;
  readonly content: string;
  readonly startLine?: number | undefined;
  readonly endLine?: number | undefined;
  readonly metadata: DocumentMetadata;
}
