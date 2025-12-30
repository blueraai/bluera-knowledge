---
description: Re-index a knowledge store
argument-hint: "[store-name-or-id]"
allowed-tools: [mcp__bluera-knowledge__index_store]
---

Re-index a knowledge store to update the search index.

Store to index: $ARGUMENTS

Call the index_store MCP tool with:
- store: The store name or ID provided by the user

Report to the user:
- Store name and ID
- Number of documents indexed
- Time taken
- Success/failure status
