import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Tests to verify .mcp.json is correctly configured for project-level use.
 * The MCP server should work when running from the project directory,
 * not just when loaded as a Claude Code plugin.
 */
describe('MCP Configuration (.mcp.json)', () => {
  const configPath = join(process.cwd(), '.mcp.json');
  const config = JSON.parse(readFileSync(configPath, 'utf-8'));

  it('does not use CLAUDE_PLUGIN_ROOT (only available in plugin mode)', () => {
    const serverConfig = config.mcpServers['bluera-knowledge'];
    const argsString = JSON.stringify(serverConfig.args);

    // CLAUDE_PLUGIN_ROOT is only set when running as a Claude Code plugin
    // .mcp.json is for project-level config, so it should use relative paths
    expect(argsString).not.toContain('CLAUDE_PLUGIN_ROOT');
  });

  it('uses relative path for server entry point', () => {
    const serverConfig = config.mcpServers['bluera-knowledge'];

    // Should use ./dist/mcp/server.js or similar relative path
    expect(serverConfig.args).toContain('./dist/mcp/server.js');
  });

  it('sets PROJECT_ROOT environment variable', () => {
    const serverConfig = config.mcpServers['bluera-knowledge'];

    // MCP server requires PROJECT_ROOT to function
    expect(serverConfig.env).toHaveProperty('PROJECT_ROOT');
  });

  it('uses PWD for PROJECT_ROOT', () => {
    const serverConfig = config.mcpServers['bluera-knowledge'];

    // PROJECT_ROOT should be set to PWD (current working directory)
    expect(serverConfig.env['PROJECT_ROOT']).toBe('${PWD}');
  });
});
