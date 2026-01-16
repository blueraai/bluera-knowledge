import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { handleUninstall } from './uninstall.handler.js';
import type { HandlerContext } from '../types.js';
import type { UninstallArgs } from './uninstall.handler.js';

// Mock os module to control homedir for testing global data deletion
vi.mock('node:os', async () => {
  const actual = await vi.importActual<typeof import('node:os')>('node:os');
  return {
    ...actual,
    homedir: vi.fn(() => actual.homedir()),
  };
});

describe('uninstall.handler', () => {
  let tempDir: string;
  let projectRoot: string;
  let mockContext: HandlerContext;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'uninstall-handler-test-'));
    projectRoot = tempDir;

    // Create minimal mock context - uninstall handler doesn't use services
    mockContext = {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      services: {} as HandlerContext['services'],
      options: { projectRoot },
    };
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  describe('handleUninstall', () => {
    it('should delete project data when it exists', async () => {
      // Create project data structure
      const bkDir = join(projectRoot, '.bluera', 'bluera-knowledge');
      const dataDir = join(bkDir, 'data');
      mkdirSync(dataDir, { recursive: true });
      writeFileSync(join(bkDir, 'config.json'), '{}');
      writeFileSync(join(dataDir, 'stores.json'), '[]');

      const args: UninstallArgs = {};
      const result = await handleUninstall(args, mockContext);

      // Verify deletion
      expect(existsSync(join(bkDir, 'data'))).toBe(false);
      expect(existsSync(join(bkDir, 'config.json'))).toBe(false);

      // Verify response
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('Deleted:');
      expect(result.content[0].text).toContain('plugin cache');
    });

    it('should preserve stores.config.json by default', async () => {
      // Create project data structure
      const bkDir = join(projectRoot, '.bluera', 'bluera-knowledge');
      const dataDir = join(bkDir, 'data');
      mkdirSync(dataDir, { recursive: true });
      writeFileSync(join(bkDir, 'config.json'), '{}');
      writeFileSync(join(bkDir, 'stores.config.json'), '{"stores":[]}');
      writeFileSync(join(dataDir, 'stores.json'), '[]');

      const args: UninstallArgs = { keepDefinitions: true };
      const result = await handleUninstall(args, mockContext);

      // Verify stores.config.json is preserved
      expect(existsSync(join(bkDir, 'stores.config.json'))).toBe(true);
      expect(existsSync(join(bkDir, 'data'))).toBe(false);
      expect(existsSync(join(bkDir, 'config.json'))).toBe(false);

      // Verify response mentions preserved files
      expect(result.content[0].text).toContain('Preserved:');
      expect(result.content[0].text).toContain('stores.config.json');
    });

    it('should delete stores.config.json when keepDefinitions is false', async () => {
      // Create project data structure
      const bkDir = join(projectRoot, '.bluera', 'bluera-knowledge');
      mkdirSync(bkDir, { recursive: true });
      writeFileSync(join(bkDir, 'stores.config.json'), '{"stores":[]}');

      const args: UninstallArgs = { keepDefinitions: false };
      const result = await handleUninstall(args, mockContext);

      // Verify entire directory is gone
      expect(existsSync(bkDir)).toBe(false);

      // Verify response
      expect(result.content[0].text).toContain('Deleted:');
      expect(result.content[0].text).not.toContain('Preserved:');
    });

    it('should handle missing project data gracefully', async () => {
      const args: UninstallArgs = {};
      const result = await handleUninstall(args, mockContext);

      // Verify response indicates nothing to delete
      expect(result.content[0].text).toContain('No data found to delete');
      expect(result.content[0].text).toContain('plugin cache');
    });

    it('should always include plugin cache instructions', async () => {
      const args: UninstallArgs = {};
      const result = await handleUninstall(args, mockContext);

      expect(result.content[0].text).toContain('To fully uninstall (clear plugin cache):');
      expect(result.content[0].text).toContain('~/.claude/plugins/cache/bluera-knowledge-*');
    });

    it('should mention venv is cleaned with plugin cache', async () => {
      const args: UninstallArgs = {};
      const result = await handleUninstall(args, mockContext);

      expect(result.content[0].text).toContain('Python venv');
      expect(result.content[0].text).toContain('all dependencies');
    });

    it('should handle subdirectories in data folder', async () => {
      // Create nested structure
      const bkDir = join(projectRoot, '.bluera', 'bluera-knowledge');
      const reposDir = join(bkDir, 'data', 'repos', 'test-repo');
      mkdirSync(reposDir, { recursive: true });
      writeFileSync(join(reposDir, 'file.txt'), 'test');

      const args: UninstallArgs = {};
      await handleUninstall(args, mockContext);

      // Verify everything is deleted
      expect(existsSync(join(bkDir, 'data'))).toBe(false);
    });

    it('should delete global data when global flag is true', async () => {
      // Mock homedir to return our temp directory
      const { homedir } = await import('node:os');
      vi.mocked(homedir).mockReturnValue(tempDir);

      // Create fake global data directory
      const globalDir = join(tempDir, '.local', 'share', 'bluera-knowledge');
      mkdirSync(globalDir, { recursive: true });
      writeFileSync(join(globalDir, 'jobs.json'), '[]');

      const args: UninstallArgs = { global: true };
      const result = await handleUninstall(args, mockContext);

      // Verify global data was deleted
      expect(existsSync(globalDir)).toBe(false);
      expect(result.content[0].text).toContain('Deleted:');
      expect(result.content[0].text).toContain('.local/share/bluera-knowledge');
    });

    it('should handle global flag when global data does not exist', async () => {
      // Mock homedir to return our temp directory (no global data exists)
      const { homedir } = await import('node:os');
      vi.mocked(homedir).mockReturnValue(tempDir);

      const args: UninstallArgs = { global: true };
      const result = await handleUninstall(args, mockContext);

      // The handler should still complete without errors
      expect(result.content[0].text).toContain('plugin cache');
    });

    it('should report global data deletion in result', async () => {
      // Mock homedir to return our temp directory
      const { homedir } = await import('node:os');
      vi.mocked(homedir).mockReturnValue(tempDir);

      // Create both project and global data
      const bkDir = join(projectRoot, '.bluera', 'bluera-knowledge');
      mkdirSync(bkDir, { recursive: true });
      writeFileSync(join(bkDir, 'config.json'), '{}');

      const globalDir = join(tempDir, '.local', 'share', 'bluera-knowledge');
      mkdirSync(globalDir, { recursive: true });
      writeFileSync(join(globalDir, 'jobs.json'), '[]');

      const args: UninstallArgs = { global: true, keepDefinitions: false };
      const result = await handleUninstall(args, mockContext);

      // Verify both were deleted
      expect(existsSync(bkDir)).toBe(false);
      expect(existsSync(globalDir)).toBe(false);
      expect(result.content[0].text).toContain('Deleted:');
    });
  });
});
