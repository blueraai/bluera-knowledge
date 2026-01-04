## NPM Scripts

**Development:**
- `npm run build` - Compile TypeScript
- `npm run test:run` - Run tests once
- `npm run precommit` - Full validation (lint, typecheck, tests, build)

**Versioning (after code changes):**
- `npm run version:patch` - Bump patch version (updates package.json, plugin.json, marketplace.json, README badge)
- `npm run version:minor` - Bump minor version
- `npm run version:major` - Bump major version

**Releasing:**
- `npm run release:patch` - Bump + commit + tag + push (triggers GitHub Actions release)
- `npm run release:minor` - Same for minor version
- `npm run release:major` - Same for major version
- `npm run release:current` - Tag + push current version (if version already bumped)

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
