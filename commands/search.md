---
description: Search indexed library sources
argument-hint: "[query] [--stores names] [--limit N]"
allowed-tools: [Bash(${CLAUDE_PLUGIN_ROOT}/dist/index.js:*)]
---

Search indexed library sources for: $ARGUMENTS

!`PROJECT_ROOT="${PWD}" node ${CLAUDE_PLUGIN_ROOT}/dist/index.js search $ARGUMENTS`

The results show relevant code locations, purposes, and relevance scores from your indexed libraries.
