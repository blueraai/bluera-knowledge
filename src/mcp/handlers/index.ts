import { z } from 'zod';
import type { ToolHandler } from '../types.js';
import {
  SearchArgsSchema,
  GetFullContextArgsSchema
} from '../schemas/index.js';
import {
  handleSearch,
  handleGetFullContext
} from './search.handler.js';

/**
 * Tool definition with schema and handler
 */
export interface ToolDefinition {
  name: string;
  description: string;
  schema: z.ZodType;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler: ToolHandler<any>;
}

/**
 * Registry of native MCP tools
 *
 * Only search and get_full_context are native tools with full schemas.
 * Store and job management is consolidated into the execute meta-tool
 * (see commands/ directory and execute.handler.ts).
 */
export const tools: ToolDefinition[] = [
  {
    name: 'search',
    description: 'Search all indexed knowledge stores with pattern detection and AI-optimized results. Returns structured code units with progressive context layers.',
    schema: SearchArgsSchema,
    handler: handleSearch
  },
  {
    name: 'get_full_context',
    description: 'Get complete code and context for a specific search result by ID. Use this after search to get full implementation details.',
    schema: GetFullContextArgsSchema,
    handler: handleGetFullContext
  }
];
