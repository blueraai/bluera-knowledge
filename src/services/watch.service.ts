import { watch, type FSWatcher } from 'chokidar';
import { normalizeGlobPatterns } from '../utils/ignore-patterns.js';
import type { IndexService } from './index.service.js';
import type { LanceStore } from '../db/lance.js';
import type { FileStore, RepoStore } from '../types/store.js';

export interface WatchServiceOptions {
  ignorePatterns?: readonly string[];
}

export class WatchService {
  private readonly watchers: Map<string, FSWatcher> = new Map();
  private readonly pendingTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private readonly indexService: IndexService;
  private readonly lanceStore: LanceStore;
  private readonly ignorePatterns: readonly string[];

  constructor(
    indexService: IndexService,
    lanceStore: LanceStore,
    options: WatchServiceOptions = {}
  ) {
    this.indexService = indexService;
    this.lanceStore = lanceStore;
    // Use shared utility to normalize patterns to glob format with defaults
    this.ignorePatterns = normalizeGlobPatterns(options.ignorePatterns ?? []);
  }

  async watch(
    store: FileStore | RepoStore,
    debounceMs: number,
    onReindex: (() => void) | undefined,
    onError: (error: Error) => void
  ): Promise<void> {
    if (this.watchers.has(store.id)) {
      return Promise.resolve(); // Already watching
    }

    let timeout: NodeJS.Timeout | null = null;

    const watcher = watch(store.path, {
      ignored: [...this.ignorePatterns],
      persistent: true,
      ignoreInitial: true,
    });

    const reindexHandler = (): void => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        this.pendingTimeouts.delete(store.id);
        void (async (): Promise<void> => {
          try {
            await this.lanceStore.initialize(store.id);

            // Try incremental indexing first if available, fall back to full indexing
            let useFullReindex = true;
            if (typeof this.indexService.indexStoreIncremental === 'function') {
              const incrementalResult = await this.indexService.indexStoreIncremental(store);
              if (incrementalResult.success) {
                useFullReindex = false;
              }
            }

            if (useFullReindex) {
              const fullResult = await this.indexService.indexStore(store);
              if (!fullResult.success) {
                onError(fullResult.error);
                return;
              }
            }

            onReindex?.();
          } catch (e) {
            const error = e instanceof Error ? e : new Error(String(e));
            onError(error);
          }
        })();
      }, debounceMs);
      this.pendingTimeouts.set(store.id, timeout);
    };

    watcher.on('all', reindexHandler);

    watcher.on('error', (e) => {
      const error = e instanceof Error ? e : new Error(String(e));
      onError(error);
    });

    this.watchers.set(store.id, watcher);
    return Promise.resolve();
  }

  async unwatch(storeId: string): Promise<void> {
    // Clear any pending timeout to prevent timer leak
    const pendingTimeout = this.pendingTimeouts.get(storeId);
    if (pendingTimeout) {
      clearTimeout(pendingTimeout);
      this.pendingTimeouts.delete(storeId);
    }

    const watcher = this.watchers.get(storeId);
    if (watcher) {
      await watcher.close();
      this.watchers.delete(storeId);
    }
  }

  async unwatchAll(): Promise<void> {
    for (const [id] of this.watchers) {
      await this.unwatch(id);
    }
  }
}
