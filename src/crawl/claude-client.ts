/**
 * Claude CLI client for intelligent crawling and extraction
 * Uses `claude -p` programmatically to analyze page structure and extract content
 */

import { spawn, execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

/**
 * Schema for crawl strategy response from Claude
 */
export interface CrawlStrategy {
  urls: string[];
  reasoning: string;
}

const CRAWL_STRATEGY_SCHEMA = {
  type: 'object',
  properties: {
    urls: {
      type: 'array',
      items: { type: 'string' },
      description: 'List of URLs to crawl based on the instruction',
    },
    reasoning: {
      type: 'string',
      description: 'Brief explanation of why these URLs were selected',
    },
  },
  required: ['urls', 'reasoning'],
};

/**
 * Client for interacting with Claude Code CLI
 */
export class ClaudeClient {
  private readonly timeout: number;
  private static availabilityChecked = false;
  private static available = false;
  private static claudePath: string | null = null;

  /**
   * Get the path to the Claude CLI binary
   * Checks in order:
   * 1. CLAUDE_BIN environment variable (explicit override)
   * 2. ~/.claude/local/claude (newer installation location)
   * 3. ~/.local/bin/claude (standard installation location)
   * 4. 'claude' in PATH (custom installations)
   */
  static getClaudePath(): string | null {
    // Check environment variable override
    const envPath = process.env['CLAUDE_BIN'];
    if (envPath !== undefined && envPath !== '' && existsSync(envPath)) {
      return envPath;
    }

    // Check ~/.claude/local/claude (newer location)
    const claudeLocalPath = join(homedir(), '.claude', 'local', 'claude');
    if (existsSync(claudeLocalPath)) {
      return claudeLocalPath;
    }

    // Check ~/.local/bin/claude (standard location)
    const localBinPath = join(homedir(), '.local', 'bin', 'claude');
    if (existsSync(localBinPath)) {
      return localBinPath;
    }

    // Check if 'claude' is in PATH (custom installations, uses 'command -v' which handles aliases)
    try {
      const result = execSync('command -v claude', { stdio: ['pipe', 'pipe', 'ignore'] });
      const path = result.toString().trim();
      if (path) {
        return path;
      }
    } catch {
      // Not in PATH
    }

    return null;
  }

  /**
   * Check if Claude CLI is available
   * Result is cached after first check for performance
   */
  static isAvailable(): boolean {
    if (!ClaudeClient.availabilityChecked) {
      ClaudeClient.claudePath = ClaudeClient.getClaudePath();
      ClaudeClient.available = ClaudeClient.claudePath !== null;
      ClaudeClient.availabilityChecked = true;
    }
    return ClaudeClient.available;
  }

  /**
   * Get the cached Claude path (call isAvailable first)
   */
  static getCachedPath(): string | null {
    return ClaudeClient.claudePath;
  }

  /**
   * Reset availability cache (for testing)
   */
  static resetAvailabilityCache(): void {
    ClaudeClient.availabilityChecked = false;
    ClaudeClient.available = false;
  }

  constructor(options: { timeout?: number } = {}) {
    this.timeout = options.timeout ?? 30000; // 30s default
  }

  /**
   * Determine which URLs to crawl based on natural language instruction
   *
   * @param seedUrl - The URL of the seed page (for resolving relative URLs)
   * @param seedHtml - HTML content of the seed page
   * @param instruction - Natural language crawl instruction (e.g., "scrape all Getting Started pages")
   * @returns List of URLs to crawl with reasoning
   */
  async determineCrawlUrls(
    seedUrl: string,
    seedHtml: string,
    instruction: string
  ): Promise<CrawlStrategy> {
    const prompt = `You are analyzing a webpage to determine which pages to crawl based on the user's instruction.

Base URL: ${seedUrl}

Instruction: ${instruction}

Webpage HTML (analyze the navigation structure, links, and content):
${this.truncateHtml(seedHtml, 50000)}

Based on the instruction, extract and return a list of absolute URLs that should be crawled. When you encounter relative URLs (starting with "/" or without a protocol), resolve them against the Base URL. For example, if Base URL is "https://example.com/docs" and you see href="/docs/hooks", return "https://example.com/docs/hooks".

Look for navigation menus, sidebars, headers, and link structures that match the instruction.

Return only URLs that are relevant to the instruction. If the instruction mentions specific sections (e.g., "Getting Started"), find links in those sections.`;

    try {
      const result = await this.callClaude(prompt, CRAWL_STRATEGY_SCHEMA);
      const rawParsed: unknown = JSON.parse(result);

      // Claude CLI with --json-schema returns wrapper: {type, result, structured_output: {...}}
      // Extract structured_output if present, otherwise use raw response
      const parsed = this.extractStructuredOutput(rawParsed);

      // Validate and narrow type
      if (
        typeof parsed !== 'object' ||
        parsed === null ||
        !('urls' in parsed) ||
        !('reasoning' in parsed) ||
        !Array.isArray(parsed.urls) ||
        parsed.urls.length === 0 ||
        typeof parsed.reasoning !== 'string' ||
        !parsed.urls.every((url) => typeof url === 'string')
      ) {
        throw new Error('Claude returned invalid crawl strategy');
      }

      // Type is now properly narrowed - urls is string[] after validation
      return { urls: parsed.urls, reasoning: parsed.reasoning };
    } catch (error) {
      throw new Error(
        `Failed to determine crawl strategy: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Extract specific information from markdown content using natural language
   *
   * @param markdown - Page content in markdown format
   * @param instruction - Natural language extraction instruction (e.g., "extract pricing info")
   * @returns Extracted information as text
   */
  async extractContent(markdown: string, instruction: string): Promise<string> {
    const prompt = `${instruction}

Content to analyze:
${this.truncateMarkdown(markdown, 100000)}`;

    try {
      const result = await this.callClaude(prompt);
      return result.trim();
    } catch (error) {
      throw new Error(
        `Failed to extract content: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Call Claude CLI with a prompt
   *
   * @param prompt - The prompt to send to Claude
   * @param jsonSchema - Optional JSON schema for structured output
   * @returns Claude's response as a string
   */
  private async callClaude(prompt: string, jsonSchema?: Record<string, unknown>): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      // Ensure we have Claude path
      const claudePath = ClaudeClient.getCachedPath();
      if (claudePath === null) {
        reject(new Error('Claude CLI not available'));
        return;
      }

      const args = ['-p'];

      // Add JSON schema if provided
      if (jsonSchema) {
        args.push('--json-schema', JSON.stringify(jsonSchema));
        args.push('--output-format', 'json');
      }

      const proc = spawn(claudePath, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: process.cwd(),
        env: { ...process.env },
      });

      let stdout = '';
      let stderr = '';
      let timeoutId: NodeJS.Timeout | undefined;

      // Set timeout
      if (this.timeout > 0) {
        timeoutId = setTimeout(() => {
          proc.kill('SIGTERM');
          reject(new Error(`Claude CLI timed out after ${String(this.timeout)}ms`));
        }, this.timeout);
      }

      proc.stdout.on('data', (chunk: Buffer) => {
        stdout += chunk.toString();
      });

      proc.stderr.on('data', (chunk: Buffer) => {
        stderr += chunk.toString();
      });

      proc.on('close', (code: number | null) => {
        if (timeoutId !== undefined) {
          clearTimeout(timeoutId);
        }

        if (code === 0) {
          resolve(stdout.trim());
        } else {
          reject(
            new Error(`Claude CLI exited with code ${String(code)}${stderr ? `: ${stderr}` : ''}`)
          );
        }
      });

      proc.on('error', (err) => {
        if (timeoutId !== undefined) {
          clearTimeout(timeoutId);
        }
        reject(new Error(`Failed to spawn Claude CLI: ${err.message}`));
      });

      // Write prompt to stdin
      proc.stdin.write(prompt);
      proc.stdin.end();
    });
  }

  /**
   * Truncate HTML to a maximum length (keep important parts)
   */
  private truncateHtml(html: string, maxLength: number): string {
    if (html.length <= maxLength) return html;

    // Try to keep the beginning (usually has navigation)
    return `${html.substring(0, maxLength)}\n\n[... HTML truncated ...]`;
  }

  /**
   * Truncate markdown to a maximum length
   */
  private truncateMarkdown(markdown: string, maxLength: number): string {
    if (markdown.length <= maxLength) return markdown;

    return `${markdown.substring(0, maxLength)}\n\n[... content truncated ...]`;
  }

  /**
   * Type guard to check if value is a record (plain object)
   */
  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  /**
   * Extract structured_output from Claude CLI wrapper format if present.
   * Claude CLI with --json-schema returns: {type, result, structured_output: {...}}
   * This method extracts the inner structured_output, or returns the raw value if not wrapped.
   */
  private extractStructuredOutput(rawParsed: unknown): unknown {
    if (this.isRecord(rawParsed) && 'structured_output' in rawParsed) {
      const structuredOutput = rawParsed['structured_output'];
      if (typeof structuredOutput === 'object') {
        return structuredOutput;
      }
    }
    return rawParsed;
  }
}
