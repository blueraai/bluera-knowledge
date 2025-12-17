import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { ServiceContainer } from '../services/index.js';

export function createApp(services: ServiceContainer): Hono {
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
    const body = await c.req.json();
    const result = await services.store.create(body);
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
    const result = await services.store.delete(store.id);
    if (result.success) return c.json({ deleted: true });
    return c.json({ error: result.error.message }, 400);
  });

  // Search
  app.post('/api/search', async (c) => {
    const body = await c.req.json();
    const storeIds = (await services.store.list()).map(s => s.id);

    for (const id of storeIds) {
      await services.lance.initialize(id);
    }

    const results = await services.search.search({
      ...body,
      stores: body.stores ?? storeIds,
    });
    return c.json(results);
  });

  // Index
  app.post('/api/stores/:id/index', async (c) => {
    const store = await services.store.getByIdOrName(c.req.param('id'));
    if (!store) return c.json({ error: 'Not found' }, 404);

    await services.lance.initialize(store.id);
    const result = await services.index.indexStore(store);

    if (result.success) return c.json(result.data);
    return c.json({ error: result.error.message }, 400);
  });

  return app;
}
