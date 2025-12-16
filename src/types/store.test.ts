import { describe, it, expect } from 'vitest';
import { isFileStore, isRepoStore, isWebStore } from './store.js';
import type { Store, FileStore, RepoStore, WebStore } from './store.js';
import { createStoreId } from './brands.js';

describe('Store types', () => {
  const fileStore: FileStore = {
    type: 'file',
    id: createStoreId('file-store'),
    name: 'My Files',
    path: '/path/to/files',
    description: 'Test file store',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const repoStore: RepoStore = {
    type: 'repo',
    id: createStoreId('repo-store'),
    name: 'My Repo',
    path: '/path/to/repo',
    branch: 'main',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const webStore: WebStore = {
    type: 'web',
    id: createStoreId('web-store'),
    name: 'Docs Site',
    url: 'https://docs.example.com',
    depth: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('isFileStore', () => {
    it('returns true for file stores', () => {
      expect(isFileStore(fileStore)).toBe(true);
    });

    it('returns false for other store types', () => {
      expect(isFileStore(repoStore)).toBe(false);
      expect(isFileStore(webStore)).toBe(false);
    });
  });

  describe('isRepoStore', () => {
    it('returns true for repo stores', () => {
      expect(isRepoStore(repoStore)).toBe(true);
    });

    it('returns false for other store types', () => {
      expect(isRepoStore(fileStore)).toBe(false);
      expect(isRepoStore(webStore)).toBe(false);
    });
  });

  describe('isWebStore', () => {
    it('returns true for web stores', () => {
      expect(isWebStore(webStore)).toBe(true);
    });

    it('returns false for other store types', () => {
      expect(isWebStore(fileStore)).toBe(false);
      expect(isWebStore(repoStore)).toBe(false);
    });
  });
});
