#!/usr/bin/env node
/**
 * MCP Server Bootstrap - installs dependencies before starting server.
 *
 * Uses only Node.js built-ins (no external dependencies required).
 * Self-locates plugin root via import.meta.url (doesn't rely on CLAUDE_PLUGIN_ROOT).
 *
 * Dependency installation strategy:
 * 1. Fast path: node_modules already exists → skip
 * 2. Package manager: Run bun install or npm ci
 *
 * IMPORTANT: MCP servers must NOT log to stderr - Claude Code treats stderr output
 * as an error and may mark the MCP server as failed. All logging goes to file.
 */
import { execSync } from 'node:child_process';
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Logging helper - writes to file since MCP servers must NOT use stderr
// (Claude Code treats stderr as error and may fail the server)
// JSON format matches pino output for consistency
// Use PROJECT_ROOT if available (set by Claude Code), else fall back to home dir
const envProjectRoot = process.env['PROJECT_ROOT'];
const logDir =
  envProjectRoot !== undefined && envProjectRoot !== ''
    ? join(envProjectRoot, '.bluera', 'bluera-knowledge', 'logs')
    : join(homedir(), '.bluera', 'bluera-knowledge', 'logs');
const logFile = join(logDir, 'app.log');

const log = (
  level: 'info' | 'error' | 'debug',
  msg: string,
  data?: Record<string, unknown>
): void => {
  try {
    mkdirSync(logDir, { recursive: true });
    const entry = {
      time: new Date().toISOString(),
      level,
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

// Lock file to detect interrupted installs
const installLockFile = join(pluginRoot, '.node_modules_installing');

// Get version from package.json for logging
const getVersion = (): string => {
  try {
    const pkg: unknown = JSON.parse(readFileSync(join(pluginRoot, 'package.json'), 'utf-8'));
    if (
      typeof pkg === 'object' &&
      pkg !== null &&
      'version' in pkg &&
      typeof pkg.version === 'string'
    ) {
      return `v${pkg.version}`;
    }
    return 'unknown';
  } catch {
    return 'unknown';
  }
};

/**
 * Install dependencies using bun or npm.
 * Uses stdio: 'pipe' to capture output and avoid corrupting MCP stdio transport.
 */
function installWithPackageManager(): void {
  const hasBun = ((): boolean => {
    try {
      execSync('which bun', { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  })();

  const cmd = hasBun ? 'bun install --frozen-lockfile' : 'npm ci --silent';
  log('info', 'Installing dependencies with package manager', { hasBun, cmd });

  try {
    // Use stdio: 'pipe' to capture output - 'inherit' would corrupt MCP stdio transport
    const output = execSync(cmd, { cwd: pluginRoot, stdio: 'pipe' });
    if (output.length > 0) {
      log('debug', 'Install output', { output: output.toString().trim() });
    }
    log('info', 'Dependencies installed via package manager');
  } catch (error) {
    // Log installation failure details before re-throwing
    // execSync throws an object with stdout/stderr buffers on failure
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorDetails: Record<string, unknown> = { message: errorMessage };

    if (typeof error === 'object' && error !== null) {
      if ('stdout' in error && Buffer.isBuffer(error.stdout)) {
        errorDetails['stdout'] = error.stdout.toString().trim();
      }
      if ('stderr' in error && Buffer.isBuffer(error.stderr)) {
        errorDetails['stderr'] = error.stderr.toString().trim();
      }
    }

    log('error', 'Dependency installation failed', errorDetails);
    throw error;
  }
}

/**
 * Ensure dependencies are available.
 * Uses a lock file to detect and recover from interrupted installs.
 */
function ensureDependencies(): void {
  const nodeModulesPath = join(pluginRoot, 'node_modules');

  // Check for interrupted install - lock file exists means previous install was killed
  if (existsSync(installLockFile)) {
    log('info', 'Detected interrupted install, cleaning up');
    rmSync(nodeModulesPath, { recursive: true, force: true });
    unlinkSync(installLockFile);
  }

  // Fast path: already installed
  if (existsSync(nodeModulesPath)) {
    log('info', 'Dependencies already installed');
    return;
  }

  // Create lock file before install (left behind if install interrupted/fails)
  writeFileSync(installLockFile, new Date().toISOString());

  installWithPackageManager();

  // Remove lock file on success
  unlinkSync(installLockFile);
}

// Main entry point
const VERSION = getVersion();
log('info', 'Bootstrap starting', { pluginRoot, version: VERSION });

ensureDependencies();

// Now that dependencies are installed, import and run the server
// Dynamic import required because @modelcontextprotocol/sdk wouldn't be available before install
log('info', 'Loading server module');
const { runMCPServer } = await import('./server.js');

const projectRoot = process.env['PROJECT_ROOT'];
if (projectRoot === undefined) {
  throw new Error('PROJECT_ROOT environment variable is required');
}

log('info', 'Starting MCP server', {
  projectRoot,
  dataDir: process.env['DATA_DIR'],
});

await runMCPServer({
  dataDir: process.env['DATA_DIR'],
  config: process.env['CONFIG_PATH'],
  projectRoot,
});
