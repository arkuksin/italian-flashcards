#!/usr/bin/env tsx

/**
 * Migration Linting Tool
 *
 * Validates migration files for common issues and best practices:
 * - Dangerous operations without safety checks
 * - Missing idempotent clauses
 * - Transaction statements in migrations (should be omitted)
 * - CREATE INDEX without CONCURRENTLY
 * - SQL syntax validation
 */

import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const MIGRATIONS_DIR = path.resolve(process.cwd(), 'db/migrations');
const MIGRATION_FILE_REGEX = /^V(\d{14})__([a-z0-9_]+)\.sql$/;

interface LintIssue {
  severity: 'error' | 'warning' | 'info';
  line?: number;
  message: string;
  suggestion?: string;
}

interface LintResult {
  filename: string;
  issues: LintIssue[];
}

/**
 * Lint rules for migration files
 */
const lintRules = [
  {
    name: 'no-transaction-statements',
    check: (sql: string): LintIssue[] => {
      const issues: LintIssue[] = [];
      const lines = sql.split('\n');

      const dollarQuoteStack: string[] = [];

      const isInsideDollarQuote = (): boolean => dollarQuoteStack.length > 0;

      const updateDollarQuoteStack = (line: string): void => {
        const matches = line.match(/\$[A-Za-z0-9_]*\$/g);
        if (!matches) return;

        for (const match of matches) {
          const lastIndex = dollarQuoteStack.lastIndexOf(match);
          if (lastIndex === -1) {
            dollarQuoteStack.push(match);
          } else {
            dollarQuoteStack.splice(lastIndex, 1);
          }
        }
      };

      lines.forEach((line, index) => {
        updateDollarQuoteStack(line);

        if (isInsideDollarQuote()) {
          return;
        }

        const trimmedUpper = line.trim().toUpperCase();
        if (line.trim().startsWith('--')) {
          return;
        }

        if (
          trimmedUpper.startsWith('BEGIN;') ||
          trimmedUpper.startsWith('BEGIN TRANSACTION') ||
          trimmedUpper === 'BEGIN' ||
          trimmedUpper.startsWith('COMMIT') ||
          trimmedUpper.startsWith('ROLLBACK')
        ) {
          const keyword = trimmedUpper.split(/\s+/)[0].replace(/;$/, '');
          issues.push({
            severity: 'error',
            line: index + 1,
            message: `Found ${keyword} statement - migrations are automatically wrapped in transactions`,
            suggestion: 'Remove BEGIN, COMMIT, and ROLLBACK statements from your migration'
          });
        }
      });

      return issues;
    }
  },

  {
    name: 'unsafe-drop-operations',
    check: (sql: string): LintIssue[] => {
      const issues: LintIssue[] = [];
      const lines = sql.split('\n');

      lines.forEach((line, index) => {
        const trimmed = line.trim().toUpperCase();
        // Skip comments
        if (trimmed.startsWith('--')) return;

        // Check for DROP without IF EXISTS
        if (trimmed.includes('DROP TABLE') && !trimmed.includes('IF EXISTS')) {
          issues.push({
            severity: 'warning',
            line: index + 1,
            message: 'DROP TABLE without IF EXISTS - may fail if table does not exist',
            suggestion: 'Use DROP TABLE IF EXISTS for idempotent migrations'
          });
        }

        if (trimmed.includes('DROP COLUMN') && !trimmed.includes('IF EXISTS')) {
          issues.push({
            severity: 'warning',
            line: index + 1,
            message: 'DROP COLUMN without IF EXISTS - may fail if column does not exist',
            suggestion: 'Use DROP COLUMN IF EXISTS for idempotent migrations'
          });
        }

        if (trimmed.includes('TRUNCATE') && !trimmed.includes('--')) {
          issues.push({
            severity: 'warning',
            line: index + 1,
            message: 'TRUNCATE statement found - this deletes all data',
            suggestion: 'Ensure this is intentional and documented'
          });
        }
      });

      return issues;
    }
  },

  {
    name: 'missing-idempotent-clauses',
    check: (sql: string): LintIssue[] => {
      const issues: LintIssue[] = [];
      const lines = sql.split('\n');

      lines.forEach((line, index) => {
        const trimmed = line.trim().toUpperCase();
        // Skip comments
        if (trimmed.startsWith('--')) return;

        // Check for CREATE without IF NOT EXISTS
        if ((trimmed.includes('CREATE TABLE') || trimmed.includes('CREATE INDEX'))
            && !trimmed.includes('IF NOT EXISTS')) {
          issues.push({
            severity: 'warning',
            line: index + 1,
            message: 'CREATE statement without IF NOT EXISTS - may fail on re-run',
            suggestion: 'Use IF NOT EXISTS for idempotent migrations'
          });
        }

        // Check for ALTER TABLE ADD COLUMN without IF NOT EXISTS
        if (trimmed.includes('ALTER TABLE') && trimmed.includes('ADD COLUMN')
            && !trimmed.includes('IF NOT EXISTS')) {
          issues.push({
            severity: 'warning',
            line: index + 1,
            message: 'ADD COLUMN without IF NOT EXISTS - may fail if column already exists',
            suggestion: 'Use ADD COLUMN IF NOT EXISTS for idempotent migrations'
          });
        }
      });

      return issues;
    }
  },

  {
    name: 'index-without-concurrently',
    check: (sql: string): LintIssue[] => {
      const issues: LintIssue[] = [];
      const lines = sql.split('\n');

      lines.forEach((line, index) => {
        const trimmed = line.trim().toUpperCase();
        // Skip comments
        if (trimmed.startsWith('--')) return;

        // Check for CREATE INDEX without CONCURRENTLY
        if (trimmed.includes('CREATE INDEX') && !trimmed.includes('CONCURRENTLY')
            && !trimmed.includes('IF NOT EXISTS')) {
          issues.push({
            severity: 'info',
            line: index + 1,
            message: 'CREATE INDEX without CONCURRENTLY - may lock table during creation',
            suggestion: 'Consider using CREATE INDEX CONCURRENTLY for large tables to avoid blocking queries'
          });
        }
      });

      return issues;
    }
  },

  {
    name: 'missing-comments',
    check: (sql: string): LintIssue[] => {
      const issues: LintIssue[] = [];
      const lines = sql.split('\n');

      // Check if file has meaningful comments (not just empty lines)
      const hasComments = lines.some(line => {
        const trimmed = line.trim();
        return trimmed.startsWith('--') && trimmed.length > 3;
      });

      if (!hasComments) {
        issues.push({
          severity: 'info',
          message: 'Migration lacks comments explaining the purpose and intent',
          suggestion: 'Add comments describing what the migration does and why'
        });
      }

      return issues;
    }
  },

  {
    name: 'check-rls-policies',
    check: (sql: string): LintIssue[] => {
      const issues: LintIssue[] = [];
      const lines = sql.split('\n');

      lines.forEach((line, index) => {
        const trimmed = line.trim().toUpperCase();
        // Skip comments
        if (trimmed.startsWith('--')) return;

        // Check for CREATE POLICY without DROP POLICY IF EXISTS first
        if (trimmed.includes('CREATE POLICY')) {
          const policyMatch = line.match(/CREATE POLICY\s+"([^"]+)"/i);
          if (policyMatch) {
            const policyName = policyMatch[1];
            // Look backwards for a DROP POLICY statement
            let foundDrop = false;
            for (let i = index - 1; i >= Math.max(0, index - 10); i--) {
              if (lines[i].toUpperCase().includes(`DROP POLICY IF EXISTS "${policyName.toUpperCase()}"`)) {
                foundDrop = true;
                break;
              }
            }
            if (!foundDrop) {
              issues.push({
                severity: 'warning',
                line: index + 1,
                message: `CREATE POLICY "${policyName}" without preceding DROP POLICY IF EXISTS`,
                suggestion: 'Add DROP POLICY IF EXISTS before CREATE POLICY for idempotent migrations'
              });
            }
          }
        }
      });

      return issues;
    }
  }
];

/**
 * Lint a single migration file
 */
async function lintMigrationFile(filename: string, fullPath: string): Promise<LintResult> {
  const sql = await readFile(fullPath, 'utf-8');
  const issues: LintIssue[] = [];

  // Run all lint rules
  for (const rule of lintRules) {
    const ruleIssues = rule.check(sql);
    issues.push(...ruleIssues);
  }

  return {
    filename,
    issues
  };
}

/**
 * Lint all migration files in the directory
 */
async function lintAllMigrations(): Promise<LintResult[]> {
  const files = await readdir(MIGRATIONS_DIR);
  const migrationFiles = files.filter(f => MIGRATION_FILE_REGEX.test(f));

  const results: LintResult[] = [];

  for (const filename of migrationFiles) {
    const fullPath = path.join(MIGRATIONS_DIR, filename);
    const result = await lintMigrationFile(filename, fullPath);
    results.push(result);
  }

  return results;
}

/**
 * Format and display lint results
 */
function displayResults(results: LintResult[]): number {
  let totalErrors = 0;
  let totalWarnings = 0;
  let totalInfo = 0;

  console.log('\n🔍 Migration Linting Results\n');
  console.log('='.repeat(80));

  for (const result of results) {
    if (result.issues.length === 0) {
      console.log(`\n✅ ${result.filename} - No issues found`);
      continue;
    }

    console.log(`\n📄 ${result.filename}\n`);

    for (const issue of result.issues) {
      const icon = issue.severity === 'error' ? '❌' : issue.severity === 'warning' ? '⚠️' : 'ℹ️';
      const location = issue.line ? ` (line ${issue.line})` : '';

      console.log(`  ${icon} ${issue.severity.toUpperCase()}${location}: ${issue.message}`);

      if (issue.suggestion) {
        console.log(`     💡 ${issue.suggestion}`);
      }
      console.log('');

      if (issue.severity === 'error') totalErrors++;
      else if (issue.severity === 'warning') totalWarnings++;
      else totalInfo++;
    }
  }

  console.log('='.repeat(80));
  console.log(`\n📊 Summary: ${totalErrors} errors, ${totalWarnings} warnings, ${totalInfo} info\n`);

  if (totalErrors > 0) {
    console.log('❌ Linting failed with errors. Please fix the issues above.\n');
    return 1;
  }

  if (totalWarnings > 0) {
    console.log('⚠️  Linting completed with warnings. Consider addressing them.\n');
  } else if (totalInfo > 0) {
    console.log('ℹ️  Linting completed with informational messages.\n');
  } else {
    console.log('✅ All migrations passed linting!\n');
  }

  return 0;
}

/**
 * Main function
 */
async function main(): Promise<void> {
  try {
    console.log(`📂 Linting migrations in: ${MIGRATIONS_DIR}\n`);

    const results = await lintAllMigrations();
    const exitCode = displayResults(results);

    process.exit(exitCode);
  } catch (error) {
    console.error('❌ Fatal error during linting:', error);
    process.exit(1);
  }
}

main();
