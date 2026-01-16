import { z } from 'zod';
import { handleUninstall } from '../handlers/uninstall.handler.js';
import type { CommandDefinition } from './registry.js';
import type { UninstallArgs } from '../handlers/uninstall.handler.js';

/**
 * Uninstall commands for removing Bluera Knowledge data
 *
 * Provides cleanup functionality for testing fresh installs or removing the plugin.
 */
/* eslint-disable @typescript-eslint/consistent-type-assertions */
export const uninstallCommands: CommandDefinition[] = [
  {
    name: 'uninstall',
    description: 'Remove Bluera Knowledge data from project (and optionally global data)',
    argsSchema: z.object({
      global: z
        .boolean()
        .optional()
        .describe('Also remove global data (~/.local/share/bluera-knowledge)'),
      keepDefinitions: z
        .boolean()
        .optional()
        .describe('Keep stores.config.json for team sharing (default: true)'),
    }),
    handler: (args, context) => handleUninstall(args as unknown as UninstallArgs, context),
  },
];
/* eslint-enable @typescript-eslint/consistent-type-assertions */
