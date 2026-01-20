# Commands Reference

Complete reference for all Bluera Knowledge slash commands.

## Quick Reference

| Command | Purpose | Arguments |
|---------|---------|-----------|
| `/bluera-knowledge:suggest` | Analyze project dependencies | None |
| `/bluera-knowledge:add-repo` | Clone and index Git repository | `<url> [--name=<name>] [--branch=<branch>]` |
| `/bluera-knowledge:add-folder` | Index local folder | `<path> [--name=<name>]` |
| `/bluera-knowledge:search` | Search knowledge stores | `"<query>" [--stores=<names>] [--limit=<N>]` |
| `/bluera-knowledge:stores` | List all stores | None |
| `/bluera-knowledge:index` | Re-index a store | `<store-name-or-id>` |
| `/bluera-knowledge:remove-store` | Delete a store and all data | `<store-name-or-id>` |
| `/bluera-knowledge:crawl` | Crawl web pages | `<url> <store-name> [--crawl "<instruction>"]` |
| `/bluera-knowledge:sync` | Sync stores from definitions config | `[--dry-run] [--prune]` |
| `/bluera-knowledge:check-status` | Check status of background operations | None |
| `/bluera-knowledge:cancel` | Cancel a background job | `<job-id>` |
| `/bluera-knowledge:uninstall` | Remove Bluera Knowledge data | None |
| `/bluera-knowledge:skill-activation` | Toggle skill auto-activation | `[--enable] [--disable]` |
| `/bluera-knowledge:test-plugin` | Run plugin validation tests | None |

---

## `/bluera-knowledge:suggest`

**Analyze your project to suggest libraries worth indexing as knowledge stores**

```bash
/bluera-knowledge:suggest
```

Scans source files, counts import statements, and suggests the top 5 most-used dependencies with their repository URLs.

**Supported languages:**

| Language | Manifest File | Registry |
|----------|---------------|----------|
| JavaScript/TypeScript | `package.json` | NPM |
| Python | `requirements.txt`, `pyproject.toml` | PyPI |
| Rust | `Cargo.toml` | crates.io |
| Go | `go.mod` | Go modules |

<details>
<summary><b>Expected Output</b></summary>

```
## Dependency Analysis

Scanned 342 source files and found 24 dependencies.

### Top Dependencies by Usage

1. **react** (156 imports across 87 files)
   Repository: https://github.com/facebook/react

   Add with:
   /bluera-knowledge:add-repo https://github.com/facebook/react --name=react

2. **vitest** (40 imports across 40 files)
   Repository: https://github.com/vitest-dev/vitest

   Add with:
   /bluera-knowledge:add-repo https://github.com/vitest-dev/vitest --name=vitest

3. **lodash** (28 imports across 15 files)
   Repository: https://github.com/lodash/lodash

   Add with:
   /bluera-knowledge:add-repo https://github.com/lodash/lodash --name=lodash

---

Already indexed: typescript, express
```
</details>

---

## `/bluera-knowledge:add-repo`

**Clone and index a Git repository**

```bash
/bluera-knowledge:add-repo <url> [--name=<name>] [--branch=<branch>]
```

**Examples:**
```bash
/bluera-knowledge:add-repo https://github.com/lodash/lodash
/bluera-knowledge:add-repo https://github.com/facebook/react --branch=main --name=react
```

<details>
<summary><b>Expected Output</b></summary>

```
✓ Cloning https://github.com/facebook/react...
✓ Created store: react (a1b2c3d4...)
  Location: .bluera/bluera-knowledge/data/repos/a1b2c3d4.../

✓ Indexing...
✓ Indexed 1,247 files

Store is ready for searching!
```
</details>

---

## `/bluera-knowledge:add-folder`

**Index a local folder**

```bash
/bluera-knowledge:add-folder <path> [--name=<name>]
```

**Use cases:**
- Project documentation
- Coding standards
- Design documents
- API specifications
- Reference materials
- Any other content

**Examples:**
```bash
/bluera-knowledge:add-folder ./docs --name=project-docs
/bluera-knowledge:add-folder ./architecture --name=design-docs
```

<details>
<summary><b>Expected Output</b></summary>

```
✓ Adding folder: ~/my-project/docs...
✓ Created store: project-docs (e5f6g7h8...)
  Location: ~/my-project/docs

✓ Indexing...
✓ Indexed 342 files

Store is ready for searching!
```
</details>

---

## `/bluera-knowledge:search`

**Search across indexed knowledge stores**

```bash
/bluera-knowledge:search "<query>" [--stores=<names>] [--limit=<number>] [--min-relevance=<0-1>]
```

**Options:**
- `--stores=<names>` - Comma-separated store names to search (default: all stores)
- `--limit=<number>` - Maximum results to return (default: 10)
- `--min-relevance=<0-1>` - Minimum raw cosine similarity; returns empty if no results meet threshold
- `--threshold=<0-1>` - Minimum normalized score to include results
- `--mode=<mode>` - Search mode: `hybrid` (default), `vector`, or `fts`
- `--detail=<level>` - Context detail: `contextual` (default), `minimal`, or `full`

**Examples:**
```bash
# Search all stores
/bluera-knowledge:search "how to invalidate queries"

# Search specific store
/bluera-knowledge:search "useState implementation" --stores=react

# Search multiple stores (comma-separated)
/bluera-knowledge:search "deep clone" --stores=react,lodash

# Limit results
/bluera-knowledge:search "testing patterns" --limit=5

# Filter irrelevant results (returns empty if nothing is truly relevant)
/bluera-knowledge:search "kubernetes deployment" --min-relevance=0.4
```

<details>
<summary><b>Expected Output</b></summary>

```
## Search Results: "button component" (hybrid search)

**1. [Score: 0.95] [Vector+FTS]**
Store: react
File: src/components/Button.tsx
Purpose: → Reusable button component with variants
Top Terms: (in this chunk): button, variant, size, color, onClick
Imports: (in this chunk): React, clsx

**2. [Score: 0.87] [Vector]**
Store: react
File: src/hooks/useButton.ts
Purpose: → Custom hook for button state management
Top Terms: (in this chunk): hook, state, pressed, disabled
Imports: (in this chunk): useState, useCallback

**3. [Score: 0.81] [Vector+FTS]**
Store: react
File: src/components/IconButton.tsx
Purpose: → Button component with icon support
Top Terms: (in this chunk): icon, button, aria-label, accessible

---
**Found 3 results in 45ms**

**Next Steps:**
- Read file: `Read src/components/Button.tsx`
- Get full code: `mcp__bluera-knowledge__get_full_context("result-id")`
- Refine search: Use keywords above
```
</details>

---

## `/bluera-knowledge:stores`

**List all indexed knowledge stores**

```bash
/bluera-knowledge:stores
```

Shows store name, type, ID, and source location in a clean table format.

<details>
<summary><b>Expected Output</b></summary>

```
| Name | Type | ID | Source |
|------|------|----|--------------------|
| react | repo | 459747c7 | https://github.com/facebook/react |
| crawl4ai | repo | b5a72a94 | https://github.com/unclecode/crawl4ai.git |
| project-docs | file | 70f6309b | ~/repos/my-project/docs |
| claude-docs | web | 9cc62018 | https://code.claude.com/docs |

**Total**: 4 stores
```
</details>

---

## `/bluera-knowledge:index`

**Re-index an existing store to update the search index**

```bash
/bluera-knowledge:index <store-name-or-id>
```

**When to re-index:**
- The source repository has been updated (for repo stores)
- Files have been added or modified (for file stores)
- Search results seem out of date

**Example:**
```bash
/bluera-knowledge:index react
```

<details>
<summary><b>Expected Output</b></summary>

```
✓ Indexing store: react...
✓ Indexed 1,247 documents in 3,421ms

Store search index is up to date!
```
</details>

---

## `/bluera-knowledge:remove-store`

**Delete a knowledge store and all associated data**

```bash
/bluera-knowledge:remove-store <store-name-or-id>
```

**What gets deleted:**
- Store registry entry
- LanceDB search index (vector embeddings)
- Cloned repository files (for repo stores created from URLs)

**Example:**
```bash
/bluera-knowledge:remove-store react
```

<details>
<summary><b>Expected Output</b></summary>

```
Store "react" deleted successfully.

Removed:
- Store registry entry
- LanceDB search index
- Cloned repository files
```
</details>

---

## `/bluera-knowledge:crawl`

**Crawl web pages with natural language control**

```bash
/bluera-knowledge:crawl <url> <store-name> [options]
```

**Options:**
- `--crawl "<instruction>"` - Natural language instruction for which pages to crawl
- `--extract "<instruction>"` - Natural language instruction for what content to extract
- `--simple` - Use simple BFS mode instead of intelligent crawling
- `--max-pages <n>` - Maximum pages to crawl (default: 50)
- `--fast` - Use fast axios-only mode (may fail on JavaScript-heavy sites)

**Requirements:**
- Python 3 with `crawl4ai` package installed
- Web store is auto-created if it doesn't exist

**Examples:**
```bash
# Basic crawl
/bluera-knowledge:crawl https://docs.example.com/guide my-docs

# Intelligent crawl with custom strategy
/bluera-knowledge:crawl https://react.dev react-docs --crawl "all API reference pages"

# Extract specific content from pages
/bluera-knowledge:crawl https://example.com/pricing pricing --extract "pricing tiers and features"

# Combine crawl strategy + extraction
/bluera-knowledge:crawl https://docs.python.org python-docs \
  --crawl "standard library modules" \
  --extract "function signatures and examples"

# JavaScript-rendered sites work by default (uses headless browser)
/bluera-knowledge:crawl https://nextjs.org/docs nextjs-docs --max-pages 30

# Fast mode for static HTML sites (axios-only, faster but may miss JS content)
/bluera-knowledge:crawl https://example.com/static static-docs --fast --max-pages 100

# Simple BFS mode (no AI guidance)
/bluera-knowledge:crawl https://example.com/docs docs --simple --max-pages 100
```

The crawler converts pages to markdown and indexes them for semantic search.

---

## `/bluera-knowledge:sync`

**Sync stores from definitions config (bootstrap on fresh clone)**

```bash
/bluera-knowledge:sync [options]
```

**Options:**
- `--dry-run` - Show what would happen without making changes
- `--prune` - Remove stores not in definitions
- `--reindex` - Re-index existing stores after sync

**Use cases:**
- **Fresh clone**: Recreate all stores defined by the team
- **Check status**: See which stores exist vs. defined
- **Clean up**: Remove orphan stores not in config

**Examples:**
```bash
# Preview what would be synced
/bluera-knowledge:sync --dry-run

# Sync all stores from definitions
/bluera-knowledge:sync

# Sync and remove orphan stores
/bluera-knowledge:sync --prune
```

**How it works:**
1. Reads store definitions from `.bluera/bluera-knowledge/stores.config.json`
2. Creates any stores that don't exist locally
3. Reports orphan stores (local stores not in definitions)
4. Optionally prunes orphans with `--prune`

---

## `/bluera-knowledge:check-status`

**Check status of background operations**

```bash
/bluera-knowledge:check-status [job-id]
```

Shows the status of active background jobs or details about a specific job.

**Examples:**
```bash
# List all active jobs
/bluera-knowledge:check-status

# Check specific job
/bluera-knowledge:check-status job_abc123def456
```

<details>
<summary><b>Expected Output</b></summary>

For all active jobs:
```
Active Background Jobs
───────────────────────────────────────────────────────────────
| Job ID            | Type  | Status  | Progress | Started  |
|-------------------|-------|---------|----------|----------|
| job_abc123def456  | clone | running | 45%      | 2m ago   |
| job_xyz789ghi012  | index | pending | 0%       | Just now |

Use /bluera-knowledge:check-status <job-id> for details
```

For a specific job:
```
Job Status: job_abc123def456
───────────────────────────────────────
Type:     clone
Status:   running
Progress: 45%
Message:  Indexed 562/1,247 files
Started:  2 minutes ago
```
</details>

---

## `/bluera-knowledge:cancel`

**Cancel a background job**

```bash
/bluera-knowledge:cancel <job-id>
```

Cancels a running or pending background job.

**When to cancel:**
- Accidentally started indexing the wrong repository
- Operation is taking too long
- Need to free up system resources
- Want to stop before completion

**Example:**
```bash
/bluera-knowledge:cancel job_abc123def456
```

<details>
<summary><b>Expected Output</b></summary>

```
✓ Job job_abc123def456 cancelled
  Type: clone
  Progress: 45% (was indexing)

The job has been stopped and will not continue.
```
</details>

**Notes:**
- Only jobs in 'pending' or 'running' status can be cancelled
- Completed or failed jobs cannot be cancelled
- Partial work may be saved (e.g., partially indexed files remain in the database)

---

## `/bluera-knowledge:uninstall`

**Remove Bluera Knowledge data from this project**

```bash
/bluera-knowledge:uninstall
```

Removes all Bluera Knowledge data from the current project.

**What gets deleted:**
- `data/` - Vector indices, cloned repos, stores.json
- `config.json` - Plugin configuration
- Optionally `stores.config.json` - Store definitions

**What is NOT deleted:**
- Plugin cache (managed by Claude Code)
- Python venv (inside plugin cache)

<details>
<summary><b>Expected Output</b></summary>

```
Uninstalling Bluera Knowledge...

Deleted:
- .bluera/bluera-knowledge/data/ (vector indices, cloned repos)
- .bluera/bluera-knowledge/config.json

Preserved:
- .bluera/bluera-knowledge/stores.config.json (team sharing)

To test a completely fresh plugin install:
1. Exit Claude Code
2. Clear plugin cache: rm -rf ~/.claude/plugins/cache/bluera-knowledge-*
3. Restart Claude Code and reinstall the plugin
```
</details>

---

## `/bluera-knowledge:skill-activation`

**Toggle skill auto-activation on/off or configure individual skills**

```bash
/bluera-knowledge:skill-activation [on|off|status|config]
```

Manages the skill auto-activation system that suggests relevant skills based on your prompts.

**Subcommands:**
- `status` (default) - Show current configuration
- `on` - Enable skill activation
- `off` - Disable skill activation
- `config` - Interactive skill configuration

**Examples:**
```bash
# Show current status
/bluera-knowledge:skill-activation

# Enable skill suggestions
/bluera-knowledge:skill-activation on

# Disable skill suggestions
/bluera-knowledge:skill-activation off

# Configure individual skills
/bluera-knowledge:skill-activation config
```

<details>
<summary><b>Expected Output</b></summary>

```
## Skill Activation Status

**Status**: Enabled
**Threshold**: 1

### Individual Skills
| Skill | Status |
|-------|--------|
| knowledge-search | enabled |
| when-to-query | enabled |
| search-optimization | enabled |
| advanced-workflows | enabled |
| store-lifecycle | enabled |

Use `/bluera-knowledge:skill-activation config` to toggle individual skills.
```
</details>

**Configuration file:** `.bluera/bluera-knowledge/skill-activation.json` (per-project)

---

## `/bluera-knowledge:test-plugin`

**Run comprehensive plugin validation test suite**

```bash
/bluera-knowledge:test-plugin [--dev]
```

Tests all Bluera Knowledge plugin functionality including MCP tools, slash commands, web crawling, and hooks.

**Options:**
- `--dev` - Development mode: spawns MCP server directly, skips slash command tests

**Test coverage:**

| Category | Tests |
|----------|-------|
| MCP execute commands | help, commands, stores, store:create, store:info, store:index, store:delete, jobs, job:status, job:cancel |
| MCP tools | search, get_full_context |
| Slash commands | stores, search, suggest, check-status, skill-activation, index, add-folder |
| Web crawling | crawl (start job, verify status, cancel) |
| Hooks | PostToolUse, UserPromptSubmit, SessionStart |

**When to use each mode:**

| Scenario | Command | Tests |
|----------|---------|-------|
| Plugin installed normally | `/test-plugin` | 30/30 (full suite) |
| Development without plugin loaded | `/test-plugin --dev` | 24/30 (no slash cmds) |

<details>
<summary><b>Expected Output</b></summary>

```
| # | Test | Status |
|---|------|--------|
| 1 | MCP help | PASS |
| 2 | MCP commands | PASS |
| 3 | MCP stores | PASS |
| ... | ... | ... |
| 30 | Verify no artifacts | PASS |

**Result: 30/30 tests passed**
```
</details>
