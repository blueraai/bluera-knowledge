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
   - Extract --limit parameter (optional, default 5)

2. Call mcp__bluera-knowledge__search with:
   - query: The search query string
   - stores: Array of store names (if --stores specified)
   - limit: Number of results (if --limit specified, default 5)
   - detail: "contextual"
   - intent: "find-implementation"

3. Format and display results with rich context:

   ```
   ## Search Results: "query"

   **1. [Score: 0.95] store-name**
   📄 path/to/file.ts
   → Purpose description here
   🔗 Related: concept1, concept2, concept3
   📦 Imports: package1, package2

   **2. [Score: 0.87] store-name**
   📄 path/to/file.js
   → Another purpose here
   🔗 Related: other-concept

   ---
   **Found 5 results**

   💡 **Next Steps:**
   - Read file: `Read /path/to/file.ts`
   - Get full code: `mcp__bluera-knowledge__get_full_context("result-id")`
   - Refine search: Use related concepts above
   ```

   **Formatting rules:**
   - Each result on its own block with blank line between
   - Header: `**N. [Score: X.XX] storeName**` (bold, with rank and score)
   - File: `📄 filename` (strip repoRoot prefix from location)
   - Purpose: `→ purpose text` (arrow prefix, keep concise)
   - Related: `🔗 Related: ...` (from context.relatedConcepts, first 4-5 concepts, comma-separated)
   - Imports: `📦 Imports: ...` (from context.keyImports, first 3-4 imports, comma-separated)
   - Skip Related/Imports lines if arrays are empty
   - Footer: Total count + helpful next steps with actual result IDs

4. For the footer next steps, include:
   - First result's ID in the get_full_context example
   - First result's actual file path in the Read example
   - Use the actual related concepts from top results

5. If no results:
   ```
   No results found for "query"

   Try:
   - Broadening your search terms
   - Checking indexed stores: /bluera-knowledge:stores
   ```
