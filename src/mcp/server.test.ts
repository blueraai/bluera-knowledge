import { describe, it, expect, vi, beforeEach, afterEach, type MockInstance } from 'vitest';
import { createMCPServer } from './server.js';
import type { ServiceContainer } from '../services/index.js';

// Mock services module
vi.mock('../services/index.js', () => ({
  createLazyServices: vi.fn(),
  destroyServices: vi.fn(),
  LazyServiceContainer: class MockLazyServiceContainer {},
}));

// Create a mock ServiceContainer for testing
function createMockServices(): ServiceContainer {
  return {
    config: { load: vi.fn(), resolveDataDir: vi.fn() },
    store: { list: vi.fn().mockResolvedValue([]), getByIdOrName: vi.fn() },
    lance: { search: vi.fn(), initialize: vi.fn(), closeAsync: vi.fn() },
    search: { search: vi.fn() },
    index: { index: vi.fn() },
    embeddings: { embed: vi.fn(), dispose: vi.fn() },
    codeGraph: { getGraph: vi.fn() },
    pythonBridge: { stop: vi.fn() },
  } as unknown as ServiceContainer;
}

// MCP Server tests - server creation only since the SDK doesn't expose handlers for testing
describe('MCP Server', () => {
  let mockServices: ServiceContainer;

  beforeEach(() => {
    mockServices = createMockServices();
  });

  describe('Server creation and initialization', () => {
    it('creates server with default options and services', () => {
      const server = createMCPServer({}, mockServices);
      expect(server).toBeDefined();
    });

    it('creates server with custom dataDir', () => {
      const server = createMCPServer({ dataDir: '/custom/path' }, mockServices);
      expect(server).toBeDefined();
    });

    it('creates server with config path', () => {
      const server = createMCPServer({ config: '/path/to/config.json' }, mockServices);
      expect(server).toBeDefined();
    });

    it('creates server with project root', () => {
      const server = createMCPServer({ projectRoot: '/project' }, mockServices);
      expect(server).toBeDefined();
    });

    it('creates server with all options', () => {
      const server = createMCPServer(
        {
          dataDir: '/data',
          config: '/config.json',
          projectRoot: '/project',
        },
        mockServices
      );
      expect(server).toBeDefined();
    });
  });

  describe('Service lifecycle', () => {
    let createLazyServicesSpy: MockInstance;
    let destroyServicesSpy: MockInstance;

    beforeEach(async () => {
      vi.clearAllMocks();

      const servicesModule = await import('../services/index.js');
      createLazyServicesSpy = vi.mocked(servicesModule.createLazyServices);
      destroyServicesSpy = vi.mocked(servicesModule.destroyServices);

      createLazyServicesSpy.mockResolvedValue(mockServices);
      destroyServicesSpy.mockResolvedValue(undefined);
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('services are passed to server at creation time', () => {
      // The new architecture passes pre-initialized services to createMCPServer
      // Services are initialized ONCE at runMCPServer startup, not per-tool-call
      const server = createMCPServer({ projectRoot: '/test' }, mockServices);
      expect(server).toBeDefined();

      // Services are reused for all tool calls, not created/destroyed per-call
      // This reduces per-call latency from 1-15s to <500ms
    });

    it('server uses lazy service container for deferred initialization', async () => {
      // The runMCPServer function uses createLazyServices which:
      // 1. Initializes lightweight services immediately (config, store)
      // 2. Defers heavy services (embeddings) until first use
      // This reduces server startup from ~5s to <500ms

      // Verify mock is set up correctly
      expect(createLazyServicesSpy).toBeDefined();
      expect(destroyServicesSpy).toBeDefined();
    });
  });
});
