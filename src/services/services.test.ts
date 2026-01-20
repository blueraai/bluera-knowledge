import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createServices,
  createLazyServices,
  destroyServices,
  type ServiceContainer,
} from './index.js';
import type { PythonBridge } from '../crawl/bridge.js';
import type { EmbeddingEngine } from '../db/embeddings.js';
import type { LanceStore } from '../db/lance.js';
import type { StoreDefinitionService } from './store-definition.service.js';
import type { GitignoreService } from './gitignore.service.js';

// Mock all dependencies for createServices tests
vi.mock('../crawl/bridge.js');
vi.mock('../db/lance.js');
vi.mock('../db/embeddings.js');
vi.mock('./config.service.js');
vi.mock('./store.service.js');
vi.mock('./store-definition.service.js');
vi.mock('./gitignore.service.js');
vi.mock('./code-graph.service.js');
vi.mock('./search.service.js');
vi.mock('./index.service.js');

describe('destroyServices', () => {
  let mockPythonBridge: { stop: ReturnType<typeof vi.fn> };
  let mockLance: { closeAsync: ReturnType<typeof vi.fn>; close: ReturnType<typeof vi.fn> };
  let mockEmbeddings: { dispose: ReturnType<typeof vi.fn> };
  let mockServices: ServiceContainer;

  beforeEach(() => {
    mockPythonBridge = {
      stop: vi.fn().mockResolvedValue(undefined),
    };

    mockLance = {
      closeAsync: vi.fn().mockResolvedValue(undefined),
      close: vi.fn(),
    };

    mockEmbeddings = {
      dispose: vi.fn().mockResolvedValue(undefined),
    };

    mockServices = {
      pythonBridge: mockPythonBridge as unknown as PythonBridge,
      lance: mockLance as unknown as LanceStore,
      embeddings: mockEmbeddings as unknown as EmbeddingEngine,
    } as unknown as ServiceContainer;
  });

  it('stops the python bridge', async () => {
    await destroyServices(mockServices);

    expect(mockPythonBridge.stop).toHaveBeenCalledTimes(1);
  });

  it('throws on stop errors', async () => {
    mockPythonBridge.stop.mockRejectedValue(new Error('stop failed'));

    await expect(destroyServices(mockServices)).rejects.toThrow(
      'Service shutdown failed: stop failed'
    );
  });

  it('is idempotent - multiple calls work correctly', async () => {
    await destroyServices(mockServices);
    await destroyServices(mockServices);

    expect(mockPythonBridge.stop).toHaveBeenCalledTimes(2);
  });

  it('calls closeAsync on LanceStore for native cleanup', async () => {
    await destroyServices(mockServices);

    expect(mockLance.closeAsync).toHaveBeenCalledTimes(1);
    // Should use async version, not sync
    expect(mockLance.close).not.toHaveBeenCalled();
  });

  it('throws on LanceStore closeAsync errors', async () => {
    mockLance.closeAsync.mockRejectedValue(new Error('closeAsync failed'));

    await expect(destroyServices(mockServices)).rejects.toThrow(
      'Service shutdown failed: closeAsync failed'
    );
  });

  it('attempts all cleanup even if first fails, then throws aggregate', async () => {
    mockLance.closeAsync.mockRejectedValue(new Error('lance failed'));
    mockPythonBridge.stop.mockRejectedValue(new Error('bridge failed'));

    await expect(destroyServices(mockServices)).rejects.toThrow();

    // Both should have been called even though first failed
    expect(mockLance.closeAsync).toHaveBeenCalledTimes(1);
    expect(mockPythonBridge.stop).toHaveBeenCalledTimes(1);
  });

  it('waits for LanceStore async cleanup before returning', async () => {
    let closeCompleted = false;
    mockLance.closeAsync.mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
      closeCompleted = true;
    });

    await destroyServices(mockServices);

    // Should have waited for closeAsync to complete
    expect(closeCompleted).toBe(true);
  });

  it('calls dispose on EmbeddingEngine to free ONNX runtime resources', async () => {
    await destroyServices(mockServices);

    expect(mockEmbeddings.dispose).toHaveBeenCalledTimes(1);
  });

  it('throws on EmbeddingEngine dispose errors', async () => {
    mockEmbeddings.dispose.mockRejectedValue(new Error('dispose failed'));

    await expect(destroyServices(mockServices)).rejects.toThrow(
      'Service shutdown failed: dispose failed'
    );
  });

  it('stops PythonBridge BEFORE closing LanceStore (fork-safety)', async () => {
    // This test verifies the fix for lancedb fork-safety during shutdown.
    // PythonBridge.stop() sends SIGTERM to subprocess - must happen before
    // LanceStore.closeAsync() to avoid mutex corruption.
    const callOrder: string[] = [];

    mockPythonBridge.stop.mockImplementation(async () => {
      callOrder.push('PythonBridge.stop');
    });

    mockLance.closeAsync.mockImplementation(async () => {
      callOrder.push('LanceStore.closeAsync');
    });

    await destroyServices(mockServices);

    const pythonStopIndex = callOrder.indexOf('PythonBridge.stop');
    const lanceCloseIndex = callOrder.indexOf('LanceStore.closeAsync');

    expect(pythonStopIndex).toBeGreaterThanOrEqual(0);
    expect(lanceCloseIndex).toBeGreaterThanOrEqual(0);
    expect(pythonStopIndex).toBeLessThan(lanceCloseIndex);
  });
});

describe('createServices', () => {
  let callOrder: string[];

  beforeEach(async () => {
    vi.clearAllMocks();
    callOrder = [];

    // Import mocked modules
    const { PythonBridge } = await import('../crawl/bridge.js');
    const { LanceStore } = await import('../db/lance.js');
    const { EmbeddingEngine } = await import('../db/embeddings.js');
    const { ConfigService } = await import('./config.service.js');
    const { StoreService } = await import('./store.service.js');
    const { CodeGraphService } = await import('./code-graph.service.js');
    const { SearchService } = await import('./search.service.js');
    const { IndexService } = await import('./index.service.js');

    // Track call order for fork-safety verification
    vi.mocked(PythonBridge).mockImplementation(function () {
      return {
        start: vi.fn().mockImplementation(async () => {
          callOrder.push('PythonBridge.start');
        }),
        stop: vi.fn().mockResolvedValue(undefined),
      } as unknown as PythonBridge;
    });

    vi.mocked(LanceStore).mockImplementation(function () {
      callOrder.push('LanceStore.constructor');
      return {
        closeAsync: vi.fn().mockResolvedValue(undefined),
        close: vi.fn(),
      } as unknown as LanceStore;
    });

    vi.mocked(EmbeddingEngine).mockImplementation(function () {
      return {
        initialize: vi.fn().mockResolvedValue(undefined),
        dispose: vi.fn().mockResolvedValue(undefined),
      } as unknown as EmbeddingEngine;
    });

    vi.mocked(ConfigService).mockImplementation(function () {
      return {
        load: vi.fn().mockResolvedValue({
          embedding: { model: 'test', dimensions: 384 },
          indexing: { concurrency: 4, chunkSize: 1000, chunkOverlap: 150, ignorePatterns: [] },
        }),
        resolveDataDir: vi.fn().mockReturnValue('/tmp/test-data'),
      };
    });

    vi.mocked(StoreService).mockImplementation(function () {
      return {
        initialize: vi.fn().mockResolvedValue(undefined),
      };
    });

    vi.mocked(CodeGraphService).mockImplementation(function () {
      return {};
    });

    vi.mocked(SearchService).mockImplementation(function () {
      return {};
    });

    vi.mocked(IndexService).mockImplementation(function () {
      return {};
    });
  });

  afterEach(async () => {
    vi.clearAllMocks();
  });

  it('starts PythonBridge BEFORE creating LanceStore (fork-safety)', async () => {
    // This test verifies the fix for lancedb fork-safety issue.
    // LanceDB's native Rust code is not fork-safe. If we spawn subprocesses
    // after lancedb is loaded, the mutex state gets corrupted.
    const services = await createServices();

    // Verify PythonBridge.start() was called before LanceStore constructor
    const pythonStartIndex = callOrder.indexOf('PythonBridge.start');
    const lanceConstructorIndex = callOrder.indexOf('LanceStore.constructor');

    expect(pythonStartIndex).toBeGreaterThanOrEqual(0);
    expect(lanceConstructorIndex).toBeGreaterThanOrEqual(0);
    expect(pythonStartIndex).toBeLessThan(lanceConstructorIndex);

    // Cleanup
    await destroyServices(services);
  });

  it('creates StoreDefinitionService when projectRoot is provided', async () => {
    const { StoreDefinitionService } = await import('./store-definition.service.js');

    vi.mocked(StoreDefinitionService).mockImplementation(function () {
      return {} as unknown as StoreDefinitionService;
    });

    const services = await createServices(undefined, undefined, '/test/project');

    expect(StoreDefinitionService).toHaveBeenCalledWith('/test/project');

    await destroyServices(services);
  });

  it('creates GitignoreService when projectRoot is provided', async () => {
    const { GitignoreService } = await import('./gitignore.service.js');

    vi.mocked(GitignoreService).mockImplementation(function () {
      return {} as unknown as GitignoreService;
    });

    const services = await createServices(undefined, undefined, '/test/project');

    expect(GitignoreService).toHaveBeenCalledWith('/test/project');

    await destroyServices(services);
  });

  it('passes StoreDefinitionService and GitignoreService to StoreService', async () => {
    const { StoreService } = await import('./store.service.js');
    const { StoreDefinitionService } = await import('./store-definition.service.js');
    const { GitignoreService } = await import('./gitignore.service.js');

    const mockDefinitionService = { mock: 'definitionService' };
    const mockGitignoreService = { mock: 'gitignoreService' };

    vi.mocked(StoreDefinitionService).mockImplementation(function () {
      return mockDefinitionService as unknown as StoreDefinitionService;
    });

    vi.mocked(GitignoreService).mockImplementation(function () {
      return mockGitignoreService as unknown as GitignoreService;
    });

    const services = await createServices(undefined, undefined, '/test/project');

    expect(StoreService).toHaveBeenCalledWith('/tmp/test-data', {
      definitionService: mockDefinitionService,
      gitignoreService: mockGitignoreService,
    });

    await destroyServices(services);
  });

  it('does not create StoreDefinitionService when projectRoot is undefined', async () => {
    const { StoreDefinitionService } = await import('./store-definition.service.js');

    vi.mocked(StoreDefinitionService).mockClear();

    const services = await createServices();

    expect(StoreDefinitionService).not.toHaveBeenCalled();

    await destroyServices(services);
  });
});

describe('createLazyServices', () => {
  beforeEach(async () => {
    vi.clearAllMocks();

    const { PythonBridge } = await import('../crawl/bridge.js');
    const { LanceStore } = await import('../db/lance.js');
    const { ConfigService } = await import('./config.service.js');
    const { StoreService } = await import('./store.service.js');

    vi.mocked(PythonBridge).mockImplementation(function () {
      return {
        start: vi.fn().mockResolvedValue(undefined),
        stop: vi.fn().mockResolvedValue(undefined),
      } as unknown as PythonBridge;
    });

    vi.mocked(LanceStore).mockImplementation(function () {
      return {
        closeAsync: vi.fn().mockResolvedValue(undefined),
        close: vi.fn(),
      } as unknown as LanceStore;
    });

    vi.mocked(ConfigService).mockImplementation(function () {
      return {
        load: vi.fn().mockResolvedValue({
          embedding: { model: 'test', dimensions: 384 },
          indexing: { concurrency: 4, chunkSize: 1000, chunkOverlap: 150, ignorePatterns: [] },
        }),
        resolveDataDir: vi.fn().mockReturnValue('/tmp/test-data'),
      };
    });

    vi.mocked(StoreService).mockImplementation(function () {
      return {
        initialize: vi.fn().mockResolvedValue(undefined),
      };
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('creates StoreDefinitionService when projectRoot is provided', async () => {
    const { StoreDefinitionService } = await import('./store-definition.service.js');

    vi.mocked(StoreDefinitionService).mockImplementation(function () {
      return {} as unknown as StoreDefinitionService;
    });

    const services = await createLazyServices(undefined, undefined, '/test/project');

    expect(StoreDefinitionService).toHaveBeenCalledWith('/test/project');

    await destroyServices(services);
  });

  it('creates GitignoreService when projectRoot is provided', async () => {
    const { GitignoreService } = await import('./gitignore.service.js');

    vi.mocked(GitignoreService).mockImplementation(function () {
      return {} as unknown as GitignoreService;
    });

    const services = await createLazyServices(undefined, undefined, '/test/project');

    expect(GitignoreService).toHaveBeenCalledWith('/test/project');

    await destroyServices(services);
  });

  it('passes StoreDefinitionService and GitignoreService to StoreService', async () => {
    const { StoreService } = await import('./store.service.js');
    const { StoreDefinitionService } = await import('./store-definition.service.js');
    const { GitignoreService } = await import('./gitignore.service.js');

    const mockDefinitionService = { mock: 'definitionService' };
    const mockGitignoreService = { mock: 'gitignoreService' };

    vi.mocked(StoreDefinitionService).mockImplementation(function () {
      return mockDefinitionService as unknown as StoreDefinitionService;
    });

    vi.mocked(GitignoreService).mockImplementation(function () {
      return mockGitignoreService as unknown as GitignoreService;
    });

    const services = await createLazyServices(undefined, undefined, '/test/project');

    expect(StoreService).toHaveBeenCalledWith('/tmp/test-data', {
      definitionService: mockDefinitionService,
      gitignoreService: mockGitignoreService,
    });

    await destroyServices(services);
  });

  it('does not create StoreDefinitionService when projectRoot is undefined', async () => {
    const { StoreDefinitionService } = await import('./store-definition.service.js');

    vi.mocked(StoreDefinitionService).mockClear();

    const services = await createLazyServices();

    expect(StoreDefinitionService).not.toHaveBeenCalled();

    await destroyServices(services);
  });
});
