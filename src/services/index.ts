import { CodeGraphService } from './code-graph.service.js';
import { ConfigService } from './config.service.js';
import { GitignoreService } from './gitignore.service.js';
import { IndexService } from './index.service.js';
import { ManifestService } from './manifest.service.js';
import { SearchService } from './search.service.js';
import { StoreDefinitionService } from './store-definition.service.js';
import { StoreService } from './store.service.js';
import { PythonBridge } from '../crawl/bridge.js';
import { EmbeddingEngine } from '../db/embeddings.js';
import { LanceStore } from '../db/lance.js';
import { createLogger, shutdownLogger } from '../logging/index.js';
import type { StoreServiceOptions } from './store.service.js';
import type { AppConfig } from '../types/config.js';

const logger = createLogger('services');

export { ConfigService } from './config.service.js';
export { StoreService } from './store.service.js';
export { SearchService } from './search.service.js';
export { IndexService } from './index.service.js';
export { JobService } from './job.service.js';
export { WatchService } from './watch.service.js';
export { ChunkingService } from './chunking.service.js';
export { CodeGraphService } from './code-graph.service.js';

export interface ServiceContainer {
  config: ConfigService;
  store: StoreService;
  search: SearchService;
  index: IndexService;
  lance: LanceStore;
  embeddings: EmbeddingEngine;
  codeGraph: CodeGraphService;
  pythonBridge: PythonBridge;
  manifest: ManifestService;
}

/**
 * Lazy service container that defers heavy initialization until first use.
 *
 * Initialization strategy:
 * - Eager (lightweight): config, store, lance (wrapper only), pythonBridge (started for fork safety)
 * - Lazy (heavy): embeddings (3-10s model load), search, index, codeGraph
 *
 * IMPORTANT: PythonBridge must be started BEFORE lancedb.connect() is called.
 * LanceDB's native Rust code is not fork-safe - spawning subprocesses after
 * lancedb is loaded corrupts the mutex state, causing crashes on shutdown.
 */
export class LazyServiceContainer implements ServiceContainer {
  // Eagerly initialized (lightweight)
  readonly config: ConfigService;
  readonly store: StoreService;
  readonly lance: LanceStore;
  readonly pythonBridge: PythonBridge;

  // Configuration for lazy initialization
  private readonly appConfig: AppConfig;
  private readonly dataDir: string;

  // Lazily initialized (heavy)
  // eslint-disable-next-line @typescript-eslint/prefer-readonly -- mutated in lazy getter
  private _manifest: ManifestService | null = null;
  private _embeddings: EmbeddingEngine | null = null;
  private _codeGraph: CodeGraphService | null = null;
  private _search: SearchService | null = null;
  private _index: IndexService | null = null;

  constructor(
    config: ConfigService,
    appConfig: AppConfig,
    dataDir: string,
    store: StoreService,
    lance: LanceStore,
    pythonBridge: PythonBridge
  ) {
    this.config = config;
    this.appConfig = appConfig;
    this.dataDir = dataDir;
    this.store = store;
    this.lance = lance;
    this.pythonBridge = pythonBridge;
  }

  /**
   * EmbeddingEngine is lazily created on first access.
   * Model loading (3-10s) is deferred until embed() is called.
   */
  get embeddings(): EmbeddingEngine {
    if (this._embeddings === null) {
      logger.debug('Lazy-initializing EmbeddingEngine');
      this._embeddings = new EmbeddingEngine(this.appConfig.embedding.model);
    }
    return this._embeddings;
  }

  /**
   * CodeGraphService is lazily created on first access.
   */
  get codeGraph(): CodeGraphService {
    if (this._codeGraph === null) {
      logger.debug('Lazy-initializing CodeGraphService');
      this._codeGraph = new CodeGraphService(this.dataDir, this.pythonBridge);
    }
    return this._codeGraph;
  }

  /**
   * SearchService is lazily created on first access.
   */
  get search(): SearchService {
    if (this._search === null) {
      logger.debug('Lazy-initializing SearchService');
      this._search = new SearchService(this.lance, this.embeddings, this.codeGraph);
    }
    return this._search;
  }

  /**
   * IndexService is lazily created on first access.
   */
  get index(): IndexService {
    if (this._index === null) {
      logger.debug('Lazy-initializing IndexService');
      this._index = new IndexService(this.lance, this.embeddings, {
        codeGraphService: this.codeGraph,
        manifestService: this.manifest,
        chunkSize: this.appConfig.indexing.chunkSize,
        chunkOverlap: this.appConfig.indexing.chunkOverlap,
        concurrency: this.appConfig.indexing.concurrency,
      });
    }
    return this._index;
  }

  /**
   * ManifestService is lazily created on first access.
   */
  get manifest(): ManifestService {
    if (this._manifest === null) {
      logger.debug('Lazy-initializing ManifestService');
      this._manifest = new ManifestService(this.dataDir);
    }
    return this._manifest;
  }

  /**
   * Check if embeddings have been initialized (for cleanup purposes).
   */
  get hasEmbeddings(): boolean {
    return this._embeddings !== null;
  }
}

/**
 * Create lazy service container for MCP server.
 *
 * This defers heavy initialization (embeddings model loading) until first use,
 * reducing MCP server startup time from ~5s to <500ms.
 *
 * PythonBridge is started eagerly to avoid fork-safety issues with LanceDB.
 */
export async function createLazyServices(
  configPath?: string,
  dataDir?: string,
  projectRoot?: string
): Promise<LazyServiceContainer> {
  logger.info({ configPath, dataDir, projectRoot }, 'Initializing lazy services');
  const startTime = Date.now();

  const config = new ConfigService(configPath, dataDir, projectRoot);
  const appConfig = await config.load();
  const resolvedDataDir = config.resolveDataDir();

  // IMPORTANT: Start PythonBridge BEFORE creating LanceStore.
  // LanceDB's native Rust code is not fork-safe. Spawning subprocesses after
  // lancedb is loaded corrupts the mutex state, causing crashes on shutdown.
  const pythonBridge = new PythonBridge();
  await pythonBridge.start();

  // Now safe to create LanceStore wrapper (doesn't connect until initialize() is called)
  const lance = new LanceStore(resolvedDataDir);

  // Create project-root-dependent services
  let storeOptions: StoreServiceOptions | undefined;
  if (projectRoot !== undefined) {
    const definitionService = new StoreDefinitionService(projectRoot);
    const gitignoreService = new GitignoreService(projectRoot);
    storeOptions = { definitionService, gitignoreService, projectRoot };
  }

  const store = new StoreService(resolvedDataDir, storeOptions);
  await store.initialize();

  const durationMs = Date.now() - startTime;
  logger.info({ dataDir: resolvedDataDir, durationMs }, 'Lazy services initialized');

  return new LazyServiceContainer(config, appConfig, resolvedDataDir, store, lance, pythonBridge);
}

/**
 * Create services with eager initialization (for CLI commands).
 *
 * This initializes all services including the embedding model upfront.
 * Use createLazyServices() for MCP server to reduce startup time.
 */
export async function createServices(
  configPath?: string,
  dataDir?: string,
  projectRoot?: string
): Promise<ServiceContainer> {
  logger.info({ configPath, dataDir, projectRoot }, 'Initializing services');

  const config = new ConfigService(configPath, dataDir, projectRoot);
  const appConfig = await config.load();
  const resolvedDataDir = config.resolveDataDir();

  // IMPORTANT: Start PythonBridge BEFORE creating LanceStore.
  // LanceDB's native Rust code is not fork-safe. Spawning subprocesses after
  // lancedb is loaded corrupts the mutex state, causing crashes on shutdown.
  const pythonBridge = new PythonBridge();
  await pythonBridge.start();

  // Now safe to initialize lancedb and other services
  const lance = new LanceStore(resolvedDataDir);
  const embeddings = new EmbeddingEngine(appConfig.embedding.model);

  await embeddings.initialize();

  // Create project-root-dependent services
  let storeOptions: StoreServiceOptions | undefined;
  if (projectRoot !== undefined) {
    const definitionService = new StoreDefinitionService(projectRoot);
    const gitignoreService = new GitignoreService(projectRoot);
    storeOptions = { definitionService, gitignoreService, projectRoot };
  }

  const store = new StoreService(resolvedDataDir, storeOptions);
  await store.initialize();

  const codeGraph = new CodeGraphService(resolvedDataDir, pythonBridge);
  const manifest = new ManifestService(resolvedDataDir);
  const search = new SearchService(lance, embeddings, codeGraph);
  const index = new IndexService(lance, embeddings, {
    codeGraphService: codeGraph,
    manifestService: manifest,
    chunkSize: appConfig.indexing.chunkSize,
    chunkOverlap: appConfig.indexing.chunkOverlap,
    concurrency: appConfig.indexing.concurrency,
  });

  logger.info({ dataDir: resolvedDataDir }, 'Services initialized successfully');

  return {
    config,
    store,
    search,
    index,
    lance,
    embeddings,
    codeGraph,
    pythonBridge,
    manifest,
  };
}

/**
 * Cleanly shut down all services, stopping background processes.
 * Call this after CLI commands complete to allow the process to exit.
 * Attempts all cleanup operations and throws if any fail.
 *
 * For LazyServiceContainer, only disposes embeddings if they were initialized.
 */
export async function destroyServices(services: ServiceContainer): Promise<void> {
  logger.info('Shutting down services');
  const errors: Error[] = [];

  // IMPORTANT: Shutdown in reverse order of initialization (LIFO).
  // PythonBridge must stop BEFORE LanceStore closes to avoid mutex corruption.
  // LanceDB's native Rust code is not fork-safe and has threading issues
  // if subprocess signals are sent while lancedb is shutting down.

  // 1. Stop Python bridge first (reverse of init: started first, stopped first)
  try {
    await services.pythonBridge.stop();
  } catch (e) {
    const error = e instanceof Error ? e : new Error(String(e));
    logger.error({ error }, 'Error stopping Python bridge');
    errors.push(error);
  }

  // 2. Dispose embedding engine (only if initialized for lazy containers)
  const isLazyContainer = services instanceof LazyServiceContainer;
  const shouldDisposeEmbeddings = !isLazyContainer || services.hasEmbeddings;

  if (shouldDisposeEmbeddings) {
    try {
      await services.embeddings.dispose();
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e));
      logger.error({ error }, 'Error disposing EmbeddingEngine');
      errors.push(error);
    }
  } else {
    logger.debug('Skipping embeddings disposal (not initialized)');
  }

  // 3. Close LanceStore last (reverse of init: created after PythonBridge started)
  try {
    await services.lance.closeAsync();
  } catch (e) {
    const error = e instanceof Error ? e : new Error(String(e));
    logger.error({ error }, 'Error closing LanceStore');
    errors.push(error);
  }

  await shutdownLogger();

  // Throw if any errors occurred during cleanup
  if (errors.length === 1 && errors[0] !== undefined) {
    throw new Error(`Service shutdown failed: ${errors[0].message}`, { cause: errors[0] });
  } else if (errors.length > 1) {
    throw new AggregateError(errors, 'Multiple errors during service shutdown');
  }
}
