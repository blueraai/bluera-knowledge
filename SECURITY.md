# Security

## Reporting Vulnerabilities

If you discover a security vulnerability, please report it by opening a GitHub issue or contacting the maintainers directly.

## Security Configuration

### HTTP Server Binding

By default, the HTTP server binds to `127.0.0.1:3847` (localhost only). This means:

- The server is only accessible from the local machine
- External network access is blocked by default

To expose the server to the network (not recommended for untrusted environments):

```bash
bluera-knowledge serve --host 0.0.0.0 --port 3847
```

**Warning:** When binding to `0.0.0.0`, the API is accessible to any device on the network. Only use this in trusted environments.

### CORS Configuration

The HTTP API allows requests from any origin by default. This is appropriate for local development but should be restricted in production deployments.

### Setup Command

The `setup repos` command clones repositories from a hardcoded list of trusted Anthropic/Claude repositories. The URLs are defined in `src/defaults/repos.ts` and are not user-configurable.

## Security Practices

### Input Validation

- All MCP tool inputs are validated using Zod schemas
- HTTP API endpoints validate request bodies before processing
- Store IDs use branded types with regex validation (`/^[a-zA-Z0-9_-]+$/`)

### Subprocess Execution

- Git operations use `spawn()` with argument arrays (not shell strings)
- Python bridge uses JSON-RPC over stdin/stdout
- No shell command string interpolation

### Path Handling

- File store paths are normalized to absolute paths using `path.resolve()`
- Directory existence is validated before creating file stores
- Symlinks are resolved where security-relevant

### External Communications

- All external API calls (npm, PyPI, crates.io, Go proxy) use HTTPS
- No API keys or credentials are stored in the codebase
- Claude CLI integration uses the CLI's own authentication

## Dependencies

Run regular security audits on dependencies:

```bash
npm audit
pip-audit  # For Python dependencies
```
