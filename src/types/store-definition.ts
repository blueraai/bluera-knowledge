import { z } from 'zod';

/**
 * Store definition schemas for git-committable configuration.
 *
 * Store definitions capture the essential information needed to recreate
 * a store, without the runtime data (vector embeddings, cloned repos).
 * This allows teams to share store configurations via version control.
 */

// ============================================================================
// Base Schema
// ============================================================================

/**
 * Base fields common to all store definitions
 */
const BaseStoreDefinitionSchema = z.object({
  name: z.string().min(1, 'Store name is required'),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

// ============================================================================
// File Store Definition
// ============================================================================

/**
 * File store definition - references a local directory.
 * Path can be relative (resolved against project root) or absolute.
 */
export const FileStoreDefinitionSchema = BaseStoreDefinitionSchema.extend({
  type: z.literal('file'),
  path: z.string().min(1, 'Path is required for file stores'),
});

export type FileStoreDefinition = z.infer<typeof FileStoreDefinitionSchema>;

// ============================================================================
// Repo Store Definition
// ============================================================================

/**
 * Repo store definition - references a git repository.
 * The repo will be cloned on sync.
 */
export const RepoStoreDefinitionSchema = BaseStoreDefinitionSchema.extend({
  type: z.literal('repo'),
  url: z.url('Valid URL is required for repo stores'),
  branch: z.string().optional(),
  depth: z.number().int().positive('Depth must be a positive integer').optional(),
});

export type RepoStoreDefinition = z.infer<typeof RepoStoreDefinitionSchema>;

// ============================================================================
// Web Store Definition
// ============================================================================

/**
 * Web store definition - references a website to crawl.
 * Supports intelligent crawling with natural language instructions.
 */
export const WebStoreDefinitionSchema = BaseStoreDefinitionSchema.extend({
  type: z.literal('web'),
  url: z.url('Valid URL is required for web stores'),
  depth: z.number().int().min(0, 'Depth must be non-negative').default(1),
  maxPages: z.number().int().positive('maxPages must be a positive integer').optional(),
  crawlInstructions: z.string().optional(),
  extractInstructions: z.string().optional(),
});

export type WebStoreDefinition = z.infer<typeof WebStoreDefinitionSchema>;

// ============================================================================
// Union Type
// ============================================================================

/**
 * Discriminated union of all store definition types.
 * Use the `type` field to narrow the type.
 */
export const StoreDefinitionSchema = z.discriminatedUnion('type', [
  FileStoreDefinitionSchema,
  RepoStoreDefinitionSchema,
  WebStoreDefinitionSchema,
]);

export type StoreDefinition = z.infer<typeof StoreDefinitionSchema>;

// ============================================================================
// Config Schema
// ============================================================================

/**
 * Root configuration schema for store definitions.
 * Version field enables future schema migrations.
 */
export const StoreDefinitionsConfigSchema = z.object({
  version: z.literal(1),
  stores: z.array(StoreDefinitionSchema),
});

export type StoreDefinitionsConfig = z.infer<typeof StoreDefinitionsConfigSchema>;

// ============================================================================
// Type Guards
// ============================================================================

export function isFileStoreDefinition(def: StoreDefinition): def is FileStoreDefinition {
  return def.type === 'file';
}

export function isRepoStoreDefinition(def: StoreDefinition): def is RepoStoreDefinition {
  return def.type === 'repo';
}

export function isWebStoreDefinition(def: StoreDefinition): def is WebStoreDefinition {
  return def.type === 'web';
}

// ============================================================================
// Default Config
// ============================================================================

export const DEFAULT_STORE_DEFINITIONS_CONFIG: StoreDefinitionsConfig = {
  version: 1,
  stores: [],
};
