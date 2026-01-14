#!/usr/bin/env python3
"""
Skill activation hook for bluera-knowledge plugin.
Matches user prompts against skill rules and injects activation reminders.

Runs on UserPromptSubmit to detect users who would benefit from learning
about BK skills, while excluding users who already know BK terminology.
"""

import json
import os
import re
import sys
from pathlib import Path
from typing import Any

CONFIG_DIR = Path.home() / ".local" / "share" / "bluera-knowledge"
CONFIG_FILE = CONFIG_DIR / "skill-activation.json"
DEFAULT_CONFIG: dict[str, Any] = {
    "enabled": True,
    "threshold": 1,
    "skills": {
        "knowledge-search": True,
        "when-to-query": True,
        "search-optimization": True,
        "advanced-workflows": True,
        "store-lifecycle": True,
    },
}


def load_config() -> dict[str, Any]:
    """Load skill activation configuration."""
    if not CONFIG_FILE.exists():
        return DEFAULT_CONFIG.copy()
    try:
        with open(CONFIG_FILE, encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, IOError):
        return DEFAULT_CONFIG.copy()


def load_rules(plugin_root: Path) -> dict[str, Any]:
    """Load skill rules from plugin hooks directory."""
    rules_path = plugin_root / "hooks" / "skill-rules.json"
    if not rules_path.exists():
        return {"skills": [], "threshold": 1, "globalExclusions": []}
    with open(rules_path, encoding="utf-8") as f:
        return json.load(f)


def matches_condition(prompt: str, condition: dict[str, Any]) -> bool:
    """Check if prompt matches a single condition (keyword or regex)."""
    prompt_lower = prompt.lower()
    if "keyword" in condition:
        return condition["keyword"].lower() in prompt_lower
    if "regex" in condition:
        return bool(re.search(condition["regex"], prompt, flags=re.IGNORECASE))
    return False


def check_exclusions(
    prompt: str, exclusions: list[dict[str, Any]]
) -> bool:
    """Check if any exclusion pattern matches. Returns True if excluded."""
    for exc in exclusions:
        if matches_condition(prompt, exc):
            return True
    return False


def score_skill(
    prompt: str, skill: dict[str, Any]
) -> tuple[int, list[str]]:
    """Score a skill against the user prompt. Returns (score, reasons)."""
    reasons: list[str] = []
    score = 0

    # Check skill-specific exclusions first
    if check_exclusions(prompt, skill.get("exclusions", [])):
        return 0, []

    for trigger in skill.get("triggers", []):
        if matches_condition(prompt, trigger):
            weight = trigger.get("weight", 1)
            score += weight
            if "keyword" in trigger:
                reasons.append(f'keyword "{trigger["keyword"]}"')
            elif "regex" in trigger:
                reasons.append(f'pattern match')

    return score, reasons


def generate_reminder(
    matches: list[tuple[str, int, list[str], str]]
) -> str:
    """Generate the system-reminder for matched skills."""
    lines = [
        "<system-reminder>",
        "BLUERA-KNOWLEDGE SKILL ACTIVATION",
        "",
        "The user's prompt suggests they may benefit from these skills.",
        "For EACH skill below, decide YES/NO:",
        "- YES: Invoke via Skill tool: Skill(skill='bluera-knowledge:<skill-name>')",
        "- NO: Skip (user doesn't need this guidance)",
        "",
        "Candidate skills (ranked by relevance):",
    ]

    for name, score, reasons, description in matches:
        lines.append(f"")
        lines.append(f"  [{name}] (score={score})")
        lines.append(f"  Purpose: {description}")
        lines.append(f"  Matched: {', '.join(reasons[:3])}")

    lines.append("")
    lines.append("Evaluate quickly, then answer the user's question.")
    lines.append("</system-reminder>")

    return "\n".join(lines)


def main() -> int:
    # Load configuration
    config = load_config()

    # Check if skill activation is enabled
    if not config.get("enabled", True):
        return 0

    # Get plugin root from environment
    plugin_root_env = os.environ.get("CLAUDE_PLUGIN_ROOT", "")
    if not plugin_root_env:
        return 0
    plugin_root = Path(plugin_root_env)

    # Read hook input from stdin
    try:
        stdin_data = sys.stdin.read()
        if not stdin_data.strip():
            return 0
        hook_input = json.loads(stdin_data)
    except json.JSONDecodeError:
        return 0

    prompt = hook_input.get("prompt", "")
    if not prompt.strip():
        return 0

    # Load rules
    rules = load_rules(plugin_root)

    # Check global exclusions first
    if check_exclusions(prompt, rules.get("globalExclusions", [])):
        return 0

    threshold = config.get("threshold", rules.get("threshold", 1))
    enabled_skills = config.get("skills", {})

    # Score each skill
    matches: list[tuple[str, int, list[str], str]] = []

    for skill in rules.get("skills", []):
        name = skill["name"]

        # Skip disabled skills
        if not enabled_skills.get(name, True):
            continue

        score, reasons = score_skill(prompt, skill)
        if score >= threshold:
            matches.append((name, score, reasons, skill.get("description", "")))

    # No matches - silent exit
    if not matches:
        return 0

    # Sort by score (highest first)
    matches.sort(key=lambda t: t[1], reverse=True)

    # Generate and output the reminder
    reminder = generate_reminder(matches)
    print(reminder)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
