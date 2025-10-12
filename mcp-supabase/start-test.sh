#!/bin/bash
# Start Supabase MCP Server with TEST database credentials

# Get the directory where this script lives
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Load .env from project root
if [ -f "$PROJECT_ROOT/.env" ]; then
    set -a
    source "$PROJECT_ROOT/.env"
    set +a
fi

# Set TEST database credentials
export SUPABASE_URL="$SUPABASE_TEST_URL"
export SUPABASE_SERVICE_ROLE="$SUPABASE_TEST_SERVICE_ROLE"

# Start the MCP server
exec node "$SCRIPT_DIR/dist/index.js"
