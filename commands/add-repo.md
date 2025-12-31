---
description: Clone and index a library source repository
argument-hint: "[git-url] [--name store-name] [--branch branch-name]"
allowed-tools: [Bash(${CLAUDE_PLUGIN_ROOT}/dist/index.js:*)]
---

Cloning and indexing repository: $ARGUMENTS

!`PROJECT_ROOT="${PWD}" node ${CLAUDE_PLUGIN_ROOT}/dist/index.js add-repo $ARGUMENTS`

The repository will be cloned, added as a knowledge store, and automatically indexed for searching.
