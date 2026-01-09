import { readFile, writeFile, access } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * Required .gitignore patterns for Bluera Knowledge
 *
 * These patterns ensure:
 * - The .bluera/ data directory (vector DB, cloned repos) is ignored
 * - The stores.config.json file is NOT ignored (committed for team sharing)
 */
const REQUIRED_PATTERNS = [
  '.bluera/',
  '!.bluera/bluera-knowledge/',
  '!.bluera/bluera-knowledge/stores.config.json',
];

/**
 * Header comment for the gitignore section
 */
const SECTION_HEADER = `
# Bluera Knowledge - data directory (not committed)
# Store definitions at .bluera/bluera-knowledge/stores.config.json ARE committed for team sharing
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
