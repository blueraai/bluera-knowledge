import { existsSync, statSync, realpathSync } from 'node:fs';
import { dirname, join, normalize, sep } from 'node:path';

export interface ProjectRootOptions {
  readonly projectRoot?: string | undefined;
}

/**
 * Service for resolving the project root directory using a hierarchical detection strategy.
 *
 * Resolution hierarchy:
 * 1. Explicit projectRoot option (highest priority)
 * 2. PROJECT_ROOT environment variable (set by plugin commands)
 * 3. PWD environment variable (set by MCP server and shells)
 * 4. Git root detection (walk up to find .git directory)
 * 5. process.cwd() (fallback)
 */
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class ProjectRootService {
  /**
   * Resolve project root directory using hierarchical detection.
   */
  static resolve(options?: ProjectRootOptions): string {
    // 1. Check explicit option first
    if (options?.projectRoot !== undefined && options.projectRoot !== '') {
      return this.normalize(options.projectRoot);
    }

    // 2. Check PROJECT_ROOT environment variable (plugin commands)
    const projectRootEnv = process.env['PROJECT_ROOT'];
    if (projectRootEnv !== undefined && projectRootEnv !== '') {
      return this.normalize(projectRootEnv);
    }

    // 3. Check PWD environment variable (MCP server, shells)
    const pwdEnv = process.env['PWD'];
    if (pwdEnv !== undefined && pwdEnv !== '') {
      return this.normalize(pwdEnv);
    }

    // 4. Try git root detection
    const gitRoot = this.findGitRoot(process.cwd());
    if (gitRoot !== null) {
      return gitRoot;
    }

    // 5. Fallback to process.cwd()
    return process.cwd();
  }

  /**
   * Find git repository root by walking up the directory tree looking for .git
   */
  static findGitRoot(startPath: string): string | null {
    let currentPath = normalize(startPath);
    const root = normalize(sep); // Root filesystem (/ on Unix, C:\ on Windows)

    // Walk up directory tree
    while (currentPath !== root) {
      const gitPath = join(currentPath, '.git');

      if (existsSync(gitPath)) {
        try {
          const stats = statSync(gitPath);
          // .git can be a directory (normal repo) or file (submodule/worktree)
          if (stats.isDirectory() || stats.isFile()) {
            return currentPath;
          }
        } catch {
          // Ignore stat errors, continue searching
        }
      }

      // Move up one directory
      const parentPath = dirname(currentPath);
      if (parentPath === currentPath) {
        // Reached root without finding .git
        break;
      }
      currentPath = parentPath;
    }

    return null;
  }

  /**
   * Normalize path by resolving symlinks and normalizing separators
   */
  static normalize(path: string): string {
    try {
      // Resolve symlinks to real path
      const realPath = realpathSync(path);
      // Normalize separators
      return normalize(realPath);
    } catch {
      // If realpath fails (path doesn't exist), just normalize
      return normalize(path);
    }
  }

  /**
   * Validate that a path exists and is a directory
   */
  static validate(path: string): boolean {
    try {
      const stats = statSync(path);
      return stats.isDirectory();
    } catch {
      return false;
    }
  }
}
