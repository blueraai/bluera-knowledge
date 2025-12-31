---
description: Crawl web pages and add content to a web store
argument-hint: "[url] [store-name]"
allowed-tools: [Bash(${CLAUDE_PLUGIN_ROOT}/dist/index.js:*)]
---

Crawling $ARGUMENTS

!`PROJECT_ROOT="${PWD}" node ${CLAUDE_PLUGIN_ROOT}/dist/index.js crawl $ARGUMENTS`

The web page will be crawled, converted to markdown, and indexed for searching.
