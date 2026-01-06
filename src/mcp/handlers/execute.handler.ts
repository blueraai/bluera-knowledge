import type { ToolHandler, ToolResponse } from '../types.js';
import type { ExecuteArgs } from '../schemas/index.js';
import { ExecuteArgsSchema } from '../schemas/index.js';
// Import commands module to register all commands
import '../commands/index.js';
import { executeCommand } from '../commands/index.js';

/**
 * Handle execute requests
 *
 * This is the meta-tool handler that routes to registered commands.
 * It consolidates store and job management into a single tool surface.
 */
export const handleExecute: ToolHandler<ExecuteArgs> = async (
  args,
  context
): Promise<ToolResponse> => {
  // Validate arguments with Zod
  const validated = ExecuteArgsSchema.parse(args);

  const commandArgs = validated.args ?? {};

  return executeCommand(validated.command, commandArgs, context);
};
