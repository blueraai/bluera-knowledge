---
description: Toggle skill auto-activation on/off or configure individual skills
argument-hint: "[on|off|status|config]"
allowed-tools: ["Read", "Write", "AskUserQuestion"]
---

# Skill Activation Configuration

Manage the bluera-knowledge skill auto-activation system.

## Configuration File

Location: `~/.local/share/bluera-knowledge/skill-activation.json`

Default configuration (created if missing):
```json
{
  "enabled": true,
  "threshold": 1,
  "skills": {
    "knowledge-search": true,
    "when-to-query": true,
    "search-optimization": true,
    "advanced-workflows": true,
    "store-lifecycle": true
  }
}
```

## Steps

### 1. Parse Arguments

Extract the subcommand from $ARGUMENTS:
- Empty or "status": Show current status
- "on": Enable skill activation
- "off": Disable skill activation
- "config": Interactive skill configuration

### 2. Read Current Configuration

Read `~/.local/share/bluera-knowledge/skill-activation.json`

If the file doesn't exist, use the default configuration shown above.

### 3. Execute Subcommand

**For "status" or empty arguments:**

Display the current configuration:

```
## Skill Activation Status

**Status**: [Enabled/Disabled]
**Threshold**: [threshold value]

### Individual Skills
| Skill | Status |
|-------|--------|
| knowledge-search | enabled/disabled |
| when-to-query | enabled/disabled |
| search-optimization | enabled/disabled |
| advanced-workflows | enabled/disabled |
| store-lifecycle | enabled/disabled |

Use `/bluera-knowledge:skill-activation config` to toggle individual skills.
```

**For "on":**

1. Read configuration (or use defaults)
2. Set `enabled: true`
3. Ensure directory exists: `~/.local/share/bluera-knowledge/`
4. Write updated configuration
5. Confirm: "Skill activation **enabled**. Skills will be suggested based on your prompts."

**For "off":**

1. Read configuration (or use defaults)
2. Set `enabled: false`
3. Write updated configuration
4. Confirm: "Skill activation **disabled**. No skill suggestions will appear."

**For "config":**

1. Read current configuration
2. Use AskUserQuestion to let user toggle skills:

```json
{
  "questions": [{
    "question": "Which skills should auto-activate when relevant patterns are detected?",
    "header": "Skills",
    "multiSelect": true,
    "options": [
      {
        "label": "knowledge-search",
        "description": "Suggests when to query BK for library questions"
      },
      {
        "label": "when-to-query",
        "description": "Guides BK vs Grep/Read decisions"
      },
      {
        "label": "search-optimization",
        "description": "Tips for optimizing search parameters"
      },
      {
        "label": "advanced-workflows",
        "description": "Multi-tool orchestration patterns"
      },
      {
        "label": "store-lifecycle",
        "description": "Managing knowledge stores"
      }
    ]
  }]
}
```

3. Update skills based on selection (selected = enabled, unselected = disabled)
4. Write updated configuration
5. Show updated status table

## Notes

- The configuration directory is created automatically if it doesn't exist
- Changes take effect immediately on the next prompt
- When disabled globally, no skills are suggested regardless of individual settings
