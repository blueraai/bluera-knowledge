---
allowed-tools: ["Bash", "Read"]
description: View and search Bluera Knowledge logs
---

# Logs

View, tail, or search Bluera Knowledge log files.

## Log Location

Logs are stored at: `~/.bluera/bluera-knowledge/logs/app.log`

Rotated logs: `app.1.log`, `app.2.log`, etc. (up to 5 files, 10MB each)

## Usage

Parse $ARGUMENTS to determine the mode:

### Modes

**tail** (default if no args) - Watch logs in real-time:
```bash
tail -f ~/.bluera/bluera-knowledge/logs/app.log
```

**view [lines]** - View recent log entries (default: 100 lines):
```bash
tail -n 100 ~/.bluera/bluera-knowledge/logs/app.log
```

**search <pattern>** - Search logs for a pattern:
```bash
grep -i "<pattern>" ~/.bluera/bluera-knowledge/logs/app.log
```

**errors** - Show only error-level logs:
```bash
grep '"level":"error"' ~/.bluera/bluera-knowledge/logs/app.log | tail -n 50
```

**module <name>** - Filter logs by module (e.g., mcp-server, mcp-search, mcp-store, mcp-execute, mcp-job, mcp-sync, bootstrap):
```bash
grep '"module":"<name>"' ~/.bluera/bluera-knowledge/logs/app.log | tail -n 50
```

**all <pattern>** - Search across all rotated log files:
```bash
cat ~/.bluera/bluera-knowledge/logs/app*.log | grep -i "<pattern>"
```

## Examples

1. `/logs` or `/logs tail` - Watch MCP server activity in real-time
2. `/logs view 50` - Show last 50 log entries
3. `/logs errors` - Find recent errors
4. `/logs search store:create` - Search for store creation logs
5. `/logs module mcp-store` - Filter to store handler logs
6. `/logs module bootstrap` - See MCP server bootstrap logs
7. `/logs all "job failed"` - Search all log files for job failures

## Log Format

Logs are JSON formatted with these fields:
- `time`: ISO timestamp
- `level`: trace, debug, info, warn, error, fatal
- `module`: Source module (mcp-server, mcp-search, mcp-store, mcp-execute, mcp-job, mcp-sync, bootstrap)
- `msg`: Log message
- Additional context fields vary by operation

## Tips

- Set `LOG_LEVEL=debug` environment variable for more verbose logging
- Set `LOG_LEVEL=trace` for maximum verbosity (including large payload dumps)
- Payload files for large responses are in `~/.bluera/bluera-knowledge/logs/payload/`
- Use `jq` to pretty-print JSON logs: `tail -n 10 ~/.bluera/bluera-knowledge/logs/app.log | jq .`
