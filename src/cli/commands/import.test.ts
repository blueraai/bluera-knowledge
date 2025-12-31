import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createImportCommand } from './import.js';
import type { GlobalOptions } from '../program.js';
import type { ServiceContainer } from '../../services/index.js';
import type { Store } from '../../types/store.js';

// Mock dependencies
vi.mock('../../services/index.js', () => ({
  createServices: vi.fn()
}));

vi.mock('node:fs/promises', () => ({
  readFile: vi.fn()
}));

vi.mock('ora', () => ({
  default: vi.fn(() => ({
    start: vi.fn().mockReturnThis(),
    stop: vi.fn(),
    succeed: vi.fn(),
    fail: vi.fn(),
    text: ''
  }))
}));

describe('createImportCommand - Execution Tests', () => {
  let mockServices: ServiceContainer;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let processExitSpy: ReturnType<typeof vi.spyOn>;
  let getOptions: () => GlobalOptions;
  let mockIsTTY: boolean;

  beforeEach(async () => {
    const { createServices } = await import('../../services/index.js');
    const { readFile } = await import('node:fs/promises');

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
    vi.mocked(readFile).mockResolvedValue(JSON.stringify({
      store: {
        type: 'file',
        path: '/test/path',
        description: 'Test store'
      },
      documents: []
    }));

    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`process.exit(${code})`);
    });

    // Mock process.stdout.isTTY
    mockIsTTY = false;
    Object.defineProperty(process.stdout, 'isTTY', {
      value: mockIsTTY,
      writable: true,
      configurable: true
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

  describe('successful import', () => {
    it('imports documents from JSON file', async () => {
      const { readFile } = await import('node:fs/promises');
      const importData = {
        store: {
          type: 'file' as const,
          path: '/test/path',
          description: 'Test store'
        },
        documents: [
          { id: 'doc-1', content: 'content 1', metadata: { storeId: 'old-store' } },
          { id: 'doc-2', content: 'content 2', metadata: { storeId: 'old-store' } }
        ]
      };

      vi.mocked(readFile).mockResolvedValue(JSON.stringify(importData));
      vi.mocked(mockServices.store.create).mockResolvedValue({
        success: true,
        data: {
          id: 'new-store-123',
          name: 'imported-store',
          type: 'file',
          path: '/test/path',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      vi.mocked(mockServices.embeddings.embed).mockResolvedValue(new Array(384).fill(0.1));

      const command = createImportCommand(getOptions);
      const action = command._actionHandler;
      await action(['/tmp/import.json', 'imported-store']);

      expect(readFile).toHaveBeenCalledWith('/tmp/import.json', 'utf-8');
      expect(mockServices.store.create).toHaveBeenCalledWith({
        name: 'imported-store',
        type: 'file',
        path: '/test/path',
        url: undefined,
        description: 'Test store',
        tags: undefined,
        branch: undefined,
        depth: undefined
      });
      expect(mockServices.embeddings.embed).toHaveBeenCalledTimes(2);
      expect(mockServices.lance.addDocuments).toHaveBeenCalled();
    });

    it('re-embeds all documents with new embeddings', async () => {
      const { readFile } = await import('node:fs/promises');
      const importData = {
        store: { type: 'file' as const, path: '/test' },
        documents: [
          { id: 'doc-1', content: 'test content', metadata: {} }
        ]
      };

      vi.mocked(readFile).mockResolvedValue(JSON.stringify(importData));
      vi.mocked(mockServices.store.create).mockResolvedValue({
        success: true,
        data: {
          id: 'store-123',
          name: 'test',
          type: 'file',
          path: '/test',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      vi.mocked(mockServices.embeddings.embed).mockResolvedValue([0.1, 0.2, 0.3]);

      const command = createImportCommand(getOptions);
      const action = command._actionHandler;
      await action(['/tmp/import.json', 'test']);

      expect(mockServices.embeddings.embed).toHaveBeenCalledWith('test content');
      const addDocsCall = vi.mocked(mockServices.lance.addDocuments).mock.calls[0];
      const docs = addDocsCall?.[1] as Array<{ vector: number[] }>;
      expect(docs[0]?.vector).toEqual([0.1, 0.2, 0.3]);
    });

    it('updates document metadata with new store ID', async () => {
      const { readFile } = await import('node:fs/promises');
      const importData = {
        store: { type: 'file' as const, path: '/test' },
        documents: [
          { id: 'doc-1', content: 'test', metadata: { storeId: 'old-store-123', filePath: '/test.txt' } }
        ]
      };

      vi.mocked(readFile).mockResolvedValue(JSON.stringify(importData));
      vi.mocked(mockServices.store.create).mockResolvedValue({
        success: true,
        data: {
          id: 'new-store-456',
          name: 'test',
          type: 'file',
          path: '/test',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      vi.mocked(mockServices.embeddings.embed).mockResolvedValue([0.1]);

      const command = createImportCommand(getOptions);
      const action = command._actionHandler;
      await action(['/tmp/import.json', 'test']);

      const addDocsCall = vi.mocked(mockServices.lance.addDocuments).mock.calls[0];
      const docs = addDocsCall?.[1] as Array<{ metadata: { storeId: string; filePath: string } }>;
      expect(docs[0]?.metadata.storeId).toBe('new-store-456');
      expect(docs[0]?.metadata.filePath).toBe('/test.txt'); // Other metadata preserved
    });

    it('outputs success message in normal mode', async () => {
      const { readFile } = await import('node:fs/promises');
      const importData = {
        store: { type: 'file' as const, path: '/test' },
        documents: [
          { id: 'doc-1', content: 'test1', metadata: {} },
          { id: 'doc-2', content: 'test2', metadata: {} }
        ]
      };

      vi.mocked(readFile).mockResolvedValue(JSON.stringify(importData));
      vi.mocked(mockServices.store.create).mockResolvedValue({
        success: true,
        data: {
          id: 'store-123',
          name: 'my-store',
          type: 'file',
          path: '/test',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      vi.mocked(mockServices.embeddings.embed).mockResolvedValue([0.1]);

      const command = createImportCommand(getOptions);
      const action = command._actionHandler;
      await action(['/tmp/import.json', 'my-store']);

      expect(consoleLogSpy).toHaveBeenCalledWith('Imported 2 documents as "my-store"');
    });

    it('outputs JSON format when format=json', async () => {
      const { readFile } = await import('node:fs/promises');
      getOptions = (): GlobalOptions => ({
        config: undefined,
        dataDir: '/tmp/test-data',
        quiet: false,
        format: 'json'
      });

      const importData = {
        store: { type: 'file' as const, path: '/test' },
        documents: [{ id: 'doc-1', content: 'test', metadata: {} }]
      };

      vi.mocked(readFile).mockResolvedValue(JSON.stringify(importData));
      vi.mocked(mockServices.store.create).mockResolvedValue({
        success: true,
        data: {
          id: 'store-123',
          name: 'my-store',
          type: 'file',
          path: '/test',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      vi.mocked(mockServices.embeddings.embed).mockResolvedValue([0.1]);

      const command = createImportCommand(getOptions);
      const action = command._actionHandler;
      await action(['/tmp/import.json', 'my-store']);

      const jsonCall = consoleLogSpy.mock.calls.find(call =>
        typeof call[0] === 'string' && call[0].includes('"success"')
      );
      expect(jsonCall).toBeDefined();

      const jsonOutput = JSON.parse(jsonCall![0] as string);
      expect(jsonOutput.success).toBe(true);
      expect(jsonOutput.store).toBe('my-store');
      expect(jsonOutput.storeId).toBe('store-123');
      expect(jsonOutput.documentsImported).toBe(1);
    });

    it('uses spinner in interactive mode (TTY)', async () => {
      const ora = (await import('ora')).default;
      const { readFile } = await import('node:fs/promises');

      Object.defineProperty(process.stdout, 'isTTY', { value: true, configurable: true });

      const importData = {
        store: { type: 'file' as const, path: '/test' },
        documents: []
      };

      vi.mocked(readFile).mockResolvedValue(JSON.stringify(importData));
      vi.mocked(mockServices.store.create).mockResolvedValue({
        success: true,
        data: {
          id: 'store-123',
          name: 'test',
          type: 'file',
          path: '/test',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      const command = createImportCommand(getOptions);
      const action = command._actionHandler;
      await action(['/tmp/import.json', 'test']);

      expect(ora).toHaveBeenCalled();
    });

    it('handles empty document list', async () => {
      const { readFile } = await import('node:fs/promises');
      const importData = {
        store: { type: 'file' as const, path: '/test' },
        documents: []
      };

      vi.mocked(readFile).mockResolvedValue(JSON.stringify(importData));
      vi.mocked(mockServices.store.create).mockResolvedValue({
        success: true,
        data: {
          id: 'store-123',
          name: 'empty-store',
          type: 'file',
          path: '/test',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      const command = createImportCommand(getOptions);
      const action = command._actionHandler;
      await action(['/tmp/import.json', 'empty-store']);

      expect(mockServices.lance.addDocuments).not.toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith('Imported 0 documents as "empty-store"');
    });

    it('preserves store metadata from import file', async () => {
      const { readFile } = await import('node:fs/promises');
      const importData = {
        store: {
          type: 'repo' as const,
          url: 'https://github.com/test/repo',
          branch: 'main',
          depth: 1,
          description: 'Original description',
          tags: ['tag1', 'tag2']
        },
        documents: []
      };

      vi.mocked(readFile).mockResolvedValue(JSON.stringify(importData));
      vi.mocked(mockServices.store.create).mockResolvedValue({
        success: true,
        data: {
          id: 'store-123',
          name: 'test',
          type: 'repo',
          url: 'https://github.com/test/repo',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      const command = createImportCommand(getOptions);
      const action = command._actionHandler;
      await action(['/tmp/import.json', 'test']);

      expect(mockServices.store.create).toHaveBeenCalledWith({
        name: 'test',
        type: 'repo',
        path: undefined,
        url: 'https://github.com/test/repo',
        description: 'Original description',
        tags: ['tag1', 'tag2'],
        branch: 'main',
        depth: 1
      });
    });

    it('uses default description when not provided', async () => {
      const { readFile } = await import('node:fs/promises');
      const importData = {
        store: { type: 'file' as const, path: '/test' },
        documents: []
      };

      vi.mocked(readFile).mockResolvedValue(JSON.stringify(importData));
      vi.mocked(mockServices.store.create).mockResolvedValue({
        success: true,
        data: {
          id: 'store-123',
          name: 'test',
          type: 'file',
          path: '/test',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      const command = createImportCommand(getOptions);
      const action = command._actionHandler;
      await action(['/tmp/import.json', 'test']);

      expect(mockServices.store.create).toHaveBeenCalledWith(
        expect.objectContaining({
          description: 'Imported from /tmp/import.json'
        })
      );
    });
  });

  describe('error handling', () => {
    it('exits with code 1 when file not found', async () => {
      const { readFile } = await import('node:fs/promises');
      const error = new Error('ENOENT: no such file or directory');
      vi.mocked(readFile).mockRejectedValue(error);

      const command = createImportCommand(getOptions);
      const action = command._actionHandler;

      await expect(action(['/nonexistent/file.json', 'test'])).rejects.toThrow('process.exit(1)');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error: File not found: /nonexistent/file.json');
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('exits with code 1 on invalid JSON', async () => {
      const { readFile } = await import('node:fs/promises');
      vi.mocked(readFile).mockResolvedValue('invalid json {{{');

      const command = createImportCommand(getOptions);
      const action = command._actionHandler;

      await expect(action(['/tmp/bad.json', 'test'])).rejects.toThrow('process.exit(1)');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error: Invalid JSON format in import file');
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('exits with code 1 on missing store field', async () => {
      const { readFile } = await import('node:fs/promises');
      vi.mocked(readFile).mockResolvedValue(JSON.stringify({
        documents: []
      }));

      const command = createImportCommand(getOptions);
      const action = command._actionHandler;

      await expect(action(['/tmp/invalid.json', 'test'])).rejects.toThrow('process.exit(1)');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error: Invalid JSON format in import file');
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('exits with code 1 on missing documents field', async () => {
      const { readFile } = await import('node:fs/promises');
      vi.mocked(readFile).mockResolvedValue(JSON.stringify({
        store: { type: 'file', path: '/test' }
      }));

      const command = createImportCommand(getOptions);
      const action = command._actionHandler;

      await expect(action(['/tmp/invalid.json', 'test'])).rejects.toThrow('process.exit(1)');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error: Invalid JSON format in import file');
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('exits with code 1 when store creation fails', async () => {
      const { readFile } = await import('node:fs/promises');
      vi.mocked(readFile).mockResolvedValue(JSON.stringify({
        store: { type: 'file' as const, path: '/test' },
        documents: []
      }));
      vi.mocked(mockServices.store.create).mockResolvedValue({
        success: false,
        error: new Error('Store name already exists')
      });

      const command = createImportCommand(getOptions);
      const action = command._actionHandler;

      await expect(action(['/tmp/import.json', 'duplicate'])).rejects.toThrow('process.exit(1)');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error: Store name already exists');
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('exits with code 1 when embedding fails', async () => {
      const { readFile } = await import('node:fs/promises');
      vi.mocked(readFile).mockResolvedValue(JSON.stringify({
        store: { type: 'file' as const, path: '/test' },
        documents: [{ id: 'doc-1', content: 'test', metadata: {} }]
      }));
      vi.mocked(mockServices.store.create).mockResolvedValue({
        success: true,
        data: {
          id: 'store-123',
          name: 'test',
          type: 'file',
          path: '/test',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      vi.mocked(mockServices.embeddings.embed).mockRejectedValue(new Error('Embedding service unavailable'));

      const command = createImportCommand(getOptions);
      const action = command._actionHandler;

      await expect(action(['/tmp/import.json', 'test'])).rejects.toThrow('process.exit(1)');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error: Embedding service unavailable');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Note: Store was created but documents may not have been imported');
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('exits with code 1 when document addition fails', async () => {
      const { readFile } = await import('node:fs/promises');
      vi.mocked(readFile).mockResolvedValue(JSON.stringify({
        store: { type: 'file' as const, path: '/test' },
        documents: [{ id: 'doc-1', content: 'test', metadata: {} }]
      }));
      vi.mocked(mockServices.store.create).mockResolvedValue({
        success: true,
        data: {
          id: 'store-123',
          name: 'test',
          type: 'file',
          path: '/test',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      vi.mocked(mockServices.embeddings.embed).mockResolvedValue([0.1]);
      vi.mocked(mockServices.lance.addDocuments).mockRejectedValue(new Error('Database write error'));

      const command = createImportCommand(getOptions);
      const action = command._actionHandler;

      await expect(action(['/tmp/import.json', 'test'])).rejects.toThrow('process.exit(1)');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error: Database write error');
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('service interactions', () => {
    it('creates services with correct config and dataDir', async () => {
      const { createServices } = await import('../../services/index.js');
      const { readFile } = await import('node:fs/promises');
      getOptions = (): GlobalOptions => ({
        config: '/custom/config.json',
        dataDir: '/custom/data',
        quiet: false,
        format: undefined
      });

      vi.mocked(readFile).mockResolvedValue(JSON.stringify({
        store: { type: 'file' as const, path: '/test' },
        documents: []
      }));
      vi.mocked(mockServices.store.create).mockResolvedValue({
        success: true,
        data: {
          id: 'store-123',
          name: 'test',
          type: 'file',
          path: '/test',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      const command = createImportCommand(getOptions);
      const action = command._actionHandler;
      await action(['/tmp/import.json', 'test']);

      expect(createServices).toHaveBeenCalledWith('/custom/config.json', '/custom/data');
    });

    it('calls services in correct order', async () => {
      const { readFile } = await import('node:fs/promises');
      const callOrder: string[] = [];

      vi.mocked(readFile).mockImplementation(async () => {
        callOrder.push('readFile');
        return JSON.stringify({
          store: { type: 'file' as const, path: '/test' },
          documents: [{ id: 'doc-1', content: 'test', metadata: {} }]
        });
      });
      vi.mocked(mockServices.store.create).mockImplementation(async () => {
        callOrder.push('create');
        return {
          success: true,
          data: {
            id: 'store-123',
            name: 'test',
            type: 'file',
            path: '/test',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        };
      });
      vi.mocked(mockServices.lance.initialize).mockImplementation(async () => {
        callOrder.push('initialize');
      });
      vi.mocked(mockServices.embeddings.embed).mockImplementation(async () => {
        callOrder.push('embed');
        return [0.1];
      });
      vi.mocked(mockServices.lance.addDocuments).mockImplementation(async () => {
        callOrder.push('addDocuments');
      });

      const command = createImportCommand(getOptions);
      const action = command._actionHandler;
      await action(['/tmp/import.json', 'test']);

      expect(callOrder).toEqual(['readFile', 'create', 'initialize', 'embed', 'addDocuments']);
    });
  });
});
