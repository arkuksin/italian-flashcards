#!/bin/bash
# Debug version of start-test.sh

{
    echo "===== DEBUG START ====="
    echo "PWD: $(pwd)"
    echo "BASH_SOURCE[0]: ${BASH_SOURCE[0]}"

    # Get the directory where this script lives
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

    echo "SCRIPT_DIR: $SCRIPT_DIR"
    echo "PROJECT_ROOT: $PROJECT_ROOT"
    echo "ENV file exists: $([ -f "$PROJECT_ROOT/.env" ] && echo "YES" || echo "NO")"

    # Load .env from project root
    if [ -f "$PROJECT_ROOT/.env" ]; then
        set -a
        source "$PROJECT_ROOT/.env"
        set +a
        echo "SUPABASE_TEST_URL loaded: ${SUPABASE_TEST_URL:0:30}..."
        echo "SUPABASE_TEST_SERVICE_ROLE loaded: ${SUPABASE_TEST_SERVICE_ROLE:0:30}..."
    fi

    # Set TEST database credentials
    export SUPABASE_URL="$SUPABASE_TEST_URL"
    export SUPABASE_SERVICE_ROLE="$SUPABASE_TEST_SERVICE_ROLE"

    echo "Final SUPABASE_URL: ${SUPABASE_URL:0:30}..."
    echo "Final SUPABASE_SERVICE_ROLE: ${SUPABASE_SERVICE_ROLE:0:30}..."
    echo "===== DEBUG END ====="
} >&2

# Start the MCP server
exec node "$SCRIPT_DIR/dist/index.js"
