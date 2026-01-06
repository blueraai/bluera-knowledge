# Commit

Create atomic, well-organized commits. See @.claude/skills/atomic-commits/SKILL.md for documentation check criteria.

## Context

!`git status && echo "---STAGED---" && git diff --cached --stat && echo "---UNSTAGED---" && git diff --stat && echo "---UNTRACKED---" && git ls-files --others --exclude-standard && echo "---HISTORY---" && git log --oneline -10`

## Workflow

1. **Analyze**: Run `git diff HEAD` to see all changes
2. **Documentation Check**: Check if README.md or CLAUDE.md need updates (see skill)
3. **Group**: Identify logical features (see skill for grouping rules)
4. **Commit each group**:
   ```bash
   git add <files>
   git commit -m "<type>(<scope>): <description>"
   ```
5. **Handle untracked**: Categorize as commit/ignore/intentional
6. **Report**: Show commits created and final `git status --short`

## Validation

Pre-commit hooks run automatically:
- **Doc-only changes**: Skips all validation (instant)
- **Code changes**: Runs lint + typecheck per language

If hooks fail, fix issues and retry. Never use `--no-verify`.

## Safety

- Never force push
- Never amend commits from other sessions
- Ask if unsure about grouping
