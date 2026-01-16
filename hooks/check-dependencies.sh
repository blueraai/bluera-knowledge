#!/bin/bash
# Bluera Knowledge Plugin - Dependency Checker
# Automatically checks and installs dependencies for the plugin
#
# Environment variables:
#   BK_SKIP_AUTO_INSTALL=1  - Skip automatic installation of crawl4ai
#                             Set this if you prefer to manage Python packages manually
#
# What this script auto-installs (if missing):
#   - Node.js dependencies (via bun or npm, from package.json)
#   - Python virtual environment with crawl4ai (isolated from system Python)
#   - Playwright Chromium browser (via playwright CLI, for headless crawling)

set -e

# Get the plugin root directory
PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-$(dirname "$(dirname "$0")")}"

# Venv location within plugin (isolated from system Python)
VENV_DIR="$PLUGIN_ROOT/.venv"
VENV_PYTHON="$VENV_DIR/bin/python3"
VENV_PIP="$VENV_DIR/bin/pip"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# =====================
# Helper Functions
# =====================

# Install Playwright browser using specified python
# Args: $1 = python path to use
install_playwright_browser() {
    local PYTHON_CMD="${1:-python3}"

    # Check if Playwright Chromium is already installed by testing if browser can be launched
    if "$PYTHON_CMD" -c "from playwright.sync_api import sync_playwright; p = sync_playwright().start(); b = p.chromium.launch(); b.close(); p.stop()" 2>/dev/null; then
        echo -e "${GREEN}[bluera-knowledge] Playwright Chromium ready ✓${NC}"
        return 0
    fi

    echo -e "${YELLOW}[bluera-knowledge] Installing Playwright browser (one-time setup)...${NC}"
    if "$PYTHON_CMD" -m playwright install chromium 2>/dev/null; then
        echo -e "${GREEN}[bluera-knowledge] Playwright Chromium installed ✓${NC}"
        return 0
    else
        echo -e "${YELLOW}[bluera-knowledge] Playwright browser install failed.${NC}"
        echo -e "${YELLOW}Manual fix: $PYTHON_CMD -m playwright install chromium${NC}"
        return 1
    fi
}

# =====================
# Node.js Dependencies
# =====================

# Check if node_modules exists
if [ ! -d "$PLUGIN_ROOT/node_modules" ]; then
    echo -e "${YELLOW}[bluera-knowledge] Installing Node.js dependencies...${NC}"

    # Try bun first (faster), fall back to npm
    if command -v bun &> /dev/null; then
        (cd "$PLUGIN_ROOT" && bun install --frozen-lockfile 2>/dev/null) && \
            echo -e "${GREEN}[bluera-knowledge] Node.js dependencies installed ✓${NC}" || \
            echo -e "${RED}[bluera-knowledge] Failed to install Node.js dependencies${NC}"
    elif command -v npm &> /dev/null; then
        (cd "$PLUGIN_ROOT" && npm ci --silent 2>/dev/null) && \
            echo -e "${GREEN}[bluera-knowledge] Node.js dependencies installed ✓${NC}" || \
            echo -e "${RED}[bluera-knowledge] Failed to install Node.js dependencies${NC}"
    else
        echo -e "${RED}[bluera-knowledge] Neither bun nor npm found. Please install Node.js dependencies manually.${NC}"
    fi
fi

# =====================
# Python Dependencies (using venv)
# =====================

# Check if Python3 is installed
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}[bluera-knowledge] Python3 is not installed${NC}"
    echo -e "${YELLOW}Web crawling features require Python 3.x${NC}"
    echo -e "${YELLOW}Install Python3: https://www.python.org/downloads/${NC}"
    exit 0  # Don't block the session, just warn
fi

# Check Python version (require 3.8+)
python_version=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')

if ! python3 -c "import sys; exit(0 if sys.version_info >= (3, 8) else 1)"; then
    echo -e "${YELLOW}[bluera-knowledge] Python ${python_version} detected. Python 3.8+ recommended for crawl4ai${NC}"
fi

# Check if venv exists and has crawl4ai installed
if [ -f "$VENV_PYTHON" ] && "$VENV_PYTHON" -c "import crawl4ai" 2>/dev/null; then
    crawl4ai_version=$("$VENV_PYTHON" -c "import crawl4ai; print(crawl4ai.__version__)" 2>/dev/null || echo "unknown")
    echo -e "${GREEN}[bluera-knowledge] crawl4ai ${crawl4ai_version} ready (venv) ✓${NC}"
    # Ensure Playwright browser is installed for headless crawling
    install_playwright_browser "$VENV_PYTHON"
    exit 0
fi

# Check if auto-install is disabled
if [ "${BK_SKIP_AUTO_INSTALL:-}" = "1" ]; then
    echo -e "${YELLOW}[bluera-knowledge] Auto-install disabled (BK_SKIP_AUTO_INSTALL=1)${NC}"
    echo -e "${YELLOW}To enable web crawling, create venv manually:${NC}"
    echo -e "  ${GREEN}python3 -m venv $VENV_DIR${NC}"
    echo -e "  ${GREEN}$VENV_PIP install crawl4ai${NC}"
    echo -e "  ${GREEN}$VENV_PYTHON -m playwright install chromium${NC}"
    exit 0
fi

# Create venv if it doesn't exist
if [ ! -d "$VENV_DIR" ]; then
    echo -e "${YELLOW}[bluera-knowledge] Creating Python virtual environment...${NC}"
    if python3 -m venv "$VENV_DIR" 2>/dev/null; then
        echo -e "${GREEN}[bluera-knowledge] Virtual environment created ✓${NC}"
    else
        echo -e "${RED}[bluera-knowledge] Failed to create virtual environment${NC}"
        echo -e "${YELLOW}Manual fix: python3 -m venv $VENV_DIR${NC}"
        exit 0
    fi
fi

# Install crawl4ai into venv
echo -e "${YELLOW}[bluera-knowledge] Installing crawl4ai into virtual environment...${NC}"
echo -e "${YELLOW}(Set BK_SKIP_AUTO_INSTALL=1 to disable auto-install)${NC}"

if "$VENV_PIP" install --quiet crawl4ai 2>/dev/null; then
    crawl4ai_version=$("$VENV_PYTHON" -c "import crawl4ai; print(crawl4ai.__version__)" 2>/dev/null || echo "installed")
    echo -e "${GREEN}[bluera-knowledge] crawl4ai ${crawl4ai_version} installed (venv) ✓${NC}"
    # Install Playwright browser for headless crawling
    install_playwright_browser "$VENV_PYTHON"
else
    echo -e "${RED}[bluera-knowledge] Failed to install crawl4ai${NC}"
    echo -e "${YELLOW}Manual fix:${NC}"
    echo -e "  ${GREEN}$VENV_PIP install crawl4ai${NC}"
    echo -e "  ${GREEN}$VENV_PYTHON -m playwright install chromium${NC}"
fi

# Always exit 0 to not block the session
exit 0
