import { describe, it, expect } from 'vitest';
import { StoreDefinitionService } from './store-definition.service.js';
import { rm, mkdtemp, writeFile, readFile, mkdir, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import type { StoreDefinitionsConfig, FileStoreDefinition } from '../types/store-definition.js';

/**
 * Helper to create isolated test context.
 * Each test creates its own temp directory to ensure complete isolation.
 */
async function createTestContext(): Promise<{
  service: StoreDefinitionService;
  tempDir: string;
  cleanup: () => Promise<void>;
}> {
  const tempDir = await mkdtemp(join(tmpdir(), 'store-def-test-'));
  const service = new StoreDefinitionService(tempDir);
  return {
    service,
    tempDir,
    cleanup: async () => {
      await rm(tempDir, { recursive: true, force: true });
    },
  };
}

describe('StoreDefinitionService', () => {
  describe('load', () => {
    it('returns empty config when file does not exist', async () => {
      const ctx = await createTestContext();
      try {
        const config = await ctx.service.load();
        expect(config.version).toBe(1);
        expect(config.stores).toEqual([]);
      } finally {
        await ctx.cleanup();
      }
    });

    it('loads existing config file', async () => {
      const ctx = await createTestContext();
      try {
        const configPath = join(ctx.tempDir, '.bluera/bluera-knowledge/stores.config.json');
        await mkdir(dirname(configPath), { recursive: true });
        const existingConfig: StoreDefinitionsConfig = {
          version: 1,
          stores: [{ type: 'file', name: 'test', path: './test' }],
        };
        await writeFile(configPath, JSON.stringify(existingConfig));

        const config = await ctx.service.load();
        expect(config.stores).toHaveLength(1);
        expect(config.stores[0].name).toBe('test');
      } finally {
        await ctx.cleanup();
      }
    });

    it('throws on invalid JSON (fail fast per CLAUDE.md)', async () => {
      const ctx = await createTestContext();
      try {
        const configPath = join(ctx.tempDir, '.bluera/bluera-knowledge/stores.config.json');
        await mkdir(dirname(configPath), { recursive: true });
        await writeFile(configPath, '{invalid json');

        await expect(ctx.service.load()).rejects.toThrow(/parse|JSON/i);
      } finally {
        await ctx.cleanup();
      }
    });

    it('throws on invalid schema (fail fast per CLAUDE.md)', async () => {
      const ctx = await createTestContext();
      try {
        const configPath = join(ctx.tempDir, '.bluera/bluera-knowledge/stores.config.json');
        await mkdir(dirname(configPath), { recursive: true });
        await writeFile(configPath, JSON.stringify({ version: 1, stores: [{ type: 'invalid' }] }));

        await expect(ctx.service.load()).rejects.toThrow();
      } finally {
        await ctx.cleanup();
      }
    });

    it('throws on wrong version (fail fast per CLAUDE.md)', async () => {
      const ctx = await createTestContext();
      try {
        const configPath = join(ctx.tempDir, '.bluera/bluera-knowledge/stores.config.json');
        await mkdir(dirname(configPath), { recursive: true });
        await writeFile(configPath, JSON.stringify({ version: 99, stores: [] }));

        await expect(ctx.service.load()).rejects.toThrow();
      } finally {
        await ctx.cleanup();
      }
    });

    it('caches loaded config', async () => {
      const ctx = await createTestContext();
      try {
        const config1 = await ctx.service.load();
        const config2 = await ctx.service.load();
        expect(config1).toBe(config2); // Same reference
      } finally {
        await ctx.cleanup();
      }
    });
  });

  describe('save', () => {
    it('creates directory if not exists', async () => {
      const ctx = await createTestContext();
      try {
        const config: StoreDefinitionsConfig = { version: 1, stores: [] };
        await ctx.service.save(config);

        const configPath = ctx.service.getConfigPath();
        await expect(access(configPath)).resolves.toBeUndefined();
      } finally {
        await ctx.cleanup();
      }
    });

    it('writes formatted JSON', async () => {
      const ctx = await createTestContext();
      try {
        const config: StoreDefinitionsConfig = {
          version: 1,
          stores: [{ type: 'file', name: 'test', path: './test' }],
        };
        await ctx.service.save(config);

        const content = await readFile(ctx.service.getConfigPath(), 'utf-8');
        expect(content).toContain('\n'); // Formatted with newlines
        expect(content).toContain('"version": 1');
      } finally {
        await ctx.cleanup();
      }
    });

    it('updates cache after save', async () => {
      const ctx = await createTestContext();
      try {
        const config: StoreDefinitionsConfig = {
          version: 1,
          stores: [{ type: 'file', name: 'test', path: './test' }],
        };
        await ctx.service.save(config);

        const loaded = await ctx.service.load();
        expect(loaded.stores).toHaveLength(1);
      } finally {
        await ctx.cleanup();
      }
    });
  });

  describe('addDefinition', () => {
    it('adds definition to empty config', async () => {
      const ctx = await createTestContext();
      try {
        const definition: FileStoreDefinition = {
          type: 'file',
          name: 'docs',
          path: './docs',
        };
        await ctx.service.addDefinition(definition);

        const config = await ctx.service.load();
        expect(config.stores).toHaveLength(1);
        expect(config.stores[0].name).toBe('docs');
      } finally {
        await ctx.cleanup();
      }
    });

    it('adds definition to existing config', async () => {
      const ctx = await createTestContext();
      try {
        // Pre-populate
        await ctx.service.save({
          version: 1,
          stores: [{ type: 'file', name: 'existing', path: './existing' }],
        });
        // Clear cache to force reload
        ctx.service.clearCache();

        // Add new
        await ctx.service.addDefinition({ type: 'file', name: 'new', path: './new' });

        const config = await ctx.service.load();
        expect(config.stores).toHaveLength(2);
      } finally {
        await ctx.cleanup();
      }
    });

    it('throws when adding duplicate name', async () => {
      const ctx = await createTestContext();
      try {
        await ctx.service.addDefinition({ type: 'file', name: 'docs', path: './docs' });

        await expect(
          ctx.service.addDefinition({ type: 'file', name: 'docs', path: './other' })
        ).rejects.toThrow(/already exists/i);
      } finally {
        await ctx.cleanup();
      }
    });

    it('persists to file', async () => {
      const ctx = await createTestContext();
      try {
        await ctx.service.addDefinition({ type: 'file', name: 'docs', path: './docs' });

        // Create fresh service (no cache)
        const freshService = new StoreDefinitionService(ctx.tempDir);
        const config = await freshService.load();
        expect(config.stores).toHaveLength(1);
      } finally {
        await ctx.cleanup();
      }
    });
  });

  describe('removeDefinition', () => {
    it('removes existing definition', async () => {
      const ctx = await createTestContext();
      try {
        await ctx.service.addDefinition({ type: 'file', name: 'docs', path: './docs' });
        await ctx.service.addDefinition({ type: 'file', name: 'other', path: './other' });

        const removed = await ctx.service.removeDefinition('docs');
        expect(removed).toBe(true);

        const config = await ctx.service.load();
        expect(config.stores).toHaveLength(1);
        expect(config.stores[0].name).toBe('other');
      } finally {
        await ctx.cleanup();
      }
    });

    it('returns false for non-existent name', async () => {
      const ctx = await createTestContext();
      try {
        const removed = await ctx.service.removeDefinition('nonexistent');
        expect(removed).toBe(false);
      } finally {
        await ctx.cleanup();
      }
    });

    it('persists removal to file', async () => {
      const ctx = await createTestContext();
      try {
        await ctx.service.addDefinition({ type: 'file', name: 'docs', path: './docs' });
        await ctx.service.removeDefinition('docs');

        // Create fresh service
        const freshService = new StoreDefinitionService(ctx.tempDir);
        const config = await freshService.load();
        expect(config.stores).toHaveLength(0);
      } finally {
        await ctx.cleanup();
      }
    });
  });

  describe('updateDefinition', () => {
    it('updates existing definition', async () => {
      const ctx = await createTestContext();
      try {
        await ctx.service.addDefinition({
          type: 'file',
          name: 'docs',
          path: './docs',
          description: 'old',
        });

        await ctx.service.updateDefinition('docs', { description: 'new description' });

        const config = await ctx.service.load();
        expect(config.stores[0].description).toBe('new description');
      } finally {
        await ctx.cleanup();
      }
    });

    it('preserves unchanged fields', async () => {
      const ctx = await createTestContext();
      try {
        await ctx.service.addDefinition({
          type: 'file',
          name: 'docs',
          path: './docs',
          description: 'desc',
          tags: ['tag1'],
        });

        await ctx.service.updateDefinition('docs', { description: 'updated' });

        const config = await ctx.service.load();
        const store = config.stores[0] as FileStoreDefinition;
        expect(store.path).toBe('./docs');
        expect(store.tags).toEqual(['tag1']);
      } finally {
        await ctx.cleanup();
      }
    });

    it('throws for non-existent definition', async () => {
      const ctx = await createTestContext();
      try {
        await expect(
          ctx.service.updateDefinition('nonexistent', { description: 'x' })
        ).rejects.toThrow(/not found/i);
      } finally {
        await ctx.cleanup();
      }
    });

    it('persists update to file', async () => {
      const ctx = await createTestContext();
      try {
        await ctx.service.addDefinition({ type: 'file', name: 'docs', path: './docs' });
        await ctx.service.updateDefinition('docs', { description: 'updated' });

        const freshService = new StoreDefinitionService(ctx.tempDir);
        const config = await freshService.load();
        expect(config.stores[0].description).toBe('updated');
      } finally {
        await ctx.cleanup();
      }
    });
  });

  describe('getByName', () => {
    it('returns definition by name', async () => {
      const ctx = await createTestContext();
      try {
        await ctx.service.addDefinition({ type: 'file', name: 'docs', path: './docs' });

        const def = await ctx.service.getByName('docs');
        expect(def).toBeDefined();
        expect(def?.name).toBe('docs');
      } finally {
        await ctx.cleanup();
      }
    });

    it('returns undefined for non-existent name', async () => {
      const ctx = await createTestContext();
      try {
        const def = await ctx.service.getByName('nonexistent');
        expect(def).toBeUndefined();
      } finally {
        await ctx.cleanup();
      }
    });
  });

  describe('resolvePath', () => {
    it('resolves relative paths against project root', async () => {
      const ctx = await createTestContext();
      try {
        const resolved = ctx.service.resolvePath('./docs');
        expect(resolved).toBe(join(ctx.tempDir, 'docs'));
      } finally {
        await ctx.cleanup();
      }
    });

    it('resolves paths starting with ./ against project root', async () => {
      const ctx = await createTestContext();
      try {
        const resolved = ctx.service.resolvePath('./src/utils');
        expect(resolved).toBe(join(ctx.tempDir, 'src/utils'));
      } finally {
        await ctx.cleanup();
      }
    });

    it('resolves paths without leading ./ against project root', async () => {
      const ctx = await createTestContext();
      try {
        const resolved = ctx.service.resolvePath('docs');
        expect(resolved).toBe(join(ctx.tempDir, 'docs'));
      } finally {
        await ctx.cleanup();
      }
    });

    it('keeps absolute paths as-is', async () => {
      const ctx = await createTestContext();
      try {
        const resolved = ctx.service.resolvePath('/absolute/path');
        expect(resolved).toBe('/absolute/path');
      } finally {
        await ctx.cleanup();
      }
    });
  });

  describe('getConfigPath', () => {
    it('returns correct config path', async () => {
      const ctx = await createTestContext();
      try {
        const configPath = ctx.service.getConfigPath();
        expect(configPath).toBe(join(ctx.tempDir, '.bluera/bluera-knowledge/stores.config.json'));
      } finally {
        await ctx.cleanup();
      }
    });
  });

  describe('hasDefinitions', () => {
    it('returns false when no definitions', async () => {
      const ctx = await createTestContext();
      try {
        const has = await ctx.service.hasDefinitions();
        expect(has).toBe(false);
      } finally {
        await ctx.cleanup();
      }
    });

    it('returns true when definitions exist', async () => {
      const ctx = await createTestContext();
      try {
        await ctx.service.addDefinition({ type: 'file', name: 'docs', path: './docs' });
        const has = await ctx.service.hasDefinitions();
        expect(has).toBe(true);
      } finally {
        await ctx.cleanup();
      }
    });
  });
});
