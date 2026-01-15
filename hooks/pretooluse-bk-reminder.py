#!/usr/bin/env python3
"""
PreToolUse hook for bluera-knowledge plugin.
Fires when Claude is about to Grep/Read in dependency directories,
reminding to consider using BK instead.
"""

import json
import re
import sys
from typing import Any

# Patterns indicating library/dependency code
LIBRARY_PATH_PATTERNS = [
    r"node_modules/",
    r"vendor/",
    r"site-packages/",
    r"\.venv/",
    r"venv/",
    r"bower_components/",
    r"packages/.*/node_modules/",
    r"\.npm/",
    r"\.cargo/registry/",
    r"go/pkg/mod/",
]

# Compile patterns for efficiency
LIBRARY_PATTERNS_RE = re.compile("|".join(LIBRARY_PATH_PATTERNS), re.IGNORECASE)


def check_grep_tool(tool_input: dict[str, Any]) -> str | None:
    """Check if Grep is targeting library code."""
    path = tool_input.get("path", "")
    pattern = tool_input.get("pattern", "")

    # Check if searching in library directories
    if path and LIBRARY_PATTERNS_RE.search(path):
        return f"grep in `{path}`"

    # Check if pattern suggests library-specific search
    # (searching for common library internals)
    return None


def check_read_tool(tool_input: dict[str, Any]) -> str | None:
    """Check if Read is targeting library code."""
    file_path = tool_input.get("file_path", "")

    if file_path and LIBRARY_PATTERNS_RE.search(file_path):
        return f"read `{file_path}`"

    return None


def main() -> int:
    try:
        stdin_data = sys.stdin.read()
        if not stdin_data.strip():
            return 0
        hook_input = json.loads(stdin_data)
    except json.JSONDecodeError:
        return 0

    tool_name = hook_input.get("tool_name", "")
    tool_input = hook_input.get("tool_input", {})

    trigger_reason = None

    if tool_name == "Grep":
        trigger_reason = check_grep_tool(tool_input)
    elif tool_name == "Read":
        trigger_reason = check_read_tool(tool_input)

    if not trigger_reason:
        return 0

    # Output structured JSON for reliable context injection
    reminder_text = f"""BLUERA-KNOWLEDGE SUGGESTION

You're about to {trigger_reason} which appears to be dependency/library code.

Consider querying Bluera Knowledge instead:
- Use MCP tool `search` with a relevant query
- Or invoke `/bluera-knowledge:search <query>`

BK provides indexed, searchable access to library sources - faster and more context-efficient than grepping through node_modules.

If you don't have this library indexed, continue with your current approach."""

    output = {
        "hookSpecificOutput": {
            "hookEventName": "PreToolUse",
            "additionalContext": reminder_text,
        }
    }
    print(json.dumps(output))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
