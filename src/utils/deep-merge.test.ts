import { describe, it, expect } from 'vitest';
import { deepMerge } from './deep-merge.js';

describe('deepMerge', () => {
  it('merges flat objects', () => {
    const defaults = { a: 1, b: 2 };
    const overrides = { b: 3 };

    const result = deepMerge(defaults, overrides);

    expect(result).toEqual({ a: 1, b: 3 });
  });

  it('recursively merges nested objects', () => {
    const defaults = {
      search: { mode: 'hybrid', limit: 10, rrf: { k: 40, weight: 0.7 } },
    };
    const overrides = {
      search: { mode: 'vector' },
    };

    const result = deepMerge(defaults, overrides);

    expect(result).toEqual({
      search: { mode: 'vector', limit: 10, rrf: { k: 40, weight: 0.7 } },
    });
  });

  it('preserves deeply nested defaults when not overridden', () => {
    const defaults = {
      level1: {
        level2: {
          level3: { a: 1, b: 2, c: 3 },
        },
      },
    };
    const overrides = {
      level1: {
        level2: {
          level3: { b: 20 },
        },
      },
    };

    const result = deepMerge(defaults, overrides);

    expect(result.level1.level2.level3).toEqual({ a: 1, b: 20, c: 3 });
  });

  it('replaces arrays entirely (no concat)', () => {
    const defaults = { items: [1, 2, 3] };
    const overrides = { items: [4, 5] };

    const result = deepMerge(defaults, overrides);

    expect(result.items).toEqual([4, 5]);
  });

  it('preserves default arrays when not overridden', () => {
    const defaults = { items: [1, 2, 3], other: 'value' };
    const overrides = { other: 'new' };

    const result = deepMerge(defaults, overrides);

    expect(result.items).toEqual([1, 2, 3]);
    expect(result.other).toBe('new');
  });

  it('handles null overrides (replaces default)', () => {
    const defaults = { optional: { nested: true } };
    const overrides = { optional: null };

    const result = deepMerge(defaults, overrides);

    expect(result.optional).toBeNull();
  });

  it('ignores undefined overrides (preserves default)', () => {
    const defaults = { a: 1, b: 2 };
    const overrides = { a: undefined, b: 3 };

    const result = deepMerge(defaults, overrides);

    expect(result).toEqual({ a: 1, b: 3 });
  });

  it('handles Date objects (replaces, does not merge)', () => {
    const defaults = { date: new Date('2024-01-01') };
    const overrides = { date: new Date('2025-01-01') };

    const result = deepMerge(defaults, overrides);

    expect(result.date).toEqual(new Date('2025-01-01'));
  });

  it('adds new keys from overrides', () => {
    const defaults = { existing: 1 };
    const overrides = { existing: 2, newKey: 'new' };

    const result = deepMerge(defaults, overrides);

    expect(result).toEqual({ existing: 2, newKey: 'new' });
  });

  it('does not mutate original objects', () => {
    const defaults = { nested: { value: 1 } };
    const overrides = { nested: { value: 2 } };

    deepMerge(defaults, overrides);

    expect(defaults.nested.value).toBe(1);
    expect(overrides.nested.value).toBe(2);
  });

  it('handles empty overrides (returns defaults)', () => {
    const defaults = { a: 1, b: { c: 2 } };
    const overrides = {};

    const result = deepMerge(defaults, overrides);

    expect(result).toEqual(defaults);
  });

  it('works with realistic AppConfig-like structure', () => {
    const defaults = {
      version: 1,
      dataDir: '.bluera/data',
      search: {
        defaultMode: 'hybrid',
        defaultLimit: 10,
        rrf: { k: 40, vectorWeight: 0.7, ftsWeight: 0.3 },
      },
      indexing: {
        concurrency: 4,
        ignorePatterns: ['node_modules/**'],
      },
    };

    const userConfig = {
      search: {
        defaultMode: 'vector',
      },
      indexing: {
        ignorePatterns: ['coverage/**'],
      },
    };

    const result = deepMerge(defaults, userConfig);

    expect(result.version).toBe(1);
    expect(result.dataDir).toBe('.bluera/data');
    expect(result.search.defaultMode).toBe('vector');
    expect(result.search.defaultLimit).toBe(10);
    expect(result.search.rrf).toEqual({ k: 40, vectorWeight: 0.7, ftsWeight: 0.3 });
    expect(result.indexing.concurrency).toBe(4);
    expect(result.indexing.ignorePatterns).toEqual(['coverage/**']);
  });
});
