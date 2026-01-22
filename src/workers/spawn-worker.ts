import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { createLogger } from '../logging/index.js';

const logger = createLogger('spawn-worker');

/**
 * Spawn a background worker process to execute a job
 *
 * The worker runs detached from the parent process, allowing the
 * parent to exit while the worker continues running.
 *
 * @param jobId - The ID of the job to execute
 * @param dataDir - Optional data directory (uses default if undefined)
 */
export function spawnBackgroundWorker(jobId: string, dataDir?: string): void {
  // Determine the worker script path
  // In production, this will be the compiled dist file
  // In development, we need to use tsx to run TypeScript
  const currentFilePath = fileURLToPath(import.meta.url);
  const currentDir = path.dirname(currentFilePath);

  // Check if we're running from dist (production) or src (development)
  // Note: In bundled code, import.meta.url may point to a chunk file in dist root
  // Platform-agnostic check: match both /dist/ and \dist\ (Windows)
  const distPattern = `${path.sep}dist${path.sep}`;
  const isProduction = currentFilePath.includes(distPattern);

  let command: string;
  let args: string[];

  if (isProduction) {
    // Production: Use Node.js directly with compiled file
    // When bundled, the chunk may be in dist/ root, but worker CLI is in dist/workers/
    // Find the dist directory and construct the correct path
    const distIndex = currentFilePath.indexOf(distPattern);
    const distDir = currentFilePath.substring(0, distIndex + distPattern.length);
    const workerScript = path.join(distDir, 'workers', 'background-worker-cli.js');
    command = process.execPath; // Use the same Node.js binary
    args = [workerScript, jobId];
    logger.debug({ workerScript, distDir, currentFilePath }, 'Production worker path');
  } else {
    // Development: Use tsx to run TypeScript directly
    const workerScript = path.join(currentDir, 'background-worker-cli.ts');
    command = 'npx';
    args = ['tsx', workerScript, jobId];
    logger.debug({ workerScript, currentDir }, 'Development worker path');
  }

  logger.info({ jobId, command, args, dataDir, isProduction }, 'Spawning background worker');

  // Spawn the worker process
  const worker = spawn(command, args, {
    detached: true, // Detach from parent process
    stdio: 'ignore', // Don't pipe stdio (fully independent)
    env: {
      ...process.env, // Inherit environment variables
      ...(dataDir !== undefined && dataDir !== '' ? { BLUERA_DATA_DIR: dataDir } : {}), // Only set if provided
    },
  });

  // Handle spawn errors
  worker.on('error', (err) => {
    logger.error({ jobId, error: err.message }, 'Failed to spawn background worker');
  });

  logger.info({ jobId, pid: worker.pid }, 'Background worker spawned');

  // Unref the worker so the parent can exit
  worker.unref();
}
