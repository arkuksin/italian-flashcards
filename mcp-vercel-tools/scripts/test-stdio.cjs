#!/usr/bin/env node

// Node.js script to test the MCP server (cross-platform)

const { spawn } = require('child_process');
const readline = require('readline');
const path = require('path');
const fs = require('fs');

// Load .env file if it exists
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const dotenv = require('dotenv');
  dotenv.config({ path: envPath });
}

// Check if VERCEL_API_TOKEN is set (either from env or .env file)
if (!process.env.VERCEL_API_TOKEN) {
  console.error('\x1b[31mError: VERCEL_API_TOKEN is not set\x1b[0m');
  console.error('\x1b[33mPlease either:\x1b[0m');
  console.error('\x1b[33m  1. Create a .env file with VERCEL_API_TOKEN=your_token\x1b[0m');
  console.error('\x1b[33m  2. Set environment variable: set VERCEL_API_TOKEN=your_token\x1b[0m');
  process.exit(1);
}

// Get the path to the built index.js file
const serverPath = path.join(__dirname, '..', 'dist', 'index.js');

console.log('\x1b[32mStarting MCP server test...\x1b[0m');
console.log('\x1b[33mThe server is running. You can send JSON-RPC messages.\x1b[0m');
console.log('\x1b[33mExample commands:\x1b[0m');
console.log('\x1b[36m  list - List available tools\x1b[0m');
console.log('\x1b[36m  projects - List all Vercel projects\x1b[0m');
console.log('\x1b[36m  exit - Quit the test\x1b[0m');
console.log('');

// Spawn the MCP server
const server = spawn('node', [serverPath], {
  env: { ...process.env },
  stdio: ['pipe', 'pipe', 'inherit']
});

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Handle server output
server.stdout.on('data', (data) => {
  try {
    const response = JSON.parse(data.toString());
    console.log('\x1b[32mServer response:\x1b[0m');
    console.log(JSON.stringify(response, null, 2));
  } catch (e) {
    // Not JSON, just print as-is
    console.log(data.toString());
  }
  console.log('');
  rl.prompt();
});

// Handle server errors
server.on('error', (err) => {
  console.error('\x1b[31mError starting server:\x1b[0m', err);
  process.exit(1);
});

// Handle server exit
server.on('exit', (code) => {
  console.log(`\x1b[33mServer exited with code ${code}\x1b[0m`);
  process.exit(code);
});

// Request ID counter
let requestId = 1;

// Helper function to send a request to the server
function sendRequest(method, params = {}) {
  const request = {
    jsonrpc: '2.0',
    method: method,
    params: params,
    id: requestId++
  };

  server.stdin.write(JSON.stringify(request) + '\n');
}

// Process user commands
rl.on('line', (line) => {
  const command = line.trim().toLowerCase();

  switch (command) {
    case 'exit':
    case 'quit':
      console.log('\x1b[33mExiting...\x1b[0m');
      server.kill();
      rl.close();
      process.exit(0);
      break;

    case 'list':
      console.log('\x1b[36mFetching available tools...\x1b[0m');
      sendRequest('tools/list');
      break;

    case 'projects':
      console.log('\x1b[36mFetching Vercel projects...\x1b[0m');
      sendRequest('tools/call', {
        name: 'vercel_list_projects'
      });
      break;

    case 'help':
      console.log('\x1b[33mAvailable commands:\x1b[0m');
      console.log('  list     - List available tools');
      console.log('  projects - List all Vercel projects');
      console.log('  help     - Show this help message');
      console.log('  exit     - Quit the test');
      console.log('');
      rl.prompt();
      break;

    default:
      if (command) {
        // Try to parse as JSON and send directly
        try {
          const json = JSON.parse(command);
          server.stdin.write(JSON.stringify(json) + '\n');
        } catch (e) {
          console.log('\x1b[31mUnknown command. Type "help" for available commands.\x1b[0m');
          rl.prompt();
        }
      } else {
        rl.prompt();
      }
  }
});

// Start the prompt
console.log('\x1b[33mType "help" for available commands\x1b[0m');
rl.setPrompt('> ');
rl.prompt();

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log('\n\x1b[33mReceived SIGINT, shutting down...\x1b[0m');
  server.kill();
  rl.close();
  process.exit(0);
});