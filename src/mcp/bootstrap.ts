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
 */
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Self-locate plugin root from this file's path
// dist/mcp/bootstrap.js -> plugin root (two directories up)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const pluginRoot = join(__dirname, '..', '..');

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
  execSync(cmd, { cwd: pluginRoot, stdio: 'inherit' });
}

// Now that dependencies are installed, import and run the server
// Dynamic import required because @modelcontextprotocol/sdk wouldn't be available before install
const { runMCPServer } = await import('./server.js');

const projectRoot = process.env['PROJECT_ROOT'];
if (projectRoot === undefined) {
  throw new Error('PROJECT_ROOT environment variable is required');
}

await runMCPServer({
  dataDir: process.env['DATA_DIR'],
  config: process.env['CONFIG_PATH'],
  projectRoot,
});
