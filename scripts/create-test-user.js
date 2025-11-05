#!/usr/bin/env node

/**
 * Script to create a test user in Supabase for E2E testing
 *
 * Usage:
 *   node scripts/create-test-user.js
 *
 * Prerequisites:
 *   - Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables
 *   - Or provide them when prompted
 */

import { createClient } from '@supabase/supabase-js';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function createTestUser() {
  try {
    console.log('🚀 Supabase Test User Creation Script\n');

    // Get Supabase credentials
    let supabaseUrl = process.env.SUPABASE_URL;
    let serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl) {
      supabaseUrl = await prompt('Enter your Supabase URL (https://xxx.supabase.co): ');
    }

    if (!serviceRoleKey) {
      serviceRoleKey = await prompt('Enter your Supabase Service Role Key: ');
    }

    // Get test user details
    const testEmail = await prompt('Enter test user email (default: test-e2e@example.com): ') || 'test-e2e@example.com';
    const testPassword = await prompt('Enter test user password (default: TestPassword123!): ') || 'TestPassword123!';

    console.log('\n📡 Creating Supabase client...');

    // Create Supabase client with service role key (has admin privileges)
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    console.log('👤 Creating test user...');

    // Create the test user
    const { data, error } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true, // Skip email confirmation for testing
      user_metadata: {
        name: 'E2E Test User',
        created_for: 'automated_testing'
      }
    });

    if (error) {
      console.error('❌ Error creating test user:', error.message);

      if (error.message.includes('already registered')) {
        console.log('ℹ️  User already exists. This is fine for testing purposes.');
        console.log('✅ You can use the existing user for testing.');
      } else {
        process.exit(1);
      }
    } else {
      console.log('✅ Test user created successfully!');
      console.log('📧 Email:', testEmail);
      console.log('🔐 Password:', testPassword);
      console.log('🆔 User ID:', data.user?.id);
    }

    console.log('\n📝 Next steps:');
    console.log('1. Create .env.test.local file with:');
    console.log(`   VITE_SUPABASE_URL=${supabaseUrl}`);
    console.log(`   VITE_SUPABASE_ANON_KEY=your-anon-key`);
    console.log(`   TEST_USER_EMAIL=${testEmail}`);
    console.log(`   TEST_USER_PASSWORD=${testPassword}`);
    console.log(`   PLAYWRIGHT_TEST_BASE_URL=https://your-deployed-app.vercel.app`);
    console.log('\n2. Run E2E tests:');
    console.log('   npx playwright test e2e/real-auth.spec.ts');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Check if running as a module
if (import.meta.url === `file://${process.argv[1]}`) {
  createTestUser();
}

export { createTestUser };