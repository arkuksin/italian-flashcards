# Database Migrations

This directory contains ordered SQL migration files that define the evolution of the project's Supabase Postgres schema.

## File naming convention

- Every migration file must live directly in this folder and use the pattern `V<timestamp>__<description>.sql`.
- Use a 14-digit UTC timestamp (`YYYYMMDDHHMMSS`) to guarantee lexicographic ordering.
- The description should be lowercase, words separated by underscores, and describe the change succinctly (for example, `V20240319091500__add_profile_table.sql`).

## Migration formatting guidelines

- Write pure SQL statements; the migration runner executes each file inside a single transaction.
- Avoid including `BEGIN`/`COMMIT` in the file. The CLI tool handles transactional boundaries automatically.
- Make migrations idempotent when possible (e.g., guard `CREATE` statements with `IF NOT EXISTS`, ensure `DROP` statements check for existence) to ease re-runs in ephemeral environments.
- Keep migrations focused—prefer many small files over one large script.

## Checksums and modification policy

The migration runner stores a SHA-256 checksum for every executed file. If a checked-in migration is modified after execution, subsequent runs will fail with a checksum mismatch. Instead of editing an executed migration, create a new one that amends or reverts the change.

## Creating new migrations

Use the helper script to scaffold a timestamped file:

```bash
npm run create:migration "add profile table"
```

The script writes a template under `db/migrations/`. Fill in the SQL statements and commit the new file.

## Generating timestamps manually

If you prefer to create files yourself, format the timestamp using UTC and zero-padding for all segments. Example for March 19, 2024 at 09:15:00 UTC:

```
V20240319091500__short_description.sql
```

## Idempotency expectations

Because migrations run in CI, Vercel builds, and local development automatically, they must be safe to execute multiple times. Favor `CREATE TABLE IF NOT EXISTS`, `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`, and similar constructs. If a change cannot be written idempotently, document the required manual steps in the migration file comments and in the rollback guide.

## Running migrations

Run migrations using the dedicated CLI:

```bash
npm run migrate
```

Pass `--check` to validate pending migrations without applying them (used by CI):

```bash
npm run migrate -- --check
```

Refer to `docs/DB_Versioning_Plan.md` for the full workflow and rollback procedures.
