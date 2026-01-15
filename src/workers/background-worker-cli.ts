#!/usr/bin/env node
import { platform } from 'os';
import { BackgroundWorker } from './background-worker.js';
import { writePidFile, deletePidFile, buildPidFilePath } from './pid-file.js';
import { createLogger, shutdownLogger } from '../logging/index.js';
import { createServices, destroyServices } from '../services/index.js';
import { JobService } from '../services/job.service.js';

/**
 * Force exit the process to avoid ONNX runtime mutex crash on macOS.
 *
 * On macOS, the ONNX runtime (used by transformers.js for embeddings) has a known
 * bug where static mutex cleanup fails during process exit, causing a crash with:
 * "mutex lock failed: Invalid argument"
 *
 * This doesn't affect job completion - all work is done and persisted before exit.
 * Using SIGKILL bypasses the problematic cleanup code.
 *
 * See: https://github.com/microsoft/onnxruntime/issues/24579
 */
function forceExitOnMacOS(exitCode: number): void {
  if (platform() === 'darwin') {
    // Give time for any pending I/O to flush
    setTimeout(() => {
      process.kill(process.pid, 'SIGKILL');
    }, 100);
  } else {
    process.exit(exitCode);
  }
}

const logger = createLogger('background-worker-cli');

/**
 * Background worker CLI entry point
 *
 * Usage: background-worker-cli <job-id>
 *
 * This process runs detached from the parent and executes a single job.
 */

async function main(): Promise<void> {
  const jobId = process.argv[2];
  const dataDir = process.env['BLUERA_DATA_DIR'];

  if (jobId === undefined || jobId === '') {
    logger.error('Job ID required. Usage: background-worker-cli <job-id>');
    await shutdownLogger();
    process.exit(1);
  }

  // Initialize services
  const jobService = new JobService(dataDir);
  const services = await createServices(undefined, dataDir);

  // Write PID file for job cancellation - CRITICAL: must succeed or job cannot be cancelled
  const pidFile = buildPidFilePath(
    jobService['jobsDir'], // Access private field for PID path
    jobId
  );

  try {
    writePidFile(pidFile, process.pid);
  } catch (error) {
    // CRITICAL: Cannot proceed without PID file - job would be uncancellable
    logger.error(
      { error: error instanceof Error ? error.message : String(error) },
      'Failed to write PID file'
    );
    await shutdownLogger();
    process.exit(1);
  }

  // Handle SIGTERM for graceful shutdown
  process.on('SIGTERM', () => {
    logger.info({ jobId }, 'Received SIGTERM, cancelling job');
    jobService.updateJob(jobId, {
      status: 'cancelled',
      message: 'Job cancelled by user',
    });

    // Clean up PID file (best-effort - don't block shutdown)
    const deleteResult = deletePidFile(pidFile, 'sigterm');
    if (!deleteResult.success && deleteResult.error !== undefined) {
      logger.warn(
        { jobId, error: deleteResult.error.message },
        'Could not remove PID file during SIGTERM'
      );
    }

    // Flush logs before exit (best-effort, don't await in signal handler)
    void shutdownLogger().finally(() => process.exit(0));
  });

  // Create worker and execute job
  const worker = new BackgroundWorker(
    jobService,
    services.store,
    services.index,
    services.lance,
    services.embeddings
  );

  try {
    await worker.executeJob(jobId);

    // Clean up PID file on success (best-effort - don't change exit code)
    const successCleanup = deletePidFile(pidFile, 'success');
    if (!successCleanup.success && successCleanup.error !== undefined) {
      logger.warn(
        { jobId, error: successCleanup.error.message },
        'Could not remove PID file after success'
      );
    }

    logger.info({ jobId }, 'Job completed successfully');
    await destroyServices(services);
    await shutdownLogger();
    forceExitOnMacOS(0);
  } catch (error) {
    // Job service already updated with failure status in BackgroundWorker
    logger.error(
      { jobId, error: error instanceof Error ? error.message : String(error) },
      'Job failed'
    );

    // Clean up PID file on failure (best-effort - exit code reflects job failure)
    const failureCleanup = deletePidFile(pidFile, 'failure');
    if (!failureCleanup.success && failureCleanup.error !== undefined) {
      logger.warn(
        { jobId, error: failureCleanup.error.message },
        'Could not remove PID file after failure'
      );
    }

    await destroyServices(services);
    await shutdownLogger();
    forceExitOnMacOS(1);
  }
}

main().catch(async (error: unknown) => {
  logger.error(
    { error: error instanceof Error ? error.message : String(error) },
    'Fatal error in background worker'
  );
  await shutdownLogger();
  forceExitOnMacOS(1);
});
