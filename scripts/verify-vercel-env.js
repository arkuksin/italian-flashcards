#!/usr/bin/env node

/**
 * Verify Vercel Environment Variables
 *
 * This script checks if required environment variables are configured in Vercel.
 * Run with: node scripts/verify-vercel-env.js
 */

import { execSync } from 'child_process';

const REQUIRED_ENV_VARS = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY'
];

const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID;

console.log('🔍 Vercel Environment Variable Check\n');

if (!VERCEL_PROJECT_ID) {
  console.error('❌ VERCEL_PROJECT_ID not found in environment');
  console.log('\nTo fix this:');
  console.log('1. Copy VERCEL_PROJECT_ID from vercel.json or Vercel dashboard');
  console.log('2. Add to your local .env file');
  process.exit(1);
}

console.log(`Project ID: ${VERCEL_PROJECT_ID}\n`);

try {
  // Get all environment variables from Vercel
  const output = execSync(
    `vercel env ls --token="${process.env.VERCEL_TOKEN || ''}"`,
    { encoding: 'utf8' }
  );

  console.log('📋 Checking required variables for production:\n');

  let allFound = true;
  for (const envVar of REQUIRED_ENV_VARS) {
    // Check if the env var appears in the output for production
    const hasProduction = output.includes(envVar) && output.includes('Production');

    if (hasProduction) {
      console.log(`✅ ${envVar} - configured for Production`);
    } else {
      console.log(`❌ ${envVar} - NOT configured for Production`);
      allFound = false;
    }
  }

  console.log('\n' + '='.repeat(60));

  if (allFound) {
    console.log('✅ All required environment variables are configured!');
    console.log('\nYour Vercel deployment should work correctly.');
  } else {
    console.log('❌ Some environment variables are missing!');
    console.log('\nTo add missing variables:');
    console.log('\nOption 1: Via Vercel Dashboard (Recommended)');
    console.log('1. Visit: https://vercel.com/dashboard');
    console.log('2. Select your project');
    console.log('3. Go to Settings → Environment Variables');
    console.log('4. Add the missing variables for Production environment');
    console.log('\nOption 2: Via Vercel CLI');
    for (const envVar of REQUIRED_ENV_VARS) {
      if (!output.includes(envVar) || !output.includes('Production')) {
        console.log(`  vercel env add ${envVar} production`);
      }
    }

    process.exit(1);
  }

} catch (error) {
  console.error('\n❌ Failed to check Vercel environment variables');

  if (error.message.includes('vercel: command not found') ||
      error.message.includes('vercel: not found')) {
    console.log('\n⚠️  Vercel CLI is not installed or not in PATH');
    console.log('\nTo install:');
    console.log('  npm install -g vercel@latest');
  } else if (error.message.includes('Error: Missing required VERCEL_TOKEN')) {
    console.log('\n⚠️  VERCEL_TOKEN not found in environment');
    console.log('\nTo fix this:');
    console.log('1. Get your token from: https://vercel.com/account/tokens');
    console.log('2. Add to your local .env file: VERCEL_TOKEN=your-token-here');
  } else {
    console.log('\nError details:', error.message);
  }

  console.log('\n💡 Alternative: Check manually in Vercel Dashboard');
  console.log('   https://vercel.com/dashboard → Your Project → Settings → Environment Variables');

  process.exit(1);
}
