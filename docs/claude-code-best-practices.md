# Claude Code & Claude Code Plugins — Best Practices (2026-01)

> This is a field guide for **Claude Code customization** (CLAUDE.md, rules, skills, subagents, hooks, MCP, output styles, settings) and **plugin / marketplace development** (plugin.json, commands, skills, hooks, MCP/LSP bundling, distribution, testing, troubleshooting).
> It synthesizes official docs plus recurring real-world gotchas from GitHub issues + community threads.

---

## 0) Quick decision guide (what to build)

### Choose the lightest-weight lever that solves the problem

| You want to… | Use… | Why |
|---|---|---|
| Set project-wide standards, workflows, "how we do things here" | `CLAUDE.md` + `.claude/rules/*.md` | Always-on, versioned, easy to review; rules can be path-scoped. |
| Make **explicit, user-invoked** workflows (`/review`, `/ship`, `/debug`) | **Slash commands** (`.claude/commands/*.md`) | Deterministic, discoverable, supports args and pre-run context gathering. |
| Teach Claude a reusable "how to do X" playbook it can apply automatically | **Skills** (`.claude/skills/*/SKILL.md`) | Autonomously applied based on task intent; great for standards + recipes. |
| Isolate noisy operations (tests, grepping, docs spelunking), or run parallel research | **Subagents** (`.claude/agents/*.md`) | Separate context + tool restrictions; keeps main thread clean. |
| Guarantee something always happens (formatting, linting, compliance logging) | **Hooks** (`settings.json` or plugin `hooks.json`) | Deterministic "always-run" automation vs hoping the model remembers. |
| Connect Claude to external systems/tools (GitHub, Jira, DB, Sentry) | **MCP servers** (`.mcp.json` or plugin) | Adds tools/resources/prompts via MCP; policy controls + permissions. |
| Package and share the above across repos/teams | **Plugins** (+ marketplaces) | Portable bundles: commands, skills, agents, hooks, MCP/LSP configs. |
| Make Claude "be a different kind of agent" (teaching mode, super-terse mode, etc.) | **Output styles** | Alters system prompt behavior (and triggers reminders). Use sparingly. |

### When to move from "repo config" to "plugin"
Use a plugin when:
- You need **cross-repo reuse** (org-wide workflows, platform tooling).
- You want **versioning + distribution** via marketplaces.
- You're bundling "a product": docs, scripts, validation, and predictable interfaces.

Stay with standalone `.claude/` when:
- It's **project-specific** and tightly coupled to repo architecture.
- You want the lowest friction for contributors (no extra installs).

---

## 1) Recommended baseline layout for a repo

```
your-repo/
├─ CLAUDE.md                  # high-level "how we work" + common commands
├─ CLAUDE.local.md            # per-user overrides (gitignored by default)
└─ .claude/
   ├─ settings.json           # shared team config (permissions/hooks/plugins)
   ├─ settings.local.json     # local overrides (not committed)
   ├─ rules/                  # modular, reviewable instructions
   │  ├─ general.md
   │  ├─ testing.md
   │  ├─ security.md
   │  └─ frontend/
   │     └─ react.md
   ├─ commands/               # repo slash commands
   ├─ skills/                 # repo skills
   └─ agents/                 # repo subagents
```

Why this works:
- Memory loads hierarchically (enterprise → project → rules → user → local).
- Rules can be **path-scoped** via frontmatter `paths:` so you avoid "giant CLAUDE.md".
- `settings.local.json` is ideal for experimentation without polluting the team baseline.

---

## 2) CLAUDE.md & rules: treat it like an "agent manifest"

### CLAUDE.md best practices
- **Prefer checklists + short bullets over prose.** Keep it scannable and review-friendly.
- Include **canonical commands** (build/test/lint, local env setup, common scripts). This avoids repeated tool search.
- Put "project invariants" here: architecture boundaries, naming conventions, PR policy, test expectations.
- Keep it stable. Put volatile data (tokens, local URLs, personal notes) in `CLAUDE.local.md`.

### `.claude/rules/*.md` best practices
- **One topic per file** (testing, security, API conventions). Official guidance explicitly recommends this style.
- Use `paths:` frontmatter only when rules truly are file-type specific.
- Prefer shallow hierarchies; subdirectories for grouping are fine and recursively discovered.

**Path-scoped rule example**
```md
---
paths:
  - "src/api/**/*.ts"
---
# API rules
- Validate inputs (zod)
- Standard error format
- OpenAPI doc blocks required
```

### Imports: structure without bloat
If you have a large "standards pack," use `@path/to/file.md` imports inside `CLAUDE.md` (max depth is limited). Use imports to factor shared guidance into multiple files without giant prompts.

---

## 3) Settings & scopes: keep policy separate from preference

Claude Code settings are hierarchical (managed > CLI flags > local > project > user). Use that intentionally:
- **Managed scope:** enforce security/compliance org-wide (permissions, marketplace allowlists, hook restrictions).
- **Project scope:** team-shared permissions, hooks, MCP config, required plugins.
- **Local scope:** per-machine/per-user overrides for a repo.
- **User scope:** personal defaults everywhere.

### Settings hygiene checklist
- Put **permissions** and **hooks** in project scope so teammates have consistent guardrails.
- Keep personal allowlists (e.g., favorite harmless `Bash(...)` commands) in user scope.
- **Secrets Management:** Never hardcode API keys or secrets in `settings.json` or `plugin.json`. Use environment variables on the host system, which Claude (and MCP servers) can inherit.
- For monorepos, consider a custom `fileSuggestion` command to speed `@` completion.

---

## 4) Output styles: powerful, but don't use them as a crutch

Output styles directly change the system prompt; they're great when you want Claude Code to behave like a different agent (teaching mode, ultra-terse mode). They also trigger reminders to adhere to the style.

Best practices:
- If you're mostly doing software engineering: keep `keep-coding-instructions: true` in custom styles so you don't lose "run tests / verify" guardrails.
- If the goal is consistent formatting, consider: **CLAUDE.md**, **rules**, or a **UserPromptSubmit hook** that reminds Claude. Use output styles only when you truly want to disable/replace core prompt sections.

**Minimal custom output style**
```md
---
name: Ultra-Terse
description: Minimal text, only actionable output
keep-coding-instructions: true
---
# Instructions
- Be concise.
- Prefer code/commands over explanation.
- Ask only the minimum clarifying questions.
```

---

## 5) Slash commands: deterministic "stored prompts"

Slash commands are ideal for workflows you *choose* to run. They also support:
- args (`$ARGUMENTS`, `$1`, `$2`, …)
- frontmatter (`allowed-tools`, `argument-hint`, `context: fork`)
- optional bash pre-exec using `!` + backticks

### Slash command best practices
- Treat each command like an API:
  - Define inputs (`argument-hint`)
  - Define outputs ("what success looks like")
  - Declare tool constraints (`allowed-tools`)
- Use `context: fork` for noisy/expensive commands so they don't pollute your main thread.
- Be extremely careful with `!` pre-exec:
  - Keep it to read-only / low-risk commands (status, diff, logs).
  - Avoid constructing shell from untrusted args without strict quoting.

**Example: safe-ish "commit" command**
```md
---
description: Create a single high-quality commit from current changes
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git commit:*)
---
## Context
- Status: !`git status`
- Diff: !`git diff`

## Task
Propose a commit message and run the commit.
```

---

## 6) Skills: autonomous playbooks (make them small & surgical)

Skills are injected guidance that Claude may apply automatically when your request matches the skill's purpose.

### Skill authoring best practices
- **Progressive disclosure**: keep `SKILL.md` lean; push depth into `references/*.md`.
  *Community experience shows that huge SKILL.md files cause context bloat; a PR explicitly optimized this by moving detail into references and shrinking SKILL.md size.*
- Use frontmatter carefully:
  - `description:` is your router—write it like a trigger spec.
  - Use `disable-model-invocation: true` for skills you only want loaded manually (safety / cost control).
- Include *operational* guidance:
  - exact commands to run
  - where files live
  - how to validate success
- Keep examples realistic and minimal; avoid giant code dumps.

### "Gotcha": accidental bash execution from docs
A real plugin-dev PR removed patterns like `!` + backticks from skill documentation because Claude Code can treat them as executable pre-run snippets—even inside markdown blocks.
**Best practice:** in skills (and docs), avoid `!` + backticks unless you intentionally want a command executed by a slash command context.

### Skills vs. commands vs. subagents vs. MCP (short version)
- **Skill:** "how to do X" guidance (autonomous).
- **Command:** "do X now" (explicit).
- **Subagent:** isolate X in separate context / tool restrictions.
- **MCP:** provides tools; a Skill teaches the tool usage patterns.

---

## 7) Subagents: isolate context, tools, and cost

Subagents shine for:
- high-output operations (tests, log scrapes, big greps)
- parallel research
- specialized expertise (security review, DB query validation)

### Subagent best practices
- Keep `description` precise: it drives automatic delegation.
- Use tool restrictions (`tools`, `disallowedTools`) to enforce intent.
- **Context Cost Awareness:** Subagents spawn a *new* context window. While they keep the main thread clean, if a subagent needs to read 100 files, you pay for those tokens again. Use them for tasks that need *isolation*, not just to hide text.
- Be aware of background-mode constraints:
  - background subagents inherit permissions and auto-deny missing ones
  - **MCP tools are not available in background subagents** (plan around this)
- If you attach `skills:` in a subagent file, remember: the full skill content is injected at startup → keep those skills small.

**Example: test-runner subagent**
```md
---
name: test-runner
description: Run tests and summarize failures only
tools: Bash, Read, Grep, Glob
model: sonnet
---
Run the test suite, capture only failing test output, and summarize the root causes.
```

---

## 8) Hooks: deterministic automation (guardrails, not "magic")

Hooks are the most reliable way to ensure repeatable behavior:
- run formatters after file edits
- block unsafe commands
- log/annotate actions for compliance
- send notifications when Claude is waiting

### Hook best practices (high-signal)
- Make hooks **fast** and **idempotent**. Hooks run often; latency adds up.
- Prefer **PostToolUse** for formatting/linting (runs after edits).
- Prefer **PreToolUse** for policy enforcement (block risky Bash/MCP calls).
- Keep hook logic in scripts with real tests; keep config thin.

### Stop hooks: avoid infinite loops
Claude Code exposes `stop_hook_active` in Stop hook input to indicate a stop hook has already forced continuation. Use it to prevent "retry forever" loops.
Practical rule: **Stop hook should continue at most once**, then require user intervention.

### Security stance
- Hooks can enforce policy even when the model is "confused."
- In managed environments, admins can set `allowManagedHooksOnly: true` to block user/project/plugin hooks.

---

## 9) Plugins: build "a small product"

### Core structure
A plugin is a directory with a manifest at `.claude-plugin/plugin.json` and optional feature directories at the plugin root.

Key best practices:
- Keep `.claude-plugin/` **manifest-only**. Do **not** nest `commands/`, `skills/`, etc. inside it.
- Namespacing: plugin commands are generally invoked as `/plugin-name:command` (prefix optional unless collisions).
- Use semantic versioning in `plugin.json` and keep a `CHANGELOG.md`.

### Plugin caching: design for relocatability
Installed plugins are copied into a cache for integrity/security. Implications:
- **Never reference files outside the plugin root** via `../..` — they won't exist in cache.
- Always reference internal scripts/resources using `${CLAUDE_PLUGIN_ROOT}`.
- If you need shared code across plugins:
  - use symlinks inside the plugin directory (copied during install), or
  - restructure marketplace `source` to include the shared parent directory and declare component paths in the marketplace entry.

### Debugging & validation
- **Enable Verbose Logging:** Use `claude --debug` (CLI) or set `"verbose": true` in your user `settings.json` to see plugin loading, hook registration, and MCP init details.
- Validate manifests early: `claude plugin validate` (or `/plugin validate`).
- If skills don't show up: clear cache (`rm -rf ~/.claude/plugins/cache`), restart, reinstall.

### Cross-platform scripts
If you ship hooks/scripts:
- Use `#!/usr/bin/env bash` when possible.
- Avoid bashisms if Windows users (Git Bash) are in scope.
- Prefer portable tools (python, node) when already required, and document prerequisites.

---

## 10) Plugin marketplaces: distribution, upgrades, and trust

A marketplace is a repo (or URL) containing `.claude-plugin/marketplace.json`.

### Marketplace best practices
- Prefer Git-hosted marketplaces over URL-hosted:
  - Relative `source: "./plugins/my-plugin"` works reliably only for git-based installs.
- Use `strict` intentionally:
  - `strict: true` → plugin must have its own `plugin.json`
  - `strict: false` → marketplace entry can fully define components (useful for "monorepo" layouts)
- Provide:
  - ownership metadata (name/email)
  - plugin categories/keywords
  - license + repo homepage
  - clear install instructions + compatibility notes

### Updating marketplaces & the "stale cache" gotcha
A recent Claude Code issue reports self-hosted marketplace caches not being fetched before install/update, causing outdated installs unless you manually update the marketplace checkout. Until this is fixed everywhere:
- Run `/plugin marketplace update <marketplace>` before installing/updating plugins from self-hosted sources.
- If you suspect a stale cache, manually `git pull` inside `~/.claude/plugins/marketplaces/<marketplace-name>/`.

### Team rollouts (recommended pattern)
In `.claude/settings.json`:
- add `extraKnownMarketplaces` so teammates are prompted to install on trust
- add `enabledPlugins` to suggest default installs

In managed settings:
- restrict marketplace sources with `strictKnownMarketplaces` (allowlist).

---

## 11) MCP: integrations with sharp edges (treat as untrusted)

### Transport & configuration choices
- Remote HTTP is recommended; SSE is deprecated where possible.
- Stdio servers are ideal for local tooling or custom scripts.

### MCP security best practices
- Assume third-party MCP servers are untrusted unless vetted. Official docs explicitly warn about correctness/security and prompt injection risks.
- Minimize tool surface:
  - prefer "read-only" tools unless you need mutation
  - restrict via permissions and/or managed allowlists/denylists
- **No Secrets in Config:** Pass API keys and secrets via ENV variables. Do not commit them to `.mcp.json`.
- Combine MCP + Skills:
  - MCP provides tools
  - Skills teach "how to use our tools safely" (queries, limits, retry policy, etc.)

### MCP in plugins
- Bundle MCP via `.mcp.json` (or inline in plugin.json) and reference local scripts/config with `${CLAUDE_PLUGIN_ROOT}`.

---

## 12) LSP in plugins: cheap correctness wins

LSP servers give Claude immediate diagnostics and better navigation.
Best practices:
- Ensure binaries exist in PATH (install instructions in README).
- Set `startupTimeout` sensibly for slower servers.
- Use `extensionToLanguage` mappings carefully in polyglot repos.
- Keep LSP config in `.lsp.json` unless you truly need inline `plugin.json`.

---

## 13) Performance & context management

High-leverage habits:
- Keep always-loaded content small:
  - CLAUDE.md concise
  - rules modular
  - SKILL.md lean
- Use subagents to isolate "output floods".
- Use hooks for formatting/linting instead of "please remember to run prettier."
- If a workflow grows complex, promote it:
  - from ad-hoc prompt → command
  - from command → plugin
  - from plugin → marketplace with versioning and CI

---

## 14) Known pain points & pragmatic workarounds

### Marketplace cache / updates
Symptom: plugin updates don't appear even after bumping version.
Workarounds:
- `/plugin marketplace update …`
- manual `git pull` in the cached marketplace directory

### Windows plugin management UX
There are reports of plugin uninstall/removal problems in the UI on Windows.
Workaround:
- Use CLI commands (`claude plugin uninstall … --scope …`) where the UI gets stuck.

### Claude Code on the web: plugin install hangs
A freshly opened issue reports that installing plugins in web-based Claude Code environments can hang the agent.
Workaround patterns:
- Skip plugin installs in cloud hooks (detect env) and pre-bake dependencies where possible.
- If you need plugins, prefer local Claude Code execution until the web install path is stable.

---

## 15) Templates (copy/paste)

### Minimal plugin skeleton
```
my-plugin/
├─ .claude-plugin/
│  └─ plugin.json
├─ commands/
│  └─ hello.md
├─ skills/
│  └─ my-skill/
│     ├─ SKILL.md
│     └─ references/
│       └─ deep-dive.md
├─ hooks/
│  └─ hooks.json
└─ scripts/
   └─ format.sh
```

### Minimal marketplace skeleton
```
my-marketplace/
├─ .claude-plugin/
│  └─ marketplace.json
└─ plugins/
   └─ my-plugin/
     └─ ...plugin contents...
```

### "Progressive disclosure" skill skeleton
```md
---
name: my-skill
description: Use when the user asks to <X>; avoid when <Y>
disable-model-invocation: false
---

# Purpose
Teach Claude how to <X> safely and consistently.

# Quick recipe
1) Do A
2) Validate B
3) Only then do C

# References
- See references/deep-dive.md for edge cases and detailed workflows.
```

---

## References (source material)

Official docs (Claude Code):
- https://code.claude.com/docs/
- Plugins: https://code.claude.com/docs/en/plugins
- Plugins reference: https://code.claude.com/docs/en/plugins-reference
- Discover plugins: https://code.claude.com/docs/en/discover-plugins
- Plugin marketplaces: https://code.claude.com/docs/en/plugin-marketplaces
- Skills: https://code.claude.com/docs/en/skills
- Subagents: https://code.claude.com/docs/en/sub-agents
- Hooks: https://code.claude.com/docs/en/hooks and https://code.claude.com/docs/en/hooks-guide
- Memory: https://code.claude.com/docs/en/memory
- Settings: https://code.claude.com/docs/en/settings
- MCP: https://code.claude.com/docs/en/mcp
- Output styles: https://code.claude.com/docs/en/output-styles
- Security: https://code.claude.com/docs/en/security

GitHub issues (examples of common failure modes / UX gaps):
- Plugin marketplace cache: https://github.com/anthropics/claude-code/issues/16866
- Web env plugin install hang: https://github.com/anthropics/claude-code/issues/18088
- Windows plugin mgmt UX: https://github.com/anthropics/claude-code/issues/9426

Community signals (toolkits + discussion):
- plugin-dev toolkit (community expansion): https://github.com/sjnims/plugin-dev
- PR note on slimming skill docs / removing accidental bash triggers: https://github.com/anthropics/claude-code/pull/13204
- Output styles discussion: https://github.com/anthropics/claude-code/issues/10721
- Reddit thread re output style changes: https://www.reddit.com/r/ClaudeCode/comments/1okvlib/important_2030_please_keep_the_outputstyle/

---

*Last reviewed: 2026-01-15. Claude Code evolves quickly; validate against current release notes when making policy or platform commitments.*
