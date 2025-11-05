#!/bin/bash
set -e

# Test Against Local Build - MEDIUM SPEED (~2 minutes)
#
# This script builds the app locally with test environment variables
# and tests against localhost. This bypasses Vercel completely.
#
# Usage:
#   ./scripts/test-local-build.sh
#   ./scripts/test-local-build.sh --debug  # Run with headed browser

echo "🏗️  Local Build E2E Test"
echo "======================="
echo ""

# Load test environment variables
if [ -f .env.test.local ]; then
    echo "📦 Loading .env.test.local..."
    export $(cat .env.test.local | grep -v '^#' | xargs)
else
    echo "⚠️  .env.test.local not found"
    echo "💡 Using default test configuration..."
    export VITE_SUPABASE_URL="https://slhyzoupwluxgasvapoc.supabase.co"
    export VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsaHl6b3Vwd2x1eGdhc3ZhcG9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwMDY5OCwiZXhwIjoyMDc0NTc2Njk4fQ.hxK65OHKF8ScncLF7zlcu0qEYgKAqipmtAT2UySKVwg"
    export VITE_TEST_MODE="true"
    export NODE_ENV="test"
fi

echo "🎯 Build Configuration:"
echo "   Supabase URL: $VITE_SUPABASE_URL"
echo "   Test Mode: $VITE_TEST_MODE"
echo "   Node Env: $NODE_ENV"
echo ""

# Clean previous build
echo "🧹 Cleaning previous build..."
rm -rf dist

# Build the application
echo "🔨 Building application with test environment..."
# Set VERCEL=1 to use root path (/) instead of /italian-flashcards/
VERCEL=1 npm run build

if [ ! -d "dist" ]; then
    echo "❌ Build failed - dist directory not created"
    exit 1
fi

echo "✅ Build complete!"
echo ""

# Start local server in background
echo "🚀 Starting local server on http://localhost:5173..."
npx serve -s dist -l 5173 > /dev/null 2>&1 &
SERVER_PID=$!

# Ensure server is killed on exit
trap "echo '🛑 Stopping local server...'; kill $SERVER_PID 2>/dev/null" EXIT

# Wait for server to be ready
echo "⏳ Waiting for server to start..."
MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -s http://localhost:5173 > /dev/null 2>&1; then
        echo "✅ Server is ready!"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    sleep 1
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo "❌ Server failed to start within 30 seconds"
    exit 1
fi

echo ""

# Set test environment
export PLAYWRIGHT_TEST_BASE_URL="http://localhost:5173"

echo "🎯 Test Configuration:"
echo "   URL: $PLAYWRIGHT_TEST_BASE_URL"
echo "   Test File: e2e/quick-auth-check.spec.ts"
echo ""

# Check if debug mode requested
DEBUG_FLAG=""
if [ "$1" = "--debug" ]; then
    echo "🐛 Debug mode enabled (headed browser)"
    DEBUG_FLAG="--headed --debug"
fi

# Run the quick test
echo "🧪 Running E2E tests..."
echo ""

npx playwright test e2e/quick-auth-check.spec.ts \
    --project=chromium \
    --reporter=line \
    $DEBUG_FLAG

echo ""
echo "✅ Test complete!"
echo ""
echo "📊 Results:"
echo "   - test-results/"
echo "   - playwright-report/"
echo ""
echo "💡 To test against Vercel preview instead, run:"
echo "   ./scripts/test-vercel-preview.sh"
