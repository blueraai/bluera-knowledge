import type { StoreId } from './brands.js';

export type StoreType = 'file' | 'repo' | 'web';
export type StoreStatus = 'ready' | 'indexing' | 'error';

interface BaseStore {
  readonly id: StoreId;
  readonly name: string;
  readonly description?: string;
  readonly tags?: readonly string[];
  readonly status?: StoreStatus;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface FileStore extends BaseStore {
  readonly type: 'file';
  readonly path: string;
}

export interface RepoStore extends BaseStore {
  readonly type: 'repo';
  readonly path: string;
  readonly branch?: string;
}

export interface WebStore extends BaseStore {
  readonly type: 'web';
  readonly url: string;
  readonly depth: number;
  readonly maxPages?: number;
}

export type Store = FileStore | RepoStore | WebStore;

export function isFileStore(store: Store): store is FileStore {
  return store.type === 'file';
}

export function isRepoStore(store: Store): store is RepoStore {
  return store.type === 'repo';
}

export function isWebStore(store: Store): store is WebStore {
  return store.type === 'web';
}
