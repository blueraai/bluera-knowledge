import { JobService } from '../services/job.service.js';
import { StoreService } from '../services/store.service.js';
import { IndexService } from '../services/index.service.js';
import type { Job } from '../types/job.js';
import { createStoreId } from '../types/brands.js';

export class BackgroundWorker {
  constructor(
    private readonly jobService: JobService,
    private readonly storeService: StoreService,
    private readonly indexService: IndexService
  ) {}

  /**
   * Execute a job based on its type
   */
  async executeJob(jobId: string): Promise<void> {
    const job = this.jobService.getJob(jobId);

    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    try {
      // Update to running status
      this.jobService.updateJob(jobId, {
        status: 'running',
        message: `Starting ${job.type} operation...`,
        progress: 0,
        details: { startedAt: new Date().toISOString() }
      });

      // Execute based on job type
      switch (job.type) {
        case 'clone':
          await this.executeCloneJob(job);
          break;
        case 'index':
          await this.executeIndexJob(job);
          break;
        case 'crawl':
          await this.executeCrawlJob(job);
          break;
        default:
          throw new Error(`Unknown job type: ${String(job.type)}`);
      }

      // Mark as completed
      this.jobService.updateJob(jobId, {
        status: 'completed',
        progress: 100,
        message: `${job.type} operation completed successfully`,
        details: { completedAt: new Date().toISOString() }
      });
    } catch (error) {
      // Mark as failed
      const errorDetails: Record<string, unknown> = {
        completedAt: new Date().toISOString()
      };
      if (error instanceof Error && error.stack !== undefined) {
        errorDetails['error'] = error.stack;
      } else {
        errorDetails['error'] = String(error);
      }
      this.jobService.updateJob(jobId, {
        status: 'failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: errorDetails
      });
      throw error;
    }
  }

  /**
   * Execute a clone job (git clone + initial indexing)
   */
  private async executeCloneJob(job: Job): Promise<void> {
    const { storeId } = job.details;

    if (storeId === undefined || typeof storeId !== 'string') {
      throw new Error('Store ID required for clone job');
    }

    // Get the store
    const store = await this.storeService.get(createStoreId(storeId));
    if (!store) {
      throw new Error(`Store ${storeId} not found`);
    }

    // Clone is already done by the time the job is created
    // (happens in StoreService.create), so we just need to index

    // Update progress - cloning considered done (30%)
    this.jobService.updateJob(job.id, {
      status: 'running',
      message: 'Repository cloned, starting indexing...',
      progress: 30
    });

    // Index the repository with progress updates
    const result = await this.indexService.indexStore(store, (event: { type: string; current: number; total: number; message: string }) => {
      // Check if job was cancelled
      const currentJob = this.jobService.getJob(job.id);
      if (currentJob?.status === 'cancelled') {
        throw new Error('Job cancelled by user');
      }

      // Indexing is 70% of total progress (30-100%)
      const indexProgress = (event.current / event.total) * 70;
      const totalProgress = 30 + indexProgress;

      this.jobService.updateJob(job.id, {
        message: `Indexed ${String(event.current)}/${String(event.total)} files`,
        progress: Math.min(99, totalProgress), // Cap at 99 until fully complete
        details: {
          filesProcessed: event.current,
          totalFiles: event.total
        }
      });
    });

    if (!result.success) {
      throw result.error;
    }
  }

  /**
   * Execute an index job (re-indexing existing store)
   */
  private async executeIndexJob(job: Job): Promise<void> {
    const { storeId } = job.details;

    if (storeId === undefined || typeof storeId !== 'string') {
      throw new Error('Store ID required for index job');
    }

    // Get the store
    const store = await this.storeService.getByIdOrName(createStoreId(storeId));
    if (!store) {
      throw new Error(`Store ${storeId} not found`);
    }

    // Index with progress updates
    const result = await this.indexService.indexStore(store, (event: { type: string; current: number; total: number; message: string }) => {
      // Check if job was cancelled
      const currentJob = this.jobService.getJob(job.id);
      if (currentJob?.status === 'cancelled') {
        throw new Error('Job cancelled by user');
      }

      const progress = (event.current / event.total) * 100;

      this.jobService.updateJob(job.id, {
        message: `Indexed ${String(event.current)}/${String(event.total)} files`,
        progress: Math.min(99, progress), // Cap at 99 until fully complete
        details: {
          filesProcessed: event.current,
          totalFiles: event.total
        }
      });
    });

    if (!result.success) {
      throw result.error;
    }
  }

  /**
   * Execute a crawl job (web crawling + indexing)
   */
  private executeCrawlJob(_job: Job): Promise<void> {
    // TODO: Implement web crawling
    // This will be implemented when web crawling feature is added
    throw new Error('Crawl jobs not yet implemented');
  }
}
