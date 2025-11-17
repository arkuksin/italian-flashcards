import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import { performance } from 'node:perf_hooks';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import process from 'node:process';
import { Client, ClientConfig } from 'pg';
import dotenv from 'dotenv';

const MIGRATIONS_DIR_ENV = 'MIGRATIONS_DIR';
const DEFAULT_MIGRATIONS_DIR = path.resolve(process.cwd(), 'db/migrations');
const MIGRATION_FILE_REGEX = /^V(\d{14})__([a-z0-9_]+)\.sql$/;
const SCHEMA_VERSION_TABLE = 'public.schema_version';

interface Logger {
  info: (message: string) => void;
  warn: (message: string) => void;
  error: (message: string) => void;
}

interface MigrationDefinition {
  filename: string;
  fullPath: string;
  version: string;
  description: string;
  checksum: string;
  sql: string;
}

interface RunMigrationsOptions {
  checkOnly?: boolean;
  verbose?: boolean;
  migrationsDir?: string;
  connectionConfig?: ClientConfig;
  logger?: Logger;
}

interface RunMigrationsResult {
  appliedMigrations: MigrationDefinition[];
  skippedMigrations: MigrationDefinition[];
  alreadyApplied: MigrationDefinition[];
}

export class MigrationError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'MigrationError';
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
    throw new MigrationError('Specify either SUPABASE_DB_SSL_CA_CERT or SUPABASE_DB_SSL_CA_CERT_PATH, not both.');
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
    throw new MigrationError(`Missing required environment variables: ${missing.join(', ')}`);
  }

  const port = Number(requiredEnv.SUPABASE_DB_PORT);
  if (Number.isNaN(port)) {
    throw new MigrationError('SUPABASE_DB_PORT must be a number.');
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

async function loadMigrationDefinitions(dir: string, logger: Logger): Promise<MigrationDefinition[]> {
  let entries: import('node:fs').Dirent[];
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }
    throw error;
  }
  const migrations: MigrationDefinition[] = [];

  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const match = entry.name.match(MIGRATION_FILE_REGEX);
    if (!match) {
      if (entry.name.endsWith('.sql')) {
        logger.warn(`Ignoring migration file with unexpected name: ${entry.name}`);
      }
      continue;
    }

    const fullPath = path.join(dir, entry.name);
    const sql = await readFile(fullPath, 'utf-8');
    const checksum = createHash('sha256').update(sql, 'utf8').digest('hex');
    const [, versionTimestamp, description] = match;
    migrations.push({
      filename: entry.name,
      fullPath,
      version: `V${versionTimestamp}`,
      description: description.replace(/_/g, ' '),
      checksum,
      sql,
    });
  }

  migrations.sort((a, b) => a.filename.localeCompare(b.filename));
  for (let i = 1; i < migrations.length; i += 1) {
    if (migrations[i].version === migrations[i - 1].version) {
      throw new MigrationError(`Duplicate migration version detected: ${migrations[i].version}`);
    }
  }
  return migrations;
}

async function fetchAppliedMigrations(client: Client): Promise<Map<string, { checksum: string }>> {
  const results = await client.query<{ version: string; checksum: string }>(
    `SELECT version, checksum FROM ${SCHEMA_VERSION_TABLE}`,
  );
  return new Map(results.rows.map((row) => [row.version, { checksum: row.checksum }]));
}

async function applyMigration(
  client: Client,
  migration: MigrationDefinition,
  checkOnly: boolean,
  verbose: boolean,
): Promise<'applied' | 'skipped'> {
  if (checkOnly) {
    if (verbose) {
      console.log(`\n📄 ${migration.filename}`);
      console.log(`   Version: ${migration.version}`);
      console.log(`   Description: ${migration.description}`);
      console.log(`   Checksum: ${migration.checksum.substring(0, 16)}...`);
      console.log(`\n   SQL Content:`);
      console.log(`   ${'─'.repeat(80)}`);
      const sqlLines = migration.sql.split('\n');
      sqlLines.forEach((line, index) => {
        console.log(`   ${String(index + 1).padStart(4)} │ ${line}`);
      });
      console.log(`   ${'─'.repeat(80)}\n`);
    }
    return 'skipped';
  }

  const start = performance.now();
  await client.query('BEGIN');
  try {
    await client.query(migration.sql);
    const executionTime = Math.round(performance.now() - start);
    await client.query(
      `INSERT INTO ${SCHEMA_VERSION_TABLE} (version, description, checksum, execution_time_ms, filename)
       VALUES ($1, $2, $3, $4, $5)`,
      [migration.version, migration.description, migration.checksum, executionTime, migration.filename],
    );
    await client.query('COMMIT');
    return 'applied';
  } catch (error) {
    await client.query('ROLLBACK');
    throw new MigrationError(`Failed to apply migration ${migration.filename}`, error);
  }
}

export async function runMigrations({
  checkOnly = false,
  verbose = false,
  migrationsDir,
  connectionConfig,
  logger = console,
}: RunMigrationsOptions = {}): Promise<RunMigrationsResult> {
  loadEnvFiles();

  const resolvedDir = path.resolve(migrationsDir ?? process.env[MIGRATIONS_DIR_ENV] ?? DEFAULT_MIGRATIONS_DIR);

  const migrations = await loadMigrationDefinitions(resolvedDir, logger);
  if (migrations.length === 0) {
    logger.info(`No migration files found in ${resolvedDir}.`);
    return { appliedMigrations: [], skippedMigrations: [], alreadyApplied: [] };
  }

  const client = new Client(connectionConfig ?? resolveConnectionConfig());
  await client.connect();

  try {
    await ensureSchemaVersionTable(client);
    const appliedMap = await fetchAppliedMigrations(client);

    const applied: MigrationDefinition[] = [];
    const skipped: MigrationDefinition[] = [];
    const alreadyApplied: MigrationDefinition[] = [];

    for (const migration of migrations) {
      logger.info(`${checkOnly ? 'Checking' : 'Applying'} migration ${migration.filename}`);
      const existing = appliedMap.get(migration.version);
      if (existing) {
        if (existing.checksum !== migration.checksum) {
          throw new MigrationError(
            `Checksum mismatch for ${migration.filename}. Expected ${existing.checksum} but found ${migration.checksum}.`,
          );
        }
        alreadyApplied.push(migration);
        continue;
      }

      const status = await applyMigration(client, migration, checkOnly, verbose);
      if (status === 'applied') {
        applied.push(migration);
        logger.info(`✔ Applied ${migration.filename}`);
      } else {
        skipped.push(migration);
        if (!verbose) {
          logger.info(`ℹ Would apply ${migration.filename}`);
        }
      }
    }

    if (checkOnly && applied.length === 0 && skipped.length === 0) {
      logger.info('No new migrations to validate.');
    }

    return { appliedMigrations: applied, skippedMigrations: skipped, alreadyApplied };
  } finally {
    await client.end();
  }
}

async function cli(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`Usage: tsx scripts/run-migrations.ts [options]\n`);
    console.log(`Options:`);
    console.log(`  --check, --dry-run    Check for pending migrations without applying them`);
    console.log(`  --verbose, -v         Show detailed SQL content during dry-run`);
    console.log(`  --dir <path>          Custom migrations directory path`);
    console.log(`  --help, -h            Show this help message\n`);
    process.exit(0);
  }

  let checkOnly = false;
  let verbose = false;
  let migrationsDir: string | undefined;

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--check' || arg === '--dry-run') {
      checkOnly = true;
    } else if (arg === '--verbose' || arg === '-v') {
      verbose = true;
    } else if (arg === '--dir') {
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
    const result = await runMigrations({ checkOnly, verbose, migrationsDir });
    if (checkOnly && result.skippedMigrations.length > 0) {
      if (!verbose) {
        console.log(`\nFound ${result.skippedMigrations.length} pending migrations.`);
        console.log(`Use --verbose to see SQL content.\n`);
      } else {
        console.log(`\n✅ Found ${result.skippedMigrations.length} pending migrations (SQL content shown above).\n`);
      }
    }
  } catch (error) {
    if (error instanceof MigrationError) {
      console.error(error.message);
      if (error.cause instanceof Error) {
        console.error(error.cause.message);
      } else if (error.cause) {
        console.error(error.cause);
      }
    } else {
      console.error(error);
    }
    process.exitCode = 1;
  }
}

const entryUrl = process.argv[1] ? pathToFileURL(process.argv[1]).href : undefined;
if (import.meta.url === entryUrl || process.argv[1]?.endsWith('run-migrations.ts')) {
  void cli();
}
