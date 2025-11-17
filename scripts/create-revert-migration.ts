#!/usr/bin/env tsx

/**
 * Create Revert Migration Helper
 *
 * Generates a new migration file with a template for reverting a specific migration.
 * Usage: npm run migrate:create-revert <version>
 * Example: npm run migrate:create-revert V20250101120000
 */

import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const MIGRATIONS_DIR = path.resolve(process.cwd(), 'db/migrations');
const MIGRATION_FILE_REGEX = /^V(\d{14})__([a-z0-9_]+)\.sql$/;

/**
 * Generate timestamp in format YYYYMMDDHHMMSS
 */
function generateTimestamp(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

/**
 * Find migration file by version
 */
async function findMigrationFile(version: string): Promise<string | null> {
  const files = await readdir(MIGRATIONS_DIR);

  for (const filename of files) {
    if (filename.startsWith(version)) {
      return filename;
    }
  }

  return null;
}

/**
 * Extract summary from original migration
 */
async function extractMigrationSummary(filename: string): Promise<string> {
  const fullPath = path.join(MIGRATIONS_DIR, filename);
  const content = await readFile(fullPath, 'utf-8');

  const lines = content.split('\n');
  const commentLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('--')) {
      commentLines.push(trimmed.substring(2).trim());
    } else if (trimmed.length > 0) {
      // Stop at first non-comment, non-empty line
      break;
    }
  }

  if (commentLines.length > 0) {
    return commentLines.join('\n-- ');
  }

  return 'No description available';
}

/**
 * Generate revert migration template
 */
function generateRevertTemplate(
  originalVersion: string,
  originalFilename: string,
  originalSummary: string
): string {
  return `-- ROLLBACK for ${originalFilename}
-- This migration reverts the changes made in the referenced migration
--
-- INSTRUCTIONS:
-- 1. Review the original migration file (${originalFilename})
-- 2. Write SQL that reverses each operation
-- 3. Test on staging database first
-- 4. Document why rollback was necessary
--
-- ORIGINAL MIGRATION SUMMARY:
-- ${originalSummary}
--
-- COMMON ROLLBACK PATTERNS:
-- - ALTER TABLE ... ADD COLUMN    → ALTER TABLE ... DROP COLUMN IF EXISTS
-- - CREATE TABLE                  → DROP TABLE IF EXISTS ... CASCADE
-- - CREATE INDEX                  → DROP INDEX IF EXISTS (use CONCURRENTLY)
-- - DROP COLUMN                   → ALTER TABLE ... ADD COLUMN (with same type)
-- - UPDATE ... SET               → Irreversible (needs backup strategy)
-- - DELETE FROM                   → Irreversible (needs backup strategy)
--
-- ⚠️  IMPORTANT:
-- - Use IF EXISTS / IF NOT EXISTS for idempotent operations
-- - For data migrations, consider if rollback is even possible
-- - Test rollback on test database before applying to production

-- TODO: Add your rollback SQL here

`;
}

/**
 * Main function
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
Create Revert Migration Helper

Usage:
  npm run migrate:create-revert <version>
  npm run migrate:create-revert V20250101120000

This creates a new migration file with a template for reverting the specified migration.

Options:
  --help, -h    Show this help message
`);
    process.exit(0);
  }

  const targetVersion = args[0];

  // Validate version format
  if (!/^V\d{14}$/.test(targetVersion)) {
    console.error(`❌ Invalid version format: ${targetVersion}`);
    console.error(`   Expected format: V<YYYYMMDDHHMMSS> (e.g., V20250101120000)`);
    process.exit(1);
  }

  // Find original migration file
  console.log(`🔍 Looking for migration ${targetVersion}...`);
  const originalFilename = await findMigrationFile(targetVersion);

  if (!originalFilename) {
    console.error(`❌ Migration ${targetVersion} not found in ${MIGRATIONS_DIR}`);
    process.exit(1);
  }

  console.log(`✅ Found: ${originalFilename}`);

  // Extract summary from original
  console.log(`📖 Reading original migration...`);
  const originalSummary = await extractMigrationSummary(originalFilename);

  // Generate new migration
  const timestamp = generateTimestamp();
  const match = originalFilename.match(MIGRATION_FILE_REGEX);
  const originalDescription = match ? match[2] : 'unknown';

  const newDescription = `revert_${originalDescription}`;
  const newFilename = `V${timestamp}__${newDescription}.sql`;
  const newFullPath = path.join(MIGRATIONS_DIR, newFilename);

  // Generate template content
  const template = generateRevertTemplate(
    targetVersion,
    originalFilename,
    originalSummary
  );

  // Write new migration file
  await writeFile(newFullPath, template, 'utf-8');

  console.log(`\n✅ Created revert migration: ${newFilename}`);
  console.log(`\n📝 Next steps:`);
  console.log(`   1. Edit ${newFilename}`);
  console.log(`   2. Add SQL to reverse the original migration`);
  console.log(`   3. Test on staging database first`);
  console.log(`   4. Document why rollback was necessary\n`);
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
