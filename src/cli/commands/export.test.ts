import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createExportCommand } from './export.js';
import type { GlobalOptions } from '../program.js';
import type { ServiceContainer } from '../../services/index.js';
import type { Store } from '../../types/store.js';

// Mock dependencies
vi.mock('../../services/index.js', () => ({
  createServices: vi.fn()
}));

vi.mock('node:fs/promises', () => ({
  writeFile: vi.fn()
}));

describe('createExportCommand - Execution Tests', () => {
  let mockServices: ServiceContainer;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let processExitSpy: ReturnType<typeof vi.spyOn>;
  let getOptions: () => GlobalOptions;

  beforeEach(async () => {
    const { createServices } = await import('../../services/index.js');
    const { writeFile } = await import('node:fs/promises');

    mockServices = {
      store: {
        getByIdOrName: vi.fn(),
        list: vi.fn(),
        create: vi.fn(),
        delete: vi.fn()
      },
      lance: {
        initialize: vi.fn(),
        search: vi.fn(),
        addDocuments: vi.fn()
      },
      search: {
        search: vi.fn()
      },
      index: {
        indexStore: vi.fn()
      },
      embeddings: {
        embed: vi.fn()
      }
    } as unknown as ServiceContainer;

    vi.mocked(createServices).mockResolvedValue(mockServices);
    vi.mocked(writeFile).mockResolvedValue(undefined);

    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`process.exit(${code})`);
    });

    getOptions = (): GlobalOptions => ({
      config: undefined,
      dataDir: '/tmp/test-data',
      quiet: false,
      format: undefined
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('successful export', () => {
    it('exports store to JSON file with all documents', async () => {
      const { writeFile } = await import('node:fs/promises');
      const mockStore: Store = {
        id: 'store-123',
        name: 'test-store',
        type: 'file',
        path: '/test/path',
        description: 'Test store',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      };

      const mockDocs = [
        { id: 'doc-1', content: 'content 1', metadata: { storeId: 'store-123' } },
        { id: 'doc-2', content: 'content 2', metadata: { storeId: 'store-123' } },
        { id: 'doc-3', content: 'content 3', metadata: { storeId: 'store-123' } }
      ];

      vi.mocked(mockServices.store.getByIdOrName).mockResolvedValue(mockStore);
      vi.mocked(mockServices.lance.search).mockResolvedValue(mockDocs);

      const command = createExportCommand(getOptions);
      const actionHandler = (command as any)._actionHandler;
      await actionHandler(['test-store', '/tmp/export.json']);

      expect(mockServices.store.getByIdOrName).toHaveBeenCalledWith('test-store');
      expect(mockServices.lance.initialize).toHaveBeenCalledWith('store-123');
      expect(mockServices.lance.search).toHaveBeenCalledWith(
        'store-123',
        expect.any(Array),
        10000
      );

      expect(writeFile).toHaveBeenCalledWith(
        '/tmp/export.json',
        expect.stringContaining('"version": 1')
      );

      const writeCall = vi.mocked(writeFile).mock.calls[0];
      const exportData = JSON.parse(writeCall?.[1] as string);
      expect(exportData.version).toBe(1);
      expect(exportData.store).toEqual({
        ...mockStore,
        createdAt: mockStore.createdAt.toISOString(),
        updatedAt: mockStore.updatedAt.toISOString()
      });
      expect(exportData.documents).toEqual(mockDocs);
      expect(exportData.exportedAt).toBeDefined();
    });

    it('outputs success message in normal mode', async () => {
      const mockStore: Store = {
        id: 'store-123',
        name: 'my-store',
        type: 'file',
        path: '/test',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      vi.mocked(mockServices.store.getByIdOrName).mockResolvedValue(mockStore);
      vi.mocked(mockServices.lance.search).mockResolvedValue([
        { id: 'doc-1', content: 'test', metadata: {} },
        { id: 'doc-2', content: 'test2', metadata: {} }
      ]);

      const command = createExportCommand(getOptions);
      const actionHandler = (command as any)._actionHandler;
      await actionHandler(['my-store', '/tmp/out.json']);

      expect(consoleLogSpy).toHaveBeenCalledWith('Exported 2 documents to /tmp/out.json');
    });

    it('outputs JSON format when format=json', async () => {
      getOptions = (): GlobalOptions => ({
        config: undefined,
        dataDir: '/tmp/test-data',
        quiet: false,
        format: 'json'
      });

      const mockStore: Store = {
        id: 'store-123',
        name: 'my-store',
        type: 'file',
        path: '/test',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      vi.mocked(mockServices.store.getByIdOrName).mockResolvedValue(mockStore);
      vi.mocked(mockServices.lance.search).mockResolvedValue([
        { id: 'doc-1', content: 'test', metadata: {} }
      ]);

      const command = createExportCommand(getOptions);
      const actionHandler = (command as any)._actionHandler;
      await actionHandler(['my-store', '/tmp/out.json']);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('"success": true')
      );

      const jsonOutput = JSON.parse(consoleLogSpy.mock.calls[0]?.[0] as string);
      expect(jsonOutput.success).toBe(true);
      expect(jsonOutput.store).toBe('my-store');
      expect(jsonOutput.documentsExported).toBe(1);
      expect(jsonOutput.outputPath).toBe('/tmp/out.json');
    });

    it('suppresses output in quiet mode', async () => {
      getOptions = (): GlobalOptions => ({
        config: undefined,
        dataDir: '/tmp/test-data',
        quiet: true,
        format: undefined
      });

      const mockStore: Store = {
        id: 'store-123',
        name: 'my-store',
        type: 'file',
        path: '/test',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      vi.mocked(mockServices.store.getByIdOrName).mockResolvedValue(mockStore);
      vi.mocked(mockServices.lance.search).mockResolvedValue([]);

      const command = createExportCommand(getOptions);
      const actionHandler = (command as any)._actionHandler;
      await actionHandler(['my-store', '/tmp/out.json']);

      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('exports store with zero documents', async () => {
      const mockStore: Store = {
        id: 'store-123',
        name: 'empty-store',
        type: 'file',
        path: '/test',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      vi.mocked(mockServices.store.getByIdOrName).mockResolvedValue(mockStore);
      vi.mocked(mockServices.lance.search).mockResolvedValue([]);

      const command = createExportCommand(getOptions);
      const actionHandler = (command as any)._actionHandler;
      await actionHandler(['empty-store', '/tmp/empty.json']);

      expect(consoleLogSpy).toHaveBeenCalledWith('Exported 0 documents to /tmp/empty.json');
    });

    it('exports using store ID instead of name', async () => {
      const mockStore: Store = {
        id: 'abc-def-123',
        name: 'my-store',
        type: 'repo',
        url: 'https://github.com/test/repo',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      vi.mocked(mockServices.store.getByIdOrName).mockResolvedValue(mockStore);
      vi.mocked(mockServices.lance.search).mockResolvedValue([]);

      const command = createExportCommand(getOptions);
      const actionHandler = (command as any)._actionHandler;
      await actionHandler(['abc-def-123', '/tmp/export.json']);

      expect(mockServices.store.getByIdOrName).toHaveBeenCalledWith('abc-def-123');
    });
  });

  describe('error handling', () => {
    it('exits with code 3 when store not found', async () => {
      vi.mocked(mockServices.store.getByIdOrName).mockResolvedValue(undefined);

      const command = createExportCommand(getOptions);
      const actionHandler = (command as any)._actionHandler;

      await expect(
        actionHandler(['nonexistent-store', '/tmp/out.json'])
      ).rejects.toThrow('process.exit(3)');

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error: Store not found: nonexistent-store');
    });

    it('shows error when store lookup by ID fails', async () => {
      vi.mocked(mockServices.store.getByIdOrName).mockResolvedValue(undefined);

      const command = createExportCommand(getOptions);
      const actionHandler = (command as any)._actionHandler;

      await expect(
        actionHandler(['invalid-id-123', '/tmp/out.json'])
      ).rejects.toThrow('process.exit(3)');

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error: Store not found: invalid-id-123');
    });

    it('handles file write errors gracefully', async () => {
      const { writeFile } = await import('node:fs/promises');
      const mockStore: Store = {
        id: 'store-123',
        name: 'test-store',
        type: 'file',
        path: '/test',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      vi.mocked(mockServices.store.getByIdOrName).mockResolvedValue(mockStore);
      vi.mocked(mockServices.lance.search).mockResolvedValue([]);
      vi.mocked(writeFile).mockRejectedValue(new Error('EACCES: permission denied'));

      const command = createExportCommand(getOptions);
      const actionHandler = (command as any)._actionHandler;

      await expect(
        actionHandler(['test-store', '/tmp/out.json'])
      ).rejects.toThrow('permission denied');
    });

    it('handles lance initialization errors', async () => {
      const mockStore: Store = {
        id: 'store-123',
        name: 'test-store',
        type: 'file',
        path: '/test',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      vi.mocked(mockServices.store.getByIdOrName).mockResolvedValue(mockStore);
      vi.mocked(mockServices.lance.initialize).mockRejectedValue(new Error('Lance init failed'));

      const command = createExportCommand(getOptions);
      const actionHandler = (command as any)._actionHandler;

      await expect(
        actionHandler(['test-store', '/tmp/out.json'])
      ).rejects.toThrow('Lance init failed');
    });

    it('handles search errors gracefully', async () => {
      const mockStore: Store = {
        id: 'store-123',
        name: 'test-store',
        type: 'file',
        path: '/test',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      vi.mocked(mockServices.store.getByIdOrName).mockResolvedValue(mockStore);
      vi.mocked(mockServices.lance.search).mockRejectedValue(new Error('Search failed'));

      const command = createExportCommand(getOptions);
      const actionHandler = (command as any)._actionHandler;

      await expect(
        actionHandler(['test-store', '/tmp/out.json'])
      ).rejects.toThrow('Search failed');
    });
  });

  describe('service interactions', () => {
    it('creates services with correct config and dataDir', async () => {
      const { createServices } = await import('../../services/index.js');
      getOptions = (): GlobalOptions => ({
        config: '/custom/config.json',
        dataDir: '/custom/data',
        quiet: false,
        format: undefined
      });

      const mockStore: Store = {
        id: 'store-123',
        name: 'test',
        type: 'file',
        path: '/test',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      vi.mocked(mockServices.store.getByIdOrName).mockResolvedValue(mockStore);
      vi.mocked(mockServices.lance.search).mockResolvedValue([]);

      const command = createExportCommand(getOptions);
      const actionHandler = (command as any)._actionHandler;
      await actionHandler(['test', '/tmp/out.json']);

      expect(createServices).toHaveBeenCalledWith('/custom/config.json', '/custom/data');
    });

    it('searches with correct vector dimension (384)', async () => {
      const mockStore: Store = {
        id: 'store-123',
        name: 'test',
        type: 'file',
        path: '/test',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      vi.mocked(mockServices.store.getByIdOrName).mockResolvedValue(mockStore);
      vi.mocked(mockServices.lance.search).mockResolvedValue([]);

      const command = createExportCommand(getOptions);
      const actionHandler = (command as any)._actionHandler;
      await actionHandler(['test', '/tmp/out.json']);

      const searchCall = vi.mocked(mockServices.lance.search).mock.calls[0];
      const vector = searchCall?.[1] as number[];
      expect(vector).toHaveLength(384);
      expect(vector.every(v => v === 0)).toBe(true);
    });

    it('searches with limit of 10000 to get all documents', async () => {
      const mockStore: Store = {
        id: 'store-123',
        name: 'test',
        type: 'file',
        path: '/test',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      vi.mocked(mockServices.store.getByIdOrName).mockResolvedValue(mockStore);
      vi.mocked(mockServices.lance.search).mockResolvedValue([]);

      const command = createExportCommand(getOptions);
      const actionHandler = (command as any)._actionHandler;
      await actionHandler(['test', '/tmp/out.json']);

      expect(mockServices.lance.search).toHaveBeenCalledWith('store-123', expect.any(Array), 10000);
    });

    it('calls services in correct order', async () => {
      const callOrder: string[] = [];
      const mockStore: Store = {
        id: 'store-123',
        name: 'test',
        type: 'file',
        path: '/test',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      vi.mocked(mockServices.store.getByIdOrName).mockImplementation(async () => {
        callOrder.push('getByIdOrName');
        return mockStore;
      });
      vi.mocked(mockServices.lance.initialize).mockImplementation(async () => {
        callOrder.push('initialize');
      });
      vi.mocked(mockServices.lance.search).mockImplementation(async () => {
        callOrder.push('search');
        return [];
      });

      const command = createExportCommand(getOptions);
      const actionHandler = (command as any)._actionHandler;
      await actionHandler(['test', '/tmp/out.json']);

      expect(callOrder).toEqual(['getByIdOrName', 'initialize', 'search']);
    });
  });
});
