import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { dirname, resolve, isAbsolute, join } from 'node:path';
import { ProjectRootService } from './project-root.service.js';
import {
  StoreDefinitionsConfigSchema,
  DEFAULT_STORE_DEFINITIONS_CONFIG,
} from '../types/store-definition.js';
import type { StoreDefinitionsConfig, StoreDefinition } from '../types/store-definition.js';

/**
 * Check if a file exists
 */
async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * Service for managing git-committable store definitions.
 *
 * Store definitions are saved to `.bluera/bluera-knowledge/stores.config.json`
 * within the project root. This file is designed to be committed to version
 * control, allowing teams to share store configurations.
 *
 * The actual store data (vector embeddings, cloned repos) lives in the data
 * directory and should be gitignored.
 */
export class StoreDefinitionService {
  private readonly configPath: string;
  private readonly projectRoot: string;
  private config: StoreDefinitionsConfig | null = null;

  constructor(projectRoot?: string) {
    this.projectRoot = projectRoot ?? ProjectRootService.resolve();
    this.configPath = join(this.projectRoot, '.bluera/bluera-knowledge/stores.config.json');
  }

  /**
   * Load store definitions from config file.
   * Returns empty config if file doesn't exist.
   * Throws on parse/validation errors (fail fast per CLAUDE.md).
   */
  async load(): Promise<StoreDefinitionsConfig> {
    if (this.config !== null) {
      return this.config;
    }

    const exists = await fileExists(this.configPath);
    if (!exists) {
      // Deep clone to avoid mutating the shared default
      this.config = {
        ...DEFAULT_STORE_DEFINITIONS_CONFIG,
        stores: [...DEFAULT_STORE_DEFINITIONS_CONFIG.stores],
      };
      return this.config;
    }

    const content = await readFile(this.configPath, 'utf-8');
    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch (error) {
      throw new Error(
        `Failed to parse store definitions at ${this.configPath}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }

    const result = StoreDefinitionsConfigSchema.safeParse(parsed);
    if (!result.success) {
      throw new Error(`Invalid store definitions at ${this.configPath}: ${result.error.message}`);
    }

    this.config = result.data;
    return this.config;
  }

  /**
   * Save store definitions to config file.
   */
  async save(config: StoreDefinitionsConfig): Promise<void> {
    await mkdir(dirname(this.configPath), { recursive: true });
    await writeFile(this.configPath, JSON.stringify(config, null, 2));
    this.config = config;
  }

  /**
   * Add a store definition.
   * Throws if a definition with the same name already exists.
   */
  async addDefinition(definition: StoreDefinition): Promise<void> {
    const config = await this.load();
    const existing = config.stores.find((s) => s.name === definition.name);
    if (existing !== undefined) {
      throw new Error(`Store definition "${definition.name}" already exists`);
    }
    config.stores.push(definition);
    await this.save(config);
  }

  /**
   * Remove a store definition by name.
   * Returns true if removed, false if not found.
   */
  async removeDefinition(name: string): Promise<boolean> {
    const config = await this.load();
    const index = config.stores.findIndex((s) => s.name === name);
    if (index === -1) {
      return false;
    }
    config.stores.splice(index, 1);
    await this.save(config);
    return true;
  }

  /**
   * Update an existing store definition.
   * Only updates the provided fields, preserving others.
   * Throws if definition not found.
   */
  async updateDefinition(
    name: string,
    updates: { description?: string; tags?: string[] }
  ): Promise<void> {
    const config = await this.load();
    const index = config.stores.findIndex((s) => s.name === name);
    if (index === -1) {
      throw new Error(`Store definition "${name}" not found`);
    }

    // Merge updates while preserving type safety
    // We only allow updating common optional fields (description, tags)
    const existing = config.stores[index];
    if (existing === undefined) {
      throw new Error(`Store definition "${name}" not found at index ${String(index)}`);
    }
    if (updates.description !== undefined) {
      existing.description = updates.description;
    }
    if (updates.tags !== undefined) {
      existing.tags = updates.tags;
    }
    await this.save(config);
  }

  /**
   * Get a store definition by name.
   * Returns undefined if not found.
   */
  async getByName(name: string): Promise<StoreDefinition | undefined> {
    const config = await this.load();
    return config.stores.find((s) => s.name === name);
  }

  /**
   * Check if any definitions exist.
   */
  async hasDefinitions(): Promise<boolean> {
    const config = await this.load();
    return config.stores.length > 0;
  }

  /**
   * Resolve a file store path relative to project root.
   */
  resolvePath(path: string): string {
    if (isAbsolute(path)) {
      return path;
    }
    return resolve(this.projectRoot, path);
  }

  /**
   * Get the config file path.
   */
  getConfigPath(): string {
    return this.configPath;
  }

  /**
   * Get the project root.
   */
  getProjectRoot(): string {
    return this.projectRoot;
  }

  /**
   * Clear the cached config (useful for testing).
   */
  clearCache(): void {
    this.config = null;
  }
}
