# 🧠 Bluera Knowledge

[![CI](https://github.com/blueraai/bluera-knowledge/actions/workflows/ci.yml/badge.svg)](https://github.com/blueraai/bluera-knowledge/actions/workflows/ci.yml)
![NPM Version](https://img.shields.io/npm/v/bluera-knowledge)
![NPM Downloads](https://img.shields.io/npm/dm/bluera-knowledge)
![License](https://img.shields.io/badge/license-MIT-green)
![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen)
![Python](https://img.shields.io/badge/python-%3E%3D3.8-blue)

> 🚀 **Build a local knowledge base for your AI coding agent—dependency source code, crawled docs, and your own files, all instantly searchable.**

**Two ways to use it:**

| | npm Package | Claude Code Plugin |
|--|-------------|-------------------|
| **Install** | `npm install -g bluera-knowledge` | `/plugin install bluera-knowledge@bluera` |
| **Interface** | CLI commands | Slash commands + MCP tools |
| **Works with** | Any AI tool, any editor | Claude Code specifically |
| **Best for** | CI/CD, automation, other editors | Native Claude Code integration |

Both provide the same core functionality: index repos, crawl docs, semantic search.

Bluera Knowledge gives AI coding agents instant local access to authoritative context:

- **Dependency source code** — Clone and search the repos of dependencies you actually use
- **Documentation** — Crawl, index, and search any docs site
- **Your files** — Index and search local folders for project-specific knowledge

All searchable in milliseconds, no rate limits, fully offline.

## 📑 Table of Contents

<details>
<summary>Click to expand</summary>

- [Installation](#-installation)
- [Why Bluera Knowledge?](#-why-bluera-knowledge)
- [When to Query BK](#-when-claude-code-should-query-bk)
- [Quick Start](#-quick-start)
- [Features](#-features)
- [How It Works](#-how-it-works)
- [User Interface](#-user-interface)
- [Background Jobs](#-background-jobs)
- [Use Cases](#-use-cases)
- [Skills for Claude Code](#-skills-for-claude-code)
- [Data Storage](#-data-storage)
- [Troubleshooting](#-troubleshooting)
- [Dependencies](#-dependencies)
- [Technologies](#-technologies)
- [Documentation](#-documentation)
- [Contributing](#-contributing)
- [License](#-license)

</details>

---

## 📦 Installation

### npm Package (CLI)

```bash
# Global install (CLI available everywhere)
npm install -g bluera-knowledge

# Or project install
npm install --save-dev bluera-knowledge
```

Works with any AI coding tool, editor, CI/CD pipeline, or automation.

### Claude Code Plugin

```bash
# Add the Bluera marketplace (one-time setup)
/plugin marketplace add blueraai/bluera-marketplace

# Install the plugin (or use /plugin to browse the UI)
/plugin install bluera-knowledge@bluera
```

Adds slash commands, MCP tools, and Skills for optimal Claude Code integration.

> [!NOTE]
> **First launch may appear to hang** while the plugin installs Python dependencies (crawl4ai). This is normal—subsequent launches are instant.

---

## ✨ Why Bluera Knowledge?

When your AI coding assistant needs to answer "how do I handle errors in Express middleware?", it can:

1. **Guess from training data** — might be outdated or wrong
2. **Search the web** — slow, rate-limited, often returns blog posts instead of source
3. **Read your local knowledge base** — authoritative, complete, instant ✅

Bluera Knowledge enables option 3 by building a searchable knowledge base from **three types of sources**:

| Source Type | What It Does | Example |
|------------|--------------|---------|
| **📦 Dependency Source Code** | Clone & search library repos you actually use | Express, React, Lodash |
| **🌐 Documentation Sites** | Crawl & index any docs site | Next.js docs, FastAPI guides |
| **📁 Local Files** | Index project-specific content | Your docs, standards, API specs |

**The result:** Your AI agent has local, instant access to authoritative information with zero rate limits:

| Capability | Without | With Bluera Knowledge |
|------------|---------|----------------------|
| Response time | 2-5 seconds (web) | ~100ms (local) |
| Accuracy | Uncertain | Authoritative (source code + docs) |
| Completeness | Partial docs | Full implementation + tests + your content |
| Rate limits | Yes | None |

---

## 🎯 When Claude Code Should Query BK

**The simple rule: Query BK for any question about libraries, dependencies, or reference material.**

BK is cheap (~100ms, no rate limits), authoritative (actual source code), and complete (includes tests and internal APIs). Claude Code should query it frequently for external code questions.

### Always Query BK For:

| Question Type | Examples |
|--------------|----------|
| **Library internals** | "How does Express handle middleware errors?", "What does useEffect cleanup do?" |
| **API signatures** | "What parameters does axios.create() accept?", "What options can I pass to Hono?" |
| **Error handling** | "What errors can Zod throw?", "Why might this library return undefined?" |
| **Version behavior** | "What changed in React 18?", "Is this method deprecated?" |
| **Configuration** | "What config options exist for Vite?", "What are the defaults?" |
| **Testing patterns** | "How do the library authors test this?", "How should I mock this?" |
| **Performance/internals** | "Is this cached internally?", "What's the complexity?" |
| **Security** | "How does this library validate input?", "Is this safe against injection?" |
| **Integration** | "How do I integrate X with Y?", "What's the idiomatic way to use this?" |

### DO NOT Query BK For:

| Question Type | Use Instead |
|--------------|-------------|
| **Your project code** | Grep/Read directly ("Where is OUR auth middleware?") |
| **General concepts** | Training data ("What is a closure?") |
| **Breaking news** | Web search ("Latest React release notes") |

### Quick Pattern Matching:

```
"How does [library] work..."           → Query BK
"What does [library function] do..."   → Query BK
"What options does [library] accept..."→ Query BK
"What errors can [library] throw..."   → Query BK
"Where is [thing] in OUR code..."      → Grep/Read directly
"What is [general concept]..."         → Training data
```

---

## 🚀 Quick Start

### Using Claude Code Plugin

- [ ] **📦 Add a library**: `/bluera-knowledge:add-repo https://github.com/lodash/lodash`
- [ ] **📁 Index your docs**: `/bluera-knowledge:add-folder ./docs --name=project-docs`
- [ ] **🔍 Test search**: `/bluera-knowledge:search "deep clone object"`
- [ ] **📋 View stores**: `/bluera-knowledge:stores`

> [!TIP]
> Not sure which libraries to index? Use `/bluera-knowledge:suggest` to analyze your project's dependencies.

### Using CLI (npm package)

```bash
# Add a library
bluera-knowledge store create lodash --type repo --source https://github.com/lodash/lodash

# Index your docs
bluera-knowledge store create project-docs --type file --source ./docs

# Test search
bluera-knowledge search "deep clone object"

# View stores
bluera-knowledge store list
```

---

## ✨ Features

### 🎯 Core Features

- **🔬 Smart Dependency Analysis** - Automatically scans your project to identify which libraries are most heavily used by counting import statements across all source files
- **📊 Usage-Based Suggestions** - Ranks dependencies by actual usage frequency, showing you the top 5 most-imported packages with import counts and file counts
- **🔍 Automatic Repository Discovery** - Queries package registries (NPM, PyPI, crates.io, Go modules) to automatically find GitHub repository URLs
- **📦 Git Repository Indexing** - Clones and indexes dependency source code for both semantic search and direct file access
- **📁 Local Folder Indexing** - Indexes any local content - documentation, standards, reference materials, or custom content
- **🌐 Web Crawling** - Crawl and index web pages using `crawl4ai` - convert documentation sites to searchable markdown

### 🔍 Search Modes

- **🧠 Vector Search** - AI-powered semantic search with relevance ranking
- **📂 File Access** - Direct Grep/Glob operations on cloned source files

### 🗺️ Code Graph Analysis

- **📊 Code Graph Analysis** - During indexing, builds a graph of code relationships (calls, imports, extends) to provide usage context in search results - shows how many callers/callees each function has
- **🌐 Multi-Language Support** - Full AST parsing for JavaScript, TypeScript, Python, Rust, and Go; indexes code in any language
- **🔌 MCP Integration** - Exposes all functionality as Model Context Protocol tools for AI coding agents

### 🌍 Language-Specific Features

While bluera-knowledge indexes and searches code in any language, certain advanced features are language-specific:

| Language | Code Graph | Call Analysis | Import Tracking | Method Tracking |
|----------|------------|---------------|-----------------|-----------------|
| **TypeScript/JavaScript** | ✅ Full Support | ✅ Functions & Methods | ✅ Full | ✅ Class Methods |
| **Python** | ✅ Full Support | ✅ Functions & Methods | ✅ Full | ✅ Class Methods |
| **Rust** | ✅ Full Support | ✅ Functions & Methods | ✅ Full | ✅ Struct/Trait Methods |
| **Go** | ✅ Full Support | ✅ Functions & Methods | ✅ Full | ✅ Struct/Interface Methods |
| **ZIL** | ✅ Full Support | ✅ Routines | ✅ INSERT-FILE | ✅ Objects/Rooms |
| **Other Languages** | ⚠️ Basic Support | ❌ | ❌ | ❌ |

> [!NOTE]
> Code graph features enhance search results by showing usage context (e.g., "this function is called by 15 other functions"), but all languages benefit from vector search and full-text search capabilities.

### 🔌 Custom Language Support

Bluera Knowledge provides an extensible adapter system for adding full graph support to any language. The built-in ZIL adapter (for Infocom/Zork-era source code) demonstrates this capability.

**What adapters provide:**
- **Smart chunking** - Split files by language constructs (functions, classes, objects)
- **Symbol extraction** - Parse definitions with signatures and line numbers
- **Import tracking** - Resolve include/import relationships
- **Call graph analysis** - Track function calls with special form filtering

**Built-in adapters:**
| Language | Extensions | Symbols | Imports |
|----------|------------|---------|---------|
| ZIL | `.zil`, `.mud` | ROUTINE, OBJECT, ROOM, GLOBAL, CONSTANT | INSERT-FILE |

**Example - ZIL indexing:**
```bash
# Index a Zork source repository
bluera-knowledge store create zork1 --type repo --source https://github.com/historicalsource/zork1

# Search for routines
bluera-knowledge search "V-LOOK routine" --stores zork1
```

---

## 🎯 How It Works

The plugin provides AI agents with **four complementary search capabilities**:

### 🔍 1. Semantic Vector Search
**AI-powered search across all indexed content**

- Searches by meaning and intent, not just keywords
- Uses embeddings to find conceptually similar content
- Ideal for discovering patterns and related concepts

### 📝 2. Full-Text Search (FTS)
**Fast keyword and pattern matching**

- Traditional text search with exact matching
- Supports regex patterns and boolean operators
- Best for finding specific terms or identifiers

### ⚡ 3. Hybrid Mode (Recommended)
**Combines vector and FTS search**

- Merges results from both search modes with weighted ranking
- Balances semantic understanding with exact matching
- Provides best overall results for most queries

### 📂 4. Direct File Access
**Traditional file operations on cloned sources**

- Provides file paths to cloned repositories
- Enables Grep, Glob, and Read operations on source files
- Supports precise pattern matching and code navigation
- Full access to complete file trees

<details>
<summary>💡 <b>How Commands Work</b></summary>

When you use `/bluera-knowledge:` commands, here's what happens:

1. **You issue a command** - Type `/bluera-knowledge:stores` or similar in Claude Code
2. **Claude Code receives instructions** - The command provides step-by-step instructions for Claude Code
3. **Claude Code executes MCP tools** - Behind the scenes, Claude Code uses `mcp__bluera-knowledge__*` tools
4. **Results are formatted** - Claude Code formats and displays the output directly to you

**Example Flow:**
```
You: /bluera-knowledge:stores
  ↓
Command file instructs Claude Code to use execute("stores")
  ↓
MCP tool queries LanceDB for store metadata
  ↓
Claude Code formats results as a table
  ↓
You see: Beautiful table of all your knowledge stores
```

This architecture means commands provide a clean user interface while MCP tools handle the backend operations.
</details>

---

## 🎨 User Interface

### 👤 User Commands
**You manage knowledge stores through `/bluera-knowledge:` commands:**

- 🔬 Analyze your project to find important dependencies
- 📦 Add Git repositories (dependency source code)
- 📁 Add local folders (documentation, standards, etc.)
- 🌐 Crawl web pages and documentation
- 🔍 Search across all indexed content
- 🔄 Manage and re-index stores

### 🤖 MCP Tools
**AI agents access knowledge through Model Context Protocol (3 tools for minimal context overhead):**

| Tool | Purpose |
|------|---------|
| `search` | 🔍 Semantic vector search across all stores |
| `get_full_context` | 📖 Retrieve complete code context for a search result |
| `execute` | ⚡ Meta-tool for store/job management commands |

The `execute` tool consolidates store and job management into a single tool with subcommands:
- **Store commands**: `stores`, `store:info`, `store:create`, `store:index`, `store:delete`
- **Job commands**: `jobs`, `job:status`, `job:cancel`
- **Help**: `help`, `commands`

---

## ⚙️ Background Jobs

> [!TIP]
> Long-running operations (git clone, indexing) run in the background, allowing you to continue working while they complete.

### 🔄 How It Works

When you add a repository or index content:

1. **⚡ Instant Response** - Operation starts immediately and returns a job ID
2. **🔄 Background Processing** - Indexing runs in a separate process
3. **📊 Progress Updates** - Check status anytime with `/bluera-knowledge:check-status`
4. **🔔 Auto-Notifications** - Active jobs appear automatically in context

### 📝 Example Workflow

```bash
# Add a large repository (returns immediately with job ID)
/bluera-knowledge:add-repo https://github.com/facebook/react

# Output:
# ✓ Created store: react (a1b2c3d4...)
# 🔄 Indexing started in background
#    Job ID: job_abc123def456
#
# Check status with: /bluera-knowledge:check-status job_abc123def456

# Check progress anytime
/bluera-knowledge:check-status job_abc123def456

# Output:
# Job Status: job_abc123def456
# Status:   running
# Progress: ███████████░░░░░░░░░ 45%
# Message:  Indexed 562/1,247 files

# View all active jobs
/bluera-knowledge:check-status

# Cancel if needed
/bluera-knowledge:cancel job_abc123def456
```

### 🚀 Performance

Background jobs include significant performance optimizations:

- **⚡ Parallel Embedding** - Batch processes up to 32 chunks simultaneously
- **📂 Parallel File I/O** - Processes multiple files concurrently (configurable, default: 4)
- **🔓 Non-Blocking** - Continue working while indexing completes
- **📊 Progress Tracking** - Real-time updates on files processed and progress percentage
- **🧹 Auto-Cleanup** - Completed/stale jobs are cleaned up automatically

---

## 🎯 Use Cases

### Dependency Source Code

Provide AI agents with canonical dependency implementation details:

```bash
/bluera-knowledge:suggest
/bluera-knowledge:add-repo https://github.com/expressjs/express

# AI agents can now:
# - Semantic search: "middleware error handling"
# - Direct access: Grep/Glob through the cloned express repo
```

### Project Documentation

Make project-specific documentation available:

```bash
/bluera-knowledge:add-folder ./docs --name=project-docs
/bluera-knowledge:add-folder ./architecture --name=architecture

# AI agents can search across all documentation or access specific files
```

### Coding Standards

Provide definitive coding standards and best practices:

```bash
/bluera-knowledge:add-folder ./company-standards --name=standards
/bluera-knowledge:add-folder ./api-specs --name=api-docs

# AI agents reference actual company standards, not generic advice
```

### Mixed Sources

Combine canonical library code with project-specific patterns:

```bash
/bluera-knowledge:add-repo https://github.com/facebook/react --name=react
/bluera-knowledge:add-folder ./docs/react-patterns --name=react-patterns

# Search across both dependency source and team patterns
```

---

## 🔧 Troubleshooting

<details>
<summary><b>❌ Command not found or not recognized</b></summary>

Ensure the plugin is installed and enabled:

```bash
/plugin list
/plugin enable bluera-knowledge
```

If the plugin isn't listed, install it:

```bash
/plugin marketplace add blueraai/bluera-marketplace
/plugin install bluera-knowledge@bluera
```
</details>

<details>
<summary><b>🔌 MCP server shows as "failed" in /plugin</b></summary>

If the MCP server shows as failed after installation:

1. **Restart Claude Code** - MCP servers require a restart to initialize
2. **Check status:** Run `/mcp` to see connection status
3. **Reinstall:** Try `/plugin uninstall bluera-knowledge` then `/plugin install bluera-knowledge@bluera`

If the issue persists, check that Claude Code is v2.0.65 or later (earlier versions had MCP loading bugs).
</details>

<details>
<summary><b>🌐 Web crawling fails</b></summary>

Check Python dependencies:

```bash
python3 --version  # Should be 3.8+
pip install crawl4ai
```

The plugin attempts to auto-install `crawl4ai` on first use, but manual installation may be needed in some environments.
</details>

<details>
<summary><b>🔍 Search returns no results</b></summary>

1. Verify store exists: `/bluera-knowledge:stores`
2. Check store is indexed: `/bluera-knowledge:index <store-name>`
3. Try broader search terms
4. Verify you're searching the correct store with `--stores=<name>`
</details>

<details>
<summary><b>❓ "Store not found" error</b></summary>

List all stores to see available names and IDs:

```bash
/bluera-knowledge:stores
```

Use the exact store name or ID shown in the table.
</details>

<details>
<summary><b>⏱️ Indexing is slow or fails</b></summary>

Large repositories (10,000+ files) take longer to index. If indexing fails:

1. Check available disk space
2. Ensure the source repository/folder is accessible
3. For repo stores, verify git is installed: `git --version`
4. Check for network connectivity (for repo stores)
</details>

<details>
<summary><b>🤖 "Claude CLI not found" during crawl</b></summary>

This means intelligent crawling is unavailable. The crawler will automatically use simple BFS mode instead.

To enable intelligent crawling with `--crawl` and `--extract`:
1. Install Claude Code: https://claude.com/code
2. Ensure `claude` command is in PATH: `which claude`

Simple mode still crawls effectively—it just doesn't use AI to select which pages to crawl or extract specific content.
</details>

---

## 🔧 Dependencies

The plugin automatically checks for and attempts to install Python dependencies on first use:

**Required:**
- **🐍 Python 3.8+** - Required for web crawling functionality
- **🕷️ crawl4ai** - Required for web crawling (auto-installed via SessionStart hook)
- **🎭 Playwright browser binaries** - Required for default headless mode (auto-installed via SessionStart hook)

**What the SessionStart hook installs:**
- ✅ crawl4ai Python package (includes playwright as dependency)
- ✅ Playwright Chromium browser binaries (auto-installed after crawl4ai)

If auto-installation fails, install manually:

```bash
pip install crawl4ai
playwright install chromium
```

**Disable auto-install (security-conscious environments):**

Set the `BK_SKIP_AUTO_INSTALL` environment variable to disable automatic pip package installation:

```bash
export BK_SKIP_AUTO_INSTALL=1
```

> [!NOTE]
> The plugin will work without crawl4ai/playwright, but web crawling features (`/bluera-knowledge:crawl`) will be unavailable. The default mode uses headless browser for maximum compatibility with JavaScript-rendered sites. Use `--fast` for static sites when speed is critical.

**Update Plugin:**
```bash
/plugin update bluera-knowledge
```

---

## 🎓 Skills for Claude Code

> [!NOTE]
> Skills are a Claude Code-specific feature. They're automatically loaded when using the plugin but aren't available when using the npm package directly.

Bluera Knowledge includes built-in Skills that teach Claude Code how to use the plugin effectively. Skills provide procedural knowledge that complements the MCP tools.

### 📚 Available Skills

#### `knowledge-search`
Teaches the two approaches for accessing dependency sources:
- Vector search via MCP/slash commands for discovery
- Direct Grep/Read access to cloned repos for precision

**When to use:** Understanding how to query indexed libraries

#### `when-to-query`
Decision guide for when to query BK stores vs using Grep/Read on current project.

**When to use:** Deciding whether a question is about libraries or your project code

#### `advanced-workflows`
Multi-tool orchestration patterns for complex operations.

**When to use:** Progressive library exploration, adding libraries, handling large results

#### `search-optimization`
Guide on search parameters and progressive detail strategies.

**When to use:** Optimizing search results, choosing the right intent and detail level

#### `store-lifecycle`
Best practices for creating, indexing, and managing stores.

**When to use:** Adding new stores, understanding when to use repo/folder/crawl

### 🔄 MCP + Skills Working Together

Skills teach **how** to use the MCP tools effectively:
- MCP provides the **capabilities** (search, get_full_context, execute commands)
- Skills provide **procedural knowledge** (when to use which tool, best practices, workflows)

This hybrid approach reduces unnecessary tool calls and context usage while maintaining universal MCP compatibility.

**Example:**
- MCP tool: `search(query, intent, detail, limit, stores)`
- Skill teaches: Which `intent` for your question type, when to use `detail='minimal'` vs `'full'`, how to narrow with `stores`

Result: Fewer tool calls, more accurate results, less context consumed.

### 🎯 Skill Auto-Activation

Skills can automatically suggest themselves when your prompt matches certain patterns.

**Toggle via slash command:**
- `/bluera-knowledge:skill-activation` - Show current status
- `/bluera-knowledge:skill-activation on` - Enable (default)
- `/bluera-knowledge:skill-activation off` - Disable
- `/bluera-knowledge:skill-activation config` - Toggle individual skills

**How it works:**
When enabled, a UserPromptSubmit hook analyzes your prompt for patterns like:
- "How does [library] work?" → suggests `knowledge-search`
- "Should I grep or search?" → suggests `when-to-query`
- "Too many results" → suggests `search-optimization`
- "Multi-step workflow" → suggests `advanced-workflows`
- "Add/delete store" → suggests `store-lifecycle`

Claude evaluates each suggestion and invokes relevant skills before answering. Users who already use BK terminology are excluded (they already know the tool).

**Configuration stored in:** `~/.local/share/bluera-knowledge/skill-activation.json`

---

## 💾 Data Storage

Knowledge stores are stored in your project root:

```
<project-root>/.bluera/bluera-knowledge/
├── data/
│   ├── repos/<store-id>/       # Cloned Git repositories
│   ├── documents_*.lance/      # Vector indices (Lance DB)
│   └── stores.json             # Store registry
├── stores.config.json          # Store definitions (git-committable!)
└── config.json                 # Configuration
```

### 📋 Store Definitions (Team Sharing)

Store definitions are automatically saved to `.bluera/bluera-knowledge/stores.config.json`. This file is designed to be **committed to git**, allowing teams to share store configurations.

**Example `stores.config.json`:**
```json
{
  "version": 1,
  "stores": [
    { "type": "file", "name": "my-docs", "path": "./docs" },
    { "type": "repo", "name": "react", "url": "https://github.com/facebook/react" },
    { "type": "web", "name": "api-docs", "url": "https://api.example.com/docs", "depth": 2 }
  ]
}
```

When a teammate clones the repo, they can run `/bluera-knowledge:sync` to recreate all stores locally.

### 🚫 Recommended `.gitignore` Patterns

When you first create a store, the plugin automatically updates your `.gitignore` with:

```gitignore
# Bluera Knowledge - data directory (not committed)
.bluera/
!.bluera/bluera-knowledge/
!.bluera/bluera-knowledge/stores.config.json
```

This ensures:
- Vector indices and cloned repos are **NOT committed** (they're large and can be recreated)
- Store definitions **ARE committed** (small JSON file for team sharing)

---

## 🔬 Technologies

- **🔌 Claude Code Plugin System** with MCP server
- **✅ Runtime Validation** - [Zod](https://github.com/colinhacks/zod) schemas for Python-TypeScript boundary
- **🌳 AST Parsing** - [@babel/parser](https://github.com/babel/babel) for JS/TS, Python AST module, [tree-sitter](https://github.com/tree-sitter/tree-sitter) for Rust and Go
- **🗺️ Code Graph** - Static analysis of function calls, imports, and class relationships
- **🧠 Semantic Search** - AI-powered vector embeddings with [LanceDB](https://github.com/lancedb/lancedb)
- **📦 Git Operations** - Native git clone
- **💻 CLI** - [Commander.js](https://github.com/tj/commander.js)
- **🕷️ Web Crawling** - [crawl4ai](https://github.com/unclecode/crawl4ai) with [Playwright](https://github.com/microsoft/playwright) (headless browser)

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [CLI Reference](docs/cli.md) | Complete CLI commands, options, and usage examples |
| [MCP Integration](docs/mcp-integration.md) | MCP server configuration and tool documentation |
| [Commands Reference](docs/commands.md) | All slash commands with parameters and examples |
| [Crawler Architecture](docs/crawler-architecture.md) | How the intelligent web crawler works |
| [Token Efficiency](docs/token-efficiency.md) | How BK reduces token consumption vs web search |
| [CONTRIBUTING](CONTRIBUTING.md) | Development setup, testing, and release process |

---

## 🤝 Contributing

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, testing, and release process.

---

## 📄 License

MIT - See [LICENSE](./LICENSE) for details.

## 🙏 Acknowledgments

This project includes software developed by third parties. See [NOTICE](./NOTICE) for full attribution.

Key dependencies:
- **[Crawl4AI](https://github.com/unclecode/crawl4ai)** - Web crawling (Apache-2.0). *This product includes software developed by UncleCode ([@unclecode](https://x.com/unclecode)) as part of the Crawl4AI project.*
- **[LanceDB](https://github.com/lancedb/lancedb)** - Vector database (Apache-2.0)
- **[Hugging Face Transformers](https://github.com/huggingface/transformers.js)** - Embeddings (Apache-2.0)
- **[Playwright](https://github.com/microsoft/playwright)** - Browser automation (Apache-2.0)

---

## 💬 Support

- **🐛 Issues**: [GitHub Issues](https://github.com/blueraai/bluera-knowledge/issues)
- **📚 Documentation**: [Claude Code Plugins](https://code.claude.com/docs/en/plugins)
- **📝 Changelog**: [CHANGELOG.md](./CHANGELOG.md)
