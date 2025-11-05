#!/usr/bin/env pwsh

# PowerShell script to test the MCP server on Windows

# Check if VERCEL_API_TOKEN is set
if (-not $env:VERCEL_API_TOKEN) {
    Write-Host "Error: VERCEL_API_TOKEN environment variable is not set" -ForegroundColor Red
    Write-Host "Please set it using: `$env:VERCEL_API_TOKEN = 'your_token_here'" -ForegroundColor Yellow
    exit 1
}

# Build the project first
Write-Host "Building the TypeScript project..." -ForegroundColor Green
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed. Please fix the errors and try again." -ForegroundColor Red
    exit 1
}

Write-Host "`nStarting MCP server test..." -ForegroundColor Green
Write-Host "The server is running. You can send JSON-RPC messages via stdin." -ForegroundColor Yellow
Write-Host "Example messages:" -ForegroundColor Yellow
Write-Host '{"jsonrpc":"2.0","method":"tools/list","id":1}' -ForegroundColor Cyan
Write-Host '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"vercel_list_projects"},"id":2}' -ForegroundColor Cyan
Write-Host "`nPress Ctrl+C to exit`n" -ForegroundColor Yellow

# Run the server
node dist/index.js