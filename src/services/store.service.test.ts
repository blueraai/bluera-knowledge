import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { StoreService } from './store.service.js';
import { rm, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

describe('StoreService', () => {
  let storeService: StoreService;
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'store-test-'));
    storeService = new StoreService(tempDir);
    await storeService.initialize();
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it('creates a file store', async () => {
    const result = await storeService.create({
      name: 'My Files',
      type: 'file',
      path: '/path/to/files',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('My Files');
      expect(result.data.type).toBe('file');
    }
  });

  it('lists all stores', async () => {
    await storeService.create({ name: 'Store 1', type: 'file', path: '/path/1' });
    await storeService.create({ name: 'Store 2', type: 'repo', path: '/path/2' });

    const stores = await storeService.list();
    expect(stores).toHaveLength(2);
  });

  it('gets store by ID', async () => {
    const createResult = await storeService.create({
      name: 'Test Store',
      type: 'file',
      path: '/path/test',
    });

    if (!createResult.success) throw new Error('Create failed');

    const store = await storeService.get(createResult.data.id);
    expect(store?.name).toBe('Test Store');
  });

  it('gets store by name', async () => {
    await storeService.create({
      name: 'Named Store',
      type: 'file',
      path: '/path/named',
    });

    const store = await storeService.getByName('Named Store');
    expect(store?.name).toBe('Named Store');
  });

  it('deletes a store', async () => {
    const createResult = await storeService.create({
      name: 'To Delete',
      type: 'file',
      path: '/path/delete',
    });

    if (!createResult.success) throw new Error('Create failed');

    const deleteResult = await storeService.delete(createResult.data.id);
    expect(deleteResult.success).toBe(true);

    const stores = await storeService.list();
    expect(stores).toHaveLength(0);
  });

  describe('create file store', () => {
    it('creates file store with description', async () => {
      const result = await storeService.create({
        name: 'Described Files',
        type: 'file',
        path: '/path/to/files',
        description: 'My file collection'
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBe('My file collection');
      }
    });

    it('creates file store with tags', async () => {
      const result = await storeService.create({
        name: 'Tagged Files',
        type: 'file',
        path: '/path/to/files',
        tags: ['important', 'work']
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tags).toEqual(['important', 'work']);
      }
    });

    it('returns error when path not provided for file store', async () => {
      const result = await storeService.create({
        name: 'No Path',
        type: 'file'
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('Path is required');
      }
    });
  });

  describe('create repo store', () => {
    it('creates repo store with path', async () => {
      const result = await storeService.create({
        name: 'My Repo',
        type: 'repo',
        path: '/path/to/repo'
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe('repo');
        expect(result.data.path).toBe('/path/to/repo');
      }
    });

    it('creates repo store with branch', async () => {
      const result = await storeService.create({
        name: 'Branched Repo',
        type: 'repo',
        path: '/path/to/repo',
        branch: 'develop'
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.branch).toBe('develop');
      }
    });

    it('returns error when neither path nor URL provided for repo', async () => {
      const result = await storeService.create({
        name: 'No Path No URL',
        type: 'repo'
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('Path or URL required');
      }
    });
  });

  describe('create web store', () => {
    it('creates web store with URL', async () => {
      const result = await storeService.create({
        name: 'My Website',
        type: 'web',
        url: 'https://example.com'
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe('web');
        expect(result.data.url).toBe('https://example.com');
      }
    });

    it('creates web store with depth', async () => {
      const result = await storeService.create({
        name: 'Deep Site',
        type: 'web',
        url: 'https://example.com',
        depth: 3
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.depth).toBe(3);
      }
    });

    it('uses default depth of 1 when not specified', async () => {
      const result = await storeService.create({
        name: 'Default Depth',
        type: 'web',
        url: 'https://example.com'
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.depth).toBe(1);
      }
    });

    it('returns error when URL not provided for web store', async () => {
      const result = await storeService.create({
        name: 'No URL',
        type: 'web'
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('URL is required');
      }
    });
  });

  describe('duplicate name handling', () => {
    it('returns error when creating store with duplicate name', async () => {
      await storeService.create({
        name: 'Duplicate',
        type: 'file',
        path: '/path/1'
      });

      const result = await storeService.create({
        name: 'Duplicate',
        type: 'file',
        path: '/path/2'
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('already exists');
      }
    });
  });

  describe('list with filter', () => {
    it('lists only file stores when type filter is file', async () => {
      await storeService.create({ name: 'File 1', type: 'file', path: '/path/1' });
      await storeService.create({ name: 'Repo 1', type: 'repo', path: '/path/2' });
      await storeService.create({ name: 'Web 1', type: 'web', url: 'https://example.com' });

      const stores = await storeService.list('file');
      expect(stores).toHaveLength(1);
      expect(stores[0].type).toBe('file');
    });

    it('lists only repo stores when type filter is repo', async () => {
      await storeService.create({ name: 'File 1', type: 'file', path: '/path/1' });
      await storeService.create({ name: 'Repo 1', type: 'repo', path: '/path/2' });
      await storeService.create({ name: 'Web 1', type: 'web', url: 'https://example.com' });

      const stores = await storeService.list('repo');
      expect(stores).toHaveLength(1);
      expect(stores[0].type).toBe('repo');
    });

    it('lists only web stores when type filter is web', async () => {
      await storeService.create({ name: 'File 1', type: 'file', path: '/path/1' });
      await storeService.create({ name: 'Repo 1', type: 'repo', path: '/path/2' });
      await storeService.create({ name: 'Web 1', type: 'web', url: 'https://example.com' });

      const stores = await storeService.list('web');
      expect(stores).toHaveLength(1);
      expect(stores[0].type).toBe('web');
    });
  });

  describe('getByIdOrName', () => {
    it('finds store by ID', async () => {
      const createResult = await storeService.create({
        name: 'Test Store',
        type: 'file',
        path: '/path/test'
      });

      if (!createResult.success) throw new Error('Create failed');

      const store = await storeService.getByIdOrName(createResult.data.id);
      expect(store?.name).toBe('Test Store');
    });

    it('finds store by name', async () => {
      await storeService.create({
        name: 'Test Store',
        type: 'file',
        path: '/path/test'
      });

      const store = await storeService.getByIdOrName('Test Store');
      expect(store?.name).toBe('Test Store');
    });

    it('returns undefined when store not found', async () => {
      const store = await storeService.getByIdOrName('nonexistent');
      expect(store).toBeUndefined();
    });
  });

  describe('update store', () => {
    it('updates store name', async () => {
      const createResult = await storeService.create({
        name: 'Original Name',
        type: 'file',
        path: '/path/test'
      });

      if (!createResult.success) throw new Error('Create failed');

      const updateResult = await storeService.update(createResult.data.id, {
        name: 'Updated Name'
      });

      expect(updateResult.success).toBe(true);
      if (updateResult.success) {
        expect(updateResult.data.name).toBe('Updated Name');
      }
    });

    it('updates store description', async () => {
      const createResult = await storeService.create({
        name: 'Test Store',
        type: 'file',
        path: '/path/test'
      });

      if (!createResult.success) throw new Error('Create failed');

      const updateResult = await storeService.update(createResult.data.id, {
        description: 'New description'
      });

      expect(updateResult.success).toBe(true);
      if (updateResult.success) {
        expect(updateResult.data.description).toBe('New description');
      }
    });

    it('updates store tags', async () => {
      const createResult = await storeService.create({
        name: 'Test Store',
        type: 'file',
        path: '/path/test'
      });

      if (!createResult.success) throw new Error('Create failed');

      const updateResult = await storeService.update(createResult.data.id, {
        tags: ['new', 'tags']
      });

      expect(updateResult.success).toBe(true);
      if (updateResult.success) {
        expect(updateResult.data.tags).toEqual(['new', 'tags']);
      }
    });

    it('updates updatedAt timestamp', async () => {
      const createResult = await storeService.create({
        name: 'Test Store',
        type: 'file',
        path: '/path/test'
      });

      if (!createResult.success) throw new Error('Create failed');
      const originalUpdatedAt = createResult.data.updatedAt;

      // Wait a bit to ensure timestamp is different
      await new Promise(resolve => setTimeout(resolve, 10));

      const updateResult = await storeService.update(createResult.data.id, {
        name: 'Updated'
      });

      expect(updateResult.success).toBe(true);
      if (updateResult.success) {
        expect(updateResult.data.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
      }
    });

    it('returns error when updating nonexistent store', async () => {
      const result = await storeService.update('nonexistent-id' as any, {
        name: 'Updated'
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('Store not found');
      }
    });
  });

  describe('delete store', () => {
    it('returns error when deleting nonexistent store', async () => {
      const result = await storeService.delete('nonexistent-id' as any);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('Store not found');
      }
    });
  });

  describe('persistence', () => {
    it('persists stores across service instances', async () => {
      await storeService.create({
        name: 'Persistent Store',
        type: 'file',
        path: '/path/test'
      });

      // Create new service instance with same data dir
      const newService = new StoreService(tempDir);
      await newService.initialize();

      const stores = await newService.list();
      expect(stores).toHaveLength(1);
      expect(stores[0].name).toBe('Persistent Store');
    });

    it('initializes with empty stores when no registry file exists', async () => {
      const stores = await storeService.list();
      expect(stores).toHaveLength(0);
    });
  });
});
