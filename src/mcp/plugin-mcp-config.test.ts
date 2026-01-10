import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

/**
 * Tests to verify plugin.json is correctly configured for MCP server.
 * The MCP server must work when the plugin is installed via marketplace.
 *
 * Key requirements:
 * - Must use ${CLAUDE_PLUGIN_ROOT} for server path (resolves to plugin cache)
 * - Must set PROJECT_ROOT env var (required by server fail-fast check)
 * - Must NOT use relative paths (would resolve to user's project, not plugin)
 */
describe('Plugin MCP Configuration (.claude-plugin/plugin.json)', () => {
  const configPath = join(process.cwd(), '.claude-plugin/plugin.json');
  const config = JSON.parse(readFileSync(configPath, 'utf-8'));

  it('has mcpServers configuration inline', () => {
    expect(config).toHaveProperty('mcpServers');
    expect(config.mcpServers).toHaveProperty('bluera-knowledge');
  });

  it('uses ${CLAUDE_PLUGIN_ROOT} for server path (required for plugin mode)', () => {
    const serverConfig = config.mcpServers['bluera-knowledge'];
    const argsString = JSON.stringify(serverConfig.args);

    // CLAUDE_PLUGIN_ROOT is set by Claude Code when plugin is installed
    // This ensures the path resolves to the plugin cache, not user's project
    expect(argsString).toContain('${CLAUDE_PLUGIN_ROOT}');
    expect(argsString).toContain('dist/mcp/server.js');
  });

  it('does NOT use relative paths (would break in plugin mode)', () => {
    const serverConfig = config.mcpServers['bluera-knowledge'];
    const argsString = JSON.stringify(serverConfig.args);

    // Relative paths like ./dist would resolve to user's project directory
    // which doesn't have the plugin's dist folder
    expect(argsString).not.toMatch(/"\.\//);
  });

  it('sets PROJECT_ROOT environment variable (required by fail-fast server)', () => {
    const serverConfig = config.mcpServers['bluera-knowledge'];

    // PROJECT_ROOT is required since b404cd6 (fail-fast change)
    expect(serverConfig.env).toHaveProperty('PROJECT_ROOT');
    expect(serverConfig.env['PROJECT_ROOT']).toBe('${PWD}');
  });
});

/**
 * Tests to ensure .mcp.json is NOT distributed with the plugin.
 * .mcp.json at project root causes confusion between plugin and project config.
 */
describe('No conflicting .mcp.json in repo', () => {
  it('does NOT have .mcp.json in repo root (prevents config confusion)', () => {
    const mcpJsonPath = join(process.cwd(), '.mcp.json');

    // .mcp.json should NOT exist in the repo
    // - For plugin mode: use mcpServers in plugin.json
    // - For development: use ~/.claude.json per README
    expect(existsSync(mcpJsonPath)).toBe(false);
  });
});
