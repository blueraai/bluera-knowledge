import { z } from 'zod';
import type { StoreId, DocumentId } from './brands.js';

/**
 * Manifest types for tracking indexed file state.
 *
 * The manifest enables incremental indexing by tracking:
 * - File metadata (mtime, size) for fast change detection
 * - Content hash for deep verification
 * - Document IDs for cleanup on file changes
 */

// ============================================================================
// File State Schema
// ============================================================================

/**
 * State of a single indexed file.
 * Used for change detection in two phases:
 * - Phase 1 (fast): mtime + size comparison
 * - Phase 2 (deep): hash comparison for files that passed phase 1
 */
export const FileStateSchema = z.object({
  /** File modification time in milliseconds since epoch */
  mtime: z.number(),
  /** File size in bytes */
  size: z.number(),
  /** MD5 hash of file content */
  hash: z.string(),
  /** Document IDs created from this file (for cleanup) */
  documentIds: z.array(z.string()),
});

export type FileState = z.infer<typeof FileStateSchema>;

// ============================================================================
// Store Manifest Schema
// ============================================================================

/**
 * Manifest for a single store.
 * Tracks the state of all indexed files to enable incremental re-indexing.
 */
export const StoreManifestSchema = z.object({
  /** Schema version for future migrations */
  version: z.literal(1),
  /** Store ID this manifest belongs to */
  storeId: z.string(),
  /** When the manifest was last updated */
  indexedAt: z.string(),
  /** Map of file paths to their state */
  files: z.record(z.string(), FileStateSchema),
});

export type StoreManifest = z.infer<typeof StoreManifestSchema>;

// ============================================================================
// Branded Type Wrappers
// ============================================================================

/**
 * Type-safe manifest with branded StoreId.
 * Use this in service code for proper type safety.
 */
export interface TypedStoreManifest {
  version: 1;
  storeId: StoreId;
  indexedAt: string;
  files: Record<string, TypedFileState>;
}

/**
 * Type-safe file state with branded DocumentIds.
 */
export interface TypedFileState {
  mtime: number;
  size: number;
  hash: string;
  documentIds: DocumentId[];
}

// ============================================================================
// Change Detection Types
// ============================================================================

/**
 * Result of comparing current files against manifest.
 */
export interface DriftResult {
  /** Files that exist on disk but not in manifest */
  added: string[];
  /** Files that exist in both but have changed */
  modified: string[];
  /** Files that exist in manifest but not on disk */
  deleted: string[];
  /** Files that are unchanged */
  unchanged: string[];
}

// ============================================================================
// Default Manifest
// ============================================================================

/**
 * Create an empty manifest for a store.
 */
export function createEmptyManifest(storeId: StoreId): TypedStoreManifest {
  return {
    version: 1,
    storeId,
    indexedAt: new Date().toISOString(),
    files: {},
  };
}
