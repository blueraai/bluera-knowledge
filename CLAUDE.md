## NPM Scripts

**Development:**
- `npm run build` - Compile TypeScript
- `npm run test:run` - Run tests once
- `npm run precommit` - Full validation (lint, typecheck, tests, build)

**Versioning (after code changes):**
- `npm run version:patch` - Bump patch version (updates package.json, plugin.json, README badge)
- `npm run version:minor` - Bump minor version
- `npm run version:major` - Bump major version

**Releasing:**
- `npm run release:patch` - Bump + commit + tag + push (triggers GitHub Actions release)
- `npm run release:minor` - Same for minor version
- `npm run release:major` - Same for major version
- `npm run release:current` - Tag + push current version (if version already bumped)

**After releasing this repo:**
- Marketplace update is **automated** via GitHub Actions
- The `update-marketplace` workflow triggers when a release is published
- It waits for CI to pass, then updates `blueraai/bluera-marketplace`
- Check the Actions tab to verify marketplace was updated successfully
- If automation fails, manually update as fallback:
  1. Update version in `blueraai/bluera-marketplace` → `.claude-plugin/marketplace.json`
  2. Run `npm run release:patch` in the marketplace repo
     (https://github.com/blueraai/bluera-marketplace)

## GitHub Actions Workflows

**CI Workflow** (`.github/workflows/ci.yml`)
- Triggers: Push to main, pull requests
- Runs: Lint, typecheck, tests, build
- Required to pass before marketplace updates

**Release Workflow** (`.github/workflows/release.yml`)
- Triggers: Tag push (v*)
- Creates: GitHub release with auto-generated notes

**Update Marketplace Workflow** (`.github/workflows/update-marketplace.yml`)
- Triggers: Release published
- Waits for: CI workflow success
- Updates: `blueraai/bluera-marketplace` version automatically
- Requires: `MARKETPLACE_PAT` secret configured

## ALWAYS

* use the `npm run version:*` commands after changes
    * without this, the changes would not be detected by Claude Code
* use `npm run release:*` to create releases (not manual git tag commands)
* fail early and fast
  * our code is expected to *work* as-designed
    * use "throw" when state is unexpected or for any error condition
    * use 100% strict typing; no "any" no "as", unless completely unavoidable and considerd best practice

## NEVER

* use `--no-verify` on Git commits; this anti-pattern completely circumvents the code protections we have in place
* write "fallback code" or "graceful degradation" code or implement "defaults" *unless* it's part of the specification
* leave commented code, nor reference outdated/deprecated implementations
