import { existsSync } from 'node:fs';
import { readdir, rm } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { createLogger } from '../../logging/index.js';
import type { ToolHandler, ToolResponse } from '../types.js';

const logger = createLogger('uninstall-handler');

/**
 * Arguments for the uninstall handler
 */
export interface UninstallArgs {
  /** Also remove global data (~/.local/share/bluera-knowledge) */
  global?: boolean;
  /** Keep stores.config.json (default: true) */
  keepDefinitions?: boolean;
}

/**
 * Handle uninstall requests
 *
 * Removes Bluera Knowledge data from the project and optionally global data.
 * Always prints instructions for clearing the plugin cache.
 */
export const handleUninstall: ToolHandler<UninstallArgs> = async (
  args,
  context
): Promise<ToolResponse> => {
  const { global: includeGlobal = false, keepDefinitions = true } = args;
  const deleted: string[] = [];
  const kept: string[] = [];
  const errors: string[] = [];

  // Get project root from context or options
  const projectRoot = context.options.projectRoot ?? process.cwd();
  const projectDataDir = join(projectRoot, '.bluera', 'bluera-knowledge');

  logger.info({ projectDataDir, includeGlobal, keepDefinitions }, 'Starting uninstall');

  // Delete project data
  if (existsSync(projectDataDir)) {
    if (keepDefinitions) {
      // Delete everything except stores.config.json
      try {
        const entries = await readdir(projectDataDir, { withFileTypes: true });
        for (const entry of entries) {
          const entryPath = join(projectDataDir, entry.name);
          if (entry.name === 'stores.config.json') {
            kept.push(entryPath);
            continue;
          }
          try {
            await rm(entryPath, { recursive: true, force: true });
            deleted.push(entryPath);
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            errors.push(`Failed to delete ${entryPath}: ${msg}`);
            logger.error({ error: msg, path: entryPath }, 'Failed to delete');
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`Failed to read ${projectDataDir}: ${msg}`);
        logger.error({ error: msg, path: projectDataDir }, 'Failed to read directory');
      }
    } else {
      // Delete entire directory including stores.config.json
      try {
        await rm(projectDataDir, { recursive: true, force: true });
        deleted.push(projectDataDir);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`Failed to delete ${projectDataDir}: ${msg}`);
        logger.error({ error: msg, path: projectDataDir }, 'Failed to delete');
      }
    }
  }

  // Delete global data if requested
  if (includeGlobal) {
    const globalDir = join(homedir(), '.local', 'share', 'bluera-knowledge');
    if (existsSync(globalDir)) {
      try {
        await rm(globalDir, { recursive: true, force: true });
        deleted.push(globalDir);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`Failed to delete ${globalDir}: ${msg}`);
        logger.error({ error: msg, path: globalDir }, 'Failed to delete global data');
      }
    }
  }

  logger.info({ deleted, kept, errors }, 'Uninstall complete');

  // Build result message
  const lines: string[] = [];

  if (deleted.length > 0) {
    lines.push('## Deleted:');
    for (const path of deleted) {
      lines.push(`- ${path}`);
    }
  } else {
    lines.push('No data found to delete.');
  }

  if (kept.length > 0) {
    lines.push('');
    lines.push('## Preserved:');
    for (const path of kept) {
      lines.push(`- ${path}`);
    }
    lines.push('');
    lines.push('_Use `keepDefinitions: false` to also remove stores.config.json_');
  }

  if (errors.length > 0) {
    lines.push('');
    lines.push('## Errors:');
    for (const error of errors) {
      lines.push(`- ${error}`);
    }
  }

  // Always include plugin cache instructions
  // Note: Python venv is inside plugin cache, so it gets cleaned automatically
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('## To fully uninstall (clear plugin cache):');
  lines.push('1. Exit Claude Code');
  lines.push('2. Run: `rm -rf ~/.claude/plugins/cache/bluera-knowledge-*`');
  lines.push('3. Restart Claude Code');
  lines.push('');
  lines.push('_This removes the plugin, Python venv, and all dependencies._');

  return {
    content: [{ type: 'text', text: lines.join('\n') }],
  };
};
