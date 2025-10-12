import { spawn } from 'node:child_process';
import { createReadStream, promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';

const initializeMessage = {
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: {
    protocolVersion: '2024-11-05',
    clientInfo: { name: 'codex-test', version: '0.1.0' },
    capabilities: {},
  },
};

const shutdownMessage = { jsonrpc: '2.0', id: 2, method: 'shutdown' };
const exitMessage = { jsonrpc: '2.0', method: 'exit' };

const payload = `${JSON.stringify(initializeMessage)}\n${JSON.stringify(shutdownMessage)}\n${JSON.stringify(exitMessage)}\n`;

const tempFilePath = join(tmpdir(), `mcp-handshake-${randomUUID()}.jsonl`);
await fs.writeFile(tempFilePath, payload, 'utf8');

const child = spawn('node', ['dist/index.js'], {
  cwd: process.cwd(),
  stdio: ['pipe', 'pipe', 'inherit'],
});

const inputStream = createReadStream(tempFilePath);
inputStream.pipe(child.stdin);

let stdoutBuffer = '';
if (!child.stdout) {
  throw new Error('Failed to capture MCP server stdout');
}
child.stdout.setEncoding('utf8');
child.stdout.on('data', (chunk) => {
  stdoutBuffer += chunk;
});

function parseMessages(buffer) {
  return buffer
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch (error) {
        throw new Error(`Invalid JSON from MCP server: ${line}`);
      }
    });
}

try {
  const exitCode = await new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('close', resolve);
  });

  await fs.unlink(tempFilePath).catch(() => {});

  const messages = parseMessages(stdoutBuffer);
  const initializeResponse = messages.find((message) => message.id === 1 && 'result' in message);

  if (!initializeResponse || !initializeResponse.result?.serverInfo) {
    throw new Error('Initialize response missing expected serverInfo');
  }

  console.log('✅ MCP OK');

  if (exitCode !== 0) {
    throw new Error(`MCP server exited with code ${exitCode}`);
  }
} catch (error) {
  console.error(
    'MCP handshake test failed:',
    error instanceof Error ? error.message : String(error)
  );
  process.exitCode = 1;
}
