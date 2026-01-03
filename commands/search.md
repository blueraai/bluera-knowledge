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

3. Format and display results with rich context using ANSI colors:

   **Color codes:**
   - Header: `\x1b[1m\x1b[96m` (bold cyan)
   - High scores (≥0.7): `\x1b[92m` (bright green)
   - Medium scores (0.3-0.7): `\x1b[93m` (bright yellow)
   - Low scores (<0.3): default
   - Method badges: `\x1b[93m` (bright yellow)
   - Store names: `\x1b[35m` (magenta)
   - File paths: `\x1b[36m` (cyan)
   - Keywords/terms: `\x1b[93m` (bright yellow)
   - Reset: `\x1b[0m` (after each colored section)

   Example output:
   ```
   \x1b[1m\x1b[96m## Search Results: "query" (hybrid search)\x1b[0m

   **1. [Score: \x1b[92m0.95\x1b[0m] [\x1b[93mVector+FTS\x1b[0m]**
   Store: \x1b[35mclaude-code\x1b[0m
   File: 📄 \x1b[36mpath/to/file.ts\x1b[0m
   Purpose: → Purpose description here
   Top Terms: 🔑 (in this chunk): \x1b[93mconcept1, concept2, concept3\x1b[0m
   Imports: 📦 (in this chunk): package1, package2

   **2. [Score: \x1b[92m0.87\x1b[0m] [\x1b[93mVector\x1b[0m]**
   Store: \x1b[35manother-store\x1b[0m
   File: 📄 \x1b[36mpath/to/file.js\x1b[0m
   Purpose: → Another purpose here
   Top Terms: 🔑 (in this chunk): \x1b[93mother-concept\x1b[0m

   ---
   \x1b[96m**Found 10 results in 45ms**\x1b[0m

   💡 **Next Steps:**
   - Read file: `Read /path/to/file.ts`
   - Get full code: `mcp__bluera-knowledge__get_full_context("result-id")`
   - Refine search: Use keywords above
   ```

   **Formatting rules:**
   - Header: `\x1b[1m\x1b[96m## Search Results: "query" (mode search)\x1b[0m` - Extract mode from response (vector/fts/hybrid)
   - Each result on its own block with blank line between
   - Result header: `**N. [Score: {{colorized_score}}] [{{colorized_method}}]**` where:
     - Score color: bright green (≥0.7), bright yellow (0.3-0.7), or default (<0.3)
     - Method badges in bright yellow
     - Method is `[Vector+FTS]`, `[Vector]`, or `[Keyword]` based on rankingMetadata
   - Store: `Store: \x1b[35m{{storeName}}\x1b[0m`
   - File: `File: 📄 \x1b[36m{{filename}}\x1b[0m` (strip repoRoot prefix from location)
   - Purpose: `Purpose: → {{purpose text}}` (no color, keep concise)
   - Top Terms: `Top Terms: 🔑 (in this chunk): \x1b[93m{{terms}}\x1b[0m` (top 5 most frequent)
   - Imports: `Imports: 📦 (in this chunk): {{imports}}` (first 3-4, no color)
   - Skip Top Terms/Imports lines if arrays are empty
   - Footer: `\x1b[96m**Found {{totalResults}} results in {{timeMs}}ms**\x1b[0m` with separator line above

4. For the footer next steps, include:
   - First result's ID in the get_full_context example
   - First result's actual file path in the Read example
   - Use the actual keywords from top results

5. If no results:
   ```
   No results found for "query"

   Try:
   - Broadening your search terms
   - Checking indexed stores: /bluera-knowledge:stores
   ```
