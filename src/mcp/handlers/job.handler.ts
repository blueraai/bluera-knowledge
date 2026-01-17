import { createLogger } from '../../logging/index.js';
import { JobService } from '../../services/job.service.js';
import {
  CheckJobStatusArgsSchema,
  ListJobsArgsSchema,
  CancelJobArgsSchema,
} from '../schemas/index.js';
import type { CheckJobStatusArgs, ListJobsArgs, CancelJobArgs } from '../schemas/index.js';
import type { ToolHandler, ToolResponse } from '../types.js';

const logger = createLogger('mcp-job');

/**
 * Handle check_job_status requests
 *
 * Retrieves the current status of a background job.
 */
export const handleCheckJobStatus: ToolHandler<CheckJobStatusArgs> = (
  args,
  context
): Promise<ToolResponse> => {
  // Validate arguments with Zod
  const validated = CheckJobStatusArgsSchema.parse(args);
  logger.info({ jobId: validated.jobId }, 'Check job status started');

  const { options } = context;

  const jobService = new JobService(options.dataDir);
  const job = jobService.getJob(validated.jobId);

  if (!job) {
    logger.warn({ jobId: validated.jobId }, 'Job not found');
    throw new Error(`Job not found: ${validated.jobId}`);
  }

  logger.info({ jobId: validated.jobId, status: job.status }, 'Check job status completed');

  return Promise.resolve({
    content: [
      {
        type: 'text',
        text: JSON.stringify(job, null, 2),
      },
    ],
  });
};

/**
 * Handle list_jobs requests
 *
 * Lists all jobs with optional filtering by status or active status.
 * Automatically cleans up stale pending jobs (>2 hours old) before listing.
 */
export const handleListJobs: ToolHandler<ListJobsArgs> = (args, context): Promise<ToolResponse> => {
  // Validate arguments with Zod
  const validated = ListJobsArgsSchema.parse(args);
  logger.info({ activeOnly: validated.activeOnly, status: validated.status }, 'List jobs started');

  const { options } = context;

  const jobService = new JobService(options.dataDir);

  // Auto-cleanup: mark stale pending jobs as failed (>2 hours with no progress)
  // This handles jobs where the worker never started or crashed
  jobService.cleanupStalePendingJobs(2, { markAsFailed: true });

  let jobs;
  if (validated.activeOnly === true) {
    jobs = jobService.listActiveJobs();
  } else if (validated.status !== undefined) {
    jobs = jobService.listJobs(validated.status);
  } else {
    jobs = jobService.listJobs();
  }

  logger.info({ count: jobs.length, activeOnly: validated.activeOnly }, 'List jobs completed');

  return Promise.resolve({
    content: [
      {
        type: 'text',
        text: JSON.stringify({ jobs }, null, 2),
      },
    ],
  });
};

/**
 * Handle cancel_job requests
 *
 * Cancels a running or pending background job.
 * Kills the worker process if it exists.
 */
export const handleCancelJob: ToolHandler<CancelJobArgs> = (
  args,
  context
): Promise<ToolResponse> => {
  // Validate arguments with Zod
  const validated = CancelJobArgsSchema.parse(args);
  logger.info({ jobId: validated.jobId }, 'Cancel job started');

  const { options } = context;

  const jobService = new JobService(options.dataDir);
  const result = jobService.cancelJob(validated.jobId);

  if (!result.success) {
    logger.error({ jobId: validated.jobId, error: result.error.message }, 'Cancel job failed');
    throw new Error(result.error.message);
  }

  const job = jobService.getJob(validated.jobId);

  logger.info({ jobId: validated.jobId, cancelled: true }, 'Cancel job completed');

  return Promise.resolve({
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            success: true,
            job,
            message: 'Job cancelled successfully',
          },
          null,
          2
        ),
      },
    ],
  });
};
