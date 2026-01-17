#!/usr/bin/env node
/**
 * MCP Server Bootstrap - installs dependencies before starting server.
 *
 * Uses only Node.js built-ins (no external dependencies required).
 * Self-locates plugin root via import.meta.url (doesn't rely on CLAUDE_PLUGIN_ROOT).
 *
 * Dependency installation strategy:
 * 1. Fast path: node_modules already exists → skip
 * 2. Try prebuilt: Download platform-specific tarball from GitHub release
 * 3. Package manager: Run bun install or npm ci if prebuilt unavailable
 *
 * IMPORTANT: MCP servers must NOT log to stderr - Claude Code treats stderr output
 * as an error and may mark the MCP server as failed. All logging goes to file.
 */
import { execSync } from 'node:child_process';
import {
  appendFileSync,
  createWriteStream,
  existsSync,
  mkdirSync,
  readFileSync,
  unlinkSync,
} from 'node:fs';
import { get } from 'node:https';
import { arch, homedir, platform } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Logging helper - writes to file since MCP servers must NOT use stderr
// (Claude Code treats stderr as error and may fail the server)
// JSON format matches pino output for consistency
const logDir = join(homedir(), '.bluera', 'bluera-knowledge', 'logs');
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

// Get version from package.json
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

const VERSION = getVersion();
const MANIFEST_URL = `https://github.com/blueraai/bluera-knowledge/releases/download/${VERSION}/manifest.json`;

/**
 * Fetch JSON from URL with redirect handling.
 * Uses only Node.js built-ins.
 */
function fetchJSON(url: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const request = (targetUrl: string, redirectCount = 0): void => {
      if (redirectCount > 5) {
        reject(new Error('Too many redirects'));
        return;
      }

      get(targetUrl, { headers: { 'User-Agent': 'bluera-knowledge' } }, (res) => {
        // Follow redirects
        const location = res.headers.location;
        if (
          (res.statusCode === 302 || res.statusCode === 301) &&
          typeof location === 'string' &&
          location.length > 0
        ) {
          request(location, redirectCount + 1);
          return;
        }
        const statusCode = res.statusCode ?? 0;
        if (statusCode !== 200) {
          reject(new Error(`HTTP ${String(statusCode)}`));
          return;
        }
        let data = '';
        res.on('data', (chunk: Buffer) => (data += chunk.toString()));
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e instanceof Error ? e : new Error(String(e)));
          }
        });
      }).on('error', reject);
    };
    request(url);
  });
}

/**
 * Download file from URL to destination path.
 * Uses only Node.js built-ins.
 */
function downloadFile(url: string, destPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = (targetUrl: string, redirectCount = 0): void => {
      if (redirectCount > 10) {
        reject(new Error('Too many redirects'));
        return;
      }

      get(targetUrl, { headers: { 'User-Agent': 'bluera-knowledge' } }, (res) => {
        const location = res.headers.location;
        if (
          (res.statusCode === 302 || res.statusCode === 301) &&
          typeof location === 'string' &&
          location.length > 0
        ) {
          request(location, redirectCount + 1);
          return;
        }
        const statusCode = res.statusCode ?? 0;
        if (statusCode !== 200) {
          reject(new Error(`HTTP ${String(statusCode)}`));
          return;
        }
        const file = createWriteStream(destPath);
        res.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
        file.on('error', (err) => {
          file.close();
          reject(err);
        });
      }).on('error', reject);
    };
    request(url);
  });
}

interface PlatformInfo {
  url: string;
  sha256: string;
}

interface Manifest {
  version: string;
  platforms: Record<string, PlatformInfo>;
}

function isManifest(value: unknown): value is Manifest {
  return (
    typeof value === 'object' &&
    value !== null &&
    'version' in value &&
    'platforms' in value &&
    typeof value.platforms === 'object'
  );
}

/**
 * Try to download and extract prebuilt binary for current platform.
 * Returns true if successful, false if prebuilt is not available.
 */
async function downloadPrebuilt(): Promise<boolean> {
  const plat = platform(); // 'darwin', 'linux', 'win32'
  const ar = arch(); // 'arm64', 'x64'
  const platformKey = `${plat}-${ar}`;

  try {
    log('info', 'Checking for prebuilt binary', { platformKey, version: VERSION });

    const manifestData = await fetchJSON(MANIFEST_URL);
    if (!isManifest(manifestData)) {
      log('info', 'Invalid manifest format');
      return false;
    }

    const platformInfo = manifestData.platforms[platformKey];
    if (platformInfo === undefined) {
      log('info', 'No prebuilt binary available for platform', { platformKey });
      return false;
    }

    log('info', 'Downloading prebuilt binary', { url: platformInfo.url });
    const tmpDir = join(homedir(), '.bluera', 'tmp');
    mkdirSync(tmpDir, { recursive: true });
    const tarPath = join(tmpDir, `bluera-knowledge-${platformKey}.tar.gz`);

    await downloadFile(platformInfo.url, tarPath);
    log('info', 'Download complete, extracting', { tarPath, destDir: pluginRoot });

    // Use system tar - handles all formats (PAX, GNU, USTAR) correctly
    execSync(`tar -xzf "${tarPath}" -C "${pluginRoot}"`, { stdio: 'pipe' });

    // Cleanup temp file
    try {
      unlinkSync(tarPath);
    } catch {
      // Ignore cleanup errors
    }

    log('info', 'Prebuilt binary installed successfully');
    return true;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log('debug', 'Prebuilt download failed, will use package manager', {
      error: message,
    });
    return false;
  }
}

/**
 * Install dependencies using bun or npm.
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
  execSync(cmd, { cwd: pluginRoot, stdio: 'inherit' });
  log('info', 'Dependencies installed via package manager');
}

/**
 * Ensure dependencies are available.
 * Tries prebuilt first, falls back to package manager.
 */
async function ensureDependencies(): Promise<void> {
  // Fast path: already installed
  if (existsSync(join(pluginRoot, 'node_modules'))) {
    log('info', 'Dependencies already installed');
    return;
  }

  // Try prebuilt binary first (faster, no npm install needed)
  const prebuiltSuccess = await downloadPrebuilt();
  if (prebuiltSuccess) {
    return;
  }

  // Prebuilt not available, use package manager instead
  installWithPackageManager();
}

// Main entry point
log('info', 'Bootstrap starting', { pluginRoot, version: VERSION });

await ensureDependencies();

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
