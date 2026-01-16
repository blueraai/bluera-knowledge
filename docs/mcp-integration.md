# MCP Integration

The plugin includes a Model Context Protocol server that exposes search tools for AI agents.

> **Important:** Commands vs MCP Tools: You interact with the plugin using `/bluera-knowledge:` slash commands. Behind the scenes, these commands instruct Claude Code to use MCP tools (`mcp__bluera-knowledge__*`) which handle the actual operations. Commands provide the user interface, while MCP tools are the backend that AI agents use to access your knowledge stores.

## Configuration

The MCP server is configured in `.mcp.json` at the plugin root:

```json
{
  "bluera-knowledge": {
    "command": "node",
    "args": ["${CLAUDE_PLUGIN_ROOT}/dist/mcp/server.js"],
    "env": {
      "PROJECT_ROOT": "${PWD}",
      "DATA_DIR": ".bluera/bluera-knowledge/data",
      "CONFIG_PATH": ".bluera/bluera-knowledge/config.json"
    }
  }
}
```

> **Note:** We use a separate `.mcp.json` file rather than inline `mcpServers` in `plugin.json` due to [Claude Code Bug #16143](https://github.com/anthropics/claude-code/issues/16143). This is the recommended pattern for Claude Code plugins.

---

## Context Efficiency Strategy

### Why Only 3 MCP Tools?

Every MCP tool exposed requires its full schema to be sent to Claude with each tool invocation. More tools = more tokens consumed before Claude can even respond.

**Design decision:** Consolidate from 10+ tools down to 3:

| Approach | Tool Count | Context Cost | Trade-off |
|----------|------------|--------------|-----------|
| Individual tools | 10+ | ~800+ tokens | Simple calls, high overhead |
| **Consolidated (current)** | 3 | ~300 tokens | Minimal overhead, slightly longer commands |

### How It Works

1. **Native tools for common workflow** - `search` and `get_full_context` are the operations Claude uses most often, so they get dedicated tools with full schemas

2. **Meta-tool for management** - The `execute` tool consolidates 8 store/job management commands into a single tool. Commands are discovered on-demand via `execute("commands")` or `execute("help", {command: "store:create"})`

3. **Lazy documentation** - Command help isn't pre-sent with tool listings; it's discoverable when needed

**Result:** ~60% reduction in context overhead for MCP tool listings, without sacrificing functionality.

> **Tip:** This pattern—consolidating infrequent operations into a meta-tool while keeping high-frequency operations native—is a general strategy for MCP context efficiency.

---

## Available MCP Tools

### `search`

Semantic vector search across all indexed stores or a specific subset. Returns structured code units with relevance ranking.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `query` | string | Search query (natural language, patterns, or type signatures) |
| `intent` | string | Search intent: find-pattern, find-implementation, find-usage, find-definition, find-documentation |
| `mode` | string | Search mode: hybrid (default), vector, or fts |
| `detail` | string | Context level: minimal, contextual, or full |
| `limit` | number | Maximum results (default: 10) |
| `stores` | array | Array of specific store IDs to search (optional, searches all stores if not specified) |
| `threshold` | number | Minimum normalized score (0-1) for filtering results |
| `minRelevance` | number | Minimum raw cosine similarity (0-1) for filtering results |

### `get_full_context`

Retrieve complete code and context for a specific search result by ID.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `resultId` | string | The result ID from a previous search |

### `execute`

Meta-tool for store and job management. Consolidates 8 operations into one tool with subcommands.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `command` | string | Command to execute (see below) |
| `args` | object | Command-specific arguments (optional) |

**Available commands:**

| Command | Args | Description |
|---------|------|-------------|
| `stores` | `type?` | List all knowledge stores |
| `store:info` | `store` | Get detailed store information including file path |
| `store:create` | `name`, `type`, `source`, `branch?`, `description?` | Create a new store |
| `store:index` | `store` | Re-index an existing store |
| `store:delete` | `store` | Delete a store and all data |
| `stores:sync` | `dryRun?`, `prune?`, `reindex?` | Sync stores from definitions config |
| `jobs` | `activeOnly?`, `status?` | List background jobs |
| `job:status` | `jobId` | Check specific job status |
| `job:cancel` | `jobId` | Cancel a running job |
| `help` | `command?` | Show help for commands |
| `commands` | - | List all available commands |

---

## Known Issues

### MCP Configuration Pattern

This plugin uses a separate `.mcp.json` file for MCP server configuration (rather than inline in `plugin.json`). This is the recommended pattern for Claude Code plugins due to [Bug #16143](https://github.com/anthropics/claude-code/issues/16143) where inline `mcpServers` may be ignored during plugin manifest parsing.

If you're developing a Claude Code plugin with MCP integration, we recommend:
1. Create a `.mcp.json` file at your plugin root
2. Do NOT use inline `mcpServers` in `plugin.json`

### Related Claude Code Bugs

| Issue | Status | Description |
|-------|--------|-------------|
| [#16143](https://github.com/anthropics/claude-code/issues/16143) | Open | Inline `mcpServers` in plugin.json ignored |
| [#13543](https://github.com/anthropics/claude-code/issues/13543) | Fixed v2.0.65 | .mcp.json files not copied to plugin cache |
| [#18336](https://github.com/anthropics/claude-code/issues/18336) | Open | MCP plugin shows enabled but no resources available |
