#!/usr/bin/env bash
# Start the Italian flashcards app locally on Linux
set -e

# Install dependencies if node_modules is missing
if [ ! -d node_modules ]; then
  npm install
fi

# Start Vite dev server and open the app in the browser
npm run dev -- --open /italian-flashcards/
