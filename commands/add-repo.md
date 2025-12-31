---
description: Clone and index a library source repository
argument-hint: "[git-url] [--name store-name] [--branch branch-name]"
allowed-tools: [Bash(*/run.sh:*)]
---

Cloning and indexing repository: $ARGUMENTS

!`${CLAUDE_PLUGIN_ROOT}/run.sh add-repo $ARGUMENTS`

The repository will be cloned, added as a knowledge store, and automatically indexed for searching.
