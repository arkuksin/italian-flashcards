import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import process from 'node:process';
import { Client, ClientConfig } from 'pg';
import dotenv from 'dotenv';
import { readFileSync } from 'node:fs';

const MIGRATIONS_DIR_ENV = 'MIGRATIONS_DIR';
const DEFAULT_MIGRATIONS_DIR = path.resolve(process.cwd(), 'db/migrations');
const MIGRATION_FILE_REGEX = /^V(\d{14})__([a-z0-9_]+)\.sql$/;
const SCHEMA_VERSION_TABLE = 'public.schema_version';

interface MigrationRecord {
  filename: string;
  version: string;
  description: string;
  checksum: string;
}

class BootstrapError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'BootstrapError';
  }
}

type Booleanish = string | boolean | undefined | null;

function parseBoolean(value: Booleanish, fallback = false): boolean {
  if (value === undefined || value === null) return fallback;
  if (typeof value === 'boolean') return value;
  const normalized = value.toString().trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  return fallback;
}

function loadEnvFiles(): void {
  const candidates = [
    path.resolve(process.cwd(), 'supabase/.env.local'),
    path.resolve(process.cwd(), '.env.local'),
    path.resolve(process.cwd(), '.env'),
  ];

  for (const filePath of candidates) {
    dotenv.config({ path: filePath, override: false });
  }
}

function resolveSslConfig(): ClientConfig['ssl'] {
  const useSsl = parseBoolean(process.env.SUPABASE_DB_SSL, true);
  if (!useSsl) return undefined;

  const rejectUnauthorized = parseBoolean(process.env.SUPABASE_DB_SSL_REJECT_UNAUTHORIZED, false);
  const ca = process.env.SUPABASE_DB_SSL_CA_CERT;
  const caPath = process.env.SUPABASE_DB_SSL_CA_CERT_PATH;
  if (ca && caPath) {
    throw new BootstrapError('Specify either SUPABASE_DB_SSL_CA_CERT or SUPABASE_DB_SSL_CA_CERT_PATH, not both.');
  }

  if (caPath) {
    const resolvedPath = path.resolve(caPath);
    const fileContents = readFileSync(resolvedPath, 'utf-8');
    return {
      rejectUnauthorized,
      ca: [fileContents],
    };
  }

  if (ca) {
    return {
      rejectUnauthorized,
      ca: [ca],
    };
  }

  return { rejectUnauthorized };
}

function resolveConnectionConfig(): ClientConfig {
  const requiredEnv = {
    SUPABASE_DB_HOST: process.env.SUPABASE_DB_HOST,
    SUPABASE_DB_PORT: process.env.SUPABASE_DB_PORT,
    SUPABASE_DB_DATABASE: process.env.SUPABASE_DB_DATABASE ?? process.env.SUPABASE_DB_NAME,
    SUPABASE_DB_USER: process.env.SUPABASE_DB_USER,
    SUPABASE_DB_PASSWORD: process.env.SUPABASE_DB_PASSWORD,
  } as const;

  const missing = Object.entries(requiredEnv)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new BootstrapError(`Missing required environment variables: ${missing.join(', ')}`);
  }

  const port = Number(requiredEnv.SUPABASE_DB_PORT);
  if (Number.isNaN(port)) {
    throw new BootstrapError('SUPABASE_DB_PORT must be a number.');
  }

  return {
    host: requiredEnv.SUPABASE_DB_HOST,
    port,
    database: requiredEnv.SUPABASE_DB_DATABASE,
    user: requiredEnv.SUPABASE_DB_USER,
    password: requiredEnv.SUPABASE_DB_PASSWORD,
    ssl: resolveSslConfig(),
  };
}

async function ensureSchemaVersionTable(client: Client): Promise<void> {
  await client.query(`
    CREATE TABLE IF NOT EXISTS ${SCHEMA_VERSION_TABLE} (
      version TEXT PRIMARY KEY,
      description TEXT NOT NULL,
      checksum TEXT NOT NULL,
      executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      execution_time_ms INTEGER NOT NULL,
      filename TEXT NOT NULL
    );
  `);
}

async function loadMigrationRecords(dir: string): Promise<MigrationRecord[]> {
  let entries: import('node:fs').Dirent[];
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }
    throw error;
  }
  const migrations: MigrationRecord[] = [];

  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const match = entry.name.match(MIGRATION_FILE_REGEX);
    if (!match) {
      if (entry.name.endsWith('.sql')) {
        console.warn(`Ignoring migration file with unexpected name: ${entry.name}`);
      }
      continue;
    }

    const fullPath = path.join(dir, entry.name);
    const sql = await readFile(fullPath, 'utf-8');
    const checksum = createHash('sha256').update(sql, 'utf8').digest('hex');
    const [, versionTimestamp, description] = match;
    migrations.push({
      filename: entry.name,
      version: `V${versionTimestamp}`,
      description: description.replace(/_/g, ' '),
      checksum,
    });
  }

  migrations.sort((a, b) => a.filename.localeCompare(b.filename));
  return migrations;
}

async function fetchAppliedMigrations(client: Client): Promise<Set<string>> {
  const results = await client.query<{ version: string }>(
    `SELECT version FROM ${SCHEMA_VERSION_TABLE}`,
  );
  return new Set(results.rows.map((row) => row.version));
}

async function bootstrapSchemaVersion(migrationsDir?: string): Promise<void> {
  loadEnvFiles();

  const resolvedDir = path.resolve(migrationsDir ?? process.env[MIGRATIONS_DIR_ENV] ?? DEFAULT_MIGRATIONS_DIR);
  console.log(`Loading migrations from: ${resolvedDir}`);

  const migrations = await loadMigrationRecords(resolvedDir);
  if (migrations.length === 0) {
    console.log(`No migration files found in ${resolvedDir}.`);
    return;
  }

  console.log(`Found ${migrations.length} migration(s):`);
  for (const migration of migrations) {
    console.log(`  - ${migration.filename} (${migration.version})`);
  }

  const client = new Client(resolveConnectionConfig());
  await client.connect();

  try {
    console.log('\nEnsuring schema_version table exists...');
    await ensureSchemaVersionTable(client);

    console.log('Checking for already-applied migrations...');
    const appliedVersions = await fetchAppliedMigrations(client);

    let insertedCount = 0;
    let skippedCount = 0;

    for (const migration of migrations) {
      if (appliedVersions.has(migration.version)) {
        console.log(`  ⊘ Skipped ${migration.filename} (already recorded)`);
        skippedCount += 1;
        continue;
      }

      // Insert the migration record with execution_time_ms = 0 since it was already applied manually
      await client.query(
        `INSERT INTO ${SCHEMA_VERSION_TABLE} (version, description, checksum, execution_time_ms, filename)
         VALUES ($1, $2, $3, $4, $5)`,
        [migration.version, migration.description, migration.checksum, 0, migration.filename],
      );
      console.log(`  ✔ Inserted ${migration.filename}`);
      insertedCount += 1;
    }

    console.log(`\n✅ Bootstrap complete!`);
    console.log(`   Inserted: ${insertedCount}`);
    console.log(`   Skipped: ${skippedCount}`);
    console.log(`   Total: ${migrations.length}`);
  } finally {
    await client.end();
  }
}

async function cli(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Bootstrap schema_version table with existing migrations

Usage: tsx scripts/bootstrap-schema-version.ts [--dir <path>]

Options:
  --dir <path>  Path to migrations directory (default: db/migrations)
  --help, -h    Show this help message

Description:
  This script reads existing migration files and inserts tracking records
  into the schema_version table without actually executing the migrations.

  Use this when you have migrations that were already applied manually
  and need to be tracked by the migration system.

Example:
  tsx scripts/bootstrap-schema-version.ts
  tsx scripts/bootstrap-schema-version.ts --dir ./db/migrations
`);
    process.exit(0);
  }

  let migrationsDir: string | undefined;

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--dir') {
      const next = args[i + 1];
      if (!next) {
        console.error('Missing value for --dir');
        process.exit(1);
      }
      migrationsDir = next;
      i += 1;
    }
  }

  try {
    await bootstrapSchemaVersion(migrationsDir);
  } catch (error) {
    if (error instanceof BootstrapError) {
      console.error(`❌ ${error.message}`);
      if (error.cause instanceof Error) {
        console.error(error.cause.message);
      } else if (error.cause) {
        console.error(error.cause);
      }
    } else {
      console.error('❌ Unexpected error:');
      console.error(error);
    }
    process.exitCode = 1;
  }
}

const entryUrl = process.argv[1] ? pathToFileURL(process.argv[1]).href : undefined;
if (import.meta.url === entryUrl || process.argv[1]?.endsWith('bootstrap-schema-version.ts')) {
  void cli();
}
