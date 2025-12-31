---
description: Index a local folder of reference material
argument-hint: "[path] [--name store-name]"
allowed-tools: [Bash(run.sh:*)]
---

Indexing folder: $ARGUMENTS

!`${CLAUDE_PLUGIN_ROOT}/run.sh add-folder $ARGUMENTS`

The folder will be added as a knowledge store and automatically indexed for searching.
