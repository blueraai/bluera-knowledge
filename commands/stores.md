---
description: List all indexed library stores
allowed-tools: [Bash(${CLAUDE_PLUGIN_ROOT}/dist/index.js:*)]
---

List all indexed knowledge stores:

!`PROJECT_ROOT="${PWD}" node ${CLAUDE_PLUGIN_ROOT}/dist/index.js stores`

The output shows all indexed stores with their names, types, IDs, and paths.
