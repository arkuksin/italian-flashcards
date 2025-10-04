#!/usr/bin/env node

/**
 * Vercel Environment Variables Checker
 *
 * This script helps check your current Vercel environment configuration
 * and compares it with the required test environment setup.
 */

import { execSync } from 'child_process';
import fs from 'fs';

console.log('🔍 Vercel Environment Variables Checker\n');

// Helper function to run commands safely
function runCommand(command, description) {
  try {
    console.log(`📋 ${description}`);
    const output = execSync(command, { encoding: 'utf-8', stdio: 'pipe' });
    console.log(output.trim());
    return output.trim();
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    if (error.stderr) {
      console.log(`   ${error.stderr.trim()}`);
    }
    return null;
  }
}

// Check if user is authenticated with Vercel
console.log('🔐 Checking Vercel Authentication Status...\n');
const authCheck = runCommand('npx vercel whoami', 'Current Vercel user');

if (!authCheck || authCheck.includes('Error')) {
  console.log('\n❌ Not authenticated with Vercel. Please run:');
  console.log('   npx vercel login');
  console.log('\nOr if you have a token, set it as an environment variable:');
  console.log('   set VERCEL_TOKEN=your_token_here  # Windows');
  console.log('   export VERCEL_TOKEN=your_token_here  # Linux/Mac');
  console.log('\nThen run this script again.');
  process.exit(1);
}

console.log('\n✅ Authenticated with Vercel!\n');

// Get project information
console.log('📊 Project Information...\n');
runCommand('npx vercel project ls', 'Available projects');

console.log('\n' + '='.repeat(60) + '\n');

// List environment variables
console.log('🌍 Environment Variables...\n');

console.log('📋 Production Environment:');
const prodEnv = runCommand('npx vercel env ls production', 'Production environment variables');

console.log('\n📋 Preview Environment:');
const previewEnv = runCommand('npx vercel env ls preview', 'Preview environment variables');

console.log('\n📋 Development Environment:');
const devEnv = runCommand('npx vercel env ls development', 'Development environment variables');

console.log('\n' + '='.repeat(60) + '\n');

// Check local configuration
console.log('📁 Local Configuration...\n');

// Check vercel.json
if (fs.existsSync('vercel.json')) {
  console.log('📄 vercel.json found:');
  const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf-8'));
  console.log(JSON.stringify(vercelConfig, null, 2));
} else {
  console.log('📄 No vercel.json found');
}

// Check for .vercel directory
if (fs.existsSync('.vercel')) {
  console.log('\n📁 .vercel directory found');
  const vercelFiles = fs.readdirSync('.vercel');
  console.log('   Files:', vercelFiles.join(', '));

  if (vercelFiles.includes('project.json')) {
    const projectConfig = JSON.parse(fs.readFileSync('.vercel/project.json', 'utf-8'));
    console.log('   Project ID:', projectConfig.projectId);
    console.log('   Org ID:', projectConfig.orgId);
  }
} else {
  console.log('\n📁 No .vercel directory found');
}

console.log('\n' + '='.repeat(60) + '\n');

// Required environment variables for test setup
console.log('✅ Required Environment Variables for Test Setup:\n');

const requiredEnvVars = {
  'Production': {
    'VITE_SUPABASE_URL': 'https://gjftooyqkmijlvqbkwdr.supabase.co',
    'VITE_SUPABASE_ANON_KEY': '[Production Anon Key]',
    'NODE_ENV': 'production'
  },
  'Preview (Test)': {
    'VITE_SUPABASE_URL': 'https://slhyzoupwluxgasvapoc.supabase.co',
    'VITE_SUPABASE_ANON_KEY': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsaHl6b3Vwd2x1eGdhc3ZhcG9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwMDY5OCwiZXhwIjoyMDc0NTc2Njk4fQ.hxK65OHKF8ScncLF7zlcu0qEYgKAqipmtAT2UySKVwg',
    'VITE_TEST_MODE': 'true',
    'NODE_ENV': 'test'
  }
};

Object.entries(requiredEnvVars).forEach(([env, vars]) => {
  console.log(`🎯 ${env}:`);
  Object.entries(vars).forEach(([key, value]) => {
    if (key === 'VITE_SUPABASE_ANON_KEY' && value.length > 50) {
      console.log(`   ${key}: ${value.substring(0, 30)}...`);
    } else {
      console.log(`   ${key}: ${value}`);
    }
  });
  console.log('');
});

console.log('📝 To add environment variables in Vercel:');
console.log('   1. Go to https://vercel.com/dashboard');
console.log('   2. Select your italian-flashcards project');
console.log('   3. Go to Settings → Environment Variables');
console.log('   4. Add each variable with proper environment assignment');

console.log('\n🔗 Useful Commands:');
console.log('   npx vercel env add <name>          # Add new environment variable');
console.log('   npx vercel env rm <name>           # Remove environment variable');
console.log('   npx vercel env ls                  # List all environment variables');
console.log('   npx vercel --help                  # More Vercel commands');

console.log('\n✨ Environment setup complete!');