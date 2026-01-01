import type { ServiceContainer } from '../services/index.js';

/**
 * Configuration options for the MCP server
 */
export interface MCPServerOptions {
  dataDir?: string | undefined;
  config?: string | undefined;
  projectRoot?: string | undefined;
}

/**
 * Context passed to each handler containing services and options
 */
export interface HandlerContext {
  services: ServiceContainer;
  options: MCPServerOptions;
}

/**
 * Standard MCP tool response format
 */
export interface ToolResponse {
  content: Array<{
    type: 'text';
    text: string;
  }>;
  [x: string]: unknown;
}

/**
 * Tool handler function signature
 *
 * @param args - Validated input arguments (typed with Zod schema)
 * @param context - Handler context with services and options
 * @returns Promise resolving to MCP tool response
 */
export type ToolHandler<TInput = unknown> = (
  args: TInput,
  context: HandlerContext
) => Promise<ToolResponse>;
