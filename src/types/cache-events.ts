import type { StoreId } from './brands.js';

/**
 * Events emitted when cached data becomes stale.
 * Used to notify dependent services (e.g., SearchService) when
 * source data (e.g., code graphs) has been updated or deleted.
 */
export interface CacheInvalidationEvent {
  /** Type of invalidation */
  type: 'graph-updated' | 'graph-deleted';
  /** The store whose data changed */
  storeId: StoreId;
}

/**
 * Listener function for cache invalidation events.
 */
export type CacheInvalidationListener = (event: CacheInvalidationEvent) => void;
