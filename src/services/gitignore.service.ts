import { readFile, writeFile, access } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * Required .gitignore patterns for Bluera Knowledge
 *
 * These patterns ensure:
 * - The .bluera/ data directory (vector DB, cloned repos) is ignored
 * - The stores.config.json file is NOT ignored (committed for team sharing)
 *
 * IMPORTANT: Git ignores children of ignored directories. To un-ignore a nested
 * file, you must first un-ignore each parent directory in the path. The order is:
 * 1. Ignore .bluera/ (everything ignored by default)
 * 2. Un-ignore .bluera/ itself (allow traversing into it)
 * 3. Un-ignore .bluera/bluera-knowledge/ (allow traversing deeper)
 * 4. Un-ignore the specific file we want tracked
 * 5. Re-ignore .bluera/bluera-knowledge/data/ (keep vector DB untracked)
 */
const REQUIRED_PATTERNS = [
  '.bluera/',
  '!.bluera/',
  '!.bluera/bluera-knowledge/',
  '!.bluera/bluera-knowledge/stores.config.json',
  '.bluera/bluera-knowledge/data/',
];

/**
 * Header comment for the gitignore section
 */
const SECTION_HEADER = `
# Bluera Knowledge
# Store definitions (stores.config.json) are committed for team sharing
# Data directory (vector DB, cloned repos) is not committed
`;

/**
 * Check if a file exists
 */
async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * Service for managing .gitignore patterns for Bluera Knowledge.
 *
 * When stores are created, this service ensures the project's .gitignore
 * is updated to:
 * - Ignore the .bluera/ data directory (not committed)
 * - Allow committing .bluera/bluera-knowledge/stores.config.json (for team sharing)
 */
export class GitignoreService {
  private readonly gitignorePath: string;

  constructor(projectRoot: string) {
    this.gitignorePath = join(projectRoot, '.gitignore');
  }

  /**
   * Check if all required patterns are present in .gitignore
   */
  async hasRequiredPatterns(): Promise<boolean> {
    const exists = await fileExists(this.gitignorePath);
    if (!exists) {
      return false;
    }

    const content = await readFile(this.gitignorePath, 'utf-8');
    const lines = content.split('\n').map((l) => l.trim());

    for (const pattern of REQUIRED_PATTERNS) {
      if (!lines.includes(pattern)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Ensure required .gitignore patterns are present.
   *
   * - Creates .gitignore if it doesn't exist
   * - Appends missing patterns if .gitignore exists
   * - Does nothing if all patterns are already present
   *
   * @returns Object with updated flag and descriptive message
   */
  async ensureGitignorePatterns(): Promise<{ updated: boolean; message: string }> {
    const exists = await fileExists(this.gitignorePath);

    if (!exists) {
      // Create new .gitignore with our patterns
      const content = `${SECTION_HEADER.trim()}\n${REQUIRED_PATTERNS.join('\n')}\n`;
      await writeFile(this.gitignorePath, content);
      return {
        updated: true,
        message: 'Created .gitignore with Bluera Knowledge patterns',
      };
    }

    // Read existing content
    const existingContent = await readFile(this.gitignorePath, 'utf-8');
    const lines = existingContent.split('\n').map((l) => l.trim());

    // Find missing patterns
    const missingPatterns = REQUIRED_PATTERNS.filter((pattern) => !lines.includes(pattern));

    if (missingPatterns.length === 0) {
      return {
        updated: false,
        message: 'All Bluera Knowledge patterns already present in .gitignore',
      };
    }

    // Append missing patterns
    let newContent = existingContent;
    if (!newContent.endsWith('\n')) {
      newContent += '\n';
    }

    newContent += SECTION_HEADER;
    newContent += `${missingPatterns.join('\n')}\n`;

    await writeFile(this.gitignorePath, newContent);

    return {
      updated: true,
      message: `Updated .gitignore with ${String(missingPatterns.length)} Bluera Knowledge pattern(s)`,
    };
  }

  /**
   * Get the path to the .gitignore file
   */
  getGitignorePath(): string {
    return this.gitignorePath;
  }
}
