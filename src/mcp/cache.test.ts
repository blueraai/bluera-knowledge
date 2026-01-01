import { describe, it, expect } from 'vitest';
import { LRUCache } from './cache.js';

describe('LRUCache', () => {
  describe('constructor', () => {
    it('should create cache with default max size', () => {
      const cache = new LRUCache<string, number>();
      expect(cache.size).toBe(0);
    });

    it('should create cache with custom max size', () => {
      const cache = new LRUCache<string, number>(5);
      expect(cache.size).toBe(0);
    });
  });

  describe('set and get', () => {
    it('should store and retrieve values', () => {
      const cache = new LRUCache<string, number>(3);
      cache.set('a', 1);
      cache.set('b', 2);
      cache.set('c', 3);

      expect(cache.get('a')).toBe(1);
      expect(cache.get('b')).toBe(2);
      expect(cache.get('c')).toBe(3);
    });

    it('should return undefined for non-existent keys', () => {
      const cache = new LRUCache<string, number>(3);
      expect(cache.get('nonexistent')).toBeUndefined();
    });

    it('should update existing values', () => {
      const cache = new LRUCache<string, number>(3);
      cache.set('a', 1);
      cache.set('a', 100);
      expect(cache.get('a')).toBe(100);
    });
  });

  describe('LRU eviction', () => {
    it('should evict oldest item when over capacity', () => {
      const cache = new LRUCache<string, number>(3);
      cache.set('a', 1);
      cache.set('b', 2);
      cache.set('c', 3);
      cache.set('d', 4); // Evicts 'a'

      expect(cache.get('a')).toBeUndefined();
      expect(cache.get('b')).toBe(2);
      expect(cache.get('c')).toBe(3);
      expect(cache.get('d')).toBe(4);
    });

    it('should move accessed items to end (most recent)', () => {
      const cache = new LRUCache<string, number>(3);
      cache.set('a', 1);
      cache.set('b', 2);
      cache.set('c', 3);
      cache.get('a'); // Access 'a', moves it to end
      cache.set('d', 4); // Should evict 'b', not 'a'

      expect(cache.get('a')).toBe(1);
      expect(cache.get('b')).toBeUndefined();
      expect(cache.get('c')).toBe(3);
      expect(cache.get('d')).toBe(4);
    });

    it('should move updated items to end', () => {
      const cache = new LRUCache<string, number>(3);
      cache.set('a', 1);
      cache.set('b', 2);
      cache.set('c', 3);
      cache.set('a', 100); // Update 'a', moves it to end
      cache.set('d', 4); // Should evict 'b', not 'a'

      expect(cache.get('a')).toBe(100);
      expect(cache.get('b')).toBeUndefined();
      expect(cache.get('c')).toBe(3);
      expect(cache.get('d')).toBe(4);
    });
  });

  describe('has', () => {
    it('should return true for existing keys', () => {
      const cache = new LRUCache<string, number>(3);
      cache.set('a', 1);
      expect(cache.has('a')).toBe(true);
    });

    it('should return false for non-existent keys', () => {
      const cache = new LRUCache<string, number>(3);
      expect(cache.has('nonexistent')).toBe(false);
    });
  });

  describe('delete', () => {
    it('should delete existing keys', () => {
      const cache = new LRUCache<string, number>(3);
      cache.set('a', 1);
      cache.set('b', 2);

      expect(cache.delete('a')).toBe(true);
      expect(cache.has('a')).toBe(false);
      expect(cache.has('b')).toBe(true);
      expect(cache.size).toBe(1);
    });

    it('should return false for non-existent keys', () => {
      const cache = new LRUCache<string, number>(3);
      expect(cache.delete('nonexistent')).toBe(false);
    });
  });

  describe('clear', () => {
    it('should remove all entries', () => {
      const cache = new LRUCache<string, number>(3);
      cache.set('a', 1);
      cache.set('b', 2);
      cache.set('c', 3);

      cache.clear();
      expect(cache.size).toBe(0);
      expect(cache.get('a')).toBeUndefined();
      expect(cache.get('b')).toBeUndefined();
      expect(cache.get('c')).toBeUndefined();
    });

    it('should work on empty cache', () => {
      const cache = new LRUCache<string, number>(3);
      cache.clear();
      expect(cache.size).toBe(0);
    });
  });

  describe('size', () => {
    it('should track current size', () => {
      const cache = new LRUCache<string, number>(5);
      expect(cache.size).toBe(0);

      cache.set('a', 1);
      expect(cache.size).toBe(1);

      cache.set('b', 2);
      expect(cache.size).toBe(2);

      cache.delete('a');
      expect(cache.size).toBe(1);

      cache.clear();
      expect(cache.size).toBe(0);
    });

    it('should not exceed max size', () => {
      const cache = new LRUCache<string, number>(3);
      cache.set('a', 1);
      cache.set('b', 2);
      cache.set('c', 3);
      cache.set('d', 4);
      cache.set('e', 5);

      expect(cache.size).toBe(3);
    });
  });

  describe('edge cases', () => {
    it('should handle capacity of 1', () => {
      const cache = new LRUCache<string, number>(1);
      cache.set('a', 1);
      expect(cache.get('a')).toBe(1);

      cache.set('b', 2);
      expect(cache.get('a')).toBeUndefined();
      expect(cache.get('b')).toBe(2);
    });

    it('should handle storing undefined values', () => {
      const cache = new LRUCache<string, number | undefined>(3);
      cache.set('a', undefined);
      expect(cache.has('a')).toBe(true);
      expect(cache.get('a')).toBeUndefined();
    });

    it('should handle complex object values', () => {
      interface TestObj {
        id: number;
        data: string;
      }

      const cache = new LRUCache<string, TestObj>(3);
      const obj1 = { id: 1, data: 'test1' };
      const obj2 = { id: 2, data: 'test2' };

      cache.set('a', obj1);
      cache.set('b', obj2);

      expect(cache.get('a')).toEqual(obj1);
      expect(cache.get('b')).toEqual(obj2);
    });
  });
});
