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

// Plain version: in CI the `vitest` watcher just waited forever for keyboard
// input, so the pipeline never finished. When we detect that situation (CI or
// no real TTY) we flip over to the normal `run` mode automatically.
const rawCiValue = process.env.CI;
const normalizedCiValue = rawCiValue?.trim().toLowerCase();
let isCi = false;

if (typeof rawCiValue === 'string') {
  isCi = normalizedCiValue !== '' && normalizedCiValue !== 'false' && normalizedCiValue !== '0';
} else {
  const fallbackCiEnvVars = [
    'GITHUB_ACTIONS',
    'BUILDKITE',
    'CIRCLECI',
    'GITLAB_CI',
    'TEAMCITY_VERSION',
    'TF_BUILD',
    'BITBUCKET_BUILD_NUMBER',
  ];
  isCi = fallbackCiEnvVars.some((name) => {
    const value = process.env[name];
    if (value == null) return false;
    const normalized = String(value).trim().toLowerCase();
    return normalized !== '' && normalized !== 'false' && normalized !== '0';
  });
}

const shouldForceRun = isCi || !process.stdout.isTTY;

let finalArgs = forwardedArgs;
const hasExplicitCommand = finalArgs[0] && !finalArgs[0].startsWith('-');
const explicitlyWantsWatch = finalArgs.some((arg) => arg === 'watch' || arg === '--watch' || arg.startsWith('--watch='));
const explicitlyWantsUi = finalArgs.some((arg) => arg === '--ui' || arg === '--open');

if (shouldForceRun && !hasExplicitCommand && !explicitlyWantsWatch && !explicitlyWantsUi) {
  finalArgs = ['run', ...finalArgs];
}

const result = spawnSync(process.execPath, [vitestBin, ...finalArgs], {
  stdio: 'inherit',
});

if (result.error) {
  console.error(result.error);
}

process.exit(result.status ?? 1);
