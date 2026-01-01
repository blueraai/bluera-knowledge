---
description: Search indexed library sources
argument-hint: "[query] [--stores names] [--limit N]"
allowed-tools: ["mcp__bluera-knowledge__search"]
---

# Search Knowledge Stores

Search indexed library sources for: **$ARGUMENTS**

## Steps

1. Parse the query from $ARGUMENTS:
   - Extract the search query (required)
   - Extract --stores parameter (optional, comma-separated store names)
   - Extract --limit parameter (optional, default 10)

2. Call mcp__bluera-knowledge__search with:
   - query: The search query string
   - stores: Array of store names (if --stores specified)
   - limit: Number of results (if --limit specified, default 10)
   - detail: "contextual"
   - intent: "find-implementation"

3. Format and display the results as a markdown table:

   ```markdown
   ## Search Results: "query"

   | Score | Store | File | Purpose |
   |------:|-------|------|---------|
   | 0.95  | store-name | path/to/file.ts | Brief description |

   **Found X results**
   ```

   **Formatting rules:**
   - Score: Right-aligned, 2 decimal places (e.g., `0.95`, `1.00`)
   - Store: Extract from `summary.storeName`
   - File: Strip `summary.repoRoot` prefix from `summary.location`
   - Purpose: Extract from `summary.purpose`, keep it concise (truncate if needed)
   - Use standard markdown table syntax (don't worry about fixed-width alignment)

4. If no results:
   ```markdown
   No results found for "query"

   Try:
   - Broadening your search terms
   - Checking indexed stores: /bluera-knowledge:stores
   ```
