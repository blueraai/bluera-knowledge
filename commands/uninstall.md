---
description: Remove Bluera Knowledge data from this project
allowed-tools: ["mcp__bluera-knowledge__execute"]
---

# Uninstall Bluera Knowledge

Remove Bluera Knowledge data from this project.

## Steps

1. Use mcp__bluera-knowledge__execute tool with command "uninstall":
   - Optional args.global: true to also remove global data
   - Optional args.keepDefinitions: false to also remove stores.config.json

2. Display the result showing what was deleted and cleanup instructions.

## Options

| Flag | Description |
|------|-------------|
| `global` | Also delete global data (~/.local/share/bluera-knowledge/) |
| `keepDefinitions` | Keep stores.config.json for team sharing (default: true) |

## Examples

**Clean project data (preserves stores.config.json):**
```
/bluera-knowledge:uninstall
```

**Full cleanup including store definitions:**
```
Use uninstall with keepDefinitions: false
```

**Full cleanup including global data:**
```
Use uninstall with global: true
```

## What Gets Deleted

**Project data** (`.bluera/bluera-knowledge/`):
- `data/` - Vector indices, cloned repos, stores.json
- `config.json` - Plugin configuration
- `stores.config.json` - Only if keepDefinitions: false

**Global data** (with --global flag):
- `~/.local/share/bluera-knowledge/` - Job history, skill settings

## What Is NOT Deleted

- **Plugin cache** - Managed by Claude Code, instructions provided
- **Python venv** - Inside plugin cache, cleaned when cache is cleared

## Testing Fresh Plugin Installs

After running uninstall, to test a completely fresh plugin install:

1. Exit Claude Code
2. Clear plugin cache: `rm -rf ~/.claude/plugins/cache/bluera-knowledge-*`
3. Restart Claude Code and reinstall the plugin

_Clearing the plugin cache removes everything: plugin code, Python venv, and all dependencies._
