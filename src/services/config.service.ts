import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { homedir } from 'node:os';
import type { AppConfig } from '../types/config.js';
import { DEFAULT_CONFIG } from '../types/config.js';
import { ProjectRootService } from './project-root.service.js';

export class ConfigService {
  private readonly configPath: string;
  private readonly dataDir: string;
  private config: AppConfig | null = null;

  constructor(
    configPath = `${homedir()}/.bluera/bluera-knowledge/config.json`,
    dataDir?: string,
    projectRoot?: string
  ) {
    this.configPath = configPath;

    if (dataDir !== undefined && dataDir !== '') {
      // Explicit dataDir provided, use it as-is
      this.dataDir = dataDir;
    } else {
      // Resolve project root using hierarchical detection
      const root = projectRoot ?? ProjectRootService.resolve();
      // Expand relative default path against project root
      this.dataDir = this.expandPath(DEFAULT_CONFIG.dataDir, root);
    }
  }

  async load(): Promise<AppConfig> {
    if (this.config !== null) {
      return this.config;
    }

    try {
      const content = await readFile(this.configPath, 'utf-8');
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      this.config = { ...DEFAULT_CONFIG, ...JSON.parse(content) } as AppConfig;
    } catch {
      this.config = { ...DEFAULT_CONFIG };
    }

    return this.config;
  }

  async save(config: AppConfig): Promise<void> {
    await mkdir(dirname(this.configPath), { recursive: true });
    await writeFile(this.configPath, JSON.stringify(config, null, 2));
    this.config = config;
  }

  resolveDataDir(): string {
    return this.dataDir;
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
