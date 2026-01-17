// Import commands module - side effect registers all commands, then use executeCommand
import { createLogger } from '../../logging/index.js';
import { executeCommand } from '../commands/index.js';
import { ExecuteArgsSchema } from '../schemas/index.js';
import type { ExecuteArgs } from '../schemas/index.js';
import type { ToolHandler, ToolResponse } from '../types.js';

const logger = createLogger('mcp-execute');

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

  logger.info(
    { command: validated.command, args: JSON.stringify(commandArgs) },
    'Execute command started'
  );

  const startTime = Date.now();
  try {
    const result = await executeCommand(validated.command, commandArgs, context);
    const durationMs = Date.now() - startTime;
    logger.info({ command: validated.command, durationMs }, 'Execute command completed');
    return result;
  } catch (error) {
    const durationMs = Date.now() - startTime;
    logger.error(
      {
        command: validated.command,
        durationMs,
        error: error instanceof Error ? error.message : String(error),
      },
      'Execute command failed'
    );
    throw error;
  }
};
