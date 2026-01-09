---
description: Sync stores from definitions config (bootstrap on fresh clone)
allowed-tools: ["mcp__bluera-knowledge__execute"]
---

# Sync Stores from Definitions

Sync stores from the git-committable definitions config. This is useful when:
- You've cloned a repo that has `.bluera/bluera-knowledge/stores.config.json`
- You want to recreate all stores defined by the team
- You want to check for orphan stores not in the config

## Steps

1. Use the mcp__bluera-knowledge__execute tool with command "stores:sync" to sync stores from definitions

   Optional arguments:
   - `dryRun: true` - Show what would happen without making changes
   - `prune: true` - Remove stores not in definitions
   - `reindex: true` - Re-index existing stores after sync

2. Present results in a structured format:

```
## Sync Results

**Created**: 3 stores
- my-docs (file)
- react-source (repo)
- api-docs (web)

**Skipped** (already exist): 2 stores
- lodash
- typescript-docs

**Orphans** (not in definitions): 1 store
- old-unused-store

No errors occurred.
```

## Dry Run Mode

When using dry run, show what WOULD happen:

```
## Sync Preview (Dry Run)

**Would create**: 3 stores
- my-docs (file)
- react-source (repo)
- api-docs (web)

**Would skip** (already exist): 2 stores
- lodash
- typescript-docs

**Orphans** (not in definitions): 1 store
- old-unused-store

To apply these changes, run without --dry-run
```

## If No Definitions Found

If no store definitions config exists:

```
## No Store Definitions Found

The config file `.bluera/bluera-knowledge/stores.config.json` doesn't exist yet.

Store definitions are automatically created when you:
- Add a repo: `/bluera-knowledge:add-repo <url>`
- Add a folder: `/bluera-knowledge:add-folder <path>`
- Crawl a website: `/bluera-knowledge:crawl <url>`

The config file will be created automatically and can be committed to git for team sharing.
```

## Error Handling

If some stores fail to sync, report them individually:

```
## Sync Results

**Created**: 2 stores
- my-docs
- api-docs

**Failed**: 1 store
- react-source: Directory does not exist: /path/to/repo

Continue to resolve the errors manually.
```
