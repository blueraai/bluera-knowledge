---
description: Suggest important dependencies to add to knowledge stores
allowed-tools: [Read, mcp__bluera-knowledge__list_stores]
---

Analyze project dependencies and suggest important libraries to add to knowledge stores.

Steps:
1. Check for dependency files in the current project:
   - package.json (Node.js)
   - requirements.txt, pyproject.toml (Python)
   - Cargo.toml (Rust)
   - go.mod (Go)
   - Gemfile (Ruby)

2. Read and parse the dependency files found

3. Identify **major dependencies** - frameworks and core libraries:
   - Focus on: frameworks, state management, routing, UI libraries, major tools
   - Skip: minor utilities, plugins, type definitions, build tools

4. Call list_stores to check what's already indexed

5. For each major dependency not yet indexed, suggest adding it:
   - Provide the GitHub URL (look up if needed)
   - Show the /add-repo command to run
   - Explain why it's important

Display suggestions with priority:
- ⭐️ Critical (core framework)
- 🔵 High (heavily used library)
- ◆ Medium (useful reference)
