---
description: Clone and index a library source repository
argument-hint: "[git-url] [--name store-name] [--branch branch-name]"
allowed-tools: [mcp__bluera-knowledge__create_store, mcp__bluera-knowledge__index_store]
---

Clone a git repository and add it to the knowledge stores.

Arguments: $ARGUMENTS

Parse the arguments:
- First argument is the git URL (required)
- --name: Store name (optional, defaults to repo name)
- --branch: Git branch (optional, defaults to default branch)

Steps:
1. Call create_store MCP tool with:
   - name: Use --name if provided, otherwise extract from git URL
   - type: "repo"
   - source: The git URL
   - branch: The branch name if specified

2. After store is created successfully, call index_store MCP tool with:
   - store: The store name or ID from step 1

3. Report to the user:
   - Store name and ID
   - Clone location
   - Number of files indexed
   - How to search it (use /search command)
