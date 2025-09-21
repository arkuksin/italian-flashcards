#!/usr/bin/env node

// Script to validate MCP server configuration and connectivity

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('\x1b[36m=== MCP Vercel Tools - Configuration Check ===\x1b[0m\n');

// Step 1: Check if built files exist
console.log('\x1b[33m1. Checking build status...\x1b[0m');
const distPath = path.join(__dirname, '..', 'dist');
const indexPath = path.join(distPath, 'index.js');

if (!fs.existsSync(indexPath)) {
  console.log('\x1b[31m   ✗ Build files not found. Please run "npm run build" first.\x1b[0m');
  process.exit(1);
} else {
  console.log('\x1b[32m   ✓ Build files found\x1b[0m');
}

// Step 2: Check environment variables
console.log('\n\x1b[33m2. Checking environment variables...\x1b[0m');
if (!process.env.VERCEL_API_TOKEN) {
  console.log('\x1b[31m   ✗ VERCEL_API_TOKEN is not set\x1b[0m');
  console.log('\x1b[33m   Please set it in your Claude Code settings or environment\x1b[0m');
} else {
  console.log('\x1b[32m   ✓ VERCEL_API_TOKEN is set\x1b[0m');
  // Mask the token for security
  const token = process.env.VERCEL_API_TOKEN;
  const masked = token.substring(0, 4) + '...' + token.substring(token.length - 4);
  console.log(`\x1b[90m     Token: ${masked}\x1b[0m`);
}

if (process.env.VERCEL_TEAM_ID) {
  console.log('\x1b[32m   ✓ VERCEL_TEAM_ID is set\x1b[0m');
  console.log(`\x1b[90m     Team ID: ${process.env.VERCEL_TEAM_ID}\x1b[0m`);
} else {
  console.log('\x1b[90m   ℹ VERCEL_TEAM_ID is not set (optional)\x1b[0m');
}

// Step 3: Test MCP server startup
console.log('\n\x1b[33m3. Testing MCP server startup...\x1b[0m');

const server = spawn('node', [indexPath], {
  env: {
    ...process.env,
    VERCEL_API_TOKEN: process.env.VERCEL_API_TOKEN || 'test_token_for_validation'
  },
  stdio: ['pipe', 'pipe', 'pipe']
});

let serverStarted = false;
let errorOutput = '';

// Give the server a moment to start
setTimeout(() => {
  if (!serverStarted) {
    // Send a test request
    const testRequest = {
      jsonrpc: '2.0',
      method: 'tools/list',
      id: 1
    };
    server.stdin.write(JSON.stringify(testRequest) + '\n');
  }
}, 500);

server.stdout.on('data', (data) => {
  serverStarted = true;
  try {
    const response = JSON.parse(data.toString());
    if (response.result && response.result.tools) {
      console.log('\x1b[32m   ✓ MCP server is responding correctly\x1b[0m');
      console.log(`\x1b[90m     Available tools: ${response.result.tools.length}\x1b[0m`);

      // List first few tools
      const toolNames = response.result.tools.slice(0, 5).map(t => t.name);
      toolNames.forEach(name => {
        console.log(`\x1b[90m       - ${name}\x1b[0m`);
      });
      if (response.result.tools.length > 5) {
        console.log(`\x1b[90m       ... and ${response.result.tools.length - 5} more\x1b[0m`);
      }

      console.log('\n\x1b[32m=== Configuration check completed successfully! ===\x1b[0m');
      console.log('\n\x1b[36mNext steps:\x1b[0m');
      console.log('1. Add the server configuration to your Claude Code settings');
      console.log('2. Restart Claude Code to load the new MCP server');
      console.log('3. Use the Vercel tools in your conversations\n');

      server.kill();
      process.exit(0);
    }
  } catch (e) {
    // Not JSON or unexpected format
    console.log('\x1b[90m   Server output: ' + data.toString() + '\x1b[0m');
  }
});

server.stderr.on('data', (data) => {
  errorOutput += data.toString();
});

server.on('error', (err) => {
  console.log('\x1b[31m   ✗ Failed to start MCP server\x1b[0m');
  console.error('\x1b[31m   Error:\x1b[0m', err.message);
  process.exit(1);
});

server.on('exit', (code) => {
  if (!serverStarted && code !== 0) {
    console.log('\x1b[31m   ✗ MCP server exited unexpectedly\x1b[0m');
    if (errorOutput) {
      console.log('\x1b[31m   Error output:\x1b[0m');
      console.log(errorOutput);
    }
    process.exit(1);
  }
});

// Timeout after 5 seconds
setTimeout(() => {
  if (!serverStarted) {
    console.log('\x1b[31m   ✗ MCP server did not respond within 5 seconds\x1b[0m');
    server.kill();
    process.exit(1);
  }
}, 5000);