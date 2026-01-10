import { z } from 'zod';
import { StoreDefinitionService } from '../../services/store-definition.service.js';
import {
  isFileStoreDefinition,
  isRepoStoreDefinition,
  isWebStoreDefinition,
} from '../../types/store-definition.js';
import type { CommandDefinition } from './registry.js';
import type { StoreDefinition } from '../../types/store-definition.js';
import type { HandlerContext, ToolResponse } from '../types.js';

/**
 * Arguments for stores:sync command
 */
export interface SyncStoresArgs {
  prune?: boolean;
  dryRun?: boolean;
}

/**
 * Result of a sync operation
 */
interface SyncResult {
  created: string[];
  skipped: string[];
  failed: Array<{ name: string; error: string }>;
  orphans: string[];
  pruned?: string[];
  dryRun?: boolean;
  wouldCreate?: string[];
  wouldPrune?: string[];
}

/**
 * Handle stores:sync command
 *
 * Syncs stores from definitions config:
 * - Creates missing stores from definitions
 * - Reports stores not in definitions (orphans)
 * - Optionally prunes orphan stores
 */
export async function handleStoresSync(
  args: SyncStoresArgs,
  context: HandlerContext
): Promise<ToolResponse> {
  const { services, options } = context;
  const projectRoot = options.projectRoot;

  if (projectRoot === undefined) {
    throw new Error('Project root is required for stores:sync');
  }

  const defService = new StoreDefinitionService(projectRoot);
  const config = await defService.load();

  const result: SyncResult = {
    created: [],
    skipped: [],
    failed: [],
    orphans: [],
  };

  if (args.dryRun === true) {
    result.dryRun = true;
    result.wouldCreate = [];
    result.wouldPrune = [];
  }

  // Get existing stores
  const existingStores = await services.store.list();
  const existingNames = new Set(existingStores.map((s) => s.name));

  // Process each definition
  for (const def of config.stores) {
    if (existingNames.has(def.name)) {
      result.skipped.push(def.name);
      continue;
    }

    if (args.dryRun === true) {
      result.wouldCreate?.push(def.name);
      continue;
    }

    // Try to create the store
    const createResult = await createStoreFromDefinition(def, defService, services, context);
    if (createResult.success) {
      result.created.push(def.name);
    } else {
      result.failed.push({ name: def.name, error: createResult.error });
    }
  }

  // Find orphans (stores not in definitions)
  const definedNames = new Set(config.stores.map((d) => d.name));
  for (const store of existingStores) {
    if (!definedNames.has(store.name)) {
      result.orphans.push(store.name);
    }
  }

  // Prune orphans if requested
  if (args.prune === true && result.orphans.length > 0) {
    if (args.dryRun === true) {
      result.wouldPrune = [...result.orphans];
    } else {
      result.pruned = [];
      for (const orphanName of result.orphans) {
        const store = await services.store.getByName(orphanName);
        if (store !== undefined) {
          const deleteResult = await services.store.delete(store.id, { skipDefinitionSync: true });
          if (deleteResult.success) {
            result.pruned.push(orphanName);
          }
        }
      }
    }
  }

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
}

/**
 * Create a store from a definition
 */
async function createStoreFromDefinition(
  def: StoreDefinition,
  defService: StoreDefinitionService,
  services: HandlerContext['services'],
  _context: HandlerContext
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    if (isFileStoreDefinition(def)) {
      // Resolve path relative to project root
      const resolvedPath = defService.resolvePath(def.path);
      const createResult = await services.store.create(
        {
          name: def.name,
          type: 'file',
          path: resolvedPath,
          description: def.description,
          tags: def.tags,
        },
        { skipDefinitionSync: true } // Don't re-add to definitions
      );
      if (!createResult.success) {
        return { success: false, error: createResult.error.message };
      }
      return { success: true };
    }

    if (isRepoStoreDefinition(def)) {
      const createResult = await services.store.create(
        {
          name: def.name,
          type: 'repo',
          url: def.url,
          branch: def.branch,
          depth: def.depth,
          description: def.description,
          tags: def.tags,
        },
        { skipDefinitionSync: true }
      );
      if (!createResult.success) {
        return { success: false, error: createResult.error.message };
      }
      return { success: true };
    }

    if (isWebStoreDefinition(def)) {
      const createResult = await services.store.create(
        {
          name: def.name,
          type: 'web',
          url: def.url,
          depth: def.depth,
          description: def.description,
          tags: def.tags,
        },
        { skipDefinitionSync: true }
      );
      if (!createResult.success) {
        return { success: false, error: createResult.error.message };
      }
      return { success: true };
    }

    return { success: false, error: 'Unknown store definition type' };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Sync commands for the execute meta-tool
 */
export const syncCommands: CommandDefinition[] = [
  {
    name: 'stores:sync',
    description: 'Sync stores from definitions config (bootstrap on fresh clone)',
    argsSchema: z.object({
      prune: z.boolean().optional().describe('Remove stores not in definitions'),
      dryRun: z.boolean().optional().describe('Show what would happen without making changes'),
    }),
    handler: (args: Record<string, unknown>, context: HandlerContext): Promise<ToolResponse> => {
      const syncArgs: SyncStoresArgs = {};
      if (typeof args['prune'] === 'boolean') {
        syncArgs.prune = args['prune'];
      }
      if (typeof args['dryRun'] === 'boolean') {
        syncArgs.dryRun = args['dryRun'];
      }
      return handleStoresSync(syncArgs, context);
    },
  },
];
