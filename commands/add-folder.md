---
description: Index a local folder of reference material
argument-hint: "[path] [--name store-name]"
allowed-tools: [Bash(${CLAUDE_PLUGIN_ROOT}/dist/index.js:*)]
---

Indexing folder: $ARGUMENTS

!`PROJECT_ROOT="${PWD}" node ${CLAUDE_PLUGIN_ROOT}/dist/index.js add-folder $ARGUMENTS`

The folder will be added as a knowledge store and automatically indexed for searching.
