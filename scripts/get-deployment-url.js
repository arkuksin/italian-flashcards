#!/usr/bin/env node

/**
 * Script to get the latest production deployment URL from Vercel
 * This can be used to automatically test against the latest deployment
 */

import { execSync } from 'child_process';

async function getDeploymentUrl() {
  try {
    console.log('🔍 Looking for latest production deployment...');

    // Check if we have a vercel token
    if (!process.env.VERCEL_TOKEN) {
      console.log('⚠️  No VERCEL_TOKEN found. You can manually set the deployment URL.');
      console.log('   Common URLs:');
      console.log('   - https://italian-flashcards.vercel.app');
      console.log('   - https://italian-flashcards-arkuksin.vercel.app');
      console.log('   - https://italian-flashcards-git-main-arkuksin.vercel.app');
      return null;
    }

    // Try to get deployment info using vercel CLI
    try {
      const result = execSync('vercel ls --prod --token=$VERCEL_TOKEN', {
        encoding: 'utf8',
        stdio: 'pipe'
      });

      // Parse the output to find the production URL
      const lines = result.split('\n');
      const prodLine = lines.find(line => line.includes('italian-flashcards') && line.includes('✓'));

      if (prodLine) {
        // Extract URL from the line (format varies)
        const urlMatch = prodLine.match(/https:\/\/[^\s]+/);
        if (urlMatch) {
          console.log('✅ Found deployment URL:', urlMatch[0]);
          return urlMatch[0];
        }
      }
    } catch (error) {
      console.log('⚠️  Could not query Vercel CLI:', error.message);
    }

    // Fallback to common patterns
    console.log('📍 Using common deployment URL pattern...');
    const defaultUrl = 'https://italian-flashcards.vercel.app';
    console.log('🌐 Assumed URL:', defaultUrl);
    console.log('   (Update .env.test.production if this is incorrect)');

    return defaultUrl;

  } catch (error) {
    console.error('❌ Error getting deployment URL:', error.message);
    return null;
  }
}

// If running as script
if (import.meta.url === `file://${process.argv[1]}`) {
  getDeploymentUrl().then(url => {
    if (url) {
      console.log('\n📋 To test against this deployment:');
      console.log(`   PLAYWRIGHT_TEST_BASE_URL=${url} npm run test:e2e:real-auth`);
    } else {
      console.log('\n📋 To test manually, set the URL:');
      console.log('   PLAYWRIGHT_TEST_BASE_URL=https://your-app.vercel.app npm run test:e2e:real-auth');
    }
  });
}

export { getDeploymentUrl };