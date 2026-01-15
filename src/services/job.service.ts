import { randomUUID } from 'crypto';
import fs from 'fs';
import path from 'path';
import { JobSchema } from '../types/job.js';
import { Result, ok, err } from '../types/result.js';
import type { Job, CreateJobParams, UpdateJobParams, JobStatus } from '../types/job.js';

export class JobService {
  private readonly jobsDir: string;

  constructor(dataDir?: string) {
    // Default to ~/.local/share/bluera-knowledge/jobs
    let baseDir: string;
    if (dataDir !== undefined) {
      baseDir = dataDir;
    } else {
      const homeDir = process.env['HOME'] ?? process.env['USERPROFILE'];
      if (homeDir === undefined) {
        throw new Error('HOME or USERPROFILE environment variable is required');
      }
      baseDir = path.join(homeDir, '.local/share/bluera-knowledge');
    }
    this.jobsDir = path.join(baseDir, 'jobs');

    // Ensure jobs directory exists
    if (!fs.existsSync(this.jobsDir)) {
      fs.mkdirSync(this.jobsDir, { recursive: true });
    }
  }

  /**
   * Create a new job
   */
  createJob(params: CreateJobParams): Job {
    const job: Job = {
      id: `job_${randomUUID().replace(/-/g, '').substring(0, 12)}`,
      type: params.type,
      status: 'pending',
      progress: 0,
      message: params.message ?? `${params.type} job created`,
      details: params.details,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Write job to file
    this.writeJob(job);

    return job;
  }

  /**
   * Update an existing job
   */
  updateJob(jobId: string, updates: UpdateJobParams): void {
    const job = this.getJob(jobId);

    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    // Merge updates
    if (updates.status !== undefined) {
      job.status = updates.status;
    }
    if (updates.progress !== undefined) {
      job.progress = updates.progress;
    }
    if (updates.message !== undefined) {
      job.message = updates.message;
    }
    if (updates.details !== undefined) {
      job.details = { ...job.details, ...updates.details };
    }

    job.updatedAt = new Date().toISOString();

    // Write updated job
    this.writeJob(job);
  }

  /**
   * Get a job by ID
   */
  getJob(jobId: string): Job | null {
    const jobFile = path.join(this.jobsDir, `${jobId}.json`);

    if (!fs.existsSync(jobFile)) {
      return null;
    }

    try {
      const content = fs.readFileSync(jobFile, 'utf-8');
      return JobSchema.parse(JSON.parse(content));
    } catch (error) {
      throw new Error(
        `Failed to read job ${jobId}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * List all jobs with optional status filter
   */
  listJobs(statusFilter?: JobStatus | JobStatus[]): Job[] {
    if (!fs.existsSync(this.jobsDir)) {
      return [];
    }

    const files = fs.readdirSync(this.jobsDir);
    const jobs: Job[] = [];

    for (const file of files) {
      if (!file.endsWith('.json') || file.endsWith('.pid')) {
        continue;
      }

      try {
        const content = fs.readFileSync(path.join(this.jobsDir, file), 'utf-8');
        const job = JobSchema.parse(JSON.parse(content));

        if (statusFilter !== undefined) {
          const filters = Array.isArray(statusFilter) ? statusFilter : [statusFilter];
          if (filters.includes(job.status)) {
            jobs.push(job);
          }
        } else {
          jobs.push(job);
        }
      } catch (error) {
        throw new Error(
          `Failed to read job file ${file}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    // Sort by updated time (most recent first)
    jobs.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    return jobs;
  }

  /**
   * List active jobs (pending or running)
   */
  listActiveJobs(): Job[] {
    return this.listJobs(['pending', 'running']);
  }

  /**
   * Cancel a job
   */
  cancelJob(jobId: string): Result<void> {
    const job = this.getJob(jobId);

    if (!job) {
      return err(new Error(`Job ${jobId} not found`));
    }

    if (job.status === 'completed' || job.status === 'failed') {
      return err(new Error(`Cannot cancel ${job.status} job`));
    }

    if (job.status === 'cancelled') {
      return ok(undefined);
    }

    // Update job status
    this.updateJob(jobId, {
      status: 'cancelled',
      message: 'Job cancelled by user',
      details: { cancelledAt: new Date().toISOString() },
    });

    // Kill worker process if it exists
    const pidFile = path.join(this.jobsDir, `${jobId}.pid`);
    if (fs.existsSync(pidFile)) {
      try {
        const pid = parseInt(fs.readFileSync(pidFile, 'utf-8'), 10);
        // Validate PID: must be positive integer > 0
        // PID 0 = sends to process group (DANGEROUS - kills terminal!)
        // Negative PIDs have special meanings in kill()
        if (!Number.isNaN(pid) && Number.isInteger(pid) && pid > 0) {
          process.kill(pid, 'SIGTERM');
        }
      } catch {
        // Process may have already exited, ignore
      }
      // Always delete the PID file, even if kill failed
      try {
        fs.unlinkSync(pidFile);
      } catch {
        // Ignore if file already deleted
      }
    }

    return ok(undefined);
  }

  /**
   * Clean up old completed/failed/cancelled jobs
   */
  cleanupOldJobs(olderThanHours: number = 24): number {
    const jobs = this.listJobs();
    const cutoffTime = Date.now() - olderThanHours * 60 * 60 * 1000;
    let cleaned = 0;

    for (const job of jobs) {
      if (
        (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') &&
        new Date(job.updatedAt).getTime() < cutoffTime
      ) {
        const jobFile = path.join(this.jobsDir, `${job.id}.json`);
        try {
          fs.unlinkSync(jobFile);
          cleaned++;
        } catch (error) {
          throw new Error(
            `Failed to delete job file ${job.id}: ${error instanceof Error ? error.message : String(error)}`
          );
        }
      }
    }

    return cleaned;
  }

  /**
   * Clean up stale pending jobs that never started or got stuck
   *
   * @param olderThanHours - Consider pending jobs stale after this many hours (default 2)
   * @param options - Options for cleanup behavior
   * @param options.markAsFailed - If true, mark jobs as failed instead of deleting
   * @returns Number of jobs cleaned up or marked as failed
   */
  cleanupStalePendingJobs(
    olderThanHours: number = 2,
    options: { markAsFailed?: boolean } = {}
  ): number {
    const jobs = this.listJobs();
    const cutoffTime = Date.now() - olderThanHours * 60 * 60 * 1000;
    let cleaned = 0;

    for (const job of jobs) {
      if (job.status === 'pending' && new Date(job.updatedAt).getTime() < cutoffTime) {
        const jobFile = path.join(this.jobsDir, `${job.id}.json`);

        if (options.markAsFailed === true) {
          // Mark as failed instead of deleting
          this.updateJob(job.id, {
            status: 'failed',
            message: `Job marked as stale - pending for over ${String(olderThanHours)} hours without progress`,
          });
        } else {
          // Delete the job file
          try {
            fs.unlinkSync(jobFile);
          } catch (error) {
            throw new Error(
              `Failed to delete stale job ${job.id}: ${error instanceof Error ? error.message : String(error)}`
            );
          }
        }
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * Delete a specific job
   */
  deleteJob(jobId: string): boolean {
    const jobFile = path.join(this.jobsDir, `${jobId}.json`);

    if (!fs.existsSync(jobFile)) {
      return false;
    }

    try {
      fs.unlinkSync(jobFile);
      return true;
    } catch (error) {
      throw new Error(
        `Failed to delete job ${jobId}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Write job to file
   */
  private writeJob(job: Job): void {
    const jobFile = path.join(this.jobsDir, `${job.id}.json`);
    fs.writeFileSync(jobFile, JSON.stringify(job, null, 2), 'utf-8');
  }
}
