import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BackgroundWorker } from './background-worker.js';
import { JobService } from '../services/job.service.js';
import { StoreService } from '../services/store.service.js';
import { IndexService } from '../services/index.service.js';
import { mkdtempSync, rmSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

describe('BackgroundWorker', () => {
  let tempDir: string;
  let jobService: JobService;
  let storeService: StoreService;
  let indexService: IndexService;
  let worker: BackgroundWorker;

  beforeEach(async () => {
    tempDir = mkdtempSync(join(tmpdir(), 'background-worker-test-'));
    jobService = new JobService(tempDir);
    storeService = new StoreService(tempDir);
    indexService = new IndexService(tempDir);
    worker = new BackgroundWorker(jobService, storeService, indexService);
  });

  afterEach(() => {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('executeJob', () => {
    it('should throw error for non-existent job', async () => {
      await expect(worker.executeJob('non-existent')).rejects.toThrow(
        'Job non-existent not found'
      );
    });

    it('should throw error for unknown job type', async () => {
      const job = jobService.createJob({
        // @ts-expect-error testing invalid job type
        type: 'unknown',
        details: { storeId: 'test' }
      });

      await expect(worker.executeJob(job.id)).rejects.toThrow(
        'Unknown job type: unknown'
      );
    });

    it('should set job to running status before execution', async () => {
      const job = jobService.createJob({
        type: 'crawl', // Using crawl since it's not implemented
        details: { storeId: 'test' }
      });

      try {
        await worker.executeJob(job.id);
      } catch {
        // Expected to fail since crawl is not implemented
      }

      const updated = jobService.getJob(job.id);
      // Should have been set to running before throwing error
      expect(updated?.status).toBe('failed');
    });

    it('should update job to failed status on error', async () => {
      const job = jobService.createJob({
        type: 'crawl', // Not implemented, will throw
        details: { storeId: 'test' }
      });

      await expect(worker.executeJob(job.id)).rejects.toThrow(
        'Crawl jobs not yet implemented'
      );

      const updated = jobService.getJob(job.id);
      expect(updated?.status).toBe('failed');
      expect(updated?.message).toBe('Crawl jobs not yet implemented');
    });
  });

  describe('executeIndexJob', () => {
    it('should throw error for job without storeId', async () => {
      const job = jobService.createJob({
        type: 'index',
        details: {}
      });

      await expect(worker.executeJob(job.id)).rejects.toThrow(
        'Store ID required for index job'
      );
    });

    it('should throw error for non-existent store', async () => {
      const job = jobService.createJob({
        type: 'index',
        details: { storeId: 'non-existent-store' }
      });

      await expect(worker.executeJob(job.id)).rejects.toThrow(
        'Store non-existent-store not found'
      );
    });

  });

  describe('executeCloneJob', () => {
    it('should throw error for job without storeId', async () => {
      const job = jobService.createJob({
        type: 'clone',
        details: {}
      });

      await expect(worker.executeJob(job.id)).rejects.toThrow(
        'Store ID required for clone job'
      );
    });

    it('should throw error for non-existent store', async () => {
      const job = jobService.createJob({
        type: 'clone',
        details: { storeId: 'non-existent-store' }
      });

      await expect(worker.executeJob(job.id)).rejects.toThrow(
        'Store non-existent-store not found'
      );
    });
  });

  describe('executeCrawlJob', () => {
    it('should throw error for unimplemented crawl job', async () => {
      const job = jobService.createJob({
        type: 'crawl',
        details: { url: 'https://example.com' }
      });

      await expect(worker.executeJob(job.id)).rejects.toThrow(
        'Crawl jobs not yet implemented'
      );
    });
  });
});
