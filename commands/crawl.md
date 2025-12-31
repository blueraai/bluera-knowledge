---
description: Crawl web pages and add content to a web store
argument-hint: "[url] [store-name]"
allowed-tools: [Bash(*/run.sh:*)]
---

Crawling $ARGUMENTS

!`${CLAUDE_PLUGIN_ROOT}/run.sh crawl $ARGUMENTS`

The web page will be crawled, converted to markdown, and indexed for searching.
