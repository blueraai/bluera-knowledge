---
description: Run comprehensive plugin validation test suite
argument-hint: "[--dev]"
context: fork
---

# Test Plugin

Comprehensive test of all Bluera Knowledge plugin functionality covering the **full API surface**.

## API Coverage

| Category | Tests |
|----------|-------|
| MCP execute commands | help, commands, stores, store:create, store:info, store:index, store:delete, jobs, job:status, job:cancel |
| MCP tools | search, get_full_context |
| Slash commands | stores, search, suggest, check-status, skill-activation, index, add-folder |
| Web crawling | crawl (start job, verify status, cancel) |
| Hooks | PostToolUse, UserPromptSubmit, SessionStart |

## When to Use Each Mode

| Scenario | Command | Tests |
|----------|---------|-------|
| Claude running with `--plugin-dir .` | `/test-plugin` | 30/30 (full suite) |
| Plugin installed from marketplace | `/test-plugin` | 30/30 (full suite) |
| Claude running WITHOUT plugin loaded | `/test-plugin --dev` | 24/30 (no slash cmds) |

**Modes:**
- **Default mode**: Uses Claude's MCP tools. Runs all 30 tests including slash commands.
- **`--dev` mode**: Spawns MCP server directly. Skips slash command tests since they require Claude's skill router.

## Context

!`echo "=== BK Plugin Test ===" && ls -la .bluera/bluera-knowledge/ 2>/dev/null || echo "No BK data dir yet (will be created)"`

## Mode Detection

Check if `--dev` flag is present in: $ARGUMENTS

- If `--dev` is present: Use **Development Mode**
- Otherwise: Use **Production Mode**

---

## Pre-Test Cleanup

Clean up any leftover artifacts from previous test runs (ignore errors):

**In `--dev` mode:**
```bash
node scripts/test-mcp-dev.js call execute '{"command":"store:delete","args":{"store":"bk-test-store"}}' 2>/dev/null || true
node scripts/test-mcp-dev.js call execute '{"command":"store:delete","args":{"store":"bk-crawl-test"}}' 2>/dev/null || true
rm -rf .bluera/bluera-knowledge/test-content
```

**In production mode:**
1. Call MCP `execute` with `{ command: "store:delete", args: { store: "bk-test-store" } }` - ignore errors
2. Call MCP `execute` with `{ command: "store:delete", args: { store: "bk-crawl-test" } }` - ignore errors
3. Run: `rm -rf .bluera/bluera-knowledge/test-content`

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

---

# PRODUCTION MODE (default)

Use this section if `--dev` flag is NOT present.

## Part 1: MCP Execute Commands

1. **help**: Call `execute` with `{ command: "help" }`
   - PASS if response contains "Available commands"

2. **commands**: Call `execute` with `{ command: "commands" }`
   - PASS if response contains array of commands with "stores" and "store:create"

3. **stores**: Call `execute` with `{ command: "stores" }`
   - PASS if no error (may return empty array)

4. **store:create**: Call `execute` with:
   ```json
   { "command": "store:create", "args": { "name": "bk-test-store", "type": "file", "source": ".bluera/bluera-knowledge/test-content" } }
   ```
   - PASS if response indicates success and contains store id

5. **store:info**: Call `execute` with:
   ```json
   { "command": "store:info", "args": { "store": "bk-test-store" } }
   ```
   - PASS if response contains store name and type

6. **store:index**: Call `execute` with:
   ```json
   { "command": "store:index", "args": { "store": "bk-test-store" } }
   ```
   - PASS if response indicates indexing started (job created)

7. **jobs**: Call `execute` with `{ command: "jobs" }`
   - PASS if response contains jobs array (may be empty if indexing completed)

8. **job:status** (if job from step 6 available): Call `execute` with:
   ```json
   { "command": "job:status", "args": { "jobId": "<job-id-from-step-6>" } }
   ```
   - PASS if response contains job status (pending, running, or completed)
   - SKIP if no job id available (indexing was synchronous)

## Part 2: MCP Search Tools

9. **search**: Call MCP tool `search` with:
   ```json
   { "query": "validateBKPlugin", "stores": ["bk-test-store"] }
   ```
   - PASS if results array is non-empty

10. **get_full_context**: Call MCP tool `get_full_context` with resultId from step 9
    - PASS if response contains code or documentation content

## Part 3: Slash Commands

11. **/stores**: Run `/bluera-knowledge:stores`
    - PASS if bk-test-store is listed

12. **/search**: Run `/bluera-knowledge:search "bluera-knowledge-test"`
    - PASS if results are shown

13. **/suggest**: Run `/bluera-knowledge:suggest`
    - PASS if no error thrown

14. **/check-status**: Run `/bluera-knowledge:check-status`
    - PASS if shows job status (may show "no active jobs")

15. **/skill-activation**: Run `/bluera-knowledge:skill-activation`
    - PASS if shows activation configuration or prompts for setup

16. **/index**: Run `/bluera-knowledge:index bk-test-store`
    - PASS if indexing completes or starts successfully

## Part 4: Web Crawl Testing

> **Note:** Web crawl functionality requires the CLI (`bluera-knowledge crawl`). MCP `store:create` only supports `file` and `repo` types. Skip this section if testing MCP-only environments.

17. **Create web store via CLI** (requires CLI access):
    ```bash
    bluera-knowledge crawl https://httpbin.org/html bk-crawl-test --max-pages 1
    ```
    - PASS if crawl completes and store is created
    - SKIP if CLI not available

18. **Verify store exists**: Call `execute` with `{ command: "stores" }`
    - PASS if bk-crawl-test appears in store list
    - SKIP if test 17 was skipped

19. **Delete crawl store**: Call `execute` with:
    ```json
    { "command": "store:delete", "args": { "store": "bk-crawl-test" } }
    ```
    - PASS if deletion succeeds
    - SKIP if test 17 was skipped

## Part 5: Hook Tests

20. **Hook Registration**:
    ```bash
    cat hooks/hooks.json | jq -e '.hooks.PostToolUse and .hooks.UserPromptSubmit and .hooks.SessionStart'
    ```
    - PASS if returns `true`

21. **PostToolUse Hook - Library Detection**:
    ```bash
    echo '{"tool_name": "Read", "tool_input": {"file_path": "/project/node_modules/express/index.js"}}' | python3 hooks/posttooluse-bk-reminder.py
    ```
    - PASS if output contains "BLUERA-KNOWLEDGE REMINDER"

22. **PostToolUse Hook - Non-Library**:
    ```bash
    echo '{"tool_name": "Read", "tool_input": {"file_path": "/project/src/index.ts"}}' | python3 hooks/posttooluse-bk-reminder.py
    ```
    - PASS if output is empty

23. **Skill Activation Hook - Matching**:
    ```bash
    export CLAUDE_PLUGIN_ROOT="$(pwd)" && echo '{"prompt": "why does the express package throw this error?"}' | python3 hooks/skill-activation.py
    ```
    - PASS if output contains "MANDATORY EVALUATION"

24. **Skill Activation Hook - Excluded**:
    ```bash
    export CLAUDE_PLUGIN_ROOT="$(pwd)" && echo '{"prompt": "/bluera-knowledge:search express"}' | python3 hooks/skill-activation.py
    ```
    - PASS if output is empty

25. **Skill Rules File**:
    ```bash
    jq -e '(.skills | length) > 0 and (.globalExclusions | length) > 0' hooks/skill-rules.json
    ```
    - PASS if returns `true`

## Part 6: Cleanup

26. **Delete test store**: Call `execute` with:
    ```json
    { "command": "store:delete", "args": { "store": "bk-test-store" } }
    ```
    - PASS if deletion succeeds

27. **Remove test content**:
    ```bash
    rm -rf .bluera/bluera-knowledge/test-content
    ```
    - PASS if command succeeds

28. **Verify store cleanup**: Call `execute` with `{ command: "stores" }`
    - PASS if bk-test-store is NOT in the list

30. **Verify no test artifacts**:
    ```bash
    test ! -d .bluera/bluera-knowledge/test-content && echo "clean"
    ```
    - PASS if outputs "clean"

---

# DEVELOPMENT MODE (`--dev`)

Use this section if `--dev` flag is present. Uses `scripts/test-mcp-dev.js`.

### Part 1: MCP Commands (via dev script)

1. **help**:
   ```bash
   node scripts/test-mcp-dev.js call execute '{"command":"help"}'
   ```
   - PASS if contains "Available commands"

2. **commands**:
   ```bash
   node scripts/test-mcp-dev.js call execute '{"command":"commands"}'
   ```
   - PASS if contains commands array

3. **stores**:
   ```bash
   node scripts/test-mcp-dev.js call execute '{"command":"stores"}'
   ```
   - PASS if no error

4. **store:create**:
   ```bash
   node scripts/test-mcp-dev.js call execute '{"command":"store:create","args":{"name":"bk-test-store","type":"file","source":".bluera/bluera-knowledge/test-content"}}'
   ```
   - PASS if success

5. **store:info**:
   ```bash
   node scripts/test-mcp-dev.js call execute '{"command":"store:info","args":{"store":"bk-test-store"}}'
   ```
   - PASS if contains store details

6. **store:index**:
   ```bash
   node scripts/test-mcp-dev.js call execute '{"command":"store:index","args":{"store":"bk-test-store"}}'
   ```
   - PASS if indexing starts

7. **jobs**:
   ```bash
   node scripts/test-mcp-dev.js call execute '{"command":"jobs"}'
   ```
   - PASS if returns jobs array

8. **job:status** (if job available):
   ```bash
   node scripts/test-mcp-dev.js call execute '{"command":"job:status","args":{"jobId":"<job-id>"}}'
   ```
   - PASS if returns status

### Part 2: Search (via dev script)

9-10. **Search + Get Full Context**:
   ```bash
   node scripts/test-mcp-dev.js session << 'EOF'
search {"query":"validateBKPlugin","stores":["bk-test-store"]}
get_full_context {"resultId":"$LAST_ID"}
EOF
   ```
   - PASS if search returns results and context contains content

### Part 3: Slash Commands (SKIPPED in --dev mode)

Tests 11-16 are skipped - slash commands require Claude's skill router.

### Part 4: Web Crawl (via dev script)

17. **Create crawl store**:
    ```bash
    node scripts/test-mcp-dev.js call execute '{"command":"store:create","args":{"name":"bk-crawl-test","type":"web","source":"https://httpbin.org/html","options":{"maxPages":1}}}'
    ```
    - PASS if returns job id

18. **Verify crawl job**:
    ```bash
    node scripts/test-mcp-dev.js call execute '{"command":"jobs"}'
    ```
    - PASS if job appears

19. **job:cancel** (if running):
    ```bash
    node scripts/test-mcp-dev.js call execute '{"command":"job:cancel","args":{"jobId":"<crawl-job-id>"}}'
    ```
    - PASS if cancelled or completed

20. **Delete crawl store**:
    ```bash
    node scripts/test-mcp-dev.js call execute '{"command":"store:delete","args":{"store":"bk-crawl-test"}}'
    ```
    - PASS if deleted

### Part 5: Hook Tests (same as production)

[Tests 21-26 - same bash commands as production mode]

### Part 6: Cleanup (via dev script)

27-30: Same cleanup steps using dev script for MCP calls.

---

## Output Format

### Production mode (30 tests):

| # | Test | Status |
|---|------|--------|
| 1 | MCP help | ? |
| 2 | MCP commands | ? |
| 3 | MCP stores | ? |
| 4 | MCP store:create | ? |
| 5 | MCP store:info | ? |
| 6 | MCP store:index | ? |
| 7 | MCP jobs | ? |
| 8 | MCP job:status | ? |
| 9 | MCP search | ? |
| 10 | MCP get_full_context | ? |
| 11 | /stores | ? |
| 12 | /search | ? |
| 13 | /suggest | ? |
| 14 | /check-status | ? |
| 15 | /skill-activation | ? |
| 16 | /index | ? |
| 17 | Crawl store create | ? |
| 18 | Crawl job verify | ? |
| 19 | Crawl job:cancel | ? |
| 20 | Crawl store delete | ? |
| 21 | Hook registration | ? |
| 22 | PostToolUse - library | ? |
| 23 | PostToolUse - non-library | ? |
| 24 | Skill activation - match | ? |
| 25 | Skill activation - exclude | ? |
| 26 | Skill rules file | ? |
| 27 | Delete test store | ? |
| 28 | Remove test content | ? |
| 29 | Verify store cleanup | ? |
| 30 | Verify no artifacts | ? |

**Result: X/30 tests passed**

### Development mode (24 tests):

Same table but tests 11-16 show "SKIPPED (--dev mode)"

**Result: X/24 tests passed (6 skipped)**

---

## Error Recovery

If tests fail partway through, clean up manually:

```bash
# Delete test stores
node scripts/test-mcp-dev.js call execute '{"command":"store:delete","args":{"store":"bk-test-store"}}' 2>/dev/null || true
node scripts/test-mcp-dev.js call execute '{"command":"store:delete","args":{"store":"bk-crawl-test"}}' 2>/dev/null || true

# Remove test content
rm -rf .bluera/bluera-knowledge/test-content
```
