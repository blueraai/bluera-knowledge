import { CodeGraphService } from './code-graph.service.js';
import { ConfigService } from './config.service.js';
import { IndexService } from './index.service.js';
import { SearchService } from './search.service.js';
import { StoreService } from './store.service.js';
import { PythonBridge } from '../crawl/bridge.js';
import { EmbeddingEngine } from '../db/embeddings.js';
import { LanceStore } from '../db/lance.js';
import { createLogger, shutdownLogger } from '../logging/index.js';

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
}

export async function createServices(
  configPath?: string,
  dataDir?: string,
  projectRoot?: string
): Promise<ServiceContainer> {
  logger.info({ configPath, dataDir, projectRoot }, 'Initializing services');

  const config = new ConfigService(configPath, dataDir, projectRoot);
  const appConfig = await config.load();
  const resolvedDataDir = config.resolveDataDir();

  const lance = new LanceStore(resolvedDataDir);
  const embeddings = new EmbeddingEngine(appConfig.embedding.model, appConfig.embedding.dimensions);

  await embeddings.initialize();

  const store = new StoreService(resolvedDataDir);
  await store.initialize();

  const pythonBridge = new PythonBridge();
  await pythonBridge.start();

  const codeGraph = new CodeGraphService(resolvedDataDir, pythonBridge);
  const search = new SearchService(lance, embeddings, codeGraph);
  const index = new IndexService(lance, embeddings, { codeGraphService: codeGraph });

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
  };
}

/**
 * Cleanly shut down all services, stopping background processes.
 * Call this after CLI commands complete to allow the process to exit.
 * Attempts all cleanup operations and throws if any fail.
 */
export async function destroyServices(services: ServiceContainer): Promise<void> {
  logger.info('Shutting down services');
  const errors: Error[] = [];

  // Use async close to allow native threads time to cleanup
  try {
    await services.lance.closeAsync();
  } catch (e) {
    const error = e instanceof Error ? e : new Error(String(e));
    logger.error({ error }, 'Error closing LanceStore');
    errors.push(error);
  }

  // Dispose embedding engine to free ONNX runtime resources
  try {
    await services.embeddings.dispose();
  } catch (e) {
    const error = e instanceof Error ? e : new Error(String(e));
    logger.error({ error }, 'Error disposing EmbeddingEngine');
    errors.push(error);
  }

  try {
    await services.pythonBridge.stop();
  } catch (e) {
    const error = e instanceof Error ? e : new Error(String(e));
    logger.error({ error }, 'Error stopping Python bridge');
    errors.push(error);
  }

  // Additional delay to allow native threads (LanceDB, tree-sitter, transformers)
  // to fully complete their cleanup before process exit
  await new Promise((resolve) => setTimeout(resolve, 100));
  await shutdownLogger();

  // Throw if any errors occurred during cleanup
  if (errors.length === 1 && errors[0] !== undefined) {
    throw new Error(`Service shutdown failed: ${errors[0].message}`, { cause: errors[0] });
  } else if (errors.length > 1) {
    throw new AggregateError(errors, 'Multiple errors during service shutdown');
  }
}
