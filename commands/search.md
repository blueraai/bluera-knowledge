---
description: Search indexed library sources
argument-hint: "[query] [--stores names] [--limit N]"
allowed-tools: [mcp__bluera-knowledge__search_codebase]
---

Search the indexed library sources for the user's query.

Query: $ARGUMENTS

Parse the arguments:
- First argument is the search query (required)
- --stores: Comma-separated store names (optional)
- --limit: Maximum results (optional, default 10)

Call the search_codebase MCP tool with:
- query: The search query
- limit: Parse from --limit or default to 10
- stores: If --stores provided, split by commas into an array
- detail: Use "contextual" for helpful results with imports and types

Display the results clearly, showing:
- Code location and purpose
- Relevance score
- Key context from the match
