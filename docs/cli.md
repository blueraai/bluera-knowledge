# CLI Reference

Complete reference for the Bluera Knowledge CLI tool (npm package).

> **Note:** When using CLI without Claude Code installed, web crawling uses simple BFS mode. Install Claude Code to unlock `--crawl` (AI-guided URL selection) and `--extract` (AI content extraction) instructions.

## Installation

```bash
# Global install (CLI available everywhere)
npm install -g bluera-knowledge

# Or project install
npm install --save-dev bluera-knowledge
```

---

## Store Management

### Create a Store

```bash
# Add a Git repository
bluera-knowledge store create react --type repo --source https://github.com/facebook/react

# Add a Git repository with specific branch
bluera-knowledge store create react-canary --type repo --source https://github.com/facebook/react --branch canary

# Add a local folder
bluera-knowledge store create my-docs --type file --source ./docs

# Create a web store (requires crawl command to populate)
bluera-knowledge store create fastapi-docs --type web --source https://fastapi.tiangolo.com
# Then populate with: bluera-knowledge crawl https://fastapi.tiangolo.com fastapi-docs
```

> **Note:** Web stores created with `store create --type web` are empty shells. Use the `crawl` command to populate them with content. The `index` command does not work for web stores.

> **Note:** The CLI only accepts HTTP(S) URLs for repository sources. SSH URLs (`git@github.com:...`) are not supported—use the HTTPS URL instead.

**Create Options:**

| Option | Description |
|--------|-------------|
| `-t, --type <type>` | Store type: `file`, `repo`, or `web` (required) |
| `-s, --source <path>` | Local path or URL (required) |
| `-b, --branch <branch>` | Git branch to clone (repo stores only) |
| `-d, --description <desc>` | Optional store description |
| `--tags <tags>` | Comma-separated tags to assign |

### List Stores

```bash
bluera-knowledge store list
bluera-knowledge store list --type repo  # Filter by type
```

### Store Info

```bash
bluera-knowledge store info react
```

### Delete a Store

```bash
# Interactive deletion (prompts for confirmation in TTY mode)
bluera-knowledge store delete old-store

# Force delete without confirmation
bluera-knowledge store delete old-store --force
bluera-knowledge store delete old-store -y
```

**Delete Options:**

| Option | Description |
|--------|-------------|
| `-f, --force` | Delete without confirmation prompt |
| `-y, --yes` | Alias for `--force` |

---

## Indexing

### Index a Store

```bash
# Re-index a store (only changed files)
bluera-knowledge index react

# Force re-index all files (ignores cache)
bluera-knowledge index react --force

# Watch for changes and auto-reindex
bluera-knowledge index watch react
bluera-knowledge index watch react --debounce 2000  # Custom debounce (default: 1000ms)
```

**Index Options:**

| Option | Description |
|--------|-------------|
| `--force` | Re-index all files (ignore incremental cache) |

**Watch Options:**

| Option | Description |
|--------|-------------|
| `--debounce <ms>` | Debounce delay for file changes (default: 1000ms) |

> **Note:** Watch mode only supports `file` and `repo` stores. Web stores cannot be watched.

---

## Searching

```bash
# Search across all stores
bluera-knowledge search "how does useEffect work"

# Search specific stores
bluera-knowledge search "routing" --stores react,vue

# Get more results with full content (equivalent to --detail full)
bluera-knowledge search "middleware" --limit 20 --detail full

# Filter irrelevant results (returns empty if nothing is truly relevant)
bluera-knowledge search "kubernetes deployment" --min-relevance 0.4

# Get JSON output with confidence and raw scores
bluera-knowledge search "express middleware" --format json
```

**Search Options:**

| Option | Description |
|--------|-------------|
| `-s, --stores <stores>` | Comma-separated store names/IDs |
| `-m, --mode <mode>` | `hybrid` (default), `vector`, or `fts` |
| `-n, --limit <count>` | Max results (default: 10) |
| `-t, --threshold <score>` | Min normalized score (0-1) |
| `--min-relevance <score>` | Min raw cosine similarity (0-1) |
| `--detail <level>` | `minimal` (default), `contextual`, or `full` |

---

## Global Options

```bash
--config <path>        # Custom config file
--data-dir <path>      # Custom data directory
--project-root <path>  # Project root for store definitions (auto-detected from git root or current directory)
--format <format>      # Output format: json | table | plain
--quiet                # Suppress non-essential output
--verbose              # Enable verbose logging
```

---

## When to Use CLI vs Plugin

**Use CLI when:**
- Using an editor other than Claude Code (VSCode, Cursor, etc.)
- Integrating into CI/CD pipelines
- Scripting or automation
- Pre-indexing dependencies for teams

**Use Plugin when:**
- Working within Claude Code
- Want slash commands (`/bluera-knowledge:search`)
- Need Claude to automatically query your knowledge base
- Want Skills to guide optimal usage

Both interfaces use the same underlying services, so you can switch between them seamlessly.

---

## Sync Stores

```bash
# Sync stores from definitions config (bootstrap on fresh clone)
bluera-knowledge sync [options]
```

**Sync Options:**

| Option | Description |
|--------|-------------|
| `--dry-run` | Show what would happen without making changes |
| `--prune` | Remove stores not in definitions |
| `--reindex` | Re-index existing stores after sync |

---

## Additional Commands

### Crawl Web Pages

> **Prerequisites:** Crawling requires Python 3 with `crawl4ai` package. Headless mode also requires Playwright browsers (`playwright install chromium`).

```bash
# Crawl a website
bluera-knowledge crawl <url> <store-name> [options]

# Examples
bluera-knowledge crawl https://docs.example.com my-docs
bluera-knowledge crawl https://react.dev react-docs --crawl "API reference pages"
bluera-knowledge crawl https://example.com pricing --extract "pricing tiers"
bluera-knowledge crawl https://example.com docs --simple --max-pages 100
```

**Crawl Options:**

| Option | Description |
|--------|-------------|
| `--crawl <instruction>` | Natural language instruction for which pages to crawl |
| `--extract <instruction>` | Natural language instruction for what content to extract |
| `--simple` | Use simple BFS mode instead of intelligent crawling |
| `--max-pages <n>` | Maximum pages to crawl (default: 50) |
| `--fast` | Use fast axios-only mode (may fail on JS-heavy sites) |

> **Note:** The crawl command automatically creates a web store if one doesn't exist with the specified name.

### Start MCP Server

```bash
# Start the MCP server for external integrations
bluera-knowledge mcp [options]

# Examples
bluera-knowledge mcp
bluera-knowledge mcp --project-root /path/to/project
```

Starts the Model Context Protocol server for integration with AI agents and external tools.

> **Note:** When used as a Claude Code plugin, `projectRoot` is typically passed via the `PROJECT_ROOT` environment variable. The CLI flag also works.

### Serve HTTP API

```bash
# Start HTTP server for REST API access
bluera-knowledge serve [options]

# Examples
bluera-knowledge serve
bluera-knowledge serve --port 3000
bluera-knowledge serve --host 0.0.0.0  # Listen on all interfaces
```

**Serve Options:**

| Option | Description |
|--------|-------------|
| `-p, --port <port>` | Port to listen on (default: 3847) |
| `--host <host>` | Bind address (default: 127.0.0.1, use 0.0.0.0 for all interfaces) |

Starts an HTTP server exposing the search and store management APIs.

**Available Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/stores` | List all stores |
| POST | `/api/stores` | Create a store |
| GET | `/api/stores/:id` | Get store info |
| DELETE | `/api/stores/:id` | Delete a store |
| POST | `/api/search` | Search across stores |
| POST | `/api/stores/:id/index` | Trigger indexing for a store |

### Setup

```bash
# Clone and index pre-configured Claude/Anthropic documentation repos
bluera-knowledge setup repos [options]

# Examples
bluera-knowledge setup repos
bluera-knowledge setup repos --only claude,anthropic
bluera-knowledge setup repos --list
```

**Setup Options:**

| Option | Description |
|--------|-------------|
| `--repos-dir <path>` | Clone destination (default: ~/.bluera/bluera-knowledge/repos/) |
| `--skip-clone` | Don't clone; assume repos already exist locally |
| `--skip-index` | Clone and create stores but don't index yet |
| `--only <names>` | Only process matching repos (comma-separated, partial match) |
| `--list` | Print available repos without cloning/indexing |

> **Note:** The default repositories use SSH URLs (`git@github.com:...`). You must have SSH keys configured for GitHub. Alternatively, use `--list` to see repos and clone them manually with HTTPS URLs.

### Plugin API Commands

These CLI commands mirror the Claude Code slash commands:

| Command | Description |
|---------|-------------|
| `add-repo <url>` | Clone and index a library source repository |
| `add-folder <path>` | Index a local folder of reference material |
| `stores` | List all indexed library stores |
| `suggest` | Suggest important dependencies to add to knowledge stores |

**Options for `add-repo`:**

| Option | Description |
|--------|-------------|
| `--name <name>` | Custom store name (defaults to repo name) |
| `--branch <branch>` | Git branch to clone |

**Options for `add-folder`:**

| Option | Description |
|--------|-------------|
| `--name <name>` | Custom store name (defaults to folder name) |

**Examples:**
```bash
bluera-knowledge add-repo https://github.com/lodash/lodash
bluera-knowledge add-repo https://github.com/facebook/react --branch=main --name=react
bluera-knowledge add-folder ./docs --name=project-docs
bluera-knowledge stores
bluera-knowledge suggest
```
