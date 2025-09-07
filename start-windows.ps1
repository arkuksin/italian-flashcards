#!/usr/bin/env pwsh
# Start the Italian flashcards app locally on Windows (PowerShell)

# Install dependencies if node_modules is missing
if (-not (Test-Path 'node_modules')) {
    npm install
}

# Start Vite dev server and open the app in the browser
npm run dev -- --open /italian-flashcards/
