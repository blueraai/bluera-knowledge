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
});
