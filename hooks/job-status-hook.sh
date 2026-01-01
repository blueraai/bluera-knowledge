#!/bin/bash
# Show active jobs in context when user submits a prompt
#
# This hook runs on UserPromptSubmit events and injects
# information about active background jobs into the context.

JOBS_DIR="$HOME/.local/share/bluera-knowledge/jobs"

# Exit silently if jobs directory doesn't exist
if [ ! -d "$JOBS_DIR" ]; then
  exit 0
fi

# Find active jobs (modified in last 60 minutes)
active_jobs=$(find "$JOBS_DIR" -name "*.json" -type f -not -name "*.pid" -mmin -60 2>/dev/null | while read -r file; do
  # Skip if file doesn't exist or isn't readable
  if [ ! -r "$file" ]; then
    continue
  fi

  # Extract job details using jq (if available) or grep fallback
  if command -v jq >/dev/null 2>&1; then
    status=$(jq -r '.status' "$file" 2>/dev/null || echo "unknown")
    if [ "$status" = "running" ] || [ "$status" = "pending" ]; then
      job_id=$(basename "$file" .json)
      type=$(jq -r '.type' "$file" 2>/dev/null || echo "unknown")
      progress=$(jq -r '.progress' "$file" 2>/dev/null || echo "0")
      message=$(jq -r '.message' "$file" 2>/dev/null || echo "No message")
      echo "- $type job ($job_id): ${progress}% - $message"
    fi
  else
    # Fallback using grep if jq not available
    status=$(grep -o '"status"[[:space:]]*:[[:space:]]*"[^"]*"' "$file" | cut -d'"' -f4)
    if [ "$status" = "running" ] || [ "$status" = "pending" ]; then
      job_id=$(basename "$file" .json)
      type=$(grep -o '"type"[[:space:]]*:[[:space:]]*"[^"]*"' "$file" | cut -d'"' -f4)
      progress=$(grep -o '"progress"[[:space:]]*:[[:space:]]*[0-9.]*' "$file" | awk '{print $NF}')
      message=$(grep -o '"message"[[:space:]]*:[[:space:]]*"[^"]*"' "$file" | cut -d'"' -f4)
      echo "- $type job ($job_id): ${progress}% - $message"
    fi
  fi
done)

# Output active jobs if any found
if [ -n "$active_jobs" ]; then
  echo ""
  echo "Active background jobs:"
  echo "$active_jobs"
  echo ""
  echo "Check status with: /bluera-knowledge:check-status"
fi
