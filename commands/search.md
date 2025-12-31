---
description: Search indexed library sources
argument-hint: "[query] [--stores names] [--limit N]"
allowed-tools: [Bash(*/run.sh:*)]
---

Search indexed library sources for: $ARGUMENTS

!`${CLAUDE_PLUGIN_ROOT}/run.sh search $ARGUMENTS`

The results show relevant code locations, purposes, and relevance scores from your indexed libraries.
