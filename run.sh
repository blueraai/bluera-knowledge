#!/bin/bash
set -e

# Set PROJECT_ROOT to current working directory
PROJECT_ROOT="${PWD}"
export PROJECT_ROOT

# Execute the Node.js CLI with all arguments passed through
exec node "$(dirname "$0")/dist/index.js" "$@"
