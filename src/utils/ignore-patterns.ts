/**
 * Unified ignore pattern handling for consistent behavior across IndexService and WatchService.
 *
 * Pattern normalization ensures the same config patterns work identically whether used
 * for fs.readdir scanning (IndexService) or chokidar watching (WatchService).
 */

/** Default directories to always ignore */
export const DEFAULT_IGNORE_DIRS = ['node_modules', '.git', '.bluera', 'dist', 'build'] as const;

/**
 * Normalize patterns to standard glob format for chokidar and micromatch.
 *
 * Transformations:
 * - 'node_modules' → '** /node_modules/**' (directory anywhere in tree)
 * - 'node_modules/**' → '** /node_modules/**' (explicit directory pattern)
 * - '*.min.js' → '**\/*.min.js' (extension pattern anywhere)
 * - '** /foo/**' → unchanged (already in glob format)
 *
 * @param patterns - User-provided patterns from config
 * @param includeDefaults - Whether to include DEFAULT_IGNORE_DIRS (default: true)
 */
export function normalizeGlobPatterns(
  patterns: readonly string[],
  includeDefaults = true
): string[] {
  const result: string[] = [];

  // Add defaults first
  if (includeDefaults) {
    for (const dir of DEFAULT_IGNORE_DIRS) {
      result.push(`**/${dir}/**`);
    }
  }

  // Process user patterns
  for (const pattern of patterns) {
    if (pattern.startsWith('**/') && pattern.endsWith('/**')) {
      // Already in glob format
      result.push(pattern);
    } else if (pattern.endsWith('/**')) {
      // Directory pattern: 'foo/**' → '**/foo/**'
      result.push(`**/${pattern}`);
    } else if (pattern.startsWith('*.')) {
      // Extension pattern: '*.min.js' → '**/*.min.js'
      result.push(`**/${pattern}`);
    } else if (!pattern.includes('/') && !pattern.includes('*')) {
      // Simple directory name: 'node_modules' → '**/node_modules/**'
      result.push(`**/${pattern}/**`);
    } else {
      // Keep as-is (might be a specific path pattern)
      result.push(pattern);
    }
  }

  return result;
}

/**
 * Parsed patterns optimized for fs.readdir scanning.
 */
export interface ScanningPatterns {
  /** Directory names to skip during traversal (e.g., 'node_modules', '.git') */
  dirs: Set<string>;
  /** Predicate functions to test if a filename should be ignored (e.g., for '*.min.js') */
  fileMatchers: Array<(filename: string) => boolean>;
}

/**
 * Parse patterns into structures optimized for fs.readdir filtering.
 *
 * This is more efficient than glob matching for directory traversal since
 * it allows early termination when encountering ignored directories.
 *
 * @param patterns - User-provided patterns from config
 * @param includeDefaults - Whether to include DEFAULT_IGNORE_DIRS (default: true)
 */
export function parseIgnorePatternsForScanning(
  patterns: readonly string[],
  includeDefaults = true
): ScanningPatterns {
  const dirs = new Set<string>();
  const fileMatchers: Array<(filename: string) => boolean> = [];

  // Add defaults first
  if (includeDefaults) {
    for (const dir of DEFAULT_IGNORE_DIRS) {
      dirs.add(dir);
    }
  }

  // Process user patterns
  for (const pattern of patterns) {
    if (pattern.startsWith('**/') && pattern.endsWith('/**')) {
      // Glob format: '**/node_modules/**' → extract 'node_modules'
      const inner = pattern.slice(3, -3);
      if (!inner.includes('/') && !inner.includes('*')) {
        dirs.add(inner);
      }
    } else if (pattern.endsWith('/**')) {
      // Directory pattern: 'node_modules/**' → 'node_modules'
      dirs.add(pattern.slice(0, -3));
    } else if (pattern.startsWith('*.')) {
      // Extension pattern: '*.min.js' → matches files ending with '.min.js'
      const ext = pattern.slice(1); // Remove leading '*'
      fileMatchers.push((filename) => filename.endsWith(ext));
    } else if (!pattern.includes('/') && !pattern.includes('*')) {
      // Simple directory name: 'node_modules' → treat as directory
      dirs.add(pattern);
    }
    // Note: Complex patterns like 'src/**/*.test.ts' are not supported for scanning
    // They would require full glob matching which defeats the purpose of fast scanning
  }

  return { dirs, fileMatchers };
}
