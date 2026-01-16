import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

/**
 * Tests to verify .mcp.json is correctly configured for MCP server.
 * The MCP server must work when the plugin is installed via marketplace.
 *
 * Key requirements:
 * - Must use ${CLAUDE_PLUGIN_ROOT} for server path (resolves to plugin cache)
 * - Must set PROJECT_ROOT env var (required by server fail-fast check)
 * - Must NOT use relative paths (would resolve to user's project, not plugin)
 *
 * Note: We use .mcp.json at plugin root (not inline in plugin.json) due to
 * Claude Code Bug #16143 where inline mcpServers is ignored during parsing.
 * See: https://github.com/anthropics/claude-code/issues/16143
 */
describe('Plugin MCP Configuration (.mcp.json)', () => {
  const mcpJsonPath = join(process.cwd(), '.mcp.json');
  const config = JSON.parse(readFileSync(mcpJsonPath, 'utf-8'));

  it('has .mcp.json file at plugin root', () => {
    expect(existsSync(mcpJsonPath)).toBe(true);
  });

  it('has mcpServers wrapper with bluera-knowledge server configuration', () => {
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
 * Tests to ensure plugin.json does NOT have inline mcpServers.
 * Inline mcpServers is broken due to Claude Code Bug #16143.
 */
describe('plugin.json does NOT have inline mcpServers', () => {
  it('plugin.json does NOT contain mcpServers (would be ignored by Claude Code)', () => {
    const pluginJsonPath = join(process.cwd(), '.claude-plugin/plugin.json');
    const pluginConfig = JSON.parse(readFileSync(pluginJsonPath, 'utf-8'));

    // mcpServers in plugin.json is ignored due to Bug #16143
    // All MCP config should be in .mcp.json at plugin root
    expect(pluginConfig).not.toHaveProperty('mcpServers');
  });
});
