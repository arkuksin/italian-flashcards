import { execSync } from 'node:child_process';

function run(command, retries = 2) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`\n🔄 Attempt ${attempt}/${retries}: ${command}`);
      execSync(command, { stdio: 'inherit', env: process.env });
      console.log(`✅ Success on attempt ${attempt}\n`);
      return;
    } catch (error) {
      if (attempt === retries) {
        console.error(`\n❌ Failed after ${retries} attempts`);
        throw error;
      }
      console.log(`⚠️  Attempt ${attempt} failed, retrying...`);
      // Wait 2 seconds before retry
      execSync('sleep 2', { stdio: 'inherit' });
    }
  }
}

// Run database migrations before building the application
// This ensures the production database schema is up to date before deploying new code
// Configuration:
// - Uses connection pooler in transaction mode (port 6543) for reliability
// - NODE_OPTIONS='--dns-result-order=ipv4first' ensures IPv4 connectivity
// - Retries up to 2 times to handle transient connection issues
//
// IMPORTANT: Build will abort if migrations fail, preventing broken deployments

console.log('\n📦 Vercel Build - Pre-build Database Migration\n');
console.log('📋 Environment Configuration:');
console.log(`   - Database Host: ${process.env.SUPABASE_DB_HOST || 'not set'}`);
console.log(`   - Database Port: ${process.env.SUPABASE_DB_PORT || 'not set'}`);
console.log(`   - NODE_OPTIONS: ${process.env.NODE_OPTIONS || 'not set'}`);

try {
  console.log('\n🔄 Running database migrations...');
  run('npm run migrate');
  console.log('✅ Database migrations completed successfully');
  console.log('✓ Proceeding with application build...\n');
} catch (error) {
  console.error('\n❌ Database migrations failed!');
  console.error('🛑 Aborting Vercel build to prevent deploying with incorrect schema');
  console.error('\nTroubleshooting:');
  console.error('1. Check Vercel environment variables are correctly set');
  console.error('2. Verify database pooler is accessible');
  console.error('3. Review migration logs above for specific errors');
  console.error('4. See docs/DB_Versioning_Plan.md for more details\n');
  process.exit(1);
}
