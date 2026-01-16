import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { GitignoreService } from './gitignore.service.js';
import { rm, mkdtemp, writeFile, readFile, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

describe('GitignoreService', () => {
  let projectRoot: string;
  let service: GitignoreService;

  beforeEach(async () => {
    projectRoot = await mkdtemp(join(tmpdir(), 'gitignore-test-'));
    service = new GitignoreService(projectRoot);
  });

  afterEach(async () => {
    await rm(projectRoot, { recursive: true, force: true });
  });

  describe('hasRequiredPatterns', () => {
    it('returns false when .gitignore does not exist', async () => {
      const has = await service.hasRequiredPatterns();
      expect(has).toBe(false);
    });

    it('returns false when .gitignore exists but is empty', async () => {
      await writeFile(join(projectRoot, '.gitignore'), '');
      const has = await service.hasRequiredPatterns();
      expect(has).toBe(false);
    });

    it('returns false when .gitignore is missing bluera patterns', async () => {
      await writeFile(join(projectRoot, '.gitignore'), 'node_modules/\n*.log\n');
      const has = await service.hasRequiredPatterns();
      expect(has).toBe(false);
    });

    it('returns true when all required patterns are present', async () => {
      const content = `
node_modules/
.bluera/
!.bluera/
!.bluera/bluera-knowledge/
!.bluera/bluera-knowledge/stores.config.json
.bluera/bluera-knowledge/data/
`;
      await writeFile(join(projectRoot, '.gitignore'), content);
      const has = await service.hasRequiredPatterns();
      expect(has).toBe(true);
    });

    it('returns false when only some patterns are present', async () => {
      const content = `
.bluera/
`;
      await writeFile(join(projectRoot, '.gitignore'), content);
      const has = await service.hasRequiredPatterns();
      expect(has).toBe(false);
    });
  });

  describe('ensureGitignorePatterns', () => {
    it('creates .gitignore if it does not exist', async () => {
      const result = await service.ensureGitignorePatterns();

      expect(result.updated).toBe(true);
      expect(result.message).toContain('Created');

      // Verify file exists
      const gitignorePath = join(projectRoot, '.gitignore');
      await expect(access(gitignorePath)).resolves.toBeUndefined();
    });

    it('adds patterns to empty .gitignore', async () => {
      await writeFile(join(projectRoot, '.gitignore'), '');

      const result = await service.ensureGitignorePatterns();

      expect(result.updated).toBe(true);
      expect(result.message).toContain('Updated');

      const content = await readFile(join(projectRoot, '.gitignore'), 'utf-8');
      expect(content).toContain('.bluera/');
      expect(content).toContain('!.bluera/');
      expect(content).toContain('!.bluera/bluera-knowledge/');
      expect(content).toContain('!.bluera/bluera-knowledge/stores.config.json');
      expect(content).toContain('.bluera/bluera-knowledge/data/');
    });

    it('appends patterns to existing .gitignore', async () => {
      const existingContent = 'node_modules/\n*.log\n';
      await writeFile(join(projectRoot, '.gitignore'), existingContent);

      const result = await service.ensureGitignorePatterns();

      expect(result.updated).toBe(true);

      const content = await readFile(join(projectRoot, '.gitignore'), 'utf-8');
      // Should preserve existing content
      expect(content).toContain('node_modules/');
      expect(content).toContain('*.log');
      // Should add new patterns
      expect(content).toContain('.bluera/');
      expect(content).toContain('!.bluera/bluera-knowledge/');
    });

    it('skips if all patterns already present', async () => {
      const existingContent = `
node_modules/
.bluera/
!.bluera/
!.bluera/bluera-knowledge/
!.bluera/bluera-knowledge/stores.config.json
.bluera/bluera-knowledge/data/
`;
      await writeFile(join(projectRoot, '.gitignore'), existingContent);

      const result = await service.ensureGitignorePatterns();

      expect(result.updated).toBe(false);
      expect(result.message).toContain('already');
    });

    it('adds missing patterns when some are present', async () => {
      const existingContent = '.bluera/\n';
      await writeFile(join(projectRoot, '.gitignore'), existingContent);

      const result = await service.ensureGitignorePatterns();

      expect(result.updated).toBe(true);

      const content = await readFile(join(projectRoot, '.gitignore'), 'utf-8');
      expect(content).toContain('!.bluera/');
      expect(content).toContain('!.bluera/bluera-knowledge/');
      expect(content).toContain('!.bluera/bluera-knowledge/stores.config.json');
      expect(content).toContain('.bluera/bluera-knowledge/data/');
    });

    it('includes header comment in new additions', async () => {
      const result = await service.ensureGitignorePatterns();

      expect(result.updated).toBe(true);

      const content = await readFile(join(projectRoot, '.gitignore'), 'utf-8');
      expect(content).toContain('# Bluera Knowledge');
    });

    it('preserves trailing newline', async () => {
      const existingContent = 'node_modules/\n';
      await writeFile(join(projectRoot, '.gitignore'), existingContent);

      await service.ensureGitignorePatterns();

      const content = await readFile(join(projectRoot, '.gitignore'), 'utf-8');
      expect(content.endsWith('\n')).toBe(true);
    });
  });

  describe('getGitignorePath', () => {
    it('returns correct path', () => {
      const path = service.getGitignorePath();
      expect(path).toBe(join(projectRoot, '.gitignore'));
    });
  });
});
