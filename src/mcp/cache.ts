/**
 * LRU (Least Recently Used) Cache implementation
 *
 * Maintains a cache with a maximum size, evicting the oldest (least recently used)
 * items when the capacity is exceeded. This prevents unbounded memory growth.
 *
 * Items are automatically moved to the end of the cache when accessed (via get),
 * making them the most recently used.
 */
export class LRUCache<K, V> {
  private readonly cache = new Map<K, V>();
  private readonly maxSize: number;

  /**
   * Create a new LRU cache
   *
   * @param maxSize - Maximum number of items to store (default: 1000)
   */
  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
  }

  /**
   * Store a value in the cache
   *
   * If the key already exists, it will be moved to the end (most recent).
   * If the cache is at capacity, the oldest item will be evicted.
   *
   * @param key - The cache key
   * @param value - The value to store
   */
  set(key: K, value: V): void {
    // If key exists, delete it first to move it to the end
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // Add the new/updated entry
    this.cache.set(key, value);

    // Evict oldest entry if over capacity
    if (this.cache.size > this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
  }

  /**
   * Retrieve a value from the cache
   *
   * If the key exists, it will be moved to the end (most recent).
   *
   * @param key - The cache key
   * @returns The cached value, or undefined if not found
   */
  get(key: K): V | undefined {
    const value = this.cache.get(key);

    if (value !== undefined) {
      // Move to end (most recent) by deleting and re-adding
      this.cache.delete(key);
      this.cache.set(key, value);
    }

    return value;
  }

  /**
   * Check if a key exists in the cache
   *
   * @param key - The cache key
   * @returns True if the key exists
   */
  has(key: K): boolean {
    return this.cache.has(key);
  }

  /**
   * Remove a specific key from the cache
   *
   * @param key - The cache key
   * @returns True if the key was removed, false if it didn't exist
   */
  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all entries from the cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get the current number of items in the cache
   */
  get size(): number {
    return this.cache.size;
  }
}
