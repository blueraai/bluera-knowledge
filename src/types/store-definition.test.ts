import { describe, it, expect } from 'vitest';
import {
  FileStoreDefinitionSchema,
  RepoStoreDefinitionSchema,
  WebStoreDefinitionSchema,
  StoreDefinitionSchema,
  StoreDefinitionsConfigSchema,
  isFileStoreDefinition,
  isRepoStoreDefinition,
  isWebStoreDefinition,
} from './store-definition.js';

describe('Store Definition Types', () => {
  describe('FileStoreDefinitionSchema', () => {
    it('validates a valid file store definition', () => {
      const valid = {
        type: 'file',
        name: 'my-docs',
        path: './docs',
      };
      const result = FileStoreDefinitionSchema.safeParse(valid);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe('file');
        expect(result.data.name).toBe('my-docs');
        expect(result.data.path).toBe('./docs');
      }
    });

    it('validates file store with optional fields', () => {
      const valid = {
        type: 'file',
        name: 'my-docs',
        path: './docs',
        description: 'Local documentation',
        tags: ['docs', 'reference'],
      };
      const result = FileStoreDefinitionSchema.safeParse(valid);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBe('Local documentation');
        expect(result.data.tags).toEqual(['docs', 'reference']);
      }
    });

    it('accepts absolute paths', () => {
      const valid = {
        type: 'file',
        name: 'absolute-docs',
        path: '/home/user/docs',
      };
      const result = FileStoreDefinitionSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('rejects missing name', () => {
      const invalid = {
        type: 'file',
        path: './docs',
      };
      const result = FileStoreDefinitionSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('rejects missing path', () => {
      const invalid = {
        type: 'file',
        name: 'my-docs',
      };
      const result = FileStoreDefinitionSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('rejects empty name', () => {
      const invalid = {
        type: 'file',
        name: '',
        path: './docs',
      };
      const result = FileStoreDefinitionSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('rejects empty path', () => {
      const invalid = {
        type: 'file',
        name: 'my-docs',
        path: '',
      };
      const result = FileStoreDefinitionSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('RepoStoreDefinitionSchema', () => {
    it('validates a valid repo store definition', () => {
      const valid = {
        type: 'repo',
        name: 'react',
        url: 'https://github.com/facebook/react',
      };
      const result = RepoStoreDefinitionSchema.safeParse(valid);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe('repo');
        expect(result.data.name).toBe('react');
        expect(result.data.url).toBe('https://github.com/facebook/react');
      }
    });

    it('validates repo store with optional branch', () => {
      const valid = {
        type: 'repo',
        name: 'react',
        url: 'https://github.com/facebook/react',
        branch: 'main',
      };
      const result = RepoStoreDefinitionSchema.safeParse(valid);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.branch).toBe('main');
      }
    });

    it('validates repo store with optional depth', () => {
      const valid = {
        type: 'repo',
        name: 'react',
        url: 'https://github.com/facebook/react',
        depth: 1,
      };
      const result = RepoStoreDefinitionSchema.safeParse(valid);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.depth).toBe(1);
      }
    });

    it('validates repo store with all optional fields', () => {
      const valid = {
        type: 'repo',
        name: 'react',
        url: 'https://github.com/facebook/react',
        branch: 'develop',
        depth: 2,
        description: 'React library source',
        tags: ['frontend', 'ui'],
      };
      const result = RepoStoreDefinitionSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('rejects invalid URL', () => {
      const invalid = {
        type: 'repo',
        name: 'react',
        url: 'not-a-valid-url',
      };
      const result = RepoStoreDefinitionSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('rejects missing URL', () => {
      const invalid = {
        type: 'repo',
        name: 'react',
      };
      const result = RepoStoreDefinitionSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('rejects negative depth', () => {
      const invalid = {
        type: 'repo',
        name: 'react',
        url: 'https://github.com/facebook/react',
        depth: -1,
      };
      const result = RepoStoreDefinitionSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('rejects zero depth', () => {
      const invalid = {
        type: 'repo',
        name: 'react',
        url: 'https://github.com/facebook/react',
        depth: 0,
      };
      const result = RepoStoreDefinitionSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('WebStoreDefinitionSchema', () => {
    it('validates a valid web store definition with default depth', () => {
      const valid = {
        type: 'web',
        name: 'docs',
        url: 'https://example.com/docs',
      };
      const result = WebStoreDefinitionSchema.safeParse(valid);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe('web');
        expect(result.data.name).toBe('docs');
        expect(result.data.url).toBe('https://example.com/docs');
        expect(result.data.depth).toBe(1); // default
      }
    });

    it('validates web store with custom depth', () => {
      const valid = {
        type: 'web',
        name: 'docs',
        url: 'https://example.com/docs',
        depth: 3,
      };
      const result = WebStoreDefinitionSchema.safeParse(valid);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.depth).toBe(3);
      }
    });

    it('validates web store with maxPages', () => {
      const valid = {
        type: 'web',
        name: 'docs',
        url: 'https://example.com/docs',
        maxPages: 100,
      };
      const result = WebStoreDefinitionSchema.safeParse(valid);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.maxPages).toBe(100);
      }
    });

    it('validates web store with crawl instructions', () => {
      const valid = {
        type: 'web',
        name: 'docs',
        url: 'https://example.com/docs',
        crawlInstructions: 'Focus on API reference pages',
      };
      const result = WebStoreDefinitionSchema.safeParse(valid);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.crawlInstructions).toBe('Focus on API reference pages');
      }
    });

    it('validates web store with extract instructions', () => {
      const valid = {
        type: 'web',
        name: 'docs',
        url: 'https://example.com/docs',
        extractInstructions: 'Extract code examples and signatures',
      };
      const result = WebStoreDefinitionSchema.safeParse(valid);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.extractInstructions).toBe('Extract code examples and signatures');
      }
    });

    it('validates web store with all optional fields', () => {
      const valid = {
        type: 'web',
        name: 'typescript-docs',
        url: 'https://www.typescriptlang.org/docs/',
        depth: 2,
        maxPages: 100,
        crawlInstructions: 'Focus on handbook pages',
        extractInstructions: 'Extract code examples',
        description: 'TypeScript documentation',
        tags: ['docs', 'typescript'],
      };
      const result = WebStoreDefinitionSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('allows depth of 0 for single page', () => {
      const valid = {
        type: 'web',
        name: 'single-page',
        url: 'https://example.com/page',
        depth: 0,
      };
      const result = WebStoreDefinitionSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('rejects invalid URL', () => {
      const invalid = {
        type: 'web',
        name: 'docs',
        url: 'not-a-valid-url',
      };
      const result = WebStoreDefinitionSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('rejects negative depth', () => {
      const invalid = {
        type: 'web',
        name: 'docs',
        url: 'https://example.com/docs',
        depth: -1,
      };
      const result = WebStoreDefinitionSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('rejects negative maxPages', () => {
      const invalid = {
        type: 'web',
        name: 'docs',
        url: 'https://example.com/docs',
        maxPages: -1,
      };
      const result = WebStoreDefinitionSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('rejects zero maxPages', () => {
      const invalid = {
        type: 'web',
        name: 'docs',
        url: 'https://example.com/docs',
        maxPages: 0,
      };
      const result = WebStoreDefinitionSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('StoreDefinitionSchema (discriminated union)', () => {
    it('parses file store definition', () => {
      const def = { type: 'file', name: 'docs', path: './docs' };
      const result = StoreDefinitionSchema.safeParse(def);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe('file');
      }
    });

    it('parses repo store definition', () => {
      const def = { type: 'repo', name: 'lib', url: 'https://github.com/org/lib' };
      const result = StoreDefinitionSchema.safeParse(def);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe('repo');
      }
    });

    it('parses web store definition', () => {
      const def = { type: 'web', name: 'docs', url: 'https://docs.example.com' };
      const result = StoreDefinitionSchema.safeParse(def);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe('web');
      }
    });

    it('rejects unknown type', () => {
      const def = { type: 'unknown', name: 'test' };
      const result = StoreDefinitionSchema.safeParse(def);
      expect(result.success).toBe(false);
    });

    it('rejects missing type', () => {
      const def = { name: 'test', path: './test' };
      const result = StoreDefinitionSchema.safeParse(def);
      expect(result.success).toBe(false);
    });
  });

  describe('StoreDefinitionsConfigSchema', () => {
    it('validates empty config', () => {
      const config = { version: 1, stores: [] };
      const result = StoreDefinitionsConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it('validates config with multiple stores', () => {
      const config = {
        version: 1,
        stores: [
          { type: 'file', name: 'docs', path: './docs' },
          { type: 'repo', name: 'react', url: 'https://github.com/facebook/react' },
          { type: 'web', name: 'api-docs', url: 'https://api.example.com/docs' },
        ],
      };
      const result = StoreDefinitionsConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.stores).toHaveLength(3);
      }
    });

    it('rejects missing version', () => {
      const config = { stores: [] };
      const result = StoreDefinitionsConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
    });

    it('rejects wrong version', () => {
      const config = { version: 2, stores: [] };
      const result = StoreDefinitionsConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
    });

    it('rejects missing stores array', () => {
      const config = { version: 1 };
      const result = StoreDefinitionsConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
    });

    it('rejects invalid store in array', () => {
      const config = {
        version: 1,
        stores: [
          { type: 'file', name: 'docs', path: './docs' },
          { type: 'invalid', name: 'bad' },
        ],
      };
      const result = StoreDefinitionsConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
    });
  });

  describe('Type guard functions', () => {
    describe('isFileStoreDefinition', () => {
      it('returns true for file store definition', () => {
        const def = StoreDefinitionSchema.parse({ type: 'file', name: 'docs', path: './docs' });
        expect(isFileStoreDefinition(def)).toBe(true);
      });

      it('returns false for repo store definition', () => {
        const def = StoreDefinitionSchema.parse({
          type: 'repo',
          name: 'lib',
          url: 'https://github.com/org/lib',
        });
        expect(isFileStoreDefinition(def)).toBe(false);
      });

      it('returns false for web store definition', () => {
        const def = StoreDefinitionSchema.parse({
          type: 'web',
          name: 'docs',
          url: 'https://docs.example.com',
        });
        expect(isFileStoreDefinition(def)).toBe(false);
      });
    });

    describe('isRepoStoreDefinition', () => {
      it('returns true for repo store definition', () => {
        const def = StoreDefinitionSchema.parse({
          type: 'repo',
          name: 'lib',
          url: 'https://github.com/org/lib',
        });
        expect(isRepoStoreDefinition(def)).toBe(true);
      });

      it('returns false for file store definition', () => {
        const def = StoreDefinitionSchema.parse({ type: 'file', name: 'docs', path: './docs' });
        expect(isRepoStoreDefinition(def)).toBe(false);
      });
    });

    describe('isWebStoreDefinition', () => {
      it('returns true for web store definition', () => {
        const def = StoreDefinitionSchema.parse({
          type: 'web',
          name: 'docs',
          url: 'https://docs.example.com',
        });
        expect(isWebStoreDefinition(def)).toBe(true);
      });

      it('returns false for file store definition', () => {
        const def = StoreDefinitionSchema.parse({ type: 'file', name: 'docs', path: './docs' });
        expect(isWebStoreDefinition(def)).toBe(false);
      });
    });
  });
});
