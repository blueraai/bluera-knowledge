import { rm } from 'node:fs/promises';
import { join } from 'node:path';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { z } from 'zod';
import type { ServiceContainer } from '../services/index.js';
import type { SearchQuery } from '../types/search.js';

// HTTP API validation schemas (consistent with MCP schemas)
const CreateStoreBodySchema = z
  .object({
    name: z.string().min(1, 'Store name must be a non-empty string'),
    type: z.enum(['file', 'repo', 'web']),
    path: z.string().min(1).optional(),
    url: z.string().min(1).optional(),
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
    branch: z.string().optional(),
    depth: z.number().int().positive().optional(),
  })
  .refine(
    (data) => {
      switch (data.type) {
        case 'file':
          return data.path !== undefined;
        case 'web':
          return data.url !== undefined;
        case 'repo':
          return data.path !== undefined || data.url !== undefined;
      }
    },
    {
      message:
        'Missing required field: file stores need path, web stores need url, repo stores need path or url',
    }
  );

const SearchBodySchema = z.object({
  query: z.string().min(1, 'Query must be a non-empty string'),
  detail: z.enum(['minimal', 'contextual', 'full']).optional(),
  limit: z.number().int().positive().optional(),
  stores: z.array(z.string()).optional(),
});

export function createApp(services: ServiceContainer, dataDir?: string): Hono {
  const app = new Hono();

  app.use('*', cors());

  // Health check
  app.get('/health', (c) => c.json({ status: 'ok' }));

  // Stores
  app.get('/api/stores', async (c) => {
    const stores = await services.store.list();
    return c.json(stores);
  });

  app.post('/api/stores', async (c) => {
    const jsonData: unknown = await c.req.json();
    const parseResult = CreateStoreBodySchema.safeParse(jsonData);
    if (!parseResult.success) {
      return c.json({ error: parseResult.error.issues[0]?.message ?? 'Invalid request body' }, 400);
    }
    const result = await services.store.create(parseResult.data);
    if (result.success) {
      return c.json(result.data, 201);
    }
    return c.json({ error: result.error.message }, 400);
  });

  app.get('/api/stores/:id', async (c) => {
    const store = await services.store.getByIdOrName(c.req.param('id'));
    if (!store) return c.json({ error: 'Not found' }, 404);
    return c.json(store);
  });

  app.delete('/api/stores/:id', async (c) => {
    const store = await services.store.getByIdOrName(c.req.param('id'));
    if (!store) return c.json({ error: 'Not found' }, 404);

    // Delete LanceDB table first (so searches don't return results for deleted store)
    await services.lance.deleteStore(store.id);

    // Delete code graph
    await services.codeGraph.deleteGraph(store.id);

    // Delete manifest
    await services.manifest.delete(store.id);

    // For repo stores cloned from URL, remove the cloned directory
    // Only delete if path is within our data directory (cloned repos)
    if (
      store.type === 'repo' &&
      'url' in store &&
      store.url !== undefined &&
      dataDir !== undefined &&
      store.path.startsWith(join(dataDir, 'repos'))
    ) {
      await rm(store.path, { recursive: true, force: true });
    }

    // Delete from registry last
    const result = await services.store.delete(store.id);
    if (result.success) return c.json({ deleted: true });
    return c.json({ error: result.error.message }, 400);
  });

  // Search
  app.post('/api/search', async (c) => {
    const jsonData: unknown = await c.req.json();
    const parseResult = SearchBodySchema.safeParse(jsonData);
    if (!parseResult.success) {
      return c.json({ error: parseResult.error.issues[0]?.message ?? 'Invalid request body' }, 400);
    }

    const storeIds = (await services.store.list()).map((s) => s.id);

    services.lance.setDimensions(await services.embeddings.ensureDimensions());
    for (const id of storeIds) {
      await services.lance.initialize(id);
    }

    // Resolve user-provided store strings to StoreIds, or use all stores
    let requestedStores = storeIds;
    if (parseResult.data.stores !== undefined) {
      const resolvedStores: typeof storeIds = [];
      for (const requested of parseResult.data.stores) {
        const store = await services.store.getByIdOrName(requested);
        if (store === undefined) {
          return c.json({ error: `Store not found: ${requested}` }, 404);
        }
        resolvedStores.push(store.id);
      }
      requestedStores = resolvedStores;
    }

    const query: SearchQuery = {
      query: parseResult.data.query,
      detail: parseResult.data.detail ?? 'minimal',
      limit: parseResult.data.limit ?? 10,
      stores: requestedStores,
    };
    const results = await services.search.search(query);
    return c.json(results);
  });

  // Index
  app.post('/api/stores/:id/index', async (c) => {
    const store = await services.store.getByIdOrName(c.req.param('id'));
    if (!store) return c.json({ error: 'Not found' }, 404);

    services.lance.setDimensions(await services.embeddings.ensureDimensions());
    await services.lance.initialize(store.id);
    const result = await services.index.indexStore(store);

    if (result.success) return c.json(result.data);
    return c.json({ error: result.error.message }, 400);
  });

  return app;
}
