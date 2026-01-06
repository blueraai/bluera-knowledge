---
description: Cancel a background job
argument-hint: "[job-id]"
allowed-tools: ["mcp__bluera-knowledge__execute"]
---

# Cancel Background Job

Cancel a running or pending background job: **$ARGUMENTS**

## Steps

1. Parse the job ID from $ARGUMENTS (required)
   - If no job ID provided, show error and suggest using /bluera-knowledge:check-status to list active jobs

2. Use mcp__bluera-knowledge__execute tool with command "job:cancel":
   - args.jobId: The job ID from $ARGUMENTS

3. Display cancellation result:

```
✓ Job job_abc123def456 cancelled
  Type: clone
  Progress: 45% (was indexing)

The job has been stopped and will not continue.
```

## When to Cancel

Cancel a job when:
- You accidentally started indexing the wrong repository
- The operation is taking too long and you want to try a different approach
- You need to free up system resources
- You want to stop an operation before it completes

## Important Notes

- Only jobs in 'pending' or 'running' status can be cancelled
- Completed or failed jobs cannot be cancelled
- Cancelled jobs are marked with status 'cancelled' and remain in the job list
- Partial work may be saved (e.g., partially indexed files remain in the database)

## Error Handling

If job cannot be cancelled:

```
✗ Cannot cancel job job_abc123def456: Job has already completed

Only pending or running jobs can be cancelled.
```

If job not found:

```
✗ Job not found: job_abc123def456

Common issues:
- Check the job ID is correct
- Use /bluera-knowledge:check-status to see all active jobs
- Job may have already completed and been cleaned up
```
