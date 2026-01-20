import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { rm, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { DriftService } from './drift.service.js';
import { createStoreId, createDocumentId } from '../types/brands.js';
import type { TypedStoreManifest } from '../types/manifest.js';
import type { CurrentFileState } from './drift.service.js';

describe('DriftService', () => {
  let testDir: string;
  let service: DriftService;

  beforeEach(async () => {
    testDir = join(tmpdir(), `drift-test-${Date.now()}-${process.pid}`);
    await mkdir(testDir, { recursive: true });
    service = new DriftService();
  });

  afterEach(async () => {
    try {
      await rm(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('detectChanges', () => {
    it('detects added files (not in manifest)', async () => {
      const storeId = createStoreId('test-store');
      const manifest: TypedStoreManifest = {
        version: 1,
        storeId,
        indexedAt: '2024-01-01T00:00:00.000Z',
        files: {},
      };

      const currentFiles: CurrentFileState[] = [
        { path: '/new/file.ts', mtime: 1704067200000, size: 100 },
      ];

      const result = await service.detectChanges(manifest, currentFiles);

      expect(result.added).toEqual(['/new/file.ts']);
      expect(result.modified).toEqual([]);
      expect(result.deleted).toEqual([]);
      expect(result.unchanged).toEqual([]);
    });

    it('detects deleted files (in manifest but not on disk)', async () => {
      const storeId = createStoreId('test-store');
      const manifest: TypedStoreManifest = {
        version: 1,
        storeId,
        indexedAt: '2024-01-01T00:00:00.000Z',
        files: {
          '/deleted/file.ts': {
            mtime: 1704067200000,
            size: 100,
            hash: 'abc123',
            documentIds: [createDocumentId('doc-1')],
          },
        },
      };

      const currentFiles: CurrentFileState[] = [];

      const result = await service.detectChanges(manifest, currentFiles);

      expect(result.added).toEqual([]);
      expect(result.modified).toEqual([]);
      expect(result.deleted).toEqual(['/deleted/file.ts']);
      expect(result.unchanged).toEqual([]);
    });

    it('detects unchanged files (same mtime and size)', async () => {
      const storeId = createStoreId('test-store');
      const manifest: TypedStoreManifest = {
        version: 1,
        storeId,
        indexedAt: '2024-01-01T00:00:00.000Z',
        files: {
          '/unchanged/file.ts': {
            mtime: 1704067200000,
            size: 100,
            hash: 'abc123',
            documentIds: [createDocumentId('doc-1')],
          },
        },
      };

      const currentFiles: CurrentFileState[] = [
        { path: '/unchanged/file.ts', mtime: 1704067200000, size: 100 },
      ];

      const result = await service.detectChanges(manifest, currentFiles);

      expect(result.added).toEqual([]);
      expect(result.modified).toEqual([]);
      expect(result.deleted).toEqual([]);
      expect(result.unchanged).toEqual(['/unchanged/file.ts']);
    });

    it('detects modified files via phase 2 hash check', async () => {
      // Create actual files for hash comparison
      const filePath = join(testDir, 'modified.ts');
      await writeFile(filePath, 'new content');

      const storeId = createStoreId('test-store');
      const manifest: TypedStoreManifest = {
        version: 1,
        storeId,
        indexedAt: '2024-01-01T00:00:00.000Z',
        files: {
          [filePath]: {
            mtime: 1704067200000, // Different from current
            size: 11, // Same size as 'new content'
            hash: 'oldhash123', // Different hash
            documentIds: [createDocumentId('doc-1')],
          },
        },
      };

      const fileState = await service.getFileState(filePath);
      const currentFiles: CurrentFileState[] = [fileState];

      const result = await service.detectChanges(manifest, currentFiles);

      expect(result.added).toEqual([]);
      expect(result.modified).toEqual([filePath]);
      expect(result.deleted).toEqual([]);
      expect(result.unchanged).toEqual([]);
    });

    it('marks file unchanged when hash matches despite mtime change', async () => {
      // Create actual file
      const filePath = join(testDir, 'touched.ts');
      const content = 'same content';
      await writeFile(filePath, content);

      const currentHash = await service.computeFileHash(filePath);
      const fileState = await service.getFileState(filePath);

      const storeId = createStoreId('test-store');
      const manifest: TypedStoreManifest = {
        version: 1,
        storeId,
        indexedAt: '2024-01-01T00:00:00.000Z',
        files: {
          [filePath]: {
            mtime: 1000, // Different mtime
            size: fileState.size, // Same size
            hash: currentHash, // Same hash
            documentIds: [createDocumentId('doc-1')],
          },
        },
      };

      const currentFiles: CurrentFileState[] = [fileState];

      const result = await service.detectChanges(manifest, currentFiles);

      expect(result.added).toEqual([]);
      expect(result.modified).toEqual([]);
      expect(result.deleted).toEqual([]);
      expect(result.unchanged).toEqual([filePath]);
    });

    it('handles complex scenario with multiple file types', async () => {
      // Create test files
      const unchangedFile = join(testDir, 'unchanged.ts');
      const modifiedFile = join(testDir, 'modified.ts');
      const addedFile = join(testDir, 'added.ts');

      await writeFile(unchangedFile, 'unchanged content');
      await writeFile(modifiedFile, 'new modified content');
      await writeFile(addedFile, 'added content');

      const unchangedState = await service.getFileState(unchangedFile);
      const unchangedHash = await service.computeFileHash(unchangedFile);
      const modifiedState = await service.getFileState(modifiedFile);
      const addedState = await service.getFileState(addedFile);

      const storeId = createStoreId('test-store');
      const deletedPath = join(testDir, 'deleted.ts');

      const manifest: TypedStoreManifest = {
        version: 1,
        storeId,
        indexedAt: '2024-01-01T00:00:00.000Z',
        files: {
          [unchangedFile]: {
            mtime: unchangedState.mtime,
            size: unchangedState.size,
            hash: unchangedHash,
            documentIds: [createDocumentId('doc-1')],
          },
          [modifiedFile]: {
            mtime: 1000,
            size: 100,
            hash: 'oldhash',
            documentIds: [createDocumentId('doc-2')],
          },
          [deletedPath]: {
            mtime: 1000,
            size: 50,
            hash: 'deletedhash',
            documentIds: [createDocumentId('doc-3')],
          },
        },
      };

      const currentFiles: CurrentFileState[] = [unchangedState, modifiedState, addedState];

      const result = await service.detectChanges(manifest, currentFiles);

      expect(result.added).toEqual([addedFile]);
      expect(result.modified).toEqual([modifiedFile]);
      expect(result.deleted).toEqual([deletedPath]);
      expect(result.unchanged).toEqual([unchangedFile]);
    });
  });

  describe('getFileState', () => {
    it('returns correct file state', async () => {
      const filePath = join(testDir, 'state-test.ts');
      const content = 'test content here';
      await writeFile(filePath, content);

      const state = await service.getFileState(filePath);

      expect(state.path).toBe(filePath);
      expect(state.size).toBe(content.length);
      expect(typeof state.mtime).toBe('number');
      expect(state.mtime).toBeGreaterThan(0);
    });
  });

  describe('computeFileHash', () => {
    it('computes MD5 hash of file', async () => {
      const filePath = join(testDir, 'hash-test.ts');
      await writeFile(filePath, 'hello world');

      const hash = await service.computeFileHash(filePath);

      // MD5 of 'hello world' is 5eb63bbbe01eeed093cb22bb8f5acdc3
      expect(hash).toBe('5eb63bbbe01eeed093cb22bb8f5acdc3');
    });

    it('returns different hash for different content', async () => {
      const file1 = join(testDir, 'file1.ts');
      const file2 = join(testDir, 'file2.ts');
      await writeFile(file1, 'content A');
      await writeFile(file2, 'content B');

      const hash1 = await service.computeFileHash(file1);
      const hash2 = await service.computeFileHash(file2);

      expect(hash1).not.toBe(hash2);
    });

    it('returns same hash for same content', async () => {
      const file1 = join(testDir, 'same1.ts');
      const file2 = join(testDir, 'same2.ts');
      const content = 'identical content';
      await writeFile(file1, content);
      await writeFile(file2, content);

      const hash1 = await service.computeFileHash(file1);
      const hash2 = await service.computeFileHash(file2);

      expect(hash1).toBe(hash2);
    });
  });

  describe('createFileState', () => {
    it('creates file state for manifest', async () => {
      const filePath = join(testDir, 'create-state.ts');
      await writeFile(filePath, 'file content');

      const { state, hash } = await service.createFileState(filePath, ['doc-1', 'doc-2']);

      expect(state.size).toBe(12); // 'file content'.length
      expect(typeof state.mtime).toBe('number');
      expect(state.hash).toBe(hash);
      expect(state.documentIds).toHaveLength(2);
    });
  });
});
