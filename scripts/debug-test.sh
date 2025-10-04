#!/bin/bash
set -e

# Visual Debugging - ULTRA FAST (~10 seconds)
#
# This script runs a single test in headed mode with debug flags
# so you can SEE what's happening in the browser.
#
# Usage:
#   ./scripts/debug-test.sh                    # Against local build
#   ./scripts/debug-test.sh --vercel           # Against Vercel preview
#   ./scripts/debug-test.sh --url <URL>        # Against specific URL

echo "🐛 Visual E2E Test Debugger"
echo "============================"
echo ""

MODE="local"
CUSTOM_URL=""

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --vercel)
            MODE="vercel"
            shift
            ;;
        --url)
            MODE="custom"
            CUSTOM_URL="$2"
            shift 2
            ;;
        *)
            echo "❌ Unknown option: $1"
            echo "Usage: $0 [--vercel] [--url <URL>]"
            exit 1
            ;;
    esac
done

# Load environment variables
if [ -f .env.test.local ]; then
    export $(cat .env.test.local | grep -v '^#' | xargs)
fi

if [ "$MODE" = "vercel" ]; then
    echo "🌐 Mode: Test against Vercel Preview"
    echo ""

    # Check Vercel CLI
    if ! command -v vercel &> /dev/null; then
        echo "❌ Vercel CLI not found. Installing..."
        npm install -g vercel@latest
    fi

    # Get Vercel token
    if [ -z "$VERCEL_TOKEN" ]; then
        if [ -f mcp-vercel-tools/.env ]; then
            export VERCEL_TOKEN=$(grep VERCEL_API_TOKEN mcp-vercel-tools/.env | cut -d '=' -f2)
        fi
    fi

    export VERCEL_ORG_ID="team_u6SeJMdPvkQRESdCl2eN7f2F"
    export VERCEL_PROJECT_ID="prj_MF9abEzyIQBMVraPsD3K81CXm3o6"

    echo "🔍 Finding latest preview..."
    LATEST_PREVIEW=$(vercel ls --token="$VERCEL_TOKEN" | grep "Preview" | head -1 | awk '{print $1}')

    if [ -z "$LATEST_PREVIEW" ]; then
        echo "❌ No preview found!"
        exit 1
    fi

    export PLAYWRIGHT_TEST_BASE_URL="https://$LATEST_PREVIEW"
    echo "✅ Testing: $PLAYWRIGHT_TEST_BASE_URL"

elif [ "$MODE" = "custom" ]; then
    echo "🌐 Mode: Test against custom URL"
    export PLAYWRIGHT_TEST_BASE_URL="$CUSTOM_URL"
    echo "✅ Testing: $PLAYWRIGHT_TEST_BASE_URL"

else
    echo "💻 Mode: Test against local build"
    echo ""

    # Build if needed
    if [ ! -d "dist" ]; then
        echo "🔨 Building application..."
        export VITE_SUPABASE_URL="${VITE_SUPABASE_URL:-https://slhyzoupwluxgasvapoc.supabase.co}"
        export VITE_SUPABASE_ANON_KEY="${VITE_SUPABASE_ANON_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsaHl6b3Vwd2x1eGdhc3ZhcG9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwMDY5OCwiZXhwIjoyMDc0NTc2Njk4fQ.hxK65OHKF8ScncLF7zlcu0qEYgKAqipmtAT2UySKVwg}"
        npm run build
    fi

    # Start server
    echo "🚀 Starting local server..."
    npx serve -s dist -l 5173 > /dev/null 2>&1 &
    SERVER_PID=$!
    trap "kill $SERVER_PID 2>/dev/null" EXIT

    # Wait for server
    echo "⏳ Waiting for server..."
    sleep 3

    export PLAYWRIGHT_TEST_BASE_URL="http://localhost:5173"
    echo "✅ Testing: $PLAYWRIGHT_TEST_BASE_URL"
fi

echo ""
echo "🎬 Starting visual debugger..."
echo "   - Browser will open (headed mode)"
echo "   - Playwright Inspector will launch"
echo "   - You can step through the test"
echo ""
echo "💡 Tips:"
echo "   - Click ▶ to run the test step by step"
echo "   - Hover over elements to see them highlighted"
echo "   - Use browser DevTools for inspection"
echo ""

# Run with maximum debugging
npx playwright test e2e/quick-auth-check.spec.ts \
    --project=chromium \
    --headed \
    --debug \
    --reporter=line

echo ""
echo "✅ Debug session complete!"
