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

# Add a web crawl
bluera-knowledge store create fastapi-docs --type web --source https://fastapi.tiangolo.com
```

**Create Options:**

| Option | Description |
|--------|-------------|
| `-t, --type <type>` | Store type: `file`, `repo`, or `web` (required) |
| `-s, --source <path>` | Local path or URL (required) |
| `-b, --branch <branch>` | Git branch to clone (repo stores only) |
| `-d, --description <desc>` | Optional store description |
| `--tags <tags>` | Comma-separated tags for filtering |

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
| `-f, --force` | Re-index all files (ignore incremental cache) |

**Watch Options:**

| Option | Description |
|--------|-------------|
| `--debounce <ms>` | Debounce delay for file changes (default: 1000ms) |

---

## Searching

```bash
# Search across all stores
bluera-knowledge search "how does useEffect work"

# Search specific stores
bluera-knowledge search "routing" --stores react,vue

# Get more results with full content
bluera-knowledge search "middleware" --limit 20 --include-content

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
| `--include-content` | Show full content in results |
| `--detail <level>` | `minimal`, `contextual`, or `full` |

---

## Global Options

```bash
--config <path>        # Custom config file
--data-dir <path>      # Custom data directory
--project-root <path>  # Project root for store definitions (required for sync)
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
