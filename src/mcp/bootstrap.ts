#!/usr/bin/env node
/**
 * MCP Server Bootstrap - installs dependencies before starting server.
 *
 * Uses only Node.js built-ins (no external dependencies required).
 * Self-locates plugin root via import.meta.url (doesn't rely on CLAUDE_PLUGIN_ROOT).
 *
 * This solves two issues:
 * 1. Bash path resolution broken - ${CLAUDE_PLUGIN_ROOT:-.} not expanded for bash
 * 2. Dependencies not installed - plugins installed via git clone without npm install
 *
 * IMPORTANT: MCP servers must NOT log to stderr - Claude Code treats stderr output
 * as an error and may mark the MCP server as failed. All logging goes to file.
 */
import { execSync } from 'node:child_process';
import { appendFileSync, existsSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Logging helper - writes to file since MCP servers must NOT use stderr
// (Claude Code treats stderr as error and may fail the server)
// JSON format matches pino output for consistency
const logDir = join(homedir(), '.bluera', 'bluera-knowledge', 'logs');
const logFile = join(logDir, 'app.log');

const log = (msg: string, data?: Record<string, unknown>): void => {
  try {
    mkdirSync(logDir, { recursive: true });
    const entry = {
      time: new Date().toISOString(),
      level: 'info',
      module: 'bootstrap',
      msg,
      ...data,
    };
    appendFileSync(logFile, `${JSON.stringify(entry)}\n`);
  } catch {
    // Silently fail - we cannot use stderr for MCP servers
  }
};

// Self-locate plugin root from this file's path
// dist/mcp/bootstrap.js -> plugin root (two directories up)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const pluginRoot = join(__dirname, '..', '..');

log('Bootstrap starting', { pluginRoot });

// Install dependencies if node_modules is missing
if (!existsSync(join(pluginRoot, 'node_modules'))) {
  const hasBun = ((): boolean => {
    try {
      execSync('which bun', { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  })();

  const cmd = hasBun ? 'bun install --frozen-lockfile' : 'npm ci --silent';
  log('Dependencies missing, installing', { hasBun, cmd });
  execSync(cmd, { cwd: pluginRoot, stdio: 'inherit' });
  log('Dependencies installed');
} else {
  log('Dependencies already installed');
}

// Now that dependencies are installed, import and run the server
// Dynamic import required because @modelcontextprotocol/sdk wouldn't be available before install
log('Loading server module');
const { runMCPServer } = await import('./server.js');

const projectRoot = process.env['PROJECT_ROOT'];
if (projectRoot === undefined) {
  throw new Error('PROJECT_ROOT environment variable is required');
}

log('Starting MCP server', { projectRoot, dataDir: process.env['DATA_DIR'] });

await runMCPServer({
  dataDir: process.env['DATA_DIR'],
  config: process.env['CONFIG_PATH'],
  projectRoot,
});
