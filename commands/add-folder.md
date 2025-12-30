---
description: Index a local folder of reference material
argument-hint: "[path] [--name store-name]"
allowed-tools: [mcp__bluera-knowledge__create_store, mcp__bluera-knowledge__index_store]
---

Index a local folder as a knowledge store.

Arguments: $ARGUMENTS

Parse the arguments:
- First argument is the folder path (required)
- --name: Store name (optional, defaults to folder name)

Steps:
1. Call create_store MCP tool with:
   - name: Use --name if provided, otherwise use folder basename
   - type: "file"
   - source: The folder path

2. After store is created successfully, call index_store MCP tool with:
   - store: The store name or ID from step 1

3. Report to the user:
   - Store name and ID
   - Folder path indexed
   - Number of files indexed
   - How to search it (use /search command)
