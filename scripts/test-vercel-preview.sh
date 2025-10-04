#!/bin/bash
set -e

# Test Against Live Vercel Preview - FASTEST METHOD (~30 seconds)
#
# This script tests against the latest Vercel preview deployment
# without rebuilding or redeploying. Perfect for quick iterations.
#
# Usage:
#   ./scripts/test-vercel-preview.sh
#   ./scripts/test-vercel-preview.sh --debug  # Run with headed browser

echo "🚀 Quick E2E Test Against Vercel Preview"
echo "========================================"
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel@latest
fi

# Load environment variables
if [ -f .env.playwright.local ]; then
    echo "📦 Loading .env.playwright.local..."
    export $(cat .env.playwright.local | grep -v '^#' | xargs)
fi

# Check for required credentials
if [ -z "$VERCEL_TOKEN" ]; then
    echo "⚠️  VERCEL_TOKEN not found in environment"
    echo "💡 Reading from mcp-vercel-tools/.env..."
    if [ -f mcp-vercel-tools/.env ]; then
        export VERCEL_TOKEN=$(grep VERCEL_API_TOKEN mcp-vercel-tools/.env | cut -d '=' -f2)
    else
        echo "❌ Cannot find Vercel token. Please set VERCEL_TOKEN environment variable"
        exit 1
    fi
fi

# Set Vercel project context
export VERCEL_ORG_ID="team_u6SeJMdPvkQRESdCl2eN7f2F"
export VERCEL_PROJECT_ID="prj_MF9abEzyIQBMVraPsD3K81CXm3o6"

echo "🔍 Finding latest Vercel preview deployment..."
LATEST_PREVIEW=$(vercel ls --token="$VERCEL_TOKEN" | grep "Preview" | head -1 | awk '{print $1}')

if [ -z "$LATEST_PREVIEW" ]; then
    echo "❌ No preview deployments found!"
    echo "💡 Create one by pushing to your branch or running: vercel deploy"
    exit 1
fi

echo "✅ Found preview: $LATEST_PREVIEW"
echo ""

# Get bypass token from GitHub secrets or environment
if [ -z "$VERCEL_BYPASS_TOKEN" ]; then
    echo "⚠️  VERCEL_BYPASS_TOKEN not set"
    echo "💡 Tests may fail if Vercel password protection is enabled"
    echo "💡 Get token from: https://vercel.com/[your-team]/[project]/settings/deployment-protection"
else
    echo "✅ Bypass token configured"
fi

# Set test environment
export PLAYWRIGHT_TEST_BASE_URL="https://$LATEST_PREVIEW"
export VITE_SUPABASE_URL="${VITE_SUPABASE_URL:-https://slhyzoupwluxgasvapoc.supabase.co}"
export VITE_SUPABASE_ANON_KEY="${VITE_SUPABASE_ANON_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsaHl6b3Vwd2x1eGdhc3ZhcG9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwMDY5OCwiZXhwIjoyMDc0NTc2Njk4fQ.hxK65OHKF8ScncLF7zlcu0qEYgKAqipmtAT2UySKVwg}"
export NODE_ENV="test"

echo "🎯 Test Configuration:"
echo "   URL: $PLAYWRIGHT_TEST_BASE_URL"
echo "   Supabase: $VITE_SUPABASE_URL"
echo "   Bypass Token: ${VERCEL_BYPASS_TOKEN:0:20}..."
echo ""

# Check if debug mode requested
DEBUG_FLAG=""
if [ "$1" = "--debug" ]; then
    echo "🐛 Debug mode enabled (headed browser)"
    DEBUG_FLAG="--headed --debug"
fi

# Run the quick test
echo "🧪 Running quick auth check test..."
echo "⏱️  This should take ~30 seconds..."
echo ""

npx playwright test e2e/quick-auth-check.spec.ts \
    --project=chromium \
    --reporter=line \
    $DEBUG_FLAG

echo ""
echo "✅ Test complete!"
echo ""
echo "📊 Results saved to:"
echo "   - test-results/"
echo "   - playwright-report/"
echo ""
echo "💡 To test locally instead, run:"
echo "   ./scripts/test-local-build.sh"
