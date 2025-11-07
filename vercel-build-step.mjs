import { execSync } from 'node:child_process';

function run(command) {
  execSync(command, { stdio: 'inherit', env: process.env });
}

// Database migrations are skipped in Vercel build due to IPv6 connectivity limitations.
// Both direct connections and connection pooler fail in the Vercel build environment.
//
// IMPORTANT: Run migrations manually before deploying using:
// - Supabase MCP tools (recommended)
// - Supabase Dashboard SQL Editor
// - Local environment with proper database access
//
// See docs/DB_Versioning_Plan.md for migration procedures.

console.log('⚠️  Database migrations skipped in Vercel build (IPv6 connectivity limitation)');
console.log('ℹ️  Ensure migrations were run manually before this deployment');
console.log('✓  Proceeding with application build...');
