import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { createServices } from '../services/index.js';
import { tools } from './handlers/index.js';
import { handleExecute } from './handlers/execute.handler.js';
import { ExecuteArgsSchema } from './schemas/index.js';
import type { MCPServerOptions } from './types.js';

// eslint-disable-next-line @typescript-eslint/no-deprecated
export function createMCPServer(options: MCPServerOptions): Server {
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  const server = new Server(
    {
      name: 'bluera-knowledge',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // List available tools - consolidated from 10 tools to 3 for reduced context overhead
  server.setRequestHandler(ListToolsRequestSchema, () => {
    return Promise.resolve({
      tools: [
        // Native search tool with full schema (most used, benefits from detailed params)
        {
          name: 'search',
          description: 'Search all indexed knowledge stores with pattern detection and AI-optimized results. Returns structured code units with progressive context layers.',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Search query (can include type signatures, constraints, or natural language)'
              },
              intent: {
                type: 'string',
                enum: ['find-pattern', 'find-implementation', 'find-usage', 'find-definition', 'find-documentation'],
                description: 'Search intent for better ranking'
              },
              detail: {
                type: 'string',
                enum: ['minimal', 'contextual', 'full'],
                default: 'minimal',
                description: 'Context detail level: minimal (summary only), contextual (+ imports/types), full (+ complete code)'
              },
              limit: {
                type: 'number',
                default: 10,
                description: 'Maximum number of results'
              },
              stores: {
                type: 'array',
                items: { type: 'string' },
                description: 'Specific store IDs to search (optional)'
              }
            },
            required: ['query']
          }
        },
        // Native get_full_context tool (frequently used after search)
        {
          name: 'get_full_context',
          description: 'Get complete code and context for a specific search result by ID. Use this after search to get full implementation details.',
          inputSchema: {
            type: 'object',
            properties: {
              resultId: {
                type: 'string',
                description: 'Result ID from previous search'
              }
            },
            required: ['resultId']
          }
        },
        // Meta-tool for store and job management (consolidates 8 tools into 1)
        {
          name: 'execute',
          description: 'Execute store/job management commands. Commands: stores, store:info, store:create, store:index, store:delete, jobs, job:status, job:cancel, help, commands',
          inputSchema: {
            type: 'object',
            properties: {
              command: {
                type: 'string',
                description: 'Command to execute (e.g., "stores", "store:create", "jobs", "help")'
              },
              args: {
                type: 'object',
                description: 'Command arguments (e.g., {store: "mystore"} for store:info)'
              }
            },
            required: ['command']
          }
        }
      ]
    });
  });

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    // Create services once (needed by all handlers)
    const services = await createServices(
      options.config,
      options.dataDir,
      options.projectRoot
    );
    const context = { services, options };

    // Handle execute meta-tool
    if (name === 'execute') {
      const validated = ExecuteArgsSchema.parse(args ?? {});
      return handleExecute(validated, context);
    }

    // Find handler in registry for native tools (search, get_full_context)
    const tool = tools.find(t => t.name === name);
    if (tool === undefined) {
      throw new Error(`Unknown tool: ${name}`);
    }

    // Validate arguments with Zod
    const validated = tool.schema.parse(args ?? {});

    // Execute handler with context
    return tool.handler(validated, context);
  });

  return server;
}

export async function runMCPServer(options: MCPServerOptions): Promise<void> {
  const server = createMCPServer(options);
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('Bluera Knowledge MCP server running on stdio');
}

// Run the server only when this file is executed directly (not imported by CLI)
// Check if we're running as the mcp/server entry point vs being imported by index.js
const scriptPath = process.argv[1] ?? '';
const isMCPServerEntry = scriptPath.endsWith('mcp/server.js') || scriptPath.endsWith('mcp/server');

if (isMCPServerEntry) {
  runMCPServer({
    dataDir: process.env['DATA_DIR'],
    config: process.env['CONFIG_PATH'],
    projectRoot: process.env['PROJECT_ROOT'] ?? process.env['PWD']
  }).catch((error: unknown) => {
    console.error('Failed to start MCP server:', error);
    process.exit(1);
  });
}
