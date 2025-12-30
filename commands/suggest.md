---
description: Suggest important dependencies to add to knowledge stores
allowed-tools: [Bash(${CLAUDE_PLUGIN_ROOT}/dist/index.js:*)]
---

Analyzing project dependencies and suggesting important libraries to add:

!`node ${CLAUDE_PLUGIN_ROOT}/dist/index.js suggest`

This scans your project's dependency files and suggests major libraries that would be useful to index as knowledge stores.
