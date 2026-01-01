---
description: Index a local folder of reference material
argument-hint: "[path] [--name store-name]"
allowed-tools: ["mcp__bluera-knowledge__create_store"]
---

# Add Local Folder to Knowledge Stores

Index a local folder of reference material: **$ARGUMENTS**

## Steps

1. Parse arguments from $ARGUMENTS:
   - Extract the folder path (required, first positional argument)
   - Extract --name parameter (optional, defaults to folder name)

2. Use mcp__bluera-knowledge__create_store tool:
   - name: Store name (from --name or folder basename)
   - type: "file"
   - source: The folder path

3. Display results showing job ID for background indexing:

```
✓ Adding folder: /Users/me/my-docs...
✓ Created store: my-docs (e5f6g7h8...)
  Location: ~/.local/share/bluera-knowledge/stores/e5f6g7h8.../

🔄 Indexing started in background
   Job ID: job_xyz789abc123

Check status with: /bluera-knowledge:check-status job_xyz789abc123
Or view all jobs: /bluera-knowledge:check-status
```

## Error Handling

If creation fails (e.g., path doesn't exist, permission denied):

```
✗ Failed to add folder: [error message]

Common issues:
- Check that the path exists
- Ensure you have read permissions for the folder
- Verify the path is a directory, not a file
- Use absolute paths to avoid ambiguity
```
