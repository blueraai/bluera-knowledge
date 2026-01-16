# Contributing to Bluera Knowledge

Contributions welcome! This guide covers development setup, testing, and the release process.

## Setup

```bash
git clone https://github.com/blueraai/bluera-knowledge.git
cd bluera-knowledge
bun install
bun run build
bun test
```

> **Note:** This project uses [Bun](https://bun.sh) for development. Install it via `curl -fsSL https://bun.sh/install | bash`

---

## Claude Code Settings (Recommended)

For the best development experience with Claude Code, copy the example settings file:

```bash
cp .claude/settings.local.json.example .claude/settings.local.json
```

**This provides:**
- **Smart validation** - Automatically runs lint/typecheck after editing code (file-type aware)
- **No permission prompts** - Pre-approves common commands (lint, typecheck, precommit)
- **Desktop notifications** - macOS notifications when Claude needs your input
- **Plugin auto-enabled** - Automatically enables the bluera-knowledge plugin
- **Faster workflow** - Catch issues immediately without manual validation

The validation is intelligent—it only runs checks for TypeScript/JavaScript files, skipping docs/config to save time.

> **Note:** The `.claude/settings.local.json` file is gitignored (local to your machine). The example file is checked in for reference.

---

## Dogfooding

Develop this plugin while using it with Claude Code:

```bash
claude --plugin-dir /path/to/bluera-knowledge
```

This loads the plugin directly from source. Changes take effect on Claude Code restart (no reinstall needed).

| What to test | Approach |
|--------------|----------|
| **Commands** (`/search`, `/add-repo`) | `--plugin-dir` (changes need restart) |
| **Hooks** (job status, dependencies) | `--plugin-dir` (changes need restart) |
| **MCP tools** (compiled) | `--plugin-dir` (run `bun run build` first) |
| **MCP tools** (live TypeScript) | `~/.claude.json` dev server (see below) |

---

## MCP Server Development

**Production mode** (`mcp.plugin.json`):
- Uses `${CLAUDE_PLUGIN_ROOT}/dist/mcp/server.js` (compiled)
- Distributed with plugin, no extra setup needed

**Development mode** (live TypeScript):

For instant feedback when editing MCP server code, add a dev server to `~/.claude.json`:

```json
{
  "mcpServers": {
    "bluera-knowledge-dev": {
      "command": "npx",
      "args": ["tsx", "/path/to/bluera-knowledge/src/mcp/server.ts"],
      "env": {
        "PWD": "${PWD}",
        "DATA_DIR": "${PWD}/.bluera/bluera-knowledge/data",
        "CONFIG_PATH": "${PWD}/.bluera/bluera-knowledge/config.json"
      }
    }
  }
}
```

This creates a separate `bluera-knowledge-dev` MCP server that runs source TypeScript directly via `tsx`—no rebuild needed for MCP changes.

---

## Commands

### Development

| Command | Description | When to Use |
|---------|-------------|-------------|
| `bun run build` | Compile TypeScript to dist/ | Before testing CLI, after code changes |
| `bun run dev` | Watch mode compilation | During active development |
| `bun start` | Run the CLI | Execute CLI commands directly |

### Testing

| Command | Description | When to Use |
|---------|-------------|-------------|
| `bun test` | Run tests in watch mode | During TDD/active development |
| `bun run test:run` | Run tests once | Quick verification |
| `bun run test:coverage` | Run tests with coverage | Before committing, CI checks |

### Validation

| Command | Description | When to Use |
|---------|-------------|-------------|
| `bun run lint` | Run ESLint (quiet by default) | Check code style issues |
| `bun run typecheck` | Run TypeScript type checking (quiet by default) | Verify type safety |
| `bun run precommit` | Smart validation (file-type aware) | Runs only relevant checks based on changed files |
| `bun run prepush` | Smart coverage (skips for docs/config) | Runs coverage only when src/tests changed |

### Verbose Variants

| Command | Description |
|---------|-------------|
| `bun run lint:verbose` | ESLint (full output) |
| `bun run typecheck:verbose` | Type check (full output) |
| `bun run test:changed:verbose` | Test changed files (full output) |
| `bun run test:coverage:verbose` | Coverage (full output) |
| `bun run build:verbose` | Build (full output) |

### GitHub Actions

| Command | Description |
|---------|-------------|
| `bun run gh:status` | List recent GitHub Actions runs |
| `bun run gh:watch` | Watch latest workflow (quiet, shows result + failures) |
| `bun run gh:watch:verbose` | Watch with live status updates |
| `bun run gh:releases` | List recent GitHub releases |

---

## Automatic Build & Dist Commit

The `dist/` directory **must be committed** because Claude Code plugins are installed by copying files—there's no build step during installation.

**Good news: This is fully automatic!**

1. **On every commit**, the pre-commit hook intelligently validates based on file types
2. **If source/config changed**, it runs build and automatically stages `dist/` via `git add dist/`
3. **You never need to manually build or stage dist**—just commit your source changes

**For live rebuilding during development:**

```bash
bun run dev  # Watches for changes and rebuilds instantly
```

This is useful when testing CLI commands locally, but not required for committing—the hook handles everything.

---

## Versioning

| Command | Description | When to Use |
|---------|-------------|-------------|
| `bun run version:patch` | Run quality checks, then bump patch version (0.0.x) | Bug fixes, minor updates |
| `bun run version:minor` | Run quality checks, then bump minor version (0.x.0) | New features, backwards compatible |
| `bun run version:major` | Run quality checks, then bump major version (x.0.0) | Breaking changes |

Note: Version commands run full quality checks (format, lint, deadcode, typecheck, coverage, build) BEFORE bumping to catch issues early.

---

## Releasing

**Workflow (Fully Automated):**

1. Make changes and commit
2. Bump version: `bun run version:patch` (runs quality checks first, then updates package.json, plugin.json, README, CHANGELOG)
3. Commit version bump: `git commit -am "chore: bump version to X.Y.Z"`
4. Push to main: `git push`
5. **GitHub Actions automatically:**
   - Runs CI (lint, typecheck, tests, build)
   - Creates release tag when CI passes
   - Creates GitHub release
   - Updates marketplace

> **That's it!** No manual tagging needed. Just push to `main` and the release happens automatically when CI passes.

---

## Post-Release Validation

After a release, validate the npm package works correctly:

```bash
bun run validate:npm
```

This script:
- Installs the latest `bluera-knowledge` from npm globally
- Exercises all CLI commands (stores, add-folder, search, index, delete)
- Writes detailed logs to `logs/validation/npm-validation-*.log`
- Returns exit code 0 on success, 1 on failure

Use this to catch any packaging or runtime issues after npm publish.

---

## Plugin Self-Test

Test all plugin functionality from within Claude Code:

```
/test-plugin
```

This command runs comprehensive tests covering:
- **MCP Tools**: execute (help, stores, create, info, index), search, get_full_context
- **Slash Commands**: /stores, /search, /suggest
- **Cleanup**: Store deletion, artifact removal, verification

The test creates temporary content, exercises all features, and cleans up automatically. Use this to verify the plugin is working correctly after installation or updates.

---

## Testing Locally

### Option 1: Development MCP Server (Recommended)

Use the local development MCP server (see "MCP Server Development" section above) which runs your source code directly via `tsx`:

1. Set up dev MCP server in `~/.claude.json`
2. Test your changes—MCP server updates automatically as you edit code

### Option 2: Test Plugin from Working Directory

Load the plugin directly from your development directory:

```bash
cd /path/to/bluera-knowledge
claude --plugin-dir .
```

The MCP config in `plugin.json` is only loaded when the directory is loaded as a plugin (via `--plugin-dir` or marketplace install), so there's no conflict with project-level MCP config.

### Option 3: CLI Tool Testing

```bash
# Build and link
cd /path/to/bluera-knowledge
bun run build
bun link

# Now 'bluera-knowledge' command is available globally
cd ~/your-project
bluera-knowledge search "test query" my-store
```

**For testing as an installed plugin:**
This requires publishing a new version to the marketplace.

---

## Project Structure

```
.claude-plugin/
└── plugin.json          # Plugin metadata (references mcp.plugin.json)

mcp.plugin.json          # MCP server configuration (plugin-scoped)
commands/                # Slash commands (auto-discovered)
skills/                  # Agent Skills (auto-discovered)
├── knowledge-search/    # How to access dependency sources
│   └── SKILL.md
├── when-to-query/       # When to query BK vs project files
│   └── SKILL.md
├── advanced-workflows/  # Multi-tool orchestration patterns
│   └── SKILL.md
├── search-optimization/ # Search parameter optimization
│   └── SKILL.md
└── store-lifecycle/     # Store management best practices
    └── SKILL.md
dist/                    # Built MCP server (committed for distribution)

src/
├── analysis/            # Dependency analysis & URL resolution
├── crawl/               # Web crawling with Python bridge
├── services/            # Index, store, and search services
├── mcp/                 # MCP server source
└── cli/                 # CLI entry point

tests/
├── integration/         # Integration tests
└── fixtures/            # Test infrastructure
```

---

## Pull Request Process

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Run `bun run precommit` to validate
5. Submit a pull request

Please ensure:
- All tests pass
- Code follows existing style
- Commit messages are descriptive
- Documentation is updated if needed
