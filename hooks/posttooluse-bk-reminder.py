#!/usr/bin/env python3
"""
PostToolUse hook for bluera-knowledge plugin.
Fires after Claude reads/greps in dependency directories,
reminding to consider using BK for similar future queries.
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


def extract_library_name(path: str) -> str | None:
    """Extract library name from dependency path."""
    # node_modules/package-name/...
    match = re.search(r"node_modules/(@[^/]+/[^/]+|[^/]+)", path)
    if match:
        return match.group(1)

    # site-packages/package_name/...
    match = re.search(r"site-packages/([^/]+)", path)
    if match:
        return match.group(1)

    # vendor/package/...
    match = re.search(r"vendor/([^/]+)", path)
    if match:
        return match.group(1)

    # .cargo/registry/.../package-name-version/...
    match = re.search(r"\.cargo/registry/[^/]+/([^/]+)-\d", path)
    if match:
        return match.group(1)

    # go/pkg/mod/package@version/...
    match = re.search(r"go/pkg/mod/([^@]+)@", path)
    if match:
        return match.group(1)

    return None


def check_grep_tool(tool_input: dict[str, Any]) -> tuple[str | None, str | None]:
    """Check if Grep targeted library code. Returns (action, library_name)."""
    path = tool_input.get("path", "")

    if path and LIBRARY_PATTERNS_RE.search(path):
        lib_name = extract_library_name(path)
        return f"grepped in `{path}`", lib_name

    return None, None


def check_read_tool(tool_input: dict[str, Any]) -> tuple[str | None, str | None]:
    """Check if Read targeted library code. Returns (action, library_name)."""
    file_path = tool_input.get("file_path", "")

    if file_path and LIBRARY_PATTERNS_RE.search(file_path):
        lib_name = extract_library_name(file_path)
        return f"read `{file_path}`", lib_name

    return None, None


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

    action = None
    lib_name = None

    if tool_name == "Grep":
        action, lib_name = check_grep_tool(tool_input)
    elif tool_name == "Read":
        action, lib_name = check_read_tool(tool_input)

    if not action:
        return 0

    # Build context-aware reminder
    lib_hint = f" ({lib_name})" if lib_name else ""
    add_suggestion = (
        f"If {lib_name} is not indexed, consider: /bluera-knowledge:add-repo"
        if lib_name
        else "Consider indexing frequently-used libraries with /bluera-knowledge:add-repo"
    )

    reminder_text = f"""BLUERA-KNOWLEDGE REMINDER

You just {action} - this is dependency/library code{lib_hint}.

For FUTURE queries about this library, use Bluera Knowledge instead:
- MCP tool: search(query="your question about {lib_name or 'the library'}")
- Slash command: /bluera-knowledge:search <query>

BK provides indexed, semantic search across library sources - significantly faster
and more context-efficient than reading through dependency directories.

{add_suggestion}"""

    output = {
        "hookSpecificOutput": {
            "hookEventName": "PostToolUse",
            "additionalContext": reminder_text,
        }
    }
    print(json.dumps(output))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
