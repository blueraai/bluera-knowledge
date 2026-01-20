import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { rm, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { ManifestService } from './manifest.service.js';
import { createStoreId, createDocumentId } from '../types/brands.js';
import type { TypedStoreManifest } from '../types/manifest.js';

describe('ManifestService', () => {
  let testDir: string;
  let service: ManifestService;

  beforeEach(async () => {
    testDir = join(tmpdir(), `manifest-test-${Date.now()}-${process.pid}`);
    service = new ManifestService(testDir);
    await service.initialize();
  });

  afterEach(async () => {
    try {
      await rm(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('initialize', () => {
    it('creates the manifests directory', async () => {
      const manifestsDir = join(testDir, 'manifests');
      const { access } = await import('node:fs/promises');

      // Should not throw
      await access(manifestsDir);
    });
  });

  describe('getManifestPath', () => {
    it('returns correct path for store', () => {
      const storeId = createStoreId('test-store');
      const path = service.getManifestPath(storeId);

      expect(path).toBe(join(testDir, 'manifests', 'test-store.manifest.json'));
    });
  });

  describe('load', () => {
    it('returns empty manifest when file does not exist', async () => {
      const storeId = createStoreId('nonexistent');

      const manifest = await service.load(storeId);

      expect(manifest.version).toBe(1);
      expect(manifest.storeId).toBe(storeId);
      expect(manifest.files).toEqual({});
    });

    it('loads existing manifest', async () => {
      const storeId = createStoreId('existing');
      const manifestPath = service.getManifestPath(storeId);

      const existingManifest = {
        version: 1,
        storeId: 'existing',
        indexedAt: '2024-01-01T00:00:00.000Z',
        files: {
          '/path/to/file.ts': {
            mtime: 1704067200000,
            size: 1234,
            hash: 'abc123',
            documentIds: ['doc-1', 'doc-2'],
          },
        },
      };
      await writeFile(manifestPath, JSON.stringify(existingManifest));

      const manifest = await service.load(storeId);

      expect(manifest.version).toBe(1);
      expect(manifest.storeId).toBe(storeId);
      expect(manifest.indexedAt).toBe('2024-01-01T00:00:00.000Z');
      expect(manifest.files['/path/to/file.ts']).toBeDefined();
      expect(manifest.files['/path/to/file.ts']?.mtime).toBe(1704067200000);
      expect(manifest.files['/path/to/file.ts']?.size).toBe(1234);
      expect(manifest.files['/path/to/file.ts']?.hash).toBe('abc123');
      expect(manifest.files['/path/to/file.ts']?.documentIds).toHaveLength(2);
    });

    it('throws on invalid JSON', async () => {
      const storeId = createStoreId('invalid');
      const manifestPath = service.getManifestPath(storeId);
      await writeFile(manifestPath, 'not valid json');

      await expect(service.load(storeId)).rejects.toThrow('Failed to parse manifest');
    });

    it('throws on invalid schema', async () => {
      const storeId = createStoreId('badschema');
      const manifestPath = service.getManifestPath(storeId);
      await writeFile(manifestPath, JSON.stringify({ version: 2, wrong: 'schema' }));

      await expect(service.load(storeId)).rejects.toThrow('Invalid manifest');
    });
  });

  describe('save', () => {
    it('saves manifest to disk', async () => {
      const storeId = createStoreId('save-test');
      const manifest: TypedStoreManifest = {
        version: 1,
        storeId,
        indexedAt: '2024-01-01T00:00:00.000Z',
        files: {
          '/path/to/file.ts': {
            mtime: 1704067200000,
            size: 1234,
            hash: 'abc123',
            documentIds: [createDocumentId('doc-1')],
          },
        },
      };

      await service.save(manifest);

      const content = await readFile(service.getManifestPath(storeId), 'utf-8');
      const saved = JSON.parse(content);
      expect(saved.version).toBe(1);
      expect(saved.storeId).toBe('save-test');
      expect(saved.files['/path/to/file.ts']).toBeDefined();
    });

    it('updates indexedAt timestamp on save', async () => {
      const storeId = createStoreId('timestamp-test');
      const oldTimestamp = '2020-01-01T00:00:00.000Z';
      const manifest: TypedStoreManifest = {
        version: 1,
        storeId,
        indexedAt: oldTimestamp,
        files: {},
      };

      await service.save(manifest);

      const content = await readFile(service.getManifestPath(storeId), 'utf-8');
      const saved = JSON.parse(content);
      expect(saved.indexedAt).not.toBe(oldTimestamp);
      // Should be a recent timestamp
      const savedTime = new Date(saved.indexedAt).getTime();
      expect(Date.now() - savedTime).toBeLessThan(5000);
    });

    it('overwrites existing manifest', async () => {
      const storeId = createStoreId('overwrite-test');
      const manifest1: TypedStoreManifest = {
        version: 1,
        storeId,
        indexedAt: '2024-01-01T00:00:00.000Z',
        files: { '/file1.ts': { mtime: 1, size: 1, hash: 'a', documentIds: [] } },
      };
      const manifest2: TypedStoreManifest = {
        version: 1,
        storeId,
        indexedAt: '2024-01-02T00:00:00.000Z',
        files: { '/file2.ts': { mtime: 2, size: 2, hash: 'b', documentIds: [] } },
      };

      await service.save(manifest1);
      await service.save(manifest2);

      const content = await readFile(service.getManifestPath(storeId), 'utf-8');
      const saved = JSON.parse(content);
      expect(saved.files['/file1.ts']).toBeUndefined();
      expect(saved.files['/file2.ts']).toBeDefined();
    });
  });

  describe('delete', () => {
    it('deletes existing manifest', async () => {
      const storeId = createStoreId('delete-test');
      const manifest: TypedStoreManifest = {
        version: 1,
        storeId,
        indexedAt: '2024-01-01T00:00:00.000Z',
        files: {},
      };

      await service.save(manifest);
      await service.delete(storeId);

      // Should return empty manifest after delete
      const loaded = await service.load(storeId);
      expect(loaded.files).toEqual({});
    });

    it('does not throw when deleting nonexistent manifest', async () => {
      const storeId = createStoreId('no-exist');

      // Should not throw
      await service.delete(storeId);
    });
  });

  describe('round-trip', () => {
    it('preserves all data through save/load cycle', async () => {
      const storeId = createStoreId('roundtrip');
      const original: TypedStoreManifest = {
        version: 1,
        storeId,
        indexedAt: '2024-01-01T00:00:00.000Z',
        files: {
          '/path/to/file1.ts': {
            mtime: 1704067200000,
            size: 1234,
            hash: 'abc123def456',
            documentIds: [createDocumentId('doc-1'), createDocumentId('doc-2')],
          },
          '/path/to/file2.ts': {
            mtime: 1704153600000,
            size: 5678,
            hash: 'xyz789',
            documentIds: [createDocumentId('doc-3')],
          },
        },
      };

      await service.save(original);
      const loaded = await service.load(storeId);

      expect(loaded.version).toBe(original.version);
      expect(loaded.storeId).toBe(original.storeId);
      // indexedAt is updated on save, so we don't check exact match
      expect(Object.keys(loaded.files)).toEqual(Object.keys(original.files));

      for (const [path, state] of Object.entries(original.files)) {
        const loadedState = loaded.files[path];
        expect(loadedState).toBeDefined();
        expect(loadedState?.mtime).toBe(state.mtime);
        expect(loadedState?.size).toBe(state.size);
        expect(loadedState?.hash).toBe(state.hash);
        expect(loadedState?.documentIds).toEqual(state.documentIds);
      }
    });
  });
});
