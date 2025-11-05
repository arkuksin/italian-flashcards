#!/usr/bin/env node

// Script to call vercel_list_deployments with specific parameters

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Load .env file if it exists
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const dotenv = require('dotenv');
  dotenv.config({ path: envPath });
}

// Check if VERCEL_API_TOKEN is set
if (!process.env.VERCEL_API_TOKEN) {
  console.error('\x1b[31mError: VERCEL_API_TOKEN is not set\x1b[0m');
  console.error('\x1b[33mPlease set the VERCEL_API_TOKEN environment variable\x1b[0m');
  process.exit(1);
}

// Get the path to the built index.js file
const serverPath = path.join(__dirname, '..', 'dist', 'index.js');

console.log('\x1b[32mFetching last 5 deployments for italian-flashcards project...\x1b[0m');

// Spawn the MCP server
const server = spawn('node', [serverPath], {
  env: { ...process.env },
  stdio: ['pipe', 'pipe', 'inherit']
});

// Request ID counter
let requestId = 1;

// Handle server output
let responseBuffer = '';
server.stdout.on('data', (data) => {
  responseBuffer += data.toString();

  // Try to parse complete JSON responses
  const lines = responseBuffer.split('\n');
  responseBuffer = lines.pop() || ''; // Keep incomplete line in buffer

  for (const line of lines) {
    if (line.trim()) {
      try {
        const response = JSON.parse(line);
        if (response.result && response.result.content) {
          console.log('\x1b[32mDeployments for italian-flashcards:\x1b[0m');
          console.log(response.result.content[0].text);
        } else {
          console.log('Response:', JSON.stringify(response, null, 2));
        }
        // Exit after receiving the response
        server.kill();
        process.exit(0);
      } catch (e) {
        // Not JSON or incomplete, continue
      }
    }
  }
});

// Handle server errors
server.on('error', (err) => {
  console.error('\x1b[31mError starting server:\x1b[0m', err);
  process.exit(1);
});

// Handle server exit
server.on('exit', (code) => {
  if (code !== 0) {
    console.log(`\x1b[33mServer exited with code ${code}\x1b[0m`);
  }
  process.exit(code);
});

// Send the deployment list request
setTimeout(() => {
  const request = {
    jsonrpc: '2.0',
    method: 'tools/call',
    params: {
      name: 'vercel_list_deployments',
      arguments: {
        projectId: 'prj_MF9abEzyIQBMVraPsD3K81CXm3o6',
        limit: 5
      }
    },
    id: requestId++
  };

  server.stdin.write(JSON.stringify(request) + '\n');
}, 100); // Small delay to ensure server is ready

// Timeout after 30 seconds
setTimeout(() => {
  console.error('\x1b[31mTimeout waiting for response\x1b[0m');
  server.kill();
  process.exit(1);
}, 30000);