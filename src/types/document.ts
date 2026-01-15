import { z } from 'zod';
import type { DocumentId, StoreId } from './brands.js';

// ============================================================================
// Zod Schemas
// ============================================================================

export const DocumentTypeSchema = z.enum(['file', 'chunk', 'web']);

export const DocumentMetadataSchema = z
  .object({
    path: z.string().optional(),
    url: z.string().optional(),
    type: DocumentTypeSchema,
    storeId: z.string(),
    indexedAt: z.union([z.string(), z.date()]),
    fileHash: z.string().optional(),
    chunkIndex: z.number().optional(),
    totalChunks: z.number().optional(),
  })
  .loose(); // Allow additional fields per index signature

// ============================================================================
// Types
// ============================================================================

export type DocumentType = z.infer<typeof DocumentTypeSchema>;

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
