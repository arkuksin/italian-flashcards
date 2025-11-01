import { mkdir, writeFile, access } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const MIGRATIONS_DIR = path.resolve(process.cwd(), 'db/migrations');

function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/__+/g, '_');
}

function timestamp(): string {
  const now = new Date();
  const pad = (value: number) => value.toString().padStart(2, '0');
  return [
    now.getUTCFullYear(),
    pad(now.getUTCMonth() + 1),
    pad(now.getUTCDate()),
    pad(now.getUTCHours()),
    pad(now.getUTCMinutes()),
    pad(now.getUTCSeconds()),
  ].join('');
}

async function ensureDir(dir: string): Promise<void> {
  try {
    await access(dir, constants.F_OK);
  } catch {
    await mkdir(dir, { recursive: true });
  }
}

async function main(): Promise<void> {
  const description = process.argv.slice(2).join(' ');
  if (!description) {
    console.error('Usage: tsx scripts/create-migration.ts "description"');
    process.exit(1);
  }

  const slug = slugify(description);
  if (!slug) {
    console.error('Description must include at least one alphanumeric character.');
    process.exit(1);
  }

  await ensureDir(MIGRATIONS_DIR);

  const filename = `V${timestamp()}__${slug}.sql`;
  const fullPath = path.join(MIGRATIONS_DIR, filename);

  const template = `-- Migration: ${description}\n-- Generated at ${new Date().toISOString()} UTC\n-- Write idempotent SQL statements below.\n\n`;

  await writeFile(fullPath, template, { encoding: 'utf-8', flag: 'wx' });
  console.log(`Created migration ${path.relative(process.cwd(), fullPath)}`);
}

main().catch((error) => {
  console.error('Failed to create migration file:', error);
  process.exit(1);
});
