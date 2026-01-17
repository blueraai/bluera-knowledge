import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

/**
 * Tests to verify .mcp.json is correctly configured for MCP server.
 *
 * Key requirements:
 * - Must use ${CLAUDE_PLUGIN_ROOT} in args path (cwd is NOT supported)
 * - Must set PROJECT_ROOT env var (required by server fail-fast check)
 *
 * Note: We use .mcp.json at plugin root (not inline in plugin.json) due to
 * Claude Code Bug #16143 where inline mcpServers is ignored during parsing.
 * See: https://github.com/anthropics/claude-code/issues/16143
 *
 * CLAUDE_PLUGIN_ROOT behavior:
 * - Plugin mode: expands to ~/.claude/plugins/cache/bluera/bluera-knowledge/X.Y.Z/
 * - Project mode: MCP not available (plugin mode only)
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

  it('uses ${CLAUDE_PLUGIN_ROOT} in args path (cwd not supported)', () => {
    const serverConfig = config.mcpServers['bluera-knowledge'];

    // ${CLAUDE_PLUGIN_ROOT} expands to plugin cache path
    // Note: cwd parameter is NOT supported by Claude Code MCP config
    expect(serverConfig.args).toContain('${CLAUDE_PLUGIN_ROOT}/dist/mcp/bootstrap.js');
    expect(serverConfig.cwd).toBeUndefined();
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
