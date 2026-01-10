import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Tests to verify background-worker-cli.ts uses file logging instead of console.
 * This prevents silent failures when the worker is spawned with stdio: 'ignore'.
 */
describe('BackgroundWorkerCLI Logging', () => {
  const sourceFile = join(process.cwd(), 'src/workers/background-worker-cli.ts');
  const source = readFileSync(sourceFile, 'utf-8');

  it('imports createLogger from logging module', () => {
    expect(source).toContain('createLogger');
    expect(source).toContain("from '../logging/index.js'");
  });

  it('imports shutdownLogger for graceful exit', () => {
    expect(source).toContain('shutdownLogger');
  });

  it('does not use console.log', () => {
    // Filter out comments
    const lines = source.split('\n').filter((line) => !line.trim().startsWith('//'));
    const hasConsoleLog = lines.some((line) => /\bconsole\.log\b/.test(line));
    expect(hasConsoleLog).toBe(false);
  });

  it('does not use console.error', () => {
    // Filter out comments
    const lines = source.split('\n').filter((line) => !line.trim().startsWith('//'));
    const hasConsoleError = lines.some((line) => /\bconsole\.error\b/.test(line));
    expect(hasConsoleError).toBe(false);
  });
});
