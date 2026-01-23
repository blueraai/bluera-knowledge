import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { StoreService } from './store.service.js';
import { StoreDefinitionService } from './store-definition.service.js';
import { rm, mkdtemp, writeFile, readFile, access } from 'node:fs/promises';
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
      path: tempDir,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('My Files');
      expect(result.data.type).toBe('file');
    }
  });

  it('lists all stores', async () => {
    const dir1 = await mkdtemp(join(tmpdir(), 'store1-'));
    const dir2 = await mkdtemp(join(tmpdir(), 'store2-'));
    await storeService.create({ name: 'Store 1', type: 'file', path: dir1 });
    await storeService.create({ name: 'Store 2', type: 'file', path: dir2 });

    const stores = await storeService.list();
    expect(stores).toHaveLength(2);

    await rm(dir1, { recursive: true, force: true });
    await rm(dir2, { recursive: true, force: true });
  });

  it('gets store by ID', async () => {
    const createResult = await storeService.create({
      name: 'Test Store',
      type: 'file',
      path: tempDir,
    });

    if (!createResult.success) throw new Error('Create failed');

    const store = await storeService.get(createResult.data.id);
    expect(store?.name).toBe('Test Store');
  });

  it('gets store by name', async () => {
    await storeService.create({
      name: 'Named Store',
      type: 'file',
      path: tempDir,
    });

    const store = await storeService.getByName('Named Store');
    expect(store?.name).toBe('Named Store');
  });

  it('deletes a store', async () => {
    const createResult = await storeService.create({
      name: 'To Delete',
      type: 'file',
      path: tempDir,
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
        path: tempDir,
        description: 'My file collection',
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
        path: tempDir,
        tags: ['important', 'work'],
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tags).toEqual(['important', 'work']);
      }
    });

    it('returns error when path not provided for file store', async () => {
      const result = await storeService.create({
        name: 'No Path',
        type: 'file',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('Path is required');
      }
    });

    it('returns error when path does not exist', async () => {
      const result = await storeService.create({
        name: 'Bad Path',
        type: 'file',
        path: '/nonexistent/path',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('Directory does not exist');
      }
    });
  });

  describe('create repo store', () => {
    it('creates repo store with path', async () => {
      const result = await storeService.create({
        name: 'My Repo',
        type: 'repo',
        path: tempDir,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe('repo');
        expect(result.data.path).toBe(tempDir);
      }
    });

    it('creates repo store with branch', async () => {
      const result = await storeService.create({
        name: 'Branched Repo',
        type: 'repo',
        path: tempDir,
        branch: 'develop',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.branch).toBe('develop');
      }
    });

    it('returns error when neither path nor URL provided for repo', async () => {
      const result = await storeService.create({
        name: 'No Path No URL',
        type: 'repo',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('Path or URL required');
      }
    });

    it('returns error for non-existent local repo path', async () => {
      const result = await storeService.create({
        name: 'Bad Repo Path',
        type: 'repo',
        path: '/nonexistent/repo/path',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('Repository path does not exist');
      }
    });

    it('returns error when local repo path is a file, not directory', async () => {
      // Create a file instead of a directory
      const tempFile = join(tempDir, 'not-a-directory.txt');
      await writeFile(tempFile, 'test content');

      const result = await storeService.create({
        name: 'File Not Dir',
        type: 'repo',
        path: tempFile,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('Path is not a directory');
      }
    });
  });

  describe('create web store', () => {
    it('creates web store with URL', async () => {
      const result = await storeService.create({
        name: 'My Website',
        type: 'web',
        url: 'https://example.com',
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
        depth: 3,
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
        url: 'https://example.com',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.depth).toBe(1);
      }
    });

    it('returns error when URL not provided for web store', async () => {
      const result = await storeService.create({
        name: 'No URL',
        type: 'web',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('URL is required');
      }
    });
  });

  describe('name validation', () => {
    it('returns error when name is empty string', async () => {
      const result = await storeService.create({
        name: '',
        type: 'file',
        path: tempDir,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('Store name cannot be empty');
      }
    });

    it('returns error when name is whitespace only', async () => {
      const result = await storeService.create({
        name: '   ',
        type: 'file',
        path: tempDir,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('Store name cannot be empty');
      }
    });
  });

  describe('duplicate name handling', () => {
    it('returns error when creating store with duplicate name', async () => {
      const dir1 = await mkdtemp(join(tmpdir(), 'dup1-'));
      const dir2 = await mkdtemp(join(tmpdir(), 'dup2-'));

      await storeService.create({
        name: 'Duplicate',
        type: 'file',
        path: dir1,
      });

      const result = await storeService.create({
        name: 'Duplicate',
        type: 'file',
        path: dir2,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('already exists');
      }

      await rm(dir1, { recursive: true, force: true });
      await rm(dir2, { recursive: true, force: true });
    });
  });

  describe('list with filter', () => {
    it('lists only file stores when type filter is file', async () => {
      const fileDir = await mkdtemp(join(tmpdir(), 'file1-'));
      const repoDir = await mkdtemp(join(tmpdir(), 'repo1-'));
      await storeService.create({ name: 'File 1', type: 'file', path: fileDir });
      await storeService.create({ name: 'Repo 1', type: 'repo', path: repoDir });
      await storeService.create({ name: 'Web 1', type: 'web', url: 'https://example.com' });

      const stores = await storeService.list('file');
      expect(stores).toHaveLength(1);
      expect(stores[0].type).toBe('file');

      await rm(fileDir, { recursive: true, force: true });
      await rm(repoDir, { recursive: true, force: true });
    });

    it('lists only repo stores when type filter is repo', async () => {
      const fileDir = await mkdtemp(join(tmpdir(), 'file1-'));
      const repoDir = await mkdtemp(join(tmpdir(), 'repo1-'));
      await storeService.create({ name: 'File 1', type: 'file', path: fileDir });
      await storeService.create({ name: 'Repo 1', type: 'repo', path: repoDir });
      await storeService.create({ name: 'Web 1', type: 'web', url: 'https://example.com' });

      const stores = await storeService.list('repo');
      expect(stores).toHaveLength(1);
      expect(stores[0].type).toBe('repo');

      await rm(fileDir, { recursive: true, force: true });
      await rm(repoDir, { recursive: true, force: true });
    });

    it('lists only web stores when type filter is web', async () => {
      const fileDir = await mkdtemp(join(tmpdir(), 'file1-'));
      const repoDir = await mkdtemp(join(tmpdir(), 'repo1-'));
      await storeService.create({ name: 'File 1', type: 'file', path: fileDir });
      await storeService.create({ name: 'Repo 1', type: 'repo', path: repoDir });
      await storeService.create({ name: 'Web 1', type: 'web', url: 'https://example.com' });

      const stores = await storeService.list('web');
      expect(stores).toHaveLength(1);
      expect(stores[0].type).toBe('web');

      await rm(fileDir, { recursive: true, force: true });
      await rm(repoDir, { recursive: true, force: true });
    });
  });

  describe('getByIdOrName', () => {
    it('finds store by ID', async () => {
      const createResult = await storeService.create({
        name: 'Test Store',
        type: 'file',
        path: tempDir,
      });

      if (!createResult.success) throw new Error('Create failed');

      const store = await storeService.getByIdOrName(createResult.data.id);
      expect(store?.name).toBe('Test Store');
    });

    it('finds store by name', async () => {
      await storeService.create({
        name: 'Test Store',
        type: 'file',
        path: tempDir,
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
        path: tempDir,
      });

      if (!createResult.success) throw new Error('Create failed');

      const updateResult = await storeService.update(createResult.data.id, {
        name: 'Updated Name',
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
        path: tempDir,
      });

      if (!createResult.success) throw new Error('Create failed');

      const updateResult = await storeService.update(createResult.data.id, {
        description: 'New description',
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
        path: tempDir,
      });

      if (!createResult.success) throw new Error('Create failed');

      const updateResult = await storeService.update(createResult.data.id, {
        tags: ['new', 'tags'],
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
        path: tempDir,
      });

      if (!createResult.success) throw new Error('Create failed');
      const originalUpdatedAt = createResult.data.updatedAt;

      // Wait a bit to ensure timestamp is different
      await new Promise((resolve) => setTimeout(resolve, 10));

      const updateResult = await storeService.update(createResult.data.id, {
        name: 'Updated',
      });

      expect(updateResult.success).toBe(true);
      if (updateResult.success) {
        expect(updateResult.data.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
      }
    });

    it('returns error when updating nonexistent store', async () => {
      const result = await storeService.update('nonexistent-id' as any, {
        name: 'Updated',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('Store not found');
      }
    });

    it('returns error when renaming to existing store name', async () => {
      const dir1 = await mkdtemp(join(tmpdir(), 'rename1-'));
      const dir2 = await mkdtemp(join(tmpdir(), 'rename2-'));

      await storeService.create({ name: 'Store A', type: 'file', path: dir1 });
      const createResult = await storeService.create({ name: 'Store B', type: 'file', path: dir2 });

      if (!createResult.success) throw new Error('Create failed');

      // Try to rename Store B to Store A (which already exists)
      const updateResult = await storeService.update(createResult.data.id, {
        name: 'Store A',
      });

      expect(updateResult.success).toBe(false);
      if (!updateResult.success) {
        expect(updateResult.error.message).toContain("'Store A' already exists");
      }

      await rm(dir1, { recursive: true, force: true });
      await rm(dir2, { recursive: true, force: true });
    });

    it('allows renaming to a unique name', async () => {
      const dir = await mkdtemp(join(tmpdir(), 'rename-ok-'));

      const createResult = await storeService.create({ name: 'Original', type: 'file', path: dir });
      if (!createResult.success) throw new Error('Create failed');

      const updateResult = await storeService.update(createResult.data.id, {
        name: 'Renamed',
      });

      expect(updateResult.success).toBe(true);
      if (updateResult.success) {
        expect(updateResult.data.name).toBe('Renamed');
      }

      // Verify old name no longer exists
      const oldStore = await storeService.getByName('Original');
      expect(oldStore).toBeUndefined();

      // Verify new name exists
      const newStore = await storeService.getByName('Renamed');
      expect(newStore).toBeDefined();
      expect(newStore?.name).toBe('Renamed');

      await rm(dir, { recursive: true, force: true });
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
      const storeDir = await mkdtemp(join(tmpdir(), 'persist-'));
      await storeService.create({
        name: 'Persistent Store',
        type: 'file',
        path: storeDir,
      });

      // Create new service instance with same data dir
      const newService = new StoreService(tempDir);
      await newService.initialize();

      const stores = await newService.list();
      expect(stores).toHaveLength(1);
      expect(stores[0].name).toBe('Persistent Store');

      await rm(storeDir, { recursive: true, force: true });
    });

    it('initializes with empty stores when no registry file exists', async () => {
      const stores = await storeService.list();
      expect(stores).toHaveLength(0);
    });
  });

  describe('first-run vs corruption handling (CLAUDE.md compliance)', () => {
    it('creates stores.json file on first run', async () => {
      const freshDir = await mkdtemp(join(tmpdir(), 'fresh-'));
      const freshService = new StoreService(freshDir);
      await freshService.initialize();

      // File should now exist
      const registryPath = join(freshDir, 'stores.json');
      await expect(access(registryPath)).resolves.toBeUndefined();

      await rm(freshDir, { recursive: true, force: true });
    });

    it('throws on corrupted stores.json', async () => {
      const corruptDir = await mkdtemp(join(tmpdir(), 'corrupt-'));
      const registryPath = join(corruptDir, 'stores.json');
      await writeFile(registryPath, '{invalid json syntax');

      const freshService = new StoreService(corruptDir);

      // Should throw per CLAUDE.md "fail early and fast"
      await expect(freshService.initialize()).rejects.toThrow();

      await rm(corruptDir, { recursive: true, force: true });
    });

    it('throws with descriptive message on JSON parse error', async () => {
      const corruptDir = await mkdtemp(join(tmpdir(), 'corrupt-'));
      const registryPath = join(corruptDir, 'stores.json');
      await writeFile(registryPath, '{"stores": [');

      const freshService = new StoreService(corruptDir);

      await expect(freshService.initialize()).rejects.toThrow(/JSON|parse|registry/i);

      await rm(corruptDir, { recursive: true, force: true });
    });

    it('filters out null entries from stores array on load', async () => {
      const nullDir = await mkdtemp(join(tmpdir(), 'null-entry-'));
      const registryPath = join(nullDir, 'stores.json');
      const validStore = {
        id: 'test-id',
        type: 'file',
        name: 'valid-store',
        path: '/some/path',
        status: 'ready',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await writeFile(registryPath, JSON.stringify({ stores: [null, validStore, null] }));

      const freshService = new StoreService(nullDir);
      await freshService.initialize();

      const stores = await freshService.list();
      expect(stores).toHaveLength(1);
      expect(stores[0]?.name).toBe('valid-store');

      await rm(nullDir, { recursive: true, force: true });
    });
  });

  describe('store definition auto-update', () => {
    let projectRoot: string;
    let dataDir: string;
    let serviceWithDefs: StoreService;
    let defService: StoreDefinitionService;

    beforeEach(async () => {
      projectRoot = await mkdtemp(join(tmpdir(), 'store-def-auto-'));
      dataDir = join(projectRoot, '.bluera/bluera-knowledge/data');
      defService = new StoreDefinitionService(projectRoot);
      serviceWithDefs = new StoreService(dataDir, { definitionService: defService });
      await serviceWithDefs.initialize();
    });

    afterEach(async () => {
      await rm(projectRoot, { recursive: true, force: true });
    });

    describe('create adds definition', () => {
      it('adds file store definition when creating file store', async () => {
        const storeDir = await mkdtemp(join(tmpdir(), 'file-store-'));
        const result = await serviceWithDefs.create({
          name: 'my-docs',
          type: 'file',
          path: storeDir,
          description: 'My documentation',
          tags: ['docs'],
        });

        expect(result.success).toBe(true);

        const def = await defService.getByName('my-docs');
        expect(def).toBeDefined();
        expect(def?.type).toBe('file');
        expect(def?.name).toBe('my-docs');
        if (def?.type === 'file') {
          expect(def.path).toBe(storeDir);
        }
        expect(def?.description).toBe('My documentation');
        expect(def?.tags).toEqual(['docs']);

        await rm(storeDir, { recursive: true, force: true });
      });

      it('skips definition for local repo store (path only, no URL)', async () => {
        // Local repo stores are machine-specific and should not be synced to definitions
        const repoDir = await mkdtemp(join(tmpdir(), 'repo-store-'));
        const result = await serviceWithDefs.create({
          name: 'my-repo',
          type: 'repo',
          path: repoDir,
          branch: 'main',
          description: 'Example repo',
        });

        expect(result.success).toBe(true);

        // Local repo store should NOT have a definition created
        const def = await defService.getByName('my-repo');
        expect(def).toBeUndefined();

        await rm(repoDir, { recursive: true, force: true });
      });

      it('adds web store definition when creating web store', async () => {
        const result = await serviceWithDefs.create({
          name: 'my-site',
          type: 'web',
          url: 'https://example.com/docs',
          depth: 2,
          description: 'Example site',
        });

        expect(result.success).toBe(true);

        const def = await defService.getByName('my-site');
        expect(def).toBeDefined();
        expect(def?.type).toBe('web');
        if (def?.type === 'web') {
          expect(def.url).toBe('https://example.com/docs');
          expect(def.depth).toBe(2);
        }
      });

      it('does not add definition when store creation fails', async () => {
        const result = await serviceWithDefs.create({
          name: 'bad-store',
          type: 'file',
          path: '/nonexistent/path',
        });

        expect(result.success).toBe(false);

        const def = await defService.getByName('bad-store');
        expect(def).toBeUndefined();
      });

      it('does not add definition when skipDefinitionSync is true', async () => {
        const storeDir = await mkdtemp(join(tmpdir(), 'skip-def-'));
        const result = await serviceWithDefs.create(
          {
            name: 'skip-store',
            type: 'file',
            path: storeDir,
          },
          { skipDefinitionSync: true }
        );

        expect(result.success).toBe(true);

        const def = await defService.getByName('skip-store');
        expect(def).toBeUndefined();

        await rm(storeDir, { recursive: true, force: true });
      });
    });

    describe('delete removes definition', () => {
      it('removes definition when store is deleted', async () => {
        const storeDir = await mkdtemp(join(tmpdir(), 'del-store-'));
        const createResult = await serviceWithDefs.create({
          name: 'to-delete',
          type: 'file',
          path: storeDir,
        });

        if (!createResult.success) throw new Error('Create failed');

        // Verify definition exists
        let def = await defService.getByName('to-delete');
        expect(def).toBeDefined();

        // Delete the store
        const deleteResult = await serviceWithDefs.delete(createResult.data.id);
        expect(deleteResult.success).toBe(true);

        // Definition should be removed
        def = await defService.getByName('to-delete');
        expect(def).toBeUndefined();

        await rm(storeDir, { recursive: true, force: true });
      });

      it('does not remove definition when skipDefinitionSync is true', async () => {
        const storeDir = await mkdtemp(join(tmpdir(), 'del-skip-'));
        const createResult = await serviceWithDefs.create({
          name: 'keep-def',
          type: 'file',
          path: storeDir,
        });

        if (!createResult.success) throw new Error('Create failed');

        // Delete with skipDefinitionSync
        const deleteResult = await serviceWithDefs.delete(createResult.data.id, {
          skipDefinitionSync: true,
        });
        expect(deleteResult.success).toBe(true);

        // Definition should still exist
        const def = await defService.getByName('keep-def');
        expect(def).toBeDefined();

        await rm(storeDir, { recursive: true, force: true });
      });
    });

    describe('update syncs definition', () => {
      it('updates definition when store description is updated', async () => {
        const storeDir = await mkdtemp(join(tmpdir(), 'upd-store-'));
        const createResult = await serviceWithDefs.create({
          name: 'to-update',
          type: 'file',
          path: storeDir,
          description: 'Original description',
        });

        if (!createResult.success) throw new Error('Create failed');

        const updateResult = await serviceWithDefs.update(createResult.data.id, {
          description: 'Updated description',
        });
        expect(updateResult.success).toBe(true);

        const def = await defService.getByName('to-update');
        expect(def?.description).toBe('Updated description');

        await rm(storeDir, { recursive: true, force: true });
      });

      it('updates definition when store tags are updated', async () => {
        const storeDir = await mkdtemp(join(tmpdir(), 'upd-tags-'));
        const createResult = await serviceWithDefs.create({
          name: 'tag-store',
          type: 'file',
          path: storeDir,
          tags: ['old'],
        });

        if (!createResult.success) throw new Error('Create failed');

        const updateResult = await serviceWithDefs.update(createResult.data.id, {
          tags: ['new', 'tags'],
        });
        expect(updateResult.success).toBe(true);

        const def = await defService.getByName('tag-store');
        expect(def?.tags).toEqual(['new', 'tags']);

        await rm(storeDir, { recursive: true, force: true });
      });

      it('does not update definition when skipDefinitionSync is true', async () => {
        const storeDir = await mkdtemp(join(tmpdir(), 'upd-skip-'));
        const createResult = await serviceWithDefs.create({
          name: 'skip-update',
          type: 'file',
          path: storeDir,
          description: 'Original',
        });

        if (!createResult.success) throw new Error('Create failed');

        const updateResult = await serviceWithDefs.update(
          createResult.data.id,
          { description: 'Updated' },
          { skipDefinitionSync: true }
        );
        expect(updateResult.success).toBe(true);

        const def = await defService.getByName('skip-update');
        expect(def?.description).toBe('Original');

        await rm(storeDir, { recursive: true, force: true });
      });

      it('syncs definition with new name on rename', async () => {
        const storeDir = await mkdtemp(join(tmpdir(), 'rename-def-'));
        const createResult = await serviceWithDefs.create({
          name: 'original-name',
          type: 'file',
          path: storeDir,
          description: 'My store',
        });

        if (!createResult.success) throw new Error('Create failed');

        // Verify original definition exists
        let def = await defService.getByName('original-name');
        expect(def).toBeDefined();

        // Rename the store
        const updateResult = await serviceWithDefs.update(createResult.data.id, {
          name: 'new-name',
        });
        expect(updateResult.success).toBe(true);

        // Old definition should be removed
        const oldDef = await defService.getByName('original-name');
        expect(oldDef).toBeUndefined();

        // New definition should exist with correct data
        def = await defService.getByName('new-name');
        expect(def).toBeDefined();
        expect(def?.name).toBe('new-name');
        expect(def?.description).toBe('My store');

        await rm(storeDir, { recursive: true, force: true });
      });

      it('deletes old definition on rename', async () => {
        const storeDir = await mkdtemp(join(tmpdir(), 'rename-del-'));
        const createResult = await serviceWithDefs.create({
          name: 'to-rename',
          type: 'file',
          path: storeDir,
        });

        if (!createResult.success) throw new Error('Create failed');

        // Rename
        await serviceWithDefs.update(createResult.data.id, { name: 'renamed' });

        // Old definition should not exist
        const oldDef = await defService.getByName('to-rename');
        expect(oldDef).toBeUndefined();

        await rm(storeDir, { recursive: true, force: true });
      });
    });

    describe('persistence', () => {
      it('persists definition to config file', async () => {
        const storeDir = await mkdtemp(join(tmpdir(), 'persist-def-'));
        await serviceWithDefs.create({
          name: 'persistent-store',
          type: 'file',
          path: storeDir,
        });

        // Read config file directly
        const configPath = join(projectRoot, '.bluera/bluera-knowledge/stores.config.json');
        const content = await readFile(configPath, 'utf-8');
        const config = JSON.parse(content);

        expect(config.stores).toHaveLength(1);
        expect(config.stores[0].name).toBe('persistent-store');

        await rm(storeDir, { recursive: true, force: true });
      });
    });

    describe('without definition service', () => {
      it('works normally without definition service injected', async () => {
        // Use the storeService from outer scope (no definition service)
        const storeDir = await mkdtemp(join(tmpdir(), 'no-def-'));
        const result = await storeService.create({
          name: 'no-def-store',
          type: 'file',
          path: storeDir,
        });

        expect(result.success).toBe(true);

        await rm(storeDir, { recursive: true, force: true });
      });
    });
  });
});
