#!/usr/bin/env node
/**
 * MCP Development Test Helper
 *
 * Spawns the MCP server and communicates with it directly via JSON-RPC over stdio.
 * Used by test-plugin --dev to test MCP functionality without needing the plugin installed.
 *
 * Usage:
 *   ./scripts/test-mcp-dev.mjs call <tool-name> '<json-args>'
 *   ./scripts/test-mcp-dev.mjs call execute '{"command":"help"}'
 *   ./scripts/test-mcp-dev.mjs call search '{"query":"test"}'
 */

import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');

class MCPTestClient {
  constructor() {
    this.server = null;
    this.messageId = 0;
    this.pendingRequests = new Map();
    this.initialized = false;
  }

  async start() {
    return new Promise((resolve, reject) => {
      const serverPath = join(PROJECT_ROOT, 'dist', 'mcp', 'server.js');

      this.server = spawn('node', [serverPath], {
        cwd: PROJECT_ROOT,
        env: {
          ...process.env,
          PROJECT_ROOT: PROJECT_ROOT,
          DATA_DIR: '.bluera/bluera-knowledge/data',
          CONFIG_PATH: '.bluera/bluera-knowledge/config.json',
        },
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      // Handle stderr (logs)
      this.server.stderr.on('data', (data) => {
        // Suppress server logs in test output unless DEBUG
        if (process.env.DEBUG) {
          process.stderr.write(`[server] ${data}`);
        }
      });

      // Handle stdout (JSON-RPC responses)
      const rl = createInterface({ input: this.server.stdout });
      rl.on('line', (line) => {
        try {
          const msg = JSON.parse(line);
          if (msg.id !== undefined && this.pendingRequests.has(msg.id)) {
            const { resolve, reject } = this.pendingRequests.get(msg.id);
            this.pendingRequests.delete(msg.id);
            if (msg.error) {
              reject(new Error(msg.error.message || JSON.stringify(msg.error)));
            } else {
              resolve(msg.result);
            }
          }
        } catch {
          // Not JSON or parse error - ignore
        }
      });

      this.server.on('error', reject);
      this.server.on('spawn', () => {
        // Give server a moment to initialize
        setTimeout(() => resolve(), 100);
      });
    });
  }

  async initialize() {
    if (this.initialized) return;

    // Send initialize request
    const initResult = await this.sendRequest('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'test-mcp-dev', version: '1.0.0' },
    });

    // Send initialized notification
    this.sendNotification('notifications/initialized', {});

    this.initialized = true;
    return initResult;
  }

  sendRequest(method, params) {
    return new Promise((resolve, reject) => {
      const id = ++this.messageId;
      const request = { jsonrpc: '2.0', id, method, params };

      this.pendingRequests.set(id, { resolve, reject });

      // Set timeout for request
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error(`Request timeout: ${method}`));
        }
      }, 30000);

      this.server.stdin.write(JSON.stringify(request) + '\n');
    });
  }

  sendNotification(method, params) {
    const notification = { jsonrpc: '2.0', method, params };
    this.server.stdin.write(JSON.stringify(notification) + '\n');
  }

  async callTool(name, args) {
    if (!this.initialized) {
      await this.initialize();
    }

    const result = await this.sendRequest('tools/call', {
      name,
      arguments: args,
    });

    return result;
  }

  async listTools() {
    if (!this.initialized) {
      await this.initialize();
    }

    return this.sendRequest('tools/list', {});
  }

  stop() {
    if (this.server) {
      this.server.kill('SIGTERM');
      this.server = null;
    }
  }
}

// Session mode - reads multiple commands from stdin, maintains server across calls
async function sessionMode() {
  const client = new MCPTestClient();
  await client.start();

  const rl = createInterface({ input: process.stdin });
  const results = [];
  let lastResultId = null;

  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const spaceIndex = trimmed.indexOf(' ');
    const toolName = spaceIndex > 0 ? trimmed.slice(0, spaceIndex) : trimmed;
    let argsStr = spaceIndex > 0 ? trimmed.slice(spaceIndex + 1) : '{}';

    // Substitute $LAST_ID with actual result ID from previous search
    if (lastResultId && argsStr.includes('$LAST_ID')) {
      argsStr = argsStr.replace(/\$LAST_ID/g, lastResultId);
    }

    const args = JSON.parse(argsStr);
    const result = await client.callTool(toolName, args);
    results.push(result);

    // Extract result ID for next call (search results have results[0].id)
    // Search results have a header line before JSON, so find first '{'
    if (result?.content?.[0]?.text) {
      const text = result.content[0].text;
      const jsonStart = text.indexOf('{');
      if (jsonStart >= 0) {
        try {
          const parsed = JSON.parse(text.slice(jsonStart));
          if (parsed.results?.[0]?.id) {
            lastResultId = parsed.results[0].id;
          }
        } catch {
          // Not valid JSON or no results - ignore
        }
      }
    }
  }

  client.stop();
  console.log(JSON.stringify(results, null, 2));
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.error('Usage: test-mcp-dev.js <command> [args...]');
    console.error('Commands:');
    console.error('  call <tool-name> <json-args>  - Call an MCP tool (one-shot)');
    console.error('  session                       - Read commands from stdin (persistent server)');
    console.error('  list                          - List available tools');
    console.error('');
    console.error('Examples:');
    console.error('  ./scripts/test-mcp-dev.js call execute \'{"command":"help"}\'');
    console.error('  ./scripts/test-mcp-dev.js call search \'{"query":"test"}\'');
    console.error('  ./scripts/test-mcp-dev.js list');
    console.error('');
    console.error('Session mode (maintains cache across calls):');
    console.error('  echo -e \'search {"query":"test"}\\nget_full_context {"resultId":"$LAST_ID"}\' | ./scripts/test-mcp-dev.js session');
    process.exit(1);
  }

  const command = args[0];

  // Session mode handles its own client lifecycle
  if (command === 'session') {
    await sessionMode();
    return;
  }

  const client = new MCPTestClient();

  try {
    await client.start();

    if (command === 'call') {
      if (args.length < 3) {
        console.error('Usage: test-mcp-dev.js call <tool-name> <json-args>');
        process.exit(1);
      }

      const toolName = args[1];
      const toolArgs = JSON.parse(args[2]);

      const result = await client.callTool(toolName, toolArgs);

      // Output result as JSON for parsing by test-plugin
      console.log(JSON.stringify(result, null, 2));
    } else if (command === 'list') {
      const result = await client.listTools();
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.error(`Unknown command: ${command}`);
      process.exit(1);
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  } finally {
    client.stop();
  }
}

main();
