#!/bin/bash
# MCP Server wrapper - ensures dependencies are installed before starting
#
# Claude Code installs plugins via git clone without npm install.
# MCP servers start before SessionStart hooks fire, so we must install
# dependencies here before starting the server.

PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-$(dirname "$(dirname "$0")")}"

# Install dependencies if missing
if [ ! -d "$PLUGIN_ROOT/node_modules" ]; then
    if command -v bun &> /dev/null; then
        (cd "$PLUGIN_ROOT" && bun install --frozen-lockfile) >&2
    elif command -v npm &> /dev/null; then
        (cd "$PLUGIN_ROOT" && npm ci --silent) >&2
    fi
fi

# Start MCP server
exec node "$PLUGIN_ROOT/dist/mcp/server.js"
