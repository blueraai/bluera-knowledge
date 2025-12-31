---
description: Re-index a knowledge store
argument-hint: "[store-name-or-id]"
allowed-tools: [Bash(${CLAUDE_PLUGIN_ROOT}/run.sh:*)]
---

Re-indexing store: $ARGUMENTS

!`${CLAUDE_PLUGIN_ROOT}/run.sh index $ARGUMENTS`

The store's search index will be updated with any new or modified files.
