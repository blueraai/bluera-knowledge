import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { Store, FileStore, RepoStore, WebStore, StoreType } from '../types/store.js';
import type { StoreId } from '../types/brands.js';
import { createStoreId } from '../types/brands.js';
import type { Result } from '../types/result.js';
import { ok, err } from '../types/result.js';

interface CreateStoreInput {
  name: string;
  type: StoreType;
  path?: string;
  url?: string;
  description?: string;
  tags?: string[];
  branch?: string;
  depth?: number;
}

interface StoreRegistry {
  stores: Store[];
}

export class StoreService {
  private readonly dataDir: string;
  private registry: StoreRegistry = { stores: [] };

  constructor(dataDir: string) {
    this.dataDir = dataDir;
  }

  async initialize(): Promise<void> {
    await mkdir(this.dataDir, { recursive: true });
    await this.loadRegistry();
  }

  async create(input: CreateStoreInput): Promise<Result<Store>> {
    const existing = await this.getByName(input.name);
    if (existing !== undefined) {
      return err(new Error(`Store with name "${input.name}" already exists`));
    }

    const id = createStoreId(randomUUID());
    const now = new Date();

    let store: Store;

    switch (input.type) {
      case 'file':
        if (input.path === undefined) {
          return err(new Error('Path is required for file stores'));
        }
        store = {
          type: 'file',
          id,
          name: input.name,
          path: input.path,
          description: input.description,
          tags: input.tags,
          status: 'ready',
          createdAt: now,
          updatedAt: now,
        } satisfies FileStore;
        break;

      case 'repo':
        if (input.path === undefined) {
          return err(new Error('Path is required for repo stores'));
        }
        store = {
          type: 'repo',
          id,
          name: input.name,
          path: input.path,
          branch: input.branch,
          description: input.description,
          tags: input.tags,
          status: 'ready',
          createdAt: now,
          updatedAt: now,
        } satisfies RepoStore;
        break;

      case 'web':
        if (input.url === undefined) {
          return err(new Error('URL is required for web stores'));
        }
        store = {
          type: 'web',
          id,
          name: input.name,
          url: input.url,
          depth: input.depth ?? 1,
          description: input.description,
          tags: input.tags,
          status: 'ready',
          createdAt: now,
          updatedAt: now,
        } satisfies WebStore;
        break;
    }

    this.registry.stores.push(store);
    await this.saveRegistry();

    return ok(store);
  }

  async list(type?: StoreType): Promise<Store[]> {
    if (type !== undefined) {
      return this.registry.stores.filter((s) => s.type === type);
    }
    return [...this.registry.stores];
  }

  async get(id: StoreId): Promise<Store | undefined> {
    return this.registry.stores.find((s) => s.id === id);
  }

  async getByName(name: string): Promise<Store | undefined> {
    return this.registry.stores.find((s) => s.name === name);
  }

  async getByIdOrName(idOrName: string): Promise<Store | undefined> {
    return this.registry.stores.find((s) => s.id === idOrName || s.name === idOrName);
  }

  async update(id: StoreId, updates: Partial<Pick<Store, 'name' | 'description' | 'tags'>>): Promise<Result<Store>> {
    const index = this.registry.stores.findIndex((s) => s.id === id);
    if (index === -1) {
      return err(new Error(`Store not found: ${id}`));
    }

    const store = this.registry.stores[index]!;
    const updated = {
      ...store,
      ...updates,
      updatedAt: new Date(),
    } as Store;

    this.registry.stores[index] = updated;
    await this.saveRegistry();

    return ok(updated);
  }

  async delete(id: StoreId): Promise<Result<void>> {
    const index = this.registry.stores.findIndex((s) => s.id === id);
    if (index === -1) {
      return err(new Error(`Store not found: ${id}`));
    }

    this.registry.stores.splice(index, 1);
    await this.saveRegistry();

    return ok(undefined);
  }

  private async loadRegistry(): Promise<void> {
    const registryPath = join(this.dataDir, 'stores.json');
    try {
      const content = await readFile(registryPath, 'utf-8');
      const data = JSON.parse(content) as { stores: Store[] };
      this.registry = {
        stores: data.stores.map((s) => ({
          ...s,
          id: createStoreId(s.id),
          createdAt: new Date(s.createdAt),
          updatedAt: new Date(s.updatedAt),
        })),
      };
    } catch {
      this.registry = { stores: [] };
    }
  }

  private async saveRegistry(): Promise<void> {
    const registryPath = join(this.dataDir, 'stores.json');
    await writeFile(registryPath, JSON.stringify(this.registry, null, 2));
  }
}
