#!/usr/bin/env node

/**
 * Setup script for E2E testing environment
 * This script helps configure Vercel project settings and validates the setup
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 Setting up E2E testing environment...\n');

// Check if Vercel CLI is installed
try {
  execSync('vercel --version', { stdio: 'pipe' });
  console.log('✅ Vercel CLI is installed');
} catch (error) {
  console.log('❌ Vercel CLI not found. Installing...');
  execSync('npm install -g vercel@latest', { stdio: 'inherit' });
  console.log('✅ Vercel CLI installed');
}

// Check if Playwright is installed
try {
  execSync('npx playwright --version', { stdio: 'pipe' });
  console.log('✅ Playwright is installed');
} catch (error) {
  console.log('❌ Playwright not found. Installing...');
  execSync('npm install', { stdio: 'inherit' });
  execSync('npx playwright install', { stdio: 'inherit' });
  console.log('✅ Playwright installed');
}

// Check for required files
const requiredFiles = [
  'playwright.config.ts',
  'vercel.json',
  'e2e/home.spec.ts',
  '.github/workflows/pr-e2e-tests.yml'
];

console.log('\n📁 Checking required files...');
for (const file of requiredFiles) {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - Missing!`);
  }
}

// Check environment variables
console.log('\n🔐 Environment variables needed for CI:');
const requiredEnvVars = [
  'VERCEL_TOKEN',
  'VERCEL_ORG_ID',
  'VERCEL_PROJECT_ID'
];

console.log('\nFor GitHub Actions, add these secrets to your repository:');
for (const envVar of requiredEnvVars) {
  console.log(`  - ${envVar}`);
}

console.log('\n📖 Setup Instructions:');
console.log('1. Go to https://vercel.com/account/tokens to create a Vercel token');
console.log('2. Run `vercel link` to link your project and get ORG_ID and PROJECT_ID');
console.log('3. Add the secrets to your GitHub repository settings');
console.log('4. Create a PR to test the E2E pipeline');

console.log('\n🧪 Testing locally:');
console.log('  npm run dev          # Start dev server');
console.log('  npm run test:e2e     # Run E2E tests against local server');
console.log('  npm run test:e2e:ui  # Run E2E tests with UI mode');

console.log('\n✨ Setup complete! Happy testing! 🎉');