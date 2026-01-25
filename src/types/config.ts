export interface EmbeddingConfig {
  readonly model: string;
  readonly batchSize: number;
  // Note: dimensions is fixed at 384 (determined by all-MiniLM-L6-v2 model)
}

export interface IndexingConfig {
  readonly concurrency: number;
  readonly chunkSize: number;
  readonly chunkOverlap: number;
  readonly ignorePatterns: readonly string[];
}

export interface SearchConfig {
  readonly defaultMode: 'vector' | 'fts' | 'hybrid';
  readonly defaultLimit: number;
}

export interface CrawlConfig {
  readonly userAgent: string;
  readonly timeout: number;
  readonly maxConcurrency: number;
}

export interface ServerConfig {
  readonly port: number;
  readonly host: string;
}

export interface AppConfig {
  readonly version: number;
  readonly dataDir: string;
  readonly embedding: EmbeddingConfig;
  readonly indexing: IndexingConfig;
  readonly search: SearchConfig;
  readonly crawl: CrawlConfig;
  readonly server: ServerConfig;
}

export const DEFAULT_CONFIG: AppConfig = {
  version: 1,
  dataDir: '.bluera/bluera-knowledge/data',
  embedding: {
    model: 'Xenova/all-MiniLM-L6-v2',
    batchSize: 32,
  },
  indexing: {
    concurrency: 4,
    chunkSize: 1000,
    chunkOverlap: 150,
    ignorePatterns: ['node_modules/**', '.git/**', '*.min.js', '*.map'],
  },
  search: {
    defaultMode: 'hybrid',
    defaultLimit: 10,
  },
  crawl: {
    userAgent: 'BlueraKnowledge/1.0',
    timeout: 30000,
    maxConcurrency: 3,
  },
  server: {
    port: 3847,
    host: '127.0.0.1',
  },
};
