import { z } from 'zod';
import type { CommandDefinition } from './registry.js';
import type {
  CheckJobStatusArgs,
  ListJobsArgs,
  CancelJobArgs
} from '../schemas/index.js';
import {
  handleCheckJobStatus,
  handleListJobs,
  handleCancelJob
} from '../handlers/job.handler.js';

/**
 * Job management commands for the execute meta-tool
 *
 * These commands wrap the existing job handlers, providing
 * a unified interface through the execute command.
 */
export const jobCommands: CommandDefinition[] = [
  {
    name: 'jobs',
    description: 'List all background jobs',
    argsSchema: z.object({
      activeOnly: z.boolean().optional().describe('Only show active jobs'),
      status: z.enum(['pending', 'running', 'completed', 'failed', 'cancelled'])
        .optional()
        .describe('Filter by job status')
    }),
    handler: (args, context) => handleListJobs(args as unknown as ListJobsArgs, context)
  },
  {
    name: 'job:status',
    description: 'Check the status of a specific background job',
    argsSchema: z.object({
      jobId: z.string().min(1).describe('Job ID to check')
    }),
    handler: (args, context) => handleCheckJobStatus(args as unknown as CheckJobStatusArgs, context)
  },
  {
    name: 'job:cancel',
    description: 'Cancel a running or pending background job',
    argsSchema: z.object({
      jobId: z.string().min(1).describe('Job ID to cancel')
    }),
    handler: (args, context) => handleCancelJob(args as unknown as CancelJobArgs, context)
  }
];
