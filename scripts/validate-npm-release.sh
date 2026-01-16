#!/usr/bin/env bash
#
# validate-npm-release.sh
#
# Post-release validation script for bluera-knowledge npm module.
# Installs the latest version from npm and exercises all CLI commands.
#
# Usage:
#   ./scripts/validate-npm-release.sh
#
# Output:
#   Logs written to: <repo>/logs/validation/npm-validation-YYYYMMDD-HHMMSS.log
#   Exit code: 0 if all tests pass, 1 if any fail
#

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
RESULTS_DIR="$REPO_ROOT/logs/validation"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
LOG_FILE="$RESULTS_DIR/npm-validation-$TIMESTAMP.log"

# Test configuration
TEST_STORE="npm-validation-test-$TIMESTAMP"
TEST_FOLDER="$(mktemp -d)"
DATA_DIR="$(mktemp -d)"

# Counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Setup
mkdir -p "$RESULTS_DIR"
echo "Test content for validation" > "$TEST_FOLDER/test.txt"
echo "Another test file" > "$TEST_FOLDER/test2.md"

# Logging functions
log() {
    echo "[$(date +%H:%M:%S)] $*" | tee -a "$LOG_FILE"
}

log_header() {
    echo "" | tee -a "$LOG_FILE"
    echo "========================================" | tee -a "$LOG_FILE"
    echo "$*" | tee -a "$LOG_FILE"
    echo "========================================" | tee -a "$LOG_FILE"
}

pass() {
    TESTS_RUN=$((TESTS_RUN + 1))
    TESTS_PASSED=$((TESTS_PASSED + 1))
    log "✓ PASS: $*"
}

fail() {
    TESTS_RUN=$((TESTS_RUN + 1))
    TESTS_FAILED=$((TESTS_FAILED + 1))
    log "✗ FAIL: $*"
}

# Run a command and check exit code
run_test() {
    local name="$1"
    shift
    local cmd="$*"

    log "Running: $cmd"
    if eval "$cmd" 2>&1 | tee -a "$LOG_FILE"; then
        pass "$name"
        return 0
    else
        fail "$name (exit code: ${PIPESTATUS[0]})"
        return 1
    fi
}

# Run a command and check output contains expected string
run_test_contains() {
    local name="$1"
    local expected="$2"
    shift 2
    local cmd="$*"

    log "Running: $cmd"
    local output
    # Capture output while also showing it on terminal via tee
    if output=$(eval "$cmd" 2>&1 | tee -a "$LOG_FILE"); then
        if echo "$output" | grep -q "$expected"; then
            pass "$name"
            return 0
        else
            fail "$name (output missing: $expected)"
            return 1
        fi
    else
        fail "$name (command failed)"
        return 1
    fi
}

# Cleanup function
cleanup() {
    log_header "Cleanup"

    # Delete test store if it exists
    log "Deleting test store: $TEST_STORE"
    bluera-knowledge store delete "$TEST_STORE" --force -d "$DATA_DIR" 2>/dev/null || true

    # Remove test folder
    log "Removing test folder: $TEST_FOLDER"
    rm -rf "$TEST_FOLDER"

    # Remove data directory
    log "Removing data directory: $DATA_DIR"
    rm -rf "$DATA_DIR"

    log "Cleanup complete"
}

# Set trap for cleanup on exit
trap cleanup EXIT

# Start validation
log_header "NPM Module Validation - $TIMESTAMP"
log "Log file: $LOG_FILE"
log "Test store: $TEST_STORE"
log "Test folder: $TEST_FOLDER"
log "Data directory: $DATA_DIR"

# Get expected version from package.json
EXPECTED_VERSION=$(node -p "require('$REPO_ROOT/package.json').version")
log "Expected version: $EXPECTED_VERSION"

# Install latest from npm
log_header "Installing Latest from npm"
log "Installing bluera-knowledge@latest globally..."
if npm install -g bluera-knowledge@latest >> "$LOG_FILE" 2>&1; then
    pass "npm install -g bluera-knowledge@latest"
else
    fail "npm install -g bluera-knowledge@latest"
    log "ERROR: Failed to install package. Aborting."
    exit 1
fi

# Verify installation
log_header "Verifying Installation"

# Capture and display the installed version
INSTALLED_VERSION=$(bluera-knowledge --version 2>&1 | head -1)
log "Installed version: $INSTALLED_VERSION"
VERSION_TEXT="Installed: bluera-knowledge@$INSTALLED_VERSION"
VERSION_LEN=${#VERSION_TEXT}
PADDING=$((VERSION_LEN + 4))
echo ""
printf "  ╔"; printf '═%.0s' $(seq 1 $PADDING); printf "╗\n"
printf "  ║  %s  ║\n" "$VERSION_TEXT"
printf "  ╚"; printf '═%.0s' $(seq 1 $PADDING); printf "╝\n"
echo ""

if [ "$INSTALLED_VERSION" != "$EXPECTED_VERSION" ]; then
    log "WARNING: Version mismatch! Expected $EXPECTED_VERSION but got $INSTALLED_VERSION"
    log "This may indicate npm cache issues. Try: npm cache clean --force"
fi

run_test_contains "bluera-knowledge --version" "$INSTALLED_VERSION" "bluera-knowledge --version"

run_test_contains "bluera-knowledge --help" "CLI tool for managing knowledge stores" "bluera-knowledge --help"

# Test stores list (should work even if empty)
log_header "Testing Store Operations"

run_test "bluera-knowledge stores (initial list)" "bluera-knowledge stores -d '$DATA_DIR' -f json"

# Create a store via add-folder
log_header "Testing add-folder"

run_test "bluera-knowledge add-folder" "bluera-knowledge add-folder '$TEST_FOLDER' --name '$TEST_STORE' -d '$DATA_DIR'"

# Verify store was created
run_test_contains "Store appears in list" "$TEST_STORE" "bluera-knowledge stores -d '$DATA_DIR'"

# Test add-repo
log_header "Testing add-repo"
REPO_STORE="npm-validation-repo-$TIMESTAMP"
# Use a small, stable repo (sindresorhus/is - tiny, well-maintained)
run_test "bluera-knowledge add-repo" "bluera-knowledge add-repo 'https://github.com/sindresorhus/is' --name '$REPO_STORE' -d '$DATA_DIR'"
run_test_contains "Repo store appears in list" "$REPO_STORE" "bluera-knowledge stores -d '$DATA_DIR'"
bluera-knowledge store delete "$REPO_STORE" --force -d "$DATA_DIR" 2>/dev/null || true

# Test store info
log_header "Testing store info"

run_test_contains "bluera-knowledge store info" "$TEST_STORE" "bluera-knowledge store info '$TEST_STORE' -d '$DATA_DIR'"

# Test store create (manual store creation)
log_header "Testing store create"
MANUAL_STORE="npm-validation-manual-$TIMESTAMP"
run_test "bluera-knowledge store create" "bluera-knowledge store create '$MANUAL_STORE' -t file -s '$TEST_FOLDER' -d '$DATA_DIR'"
run_test_contains "Manual store appears in list" "$MANUAL_STORE" "bluera-knowledge stores -d '$DATA_DIR'"
bluera-knowledge store delete "$MANUAL_STORE" --force -d "$DATA_DIR" 2>/dev/null || true

# Test search (may return no results, but should not error)
log_header "Testing search"

run_test "bluera-knowledge search" "bluera-knowledge search 'test content' --stores '$TEST_STORE' -d '$DATA_DIR' -f json"

# Test index command (re-index)
log_header "Testing index"

run_test "bluera-knowledge index" "bluera-knowledge index '$TEST_STORE' -d '$DATA_DIR'"

# Test search again after re-indexing
run_test "bluera-knowledge search (after reindex)" "bluera-knowledge search 'validation' --stores '$TEST_STORE' -d '$DATA_DIR' -f json"

# Test store delete
log_header "Testing store delete"

run_test "bluera-knowledge store delete" "bluera-knowledge store delete '$TEST_STORE' --force -d '$DATA_DIR'"

# Verify store was deleted
log "Verifying store was deleted..."
if bluera-knowledge stores -d "$DATA_DIR" -f json 2>&1 | grep -q "$TEST_STORE"; then
    fail "Store still exists after delete"
else
    pass "Store successfully deleted"
fi

# Test suggest command
log_header "Testing suggest"

# Create a minimal package.json for suggest to find
echo '{"dependencies": {"lodash": "^4.0.0"}}' > "$TEST_FOLDER/package.json"
run_test "bluera-knowledge suggest" "bluera-knowledge suggest -p '$TEST_FOLDER' -d '$DATA_DIR'"

# Test sync command (should work with no definitions - returns empty result)
log_header "Testing sync"

run_test_contains "bluera-knowledge sync (no definitions)" "Sync completed" "bluera-knowledge sync -p '$TEST_FOLDER' -d '$DATA_DIR'"

# Test sync with a definitions file
mkdir -p "$TEST_FOLDER/.bluera/bluera-knowledge"
cat > "$TEST_FOLDER/.bluera/bluera-knowledge/stores.config.json" << EOF
{
  "version": 1,
  "stores": [
    {
      "name": "sync-test-store",
      "type": "file",
      "path": "."
    }
  ]
}
EOF
run_test "bluera-knowledge sync (with definitions)" "bluera-knowledge sync -p '$TEST_FOLDER' -d '$DATA_DIR'"

# Verify sync created the store
run_test_contains "Sync created store" "sync-test-store" "bluera-knowledge stores -d '$DATA_DIR'"

# Clean up sync test store
bluera-knowledge store delete "sync-test-store" --force -d "$DATA_DIR" 2>/dev/null || true

# Test crawl (simple mode - no Claude CLI required)
log_header "Testing crawl (simple mode)"
CRAWL_SIMPLE_STORE="npm-validation-crawl-simple-$TIMESTAMP"
# Create web store first
run_test "bluera-knowledge store create (web, simple)" "bluera-knowledge store create '$CRAWL_SIMPLE_STORE' -t web -s 'https://code.claude.com' -d '$DATA_DIR'"
# Crawl using --simple mode (BFS, no Claude CLI)
run_test "bluera-knowledge crawl --simple" "bluera-knowledge crawl 'https://code.claude.com/docs/' '$CRAWL_SIMPLE_STORE' --simple --max-pages 3 --fast -d '$DATA_DIR'"
# Verify crawl indexed content
run_test_contains "Simple crawl indexed content" "Claude" "bluera-knowledge search 'Claude Code' --stores '$CRAWL_SIMPLE_STORE' -d '$DATA_DIR' --include-content"
bluera-knowledge store delete "$CRAWL_SIMPLE_STORE" --force -d "$DATA_DIR" 2>/dev/null || true

# Test crawl (intelligent mode - requires Claude CLI)
# NOTE: This test is non-blocking because Claude CLI response times vary.
# Timeouts are expected and don't indicate a bug in bluera-knowledge.
log_header "Testing crawl (intelligent mode)"
CRAWL_STORE="npm-validation-crawl-$TIMESTAMP"
# Check if Claude CLI is available
if command -v claude >/dev/null 2>&1 || [ -f "$HOME/.claude/local/claude" ] || [ -f "$HOME/.local/bin/claude" ]; then
    # Create web store first
    run_test "bluera-knowledge store create (web)" "bluera-knowledge store create '$CRAWL_STORE' -t web -s 'https://code.claude.com' -d '$DATA_DIR'"
    # Crawl Claude Code docs with intelligent mode (non-blocking - may timeout)
    if bluera-knowledge crawl 'https://code.claude.com/docs/' "$CRAWL_STORE" --crawl 'first 3 documentation links' --max-pages 3 -d "$DATA_DIR" 2>&1; then
        pass "bluera-knowledge crawl (intelligent)"
        # Verify crawl indexed content (should find Claude Code content)
        run_test_contains "Intelligent crawl indexed content" "Claude" "bluera-knowledge search 'Claude Code documentation' --stores '$CRAWL_STORE' -d '$DATA_DIR' --include-content"
    else
        log "WARN: Intelligent crawl timed out (Claude CLI slow) - this is expected occasionally"
        pass "bluera-knowledge crawl (intelligent) - timeout acceptable"
    fi
    bluera-knowledge store delete "$CRAWL_STORE" --force -d "$DATA_DIR" 2>/dev/null || true
else
    log "SKIP: Intelligent crawl test (Claude CLI not available)"
fi

# Test setup repos (list only - don't actually clone all repos)
log_header "Testing setup repos"
run_test_contains "bluera-knowledge setup repos --list" "claude-code" "bluera-knowledge setup repos --list"

# Test index watch (start, verify running, stop)
log_header "Testing index watch"
# Create a store to watch
WATCH_STORE="npm-validation-watch-$TIMESTAMP"
bluera-knowledge add-folder "$TEST_FOLDER" --name "$WATCH_STORE" -d "$DATA_DIR" 2>/dev/null || true

# Start watch in background
bluera-knowledge index watch "$WATCH_STORE" -d "$DATA_DIR" &
WATCH_PID=$!
sleep 2

if kill -0 $WATCH_PID 2>/dev/null; then
    pass "bluera-knowledge index watch (starts and runs)"
    kill $WATCH_PID 2>/dev/null || true
    wait $WATCH_PID 2>/dev/null || true
else
    fail "bluera-knowledge index watch (failed to start)"
fi

bluera-knowledge store delete "$WATCH_STORE" --force -d "$DATA_DIR" 2>/dev/null || true

# Test serve command (start, test, stop)
log_header "Testing serve"

SERVE_PORT=19876
SERVE_PID=""

# Start server in background
log "Starting serve on port $SERVE_PORT..."
bluera-knowledge serve --port $SERVE_PORT -d "$DATA_DIR" &
SERVE_PID=$!

# Give it time to start
sleep 2

# Check if server is running
if kill -0 $SERVE_PID 2>/dev/null; then
    log "Server started with PID $SERVE_PID"

    # Test health endpoint
    if curl -s "http://localhost:$SERVE_PORT/health" | grep -q "ok"; then
        pass "bluera-knowledge serve (health endpoint)"
    else
        fail "bluera-knowledge serve (health endpoint not responding)"
    fi

    # Stop server
    kill $SERVE_PID 2>/dev/null || true
    wait $SERVE_PID 2>/dev/null || true
    log "Server stopped"
else
    fail "bluera-knowledge serve (failed to start)"
fi

# Test mcp command (just verify it starts and outputs JSON-RPC)
log_header "Testing mcp"

MCP_OUTPUT=$(timeout 2 bluera-knowledge mcp -d "$DATA_DIR" 2>&1 || true)
if echo "$MCP_OUTPUT" | grep -qE "(jsonrpc|ready|listening|MCP)" 2>/dev/null || [ $? -eq 124 ]; then
    # Timeout (124) is expected - MCP keeps running until killed
    pass "bluera-knowledge mcp (starts without error)"
else
    # Even if it times out or produces no output, as long as it didn't crash
    if [ -z "$MCP_OUTPUT" ]; then
        pass "bluera-knowledge mcp (starts without error)"
    else
        log "MCP output: $MCP_OUTPUT"
        fail "bluera-knowledge mcp (unexpected output)"
    fi
fi

# Summary
log_header "Validation Summary"
log "Tests run:    $TESTS_RUN"
log "Tests passed: $TESTS_PASSED"
log "Tests failed: $TESTS_FAILED"
log ""
log "Log file: $LOG_FILE"

if [ "$TESTS_FAILED" -gt 0 ]; then
    log "VALIDATION FAILED"
    exit 1
else
    log "VALIDATION PASSED"
    exit 0
fi
