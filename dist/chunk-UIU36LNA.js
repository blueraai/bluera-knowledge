// src/services/watch.service.ts
import { watch } from "chokidar";

// src/utils/ignore-patterns.ts
var DEFAULT_IGNORE_DIRS = ["node_modules", ".git", ".bluera", "dist", "build"];
function normalizeGlobPatterns(patterns, includeDefaults = true) {
  const result = [];
  if (includeDefaults) {
    for (const dir of DEFAULT_IGNORE_DIRS) {
      result.push(`**/${dir}/**`);
    }
  }
  for (const pattern of patterns) {
    if (pattern.startsWith("**/") && pattern.endsWith("/**")) {
      result.push(pattern);
    } else if (pattern.endsWith("/**")) {
      result.push(`**/${pattern}`);
    } else if (pattern.startsWith("*.")) {
      result.push(`**/${pattern}`);
    } else if (!pattern.includes("/") && !pattern.includes("*")) {
      result.push(`**/${pattern}/**`);
    } else {
      result.push(pattern);
    }
  }
  return result;
}
function parseIgnorePatternsForScanning(patterns, includeDefaults = true) {
  const dirs = /* @__PURE__ */ new Set();
  const fileMatchers = [];
  if (includeDefaults) {
    for (const dir of DEFAULT_IGNORE_DIRS) {
      dirs.add(dir);
    }
  }
  for (const pattern of patterns) {
    if (pattern.startsWith("**/") && pattern.endsWith("/**")) {
      const inner = pattern.slice(3, -3);
      if (!inner.includes("/") && !inner.includes("*")) {
        dirs.add(inner);
      }
    } else if (pattern.endsWith("/**")) {
      dirs.add(pattern.slice(0, -3));
    } else if (pattern.startsWith("*.")) {
      const ext = pattern.slice(1);
      fileMatchers.push((filename) => filename.endsWith(ext));
    } else if (!pattern.includes("/") && !pattern.includes("*")) {
      dirs.add(pattern);
    }
  }
  return { dirs, fileMatchers };
}

// src/services/watch.service.ts
var WatchService = class {
  watchers = /* @__PURE__ */ new Map();
  pendingTimeouts = /* @__PURE__ */ new Map();
  indexService;
  lanceStore;
  ignorePatterns;
  constructor(indexService, lanceStore, options = {}) {
    this.indexService = indexService;
    this.lanceStore = lanceStore;
    this.ignorePatterns = normalizeGlobPatterns(options.ignorePatterns ?? []);
  }
  async watch(store, debounceMs, onReindex, onError) {
    if (this.watchers.has(store.id)) {
      return Promise.resolve();
    }
    let timeout = null;
    const watcher = watch(store.path, {
      ignored: [...this.ignorePatterns],
      persistent: true,
      ignoreInitial: true
    });
    const reindexHandler = () => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        this.pendingTimeouts.delete(store.id);
        void (async () => {
          try {
            await this.lanceStore.initialize(store.id);
            let useFullReindex = true;
            if (typeof this.indexService.indexStoreIncremental === "function") {
              const incrementalResult = await this.indexService.indexStoreIncremental(store);
              if (incrementalResult.success) {
                useFullReindex = false;
              }
            }
            if (useFullReindex) {
              await this.indexService.indexStore(store);
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
    watcher.on("all", reindexHandler);
    watcher.on("error", (e) => {
      const error = e instanceof Error ? e : new Error(String(e));
      onError(error);
    });
    this.watchers.set(store.id, watcher);
    return Promise.resolve();
  }
  async unwatch(storeId) {
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
  async unwatchAll() {
    for (const [id] of this.watchers) {
      await this.unwatch(id);
    }
  }
};

export {
  parseIgnorePatternsForScanning,
  WatchService
};
//# sourceMappingURL=chunk-UIU36LNA.js.map