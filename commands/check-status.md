---
description: Check status of background operations
argument-hint: "[job-id]"
allowed-tools: ["mcp__bluera-knowledge__execute"]
---

# Check Background Job Status

Check the status of a background operation: **$ARGUMENTS**

## Steps

1. Parse $ARGUMENTS:
   - If a job ID is provided, use it for specific job status
   - If no arguments, show all active jobs

2. If job ID provided:
   - Use mcp__bluera-knowledge__execute tool with command "job:status":
     - args.jobId: The job ID from $ARGUMENTS
   - Display current status, progress, and details

3. If no job ID provided:
   - Use mcp__bluera-knowledge__execute tool with command "jobs":
     - args.activeOnly: true
   - Display a table of running/pending jobs

## Display Format

For a specific job:

```
Job Status: job_abc123def456
───────────────────────────────────────
Type:     clone
Status:   running
Progress: ███████████░░░░░░░░░ 45%
Message:  Indexed 562/1,247 files
Started:  2 minutes ago
```

For all active jobs:

```
Active Background Jobs
───────────────────────────────────────────────────────────────
| Job ID            | Type  | Status  | Progress | Started  |
|-------------------|-------|---------|----------|----------|
| job_abc123def456  | clone | running | 45%      | 2m ago   |
| job_xyz789ghi012  | index | pending | 0%       | Just now |

Use /bluera-knowledge:check-status <job-id> for details
```

If no active jobs:

```
No active background jobs.

Recent completed jobs:
| Job ID            | Type  | Status    | Completed |
|-------------------|-------|-----------|-----------|
| job_old123abc456  | clone | completed | 5m ago    |

Use /bluera-knowledge:cancel <job-id> to cancel a running job
```

## Error Handling

If job not found:

```
✗ Job not found: job_abc123def456

Common issues:
- Check the job ID is correct
- Job may have been cleaned up (completed jobs are removed after 24 hours)
- Use /bluera-knowledge:check-status to see all active jobs
```
