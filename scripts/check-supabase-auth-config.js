/**
 * Verifies that the Supabase auth configuration matches the expected production setup.
 *
 * Usage:
 *   SUPABASE_PROD_ACCESS_TOKEN=... node scripts/check-supabase-auth-config.js
 *
 * Optional environment overrides:
 *   SUPABASE_PROJECT_REF - defaults to the ref extracted from SUPABASE_PROD_URL
 *   SUPABASE_EXPECTED_SITE_URL - defaults to https://italian-flashcards-eight.vercel.app
 *   SUPABASE_EXPECTED_REDIRECTS - comma-separated allow list that must be present
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import dotenv from 'dotenv';

function loadEnvFile(filename) {
  const filePath = path.resolve(process.cwd(), filename);
  if (fs.existsSync(filePath)) {
    dotenv.config({ path: filePath, override: false });
  }
}

// Load local environment files if present
['.env', '.env.local', '.env.production.local'].forEach(loadEnvFile);

const accessToken =
  process.env.SUPABASE_PROD_ACCESS_TOKEN ||
  process.env.SUPABASE_ACCESS_TOKEN;

if (!accessToken) {
  console.error('Missing SUPABASE_PROD_ACCESS_TOKEN (or SUPABASE_ACCESS_TOKEN).');
  process.exit(1);
}

const projectRef =
  process.env.SUPABASE_PROJECT_REF ||
  extractProjectRef(process.env.SUPABASE_PROD_URL) ||
  extractProjectRef(process.env.SUPABASE_URL);

if (!projectRef) {
  console.error('Unable to determine Supabase project ref. Set SUPABASE_PROJECT_REF or SUPABASE_PROD_URL.');
  process.exit(1);
}

const expectedSiteUrl =
  process.env.SUPABASE_EXPECTED_SITE_URL ||
  'https://italian-flashcards-eight.vercel.app';

const expectedRedirectsRaw =
  process.env.SUPABASE_EXPECTED_REDIRECTS ||
  'https://italian-flashcards-eight.vercel.app/auth/callback,http://localhost:5173/auth/callback,https://italian-flashcards-*.vercel.app/auth/callback';

const expectedRedirects = expectedRedirectsRaw
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

async function main() {
  const config = await fetchAuthConfig(projectRef, accessToken);

  const issues = [];

  if (config.site_url !== expectedSiteUrl) {
    issues.push(
      `site_url mismatch: expected "${expectedSiteUrl}", found "${config.site_url ?? 'undefined'}".`
    );
  }

  const currentAllowList = (config.uri_allow_list || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  const missingRedirects = expectedRedirects.filter(
    (redirect) => !currentAllowList.includes(redirect)
  );

  if (missingRedirects.length > 0) {
    issues.push(
      `Missing redirect URLs: ${missingRedirects.join(', ')}`
    );
  }

  console.log('Supabase auth config check');
  console.log('--------------------------');
  console.log(`Project ref: ${projectRef}`);
  console.log(`Configured site_url: ${config.site_url}`);
  console.log('Configured redirect URLs:');
  currentAllowList.forEach((value) => console.log(`  - ${value}`));

  if (issues.length > 0) {
    console.error('\nConfiguration issues detected:');
    issues.forEach((issue) => console.error(`- ${issue}`));
    process.exit(1);
  }

  console.log('\n✓ Supabase auth configuration matches expected values.');
}

async function fetchAuthConfig(projectRef, token) {
  const response = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/config/auth`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Failed to fetch auth config (status ${response.status}): ${body}`
    );
  }

  return response.json();
}

function extractProjectRef(url) {
  if (!url) return null;
  try {
    const { hostname } = new URL(url);
    const matches = hostname.match(/^([a-z0-9]{20})\.supabase\.co$/);
    return matches ? matches[1] : null;
  } catch {
    return null;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
