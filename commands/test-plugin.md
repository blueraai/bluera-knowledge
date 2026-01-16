---
description: Run comprehensive plugin validation test suite
argument-hint: "[--dev]"
context: fork
---

# Test Plugin

Comprehensive test of all Bluera Knowledge plugin functionality.

## When to Use Each Mode

| Scenario | Command | Tests |
|----------|---------|-------|
| Claude running with `--plugin-dir .` | `/test-plugin` | 19/19 (full suite) |
| Plugin installed from marketplace | `/test-plugin` | 19/19 (full suite) |
| Claude running WITHOUT plugin loaded | `/test-plugin --dev` | 16/19 (no slash cmds) |
| CI/CD or scripted testing (no Claude) | `--dev` via bash | 16/19 (no slash cmds) |

**Modes:**
- **Default mode**: Uses Claude's MCP tools. Works when plugin is loaded via `--plugin-dir .` or installed from marketplace. Runs all 19 tests including slash commands.
- **`--dev` mode**: Spawns MCP server directly via `scripts/test-mcp-dev.js`. Works without Claude Code or when plugin isn't loaded. Skips slash command tests (8-10) since they require Claude's skill router.

**Recommendation:** If developing with `claude --plugin-dir .`, use default mode (no `--dev` flag) for full test coverage.

## Context

!`echo "=== BK Plugin Test ===" && ls -la .bluera/bluera-knowledge/ 2>/dev/null || echo "No BK data dir yet (will be created)"`

## Mode Detection

Check if `--dev` flag is present in: $ARGUMENTS

- If `--dev` is present: Use **Development Mode** (MCP via scripts/test-mcp-dev.js)
- Otherwise: Use **Production Mode** (MCP via Claude's built-in tools)

---

## Pre-Test Cleanup

First, clean up any leftover artifacts from previous test runs (ignore errors if they don't exist):

**In `--dev` mode:**
```bash
node scripts/test-mcp-dev.js call execute '{"command":"store:delete","args":{"store":"bk-test-store"}}' 2>/dev/null || true
rm -rf .bluera/bluera-knowledge/test-content
```

**In production mode:**
1. Call MCP tool `execute` with `{ command: "store:delete", args: { store: "bk-test-store" } }` - ignore errors
2. Run: `rm -rf .bluera/bluera-knowledge/test-content`

## Test Content Setup

Create test content for indexing:

```bash
mkdir -p .bluera/bluera-knowledge/test-content
cat > .bluera/bluera-knowledge/test-content/test-file.md << 'EOF'
# BK Plugin Test File

This file contains unique test content for validating the Bluera Knowledge plugin.

## Test Function

The `validateBKPlugin` function performs comprehensive testing of all plugin features.
It checks MCP connectivity, store operations, search functionality, and cleanup.

Keywords: bluera-knowledge-test, plugin-validation, mcp-test
EOF
```

## Workflow

Execute each test in order. Mark each as PASS or FAIL.

---

# DEVELOPMENT MODE (`--dev`)

Use this section if `--dev` flag is present. Uses `scripts/test-mcp-dev.js` to spawn MCP server directly.

### Part 1: MCP Server Tests (via dev script)

1. **MCP Connection**:
   ```bash
   node scripts/test-mcp-dev.js call execute '{"command":"help"}'
   ```
   - PASS if output contains "Available commands"

2. **List Stores**:
   ```bash
   node scripts/test-mcp-dev.js call execute '{"command":"stores"}'
   ```
   - PASS if no error (may return empty array)

3. **Create Store**:
   ```bash
   node scripts/test-mcp-dev.js call execute '{"command":"store:create","args":{"name":"bk-test-store","type":"file","source":".bluera/bluera-knowledge/test-content"}}'
   ```
   - PASS if response indicates success

4. **Store Info**:
   ```bash
   node scripts/test-mcp-dev.js call execute '{"command":"store:info","args":{"store":"bk-test-store"}}'
   ```
   - PASS if response contains store details

5. **Index Store** (via CLI for reliability):
   ```bash
   node dist/index.js index bk-test-store
   ```
   - PASS if output shows "Indexed X documents"

6-7. **Search + Get Full Context** (session mode to maintain cache):
   ```bash
   node scripts/test-mcp-dev.js session << 'EOF'
search {"query":"validateBKPlugin","stores":["bk-test-store"]}
get_full_context {"resultId":"$LAST_ID"}
EOF
   ```
   - PASS if first result has non-empty results array
   - PASS if second result contains "BK Plugin Test File"

### Part 2: Slash Commands (SKIPPED in --dev mode)

Tests 8-10 are skipped in development mode because slash commands require Claude Code to invoke them. The MCP server tests (Part 1) provide equivalent coverage of the underlying functionality.

### Part 3: Hook Tests (same for both modes)

[Continue to Part 3 below]

### Part 4: Cleanup (--dev mode)

17. **Delete Store**:
    ```bash
    node scripts/test-mcp-dev.js call execute '{"command":"store:delete","args":{"store":"bk-test-store"}}'
    ```
    - PASS if deletion succeeds

18. **Remove Test Content**:
    ```bash
    rm -rf .bluera/bluera-knowledge/test-content
    ```
    - PASS if command succeeds

19. **Verify Cleanup**:
    ```bash
    node scripts/test-mcp-dev.js call execute '{"command":"stores"}'
    ```
    - PASS if bk-test-store is NOT in the list

---

# PRODUCTION MODE (default)

Use this section if `--dev` flag is NOT present. Uses Claude's built-in MCP tools.

### Part 1: MCP Tools

1. **MCP Connection**: Call MCP tool `execute` with `{ command: "help" }`
   - PASS if response contains "Available commands"

2. **List Stores (MCP)**: Call MCP tool `execute` with `{ command: "stores" }`
   - PASS if no error

3. **Create Store**: Call MCP tool `execute` with:
   ```json
   { "command": "store:create", "args": { "name": "bk-test-store", "type": "file", "source": ".bluera/bluera-knowledge/test-content" } }
   ```
   - PASS if response indicates success

4. **Store Info**: Call MCP tool `execute` with:
   ```json
   { "command": "store:info", "args": { "store": "bk-test-store" } }
   ```
   - PASS if response contains store details

5. **Index Store**: Run CLI command via Bash:
   ```bash
   node dist/index.js index bk-test-store
   ```
   - PASS if indexing completes successfully

6. **Search (MCP)**: Call MCP tool `search` with:
   ```json
   { "query": "validateBKPlugin", "stores": ["bk-test-store"] }
   ```
   - PASS if results array is non-empty

7. **Get Full Context**: Call MCP tool `get_full_context` with resultId from step 6
   - PASS if response contains "BK Plugin Test File"

### Part 2: Slash Commands

8. **Stores Command**: Run `/bluera-knowledge:stores`
   - PASS if bk-test-store is listed

9. **Search Command**: Run `/bluera-knowledge:search "bluera-knowledge-test"`
   - PASS if results are shown

10. **Suggest Command**: Run `/bluera-knowledge:suggest`
    - PASS if no error thrown

### Part 3: Hook Tests (same for both modes)

[Continue to Part 3 below]

### Part 4: Cleanup (production mode)

17. **Delete Store**: Call MCP tool `execute` with:
    ```json
    { "command": "store:delete", "args": { "store": "bk-test-store" } }
    ```
    - PASS if deletion succeeds

18. **Remove Test Content**:
    ```bash
    rm -rf .bluera/bluera-knowledge/test-content
    ```
    - PASS if command succeeds

19. **Verify Cleanup**: Call MCP tool `execute` with `{ command: "stores" }`
    - PASS if bk-test-store is NOT in the list

---

# Part 3: Hook Tests (both modes)

These tests verify that plugin hooks work correctly by running hook scripts directly.

11. **Hook Registration**:
    ```bash
    cat hooks/hooks.json | jq -e '.hooks.PostToolUse and .hooks.UserPromptSubmit and .hooks.SessionStart'
    ```
    - PASS if returns `true`

12. **PostToolUse Hook - Library Detection**:
    ```bash
    echo '{"tool_name": "Read", "tool_input": {"file_path": "/project/node_modules/express/index.js"}}' | python3 hooks/posttooluse-bk-reminder.py
    ```
    - PASS if output contains "BLUERA-KNOWLEDGE REMINDER" and "express"

13. **PostToolUse Hook - Non-Library (Silent)**:
    ```bash
    echo '{"tool_name": "Read", "tool_input": {"file_path": "/project/src/index.ts"}}' | python3 hooks/posttooluse-bk-reminder.py
    ```
    - PASS if output is empty

14. **Skill Activation Hook - Matching Prompt**:
    ```bash
    export CLAUDE_PLUGIN_ROOT="$(pwd)" && echo '{"prompt": "why does the express package throw this error?"}' | python3 hooks/skill-activation.py
    ```
    - PASS if output contains "MANDATORY EVALUATION"

15. **Skill Activation Hook - Excluded Prompt**:
    ```bash
    export CLAUDE_PLUGIN_ROOT="$(pwd)" && echo '{"prompt": "/bluera-knowledge:search express"}' | python3 hooks/skill-activation.py
    ```
    - PASS if output is empty

16. **Skill Rules File**:
    ```bash
    jq -e '(.skills | length) > 0 and (.globalExclusions | length) > 0' hooks/skill-rules.json
    ```
    - PASS if returns `true`

---

## Output Format

### For `--dev` mode (16 tests):

| # | Test | Status |
|---|------|--------|
| 1 | MCP Connection (help) | ? |
| 2 | List Stores | ? |
| 3 | Create Store | ? |
| 4 | Store Info | ? |
| 5 | Index Store | ? |
| 6-7 | Search + Get Full Context | ? |
| 8-10 | Slash Commands | SKIPPED (--dev mode) |
| 11 | Hook Registration | ? |
| 12 | PostToolUse - Library Detection | ? |
| 13 | PostToolUse - Non-Library | ? |
| 14 | Skill Activation - Matching | ? |
| 15 | Skill Activation - Excluded | ? |
| 16 | Skill Rules File | ? |
| 17 | Delete Store | ? |
| 18 | Remove Test Content | ? |
| 19 | Verify Cleanup | ? |

**Result: X/16 tests passed (3 skipped)**

### For production mode (19 tests):

| # | Test | Status |
|---|------|--------|
| 1 | MCP Connection (help) | ? |
| 2 | List Stores (MCP) | ? |
| 3 | Create Store | ? |
| 4 | Store Info | ? |
| 5 | Index Store | ? |
| 6 | Search (MCP) | ? |
| 7 | Get Full Context | ? |
| 8 | /stores Command | ? |
| 9 | /search Command | ? |
| 10 | /suggest Command | ? |
| 11 | Hook Registration | ? |
| 12 | PostToolUse - Library Detection | ? |
| 13 | PostToolUse - Non-Library | ? |
| 14 | Skill Activation - Matching | ? |
| 15 | Skill Activation - Excluded | ? |
| 16 | Skill Rules File | ? |
| 17 | Delete Store | ? |
| 18 | Remove Test Content | ? |
| 19 | Verify Cleanup | ? |

**Result: X/19 tests passed**

---

## Error Recovery

If tests fail partway through, clean up manually:

**In --dev mode:**
```bash
node scripts/test-mcp-dev.js call execute '{"command":"store:delete","args":{"store":"bk-test-store"}}' 2>/dev/null || true
rm -rf .bluera/bluera-knowledge/test-content
```

**In production mode:**
1. Call MCP tool `execute` with `{ command: "store:delete", args: { store: "bk-test-store" } }`
2. Run: `rm -rf .bluera/bluera-knowledge/test-content`
