import { readFile, access } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { ProjectRootService } from './project-root.service.js';
import { DEFAULT_CONFIG } from '../types/config.js';
import { atomicWriteFile } from '../utils/atomic-write.js';
import type { AppConfig } from '../types/config.js';

/** Default config path relative to project root */
const DEFAULT_CONFIG_PATH = '.bluera/bluera-knowledge/config.json';

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

export class ConfigService {
  private readonly configPath: string;
  private readonly dataDir: string;
  private readonly projectRoot: string;
  private config: AppConfig | null = null;

  constructor(configPath?: string, dataDir?: string, projectRoot?: string) {
    // Resolve project root using hierarchical detection
    this.projectRoot = projectRoot ?? ProjectRootService.resolve();

    // Resolve configPath - per-repo by default
    if (configPath !== undefined && configPath !== '') {
      this.configPath = configPath;
    } else {
      this.configPath = join(this.projectRoot, DEFAULT_CONFIG_PATH);
    }

    // Resolve dataDir - per-repo by default
    if (dataDir !== undefined && dataDir !== '') {
      this.dataDir = dataDir;
    } else {
      this.dataDir = this.expandPath(DEFAULT_CONFIG.dataDir, this.projectRoot);
    }
  }

  /**
   * Get the resolved project root directory.
   */
  resolveProjectRoot(): string {
    return this.projectRoot;
  }

  async load(): Promise<AppConfig> {
    if (this.config !== null) {
      return this.config;
    }

    const exists = await fileExists(this.configPath);
    if (!exists) {
      // First run - create config file with defaults
      this.config = { ...DEFAULT_CONFIG };
      await this.save(this.config);
      return this.config;
    }

    // File exists - load it (throws on corruption per CLAUDE.md "fail early")
    const content = await readFile(this.configPath, 'utf-8');
    try {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      this.config = { ...DEFAULT_CONFIG, ...JSON.parse(content) } as AppConfig;
    } catch (error) {
      throw new Error(
        `Failed to parse config file at ${this.configPath}: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    return this.config;
  }

  async save(config: AppConfig): Promise<void> {
    await atomicWriteFile(this.configPath, JSON.stringify(config, null, 2));
    this.config = config;
  }

  resolveDataDir(): string {
    return this.dataDir;
  }

  resolveConfigPath(): string {
    return this.configPath;
  }

  private expandPath(path: string, baseDir: string): string {
    // Expand ~ to home directory
    if (path.startsWith('~')) {
      return path.replace('~', homedir());
    }
    // Resolve relative paths against base directory (not process.cwd())
    if (!path.startsWith('/')) {
      return resolve(baseDir, path);
    }
    // Return absolute paths as-is
    return path;
  }
}
