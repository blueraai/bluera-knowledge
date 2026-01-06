#!/bin/bash
# Smart post-edit validation hook
# Only runs relevant checks based on modified file types

cd "$CLAUDE_PROJECT_DIR" || exit 0

# Get modified files (uncommitted changes)
MODIFIED_FILES=$(git diff --name-only HEAD 2>/dev/null || echo '')

# If no git repo or no changes, skip
if [ -z "$MODIFIED_FILES" ]; then
  exit 0
fi

# Check for TypeScript/JavaScript changes
HAS_TS_CHANGES=$(echo "$MODIFIED_FILES" | grep -E '\.(ts|tsx|js|jsx)$' || true)

# If only docs/config changed (no TS/JS), skip all checks
if [ -z "$HAS_TS_CHANGES" ]; then
  exit 0
fi

# Run lint and typecheck for TS/JS changes
bun run lint:quiet 2>&1
LINT_EXIT=$?

bun run typecheck:quiet 2>&1
TYPE_EXIT=$?

# Check for anti-patterns in code files (not just docs/json)
if git diff -- ':!.claude/' | grep -E '\b(fallback|deprecated|backward compatibility)\b' | grep -v '^-' | grep -qE '^\+'; then
  echo 'Anti-pattern detected (fallback/deprecated/backward compatibility). Review CLAUDE.md: never use fallback code, deprecated implementations, or backward compatibility shims.' >&2
  exit 2
fi

# Exit with error if lint or typecheck failed
if [ $LINT_EXIT -ne 0 ] || [ $TYPE_EXIT -ne 0 ]; then
  exit 1
fi

exit 0
