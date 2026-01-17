import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Tests to verify bootstrap.ts follows MCP server requirements:
 * - No console output (stderr breaks MCP servers)
 * - File-based logging only
 * - Clean dependency installation logic
 */
describe('Bootstrap', () => {
  const sourceFile = join(process.cwd(), 'src/mcp/bootstrap.ts');
  const source = readFileSync(sourceFile, 'utf-8');

  // Filter out comments for accurate detection
  const codeLines = source.split('\n').filter((line) => !line.trim().startsWith('//'));

  describe('Logging safety', () => {
    it('does not use console.log', () => {
      const hasConsoleLog = codeLines.some((line) => /\bconsole\.log\b/.test(line));
      expect(hasConsoleLog).toBe(false);
    });

    it('does not use console.error', () => {
      const hasConsoleError = codeLines.some((line) => /\bconsole\.error\b/.test(line));
      expect(hasConsoleError).toBe(false);
    });

    it('does not use console.warn', () => {
      const hasConsoleWarn = codeLines.some((line) => /\bconsole\.warn\b/.test(line));
      expect(hasConsoleWarn).toBe(false);
    });

    it('uses file-based logging via appendFileSync', () => {
      expect(source).toContain('appendFileSync');
    });

    it('writes to log file in .bluera directory', () => {
      expect(source).toContain("'.bluera'");
      expect(source).toContain('logFile');
    });

    it('logs are JSON formatted', () => {
      expect(source).toContain('JSON.stringify');
    });
  });

  describe('Dependency installation', () => {
    it('checks for existing node_modules (fast path)', () => {
      expect(source).toContain('existsSync');
      expect(source).toContain('node_modules');
    });

    it('detects bun availability', () => {
      expect(source).toContain('which bun');
    });

    it('supports bun install with frozen lockfile', () => {
      expect(source).toContain('bun install --frozen-lockfile');
    });

    it('falls back to npm ci', () => {
      expect(source).toContain('npm ci');
    });

    it('runs install in plugin root directory', () => {
      expect(source).toContain('cwd: pluginRoot');
    });
  });

  describe('Version handling', () => {
    it('reads version from package.json', () => {
      expect(source).toContain('package.json');
      expect(source).toContain('version');
    });

    it('handles missing package.json gracefully', () => {
      expect(source).toContain("return 'unknown'");
    });
  });

  describe('Server startup', () => {
    it('requires PROJECT_ROOT environment variable', () => {
      expect(source).toContain('PROJECT_ROOT');
      expect(source).toContain('throw new Error');
    });

    it('dynamically imports server module', () => {
      expect(source).toContain("import('./server.js')");
    });

    it('passes environment config to server', () => {
      expect(source).toContain('DATA_DIR');
      expect(source).toContain('CONFIG_PATH');
    });
  });

  describe('No prebuilt binary logic', () => {
    it('does not contain downloadPrebuilt function', () => {
      expect(source).not.toContain('downloadPrebuilt');
    });

    it('does not fetch manifest.json', () => {
      expect(source).not.toContain('manifest.json');
    });

    it('does not use tar extraction', () => {
      expect(source).not.toContain('tar -xzf');
    });

    it('does not use https.get for downloads', () => {
      expect(source).not.toContain("from 'node:https'");
    });
  });
});
