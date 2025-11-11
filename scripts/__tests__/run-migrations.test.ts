import { mkdtemp, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { Client, ClientConfig } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { MigrationError, runMigrations } from '../run-migrations';

const silentLogger = {
  info: () => {},
  warn: () => {},
  error: () => {},
};

async function createMigrationDir(files: Array<{ name: string; sql: string }>): Promise<string> {
  const dir = await mkdtemp(path.join(tmpdir(), 'migrations-'));
  for (const file of files) {
    await writeFile(path.join(dir, file.name), file.sql, 'utf-8');
  }
  return dir;
}

// Check if Docker is available
async function isDockerAvailable(): Promise<boolean> {
  try {
    const { getContainerRuntimeClient } = await import('@testcontainers/postgresql/node_modules/testcontainers/src/container-runtime/clients/client.js');
    await getContainerRuntimeClient();
    return true;
  } catch {
    return false;
  }
}

const dockerAvailable = await isDockerAvailable();

describe.skipIf(!dockerAvailable)('runMigrations', () => {
  let container: StartedPostgreSqlContainer;
  let connectionConfig: ClientConfig;

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:16-alpine').start();
    connectionConfig = {
      host: container.getHost(),
      port: container.getPort(),
      user: container.getUsername(),
      password: container.getPassword(),
      database: container.getDatabase(),
      ssl: false,
    };
  }, 120000);

  afterAll(async () => {
    await container?.stop();
  });

  async function resetDatabase(): Promise<void> {
    const client = new Client(connectionConfig);
    await client.connect();
    try {
      await client.query('DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;');
      await client.query(`GRANT ALL ON SCHEMA public TO ${connectionConfig.user};`);
    } finally {
      await client.end();
    }
  }

  it('applies migrations in order and records metadata', async () => {
    await resetDatabase();
    const dir = await createMigrationDir([
      {
        name: 'V20240101000000__create_table.sql',
        sql: 'CREATE TABLE IF NOT EXISTS tasks (id SERIAL PRIMARY KEY, name TEXT NOT NULL);',
      },
      {
        name: 'V20240101010000__insert_seed.sql',
        sql: "INSERT INTO tasks (name) VALUES ('initial task');",
      },
    ]);

    const result = await runMigrations({ migrationsDir: dir, connectionConfig, logger: silentLogger });
    expect(result.appliedMigrations.map((m) => m.filename)).toEqual([
      'V20240101000000__create_table.sql',
      'V20240101010000__insert_seed.sql',
    ]);

    const client = new Client(connectionConfig);
    await client.connect();
    try {
      const rows = await client.query('SELECT name FROM tasks');
      expect(rows.rows).toHaveLength(1);
      expect(rows.rows[0].name).toBe('initial task');
    } finally {
      await client.end();
    }
  });

  it('skips already applied migrations on subsequent runs', async () => {
    await resetDatabase();
    const dir = await createMigrationDir([
      {
        name: 'V20240101000000__create_table.sql',
        sql: 'CREATE TABLE IF NOT EXISTS projects (id SERIAL PRIMARY KEY);',
      },
    ]);

    const first = await runMigrations({ migrationsDir: dir, connectionConfig, logger: silentLogger });
    expect(first.appliedMigrations).toHaveLength(1);

    const second = await runMigrations({ migrationsDir: dir, connectionConfig, logger: silentLogger });
    expect(second.appliedMigrations).toHaveLength(0);
    expect(second.alreadyApplied).toHaveLength(1);
  });

  it('detects checksum mismatches when files change after execution', async () => {
    await resetDatabase();
    const dir = await createMigrationDir([
      {
        name: 'V20240101000000__create_table.sql',
        sql: 'CREATE TABLE IF NOT EXISTS audit_log (id SERIAL PRIMARY KEY);',
      },
    ]);

    await runMigrations({ migrationsDir: dir, connectionConfig, logger: silentLogger });

    const filePath = path.join(dir, 'V20240101000000__create_table.sql');
    const original = await readFile(filePath, 'utf-8');
    await writeFile(filePath, `${original}\n-- modified`, 'utf-8');

    await expect(
      runMigrations({ migrationsDir: dir, connectionConfig, logger: silentLogger }),
    ).rejects.toBeInstanceOf(MigrationError);
  });

  it('rolls back failed migrations and surfaces the error', async () => {
    await resetDatabase();
    const dir = await createMigrationDir([
      {
        name: 'V20240101000000__create_table.sql',
        sql: 'CREATE TABLE IF NOT EXISTS notes (id SERIAL PRIMARY KEY, body TEXT NOT NULL);',
      },
      {
        name: 'V20240101020000__invalid.sql',
        sql: 'ALTER TABLE notes ADD COLUMN body TEXT NOT NULL;',
      },
    ]);

    await expect(
      runMigrations({ migrationsDir: dir, connectionConfig, logger: silentLogger }),
    ).rejects.toBeInstanceOf(MigrationError);

    const client = new Client(connectionConfig);
    await client.connect();
    try {
      const schemaRows = await client.query(
        "SELECT column_name FROM information_schema.columns WHERE table_name = 'notes' ORDER BY ordinal_position",
      );
      expect(schemaRows.rows.map((row) => row.column_name)).toEqual(['id', 'body']);

      const versionRows = await client.query('SELECT filename FROM public.schema_version');
      expect(versionRows.rows.map((row) => row.filename)).toEqual(['V20240101000000__create_table.sql']);
    } finally {
      await client.end();
    }
  });
});
