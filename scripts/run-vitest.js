#!/usr/bin/env node

// Vitest doesn't understand Jest's --runInBand flag; strip it out and forward everything else.
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';

const require = createRequire(import.meta.url);
const vitestPackagePath = require.resolve('vitest/package.json');
const vitestPackage = require('vitest/package.json');
const vitestBin = resolve(dirname(vitestPackagePath), vitestPackage.bin?.vitest ?? 'vitest.mjs');

const ignoredFlags = new Set(['--runInBand', '-i']);

const forwardedArgs = process.argv.slice(2).filter((arg) => {
  if (ignoredFlags.has(arg)) return false;
  if (arg.startsWith('--runInBand=')) return false;
  return true;
});

const result = spawnSync(process.execPath, [vitestBin, ...forwardedArgs], {
  stdio: 'inherit',
});

if (result.error) {
  console.error(result.error);
}

process.exit(result.status ?? 1);
