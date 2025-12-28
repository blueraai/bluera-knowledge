import { watch, type FSWatcher } from 'chokidar';
import type { FileStore, RepoStore } from '../types/store.js';
import type { IndexService } from './index.service.js';
import type { LanceStore } from '../db/lance.js';

export class WatchService {
  private readonly watchers: Map<string, FSWatcher> = new Map();
  private readonly indexService: IndexService;
  private readonly lanceStore: LanceStore;

  constructor(indexService: IndexService, lanceStore: LanceStore) {
    this.indexService = indexService;
    this.lanceStore = lanceStore;
  }

  async watch(
    store: FileStore | RepoStore,
    debounceMs = 1000,
    onReindex?: () => void
  ): Promise<void> {
    if (this.watchers.has(store.id)) {
      return Promise.resolve(); // Already watching
    }

    let timeout: NodeJS.Timeout | null = null;

    const watcher = watch(store.path, {
      ignored: /(^|[/\\])\.(git|node_modules|dist|build)/,
      persistent: true,
      ignoreInitial: true,
    });

    const reindexHandler = (): void => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        void (async (): Promise<void> => {
          try {
            await this.lanceStore.initialize(store.id);
            await this.indexService.indexStore(store);
            onReindex?.();
          } catch (error) {
            console.error('Error during reindexing:', error);
          }
        })();
      }, debounceMs);
    };

    watcher.on('all', reindexHandler);

    watcher.on('error', (error) => {
      console.error('Watcher error:', error);
    });

    this.watchers.set(store.id, watcher);
    return Promise.resolve();
  }

  async unwatch(storeId: string): Promise<void> {
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
