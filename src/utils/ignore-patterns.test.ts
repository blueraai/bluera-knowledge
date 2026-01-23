import { describe, it, expect } from 'vitest';
import {
  normalizeGlobPatterns,
  parseIgnorePatternsForScanning,
  DEFAULT_IGNORE_DIRS,
} from './ignore-patterns.js';

describe('ignore-patterns', () => {
  describe('normalizeGlobPatterns', () => {
    it('includes default patterns when includeDefaults is true', () => {
      const result = normalizeGlobPatterns([], true);

      expect(result).toContain('**/node_modules/**');
      expect(result).toContain('**/.git/**');
      expect(result).toContain('**/.bluera/**');
      expect(result).toContain('**/dist/**');
      expect(result).toContain('**/build/**');
      expect(result.length).toBe(DEFAULT_IGNORE_DIRS.length);
    });

    it('excludes default patterns when includeDefaults is false', () => {
      const result = normalizeGlobPatterns(['test'], false);

      expect(result).not.toContain('**/node_modules/**');
      expect(result).toEqual(['**/test/**']);
    });

    it('converts simple directory names to glob patterns', () => {
      const result = normalizeGlobPatterns(['coverage', 'tmp'], false);

      expect(result).toEqual(['**/coverage/**', '**/tmp/**']);
    });

    it('converts directory/** patterns to full glob', () => {
      const result = normalizeGlobPatterns(['logs/**', 'cache/**'], false);

      expect(result).toEqual(['**/logs/**', '**/cache/**']);
    });

    it('converts extension patterns to glob', () => {
      const result = normalizeGlobPatterns(['*.min.js', '*.map'], false);

      expect(result).toEqual(['**/*.min.js', '**/*.map']);
    });

    it('keeps already-normalized glob patterns unchanged', () => {
      const patterns = ['**/logs/**', '**/.cache/**'];
      const result = normalizeGlobPatterns(patterns, false);

      expect(result).toEqual(patterns);
    });

    it('keeps specific path patterns as-is', () => {
      const result = normalizeGlobPatterns(['src/**/*.test.ts'], false);

      expect(result).toEqual(['src/**/*.test.ts']);
    });

    it('merges user patterns with defaults', () => {
      const result = normalizeGlobPatterns(['coverage'], true);

      expect(result).toContain('**/node_modules/**');
      expect(result).toContain('**/coverage/**');
      expect(result.length).toBe(DEFAULT_IGNORE_DIRS.length + 1);
    });
  });

  describe('parseIgnorePatternsForScanning', () => {
    it('includes default directories when includeDefaults is true', () => {
      const result = parseIgnorePatternsForScanning([], true);

      expect(result.dirs.has('node_modules')).toBe(true);
      expect(result.dirs.has('.git')).toBe(true);
      expect(result.dirs.has('.bluera')).toBe(true);
      expect(result.dirs.has('dist')).toBe(true);
      expect(result.dirs.has('build')).toBe(true);
      expect(result.dirs.size).toBe(DEFAULT_IGNORE_DIRS.length);
    });

    it('excludes default directories when includeDefaults is false', () => {
      const result = parseIgnorePatternsForScanning(['test'], false);

      expect(result.dirs.has('node_modules')).toBe(false);
      expect(result.dirs).toEqual(new Set(['test']));
    });

    it('parses simple directory names', () => {
      const result = parseIgnorePatternsForScanning(['coverage', 'tmp'], false);

      expect(result.dirs).toEqual(new Set(['coverage', 'tmp']));
      expect(result.fileMatchers.length).toBe(0);
    });

    it('parses directory/** patterns', () => {
      const result = parseIgnorePatternsForScanning(['logs/**', 'cache/**'], false);

      expect(result.dirs).toEqual(new Set(['logs', 'cache']));
    });

    it('parses **/directory/** glob patterns', () => {
      const result = parseIgnorePatternsForScanning(['**/logs/**', '**/.cache/**'], false);

      expect(result.dirs).toEqual(new Set(['logs', '.cache']));
    });

    it('parses extension patterns into file matchers', () => {
      const result = parseIgnorePatternsForScanning(['*.min.js', '*.map'], false);

      expect(result.dirs.size).toBe(0);
      expect(result.fileMatchers.length).toBe(2);
      expect(result.fileMatchers[0]('app.min.js')).toBe(true);
      expect(result.fileMatchers[0]('app.js')).toBe(false);
      expect(result.fileMatchers[1]('bundle.map')).toBe(true);
      expect(result.fileMatchers[1]('bundle.js')).toBe(false);
    });

    it('ignores complex glob patterns that cannot be optimized', () => {
      const result = parseIgnorePatternsForScanning(['src/**/*.test.ts'], false);

      // Complex patterns are silently ignored since they can't be efficiently used for scanning
      expect(result.dirs.size).toBe(0);
      expect(result.fileMatchers.length).toBe(0);
    });

    it('merges user patterns with defaults', () => {
      const result = parseIgnorePatternsForScanning(['coverage', '*.map'], true);

      expect(result.dirs.has('node_modules')).toBe(true);
      expect(result.dirs.has('coverage')).toBe(true);
      expect(result.fileMatchers.length).toBe(1);
      expect(result.fileMatchers[0]('bundle.map')).toBe(true);
    });
  });

  describe('pattern equivalence', () => {
    it('same input produces consistent output in both functions', () => {
      const patterns = ['coverage', 'tmp', '*.min.js'];

      const globs = normalizeGlobPatterns(patterns, false);
      const scanning = parseIgnorePatternsForScanning(patterns, false);

      // Both should handle 'coverage' and 'tmp' as directories
      expect(globs).toContain('**/coverage/**');
      expect(globs).toContain('**/tmp/**');
      expect(scanning.dirs.has('coverage')).toBe(true);
      expect(scanning.dirs.has('tmp')).toBe(true);

      // Both should handle '*.min.js' appropriately
      expect(globs).toContain('**/*.min.js');
      expect(scanning.fileMatchers.length).toBe(1);
    });
  });
});
