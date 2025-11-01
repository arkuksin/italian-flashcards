# Database Versioning Plan

This document describes how the team should manage Postgres schema changes using the migration tooling that lives in this repository.

## Prerequisites

1. Ensure the Supabase connection variables in `.env.local` (or `supabase/.env.local`) are populated:
   - `SUPABASE_DB_HOST`
   - `SUPABASE_DB_PORT`
   - `SUPABASE_DB_DATABASE`
   - `SUPABASE_DB_USER`
   - `SUPABASE_DB_PASSWORD`
   - `SUPABASE_DB_SSL` (set to `true` for hosted Supabase)
   - `SUPABASE_DB_SSL_REJECT_UNAUTHORIZED` (usually `false` when using Supabase-managed certificates)
   - `SUPABASE_DB_SSL_CA_CERT` or `SUPABASE_DB_SSL_CA_CERT_PATH` if your environment requires a custom CA chain
2. Install Docker Desktop (for local testing with Testcontainers) and enable Kubernetes/colima integration if required by your OS.
3. Run `npm install` to ensure the migration CLI dependencies are available.

## Creating a migration

1. Use the helper script to scaffold a timestamped SQL file:

   ```bash
   npm run create:migration "add flashcard progress indexes"
   ```

2. Edit the generated file in `db/migrations/` and write idempotent SQL. The runner wraps every migration in a transaction, so omit `BEGIN`/`COMMIT` statements.
3. Include comments in the SQL file describing the intent of the change and any manual follow-up steps.
4. Commit the new file alongside related application code.

## Running migrations locally

- Migrations run automatically before `npm run dev` (via the `predev` script) and before `npm start`.
- To run migrations manually, execute:

  ```bash
  npm run migrate
  ```

- To verify that pending migrations are valid without applying them, use:

  ```bash
  npm run migrate -- --check
  ```

## Validating in CI

The GitHub Actions workflow `db-migrations.yml` runs `npm run migrate -- --check` using Supabase credentials stored in repository secrets. Ensure your new migration passes this job before merging.

Vercel builds execute `node vercel-build-step.mjs` prior to `npm run build`, which runs `npm run migrate` using the deployment environment variables. Configure the Supabase credentials in your Vercel project settings to keep preview and production databases in sync.

## Reverting a failed migration

1. If a migration fails locally, the transaction rolls back automatically—fix the SQL and rerun the CLI.
2. If the failure happens in a shared environment (CI, Vercel preview, or production), follow the guidance in `docs/db-migration-rollbacks.md` to restore from backups or craft corrective migrations.
3. Never edit a previously committed migration; instead, create a follow-up file that reverts or adjusts the change.

## Best practices

- Keep migrations small and focused for easier reviews.
- Coordinate schema changes with feature work; migrations should accompany PRs that depend on them.
- Document any irreversible operations or data migrations directly in the SQL file comments and in the rollback guide.
- Always run migrations locally before pushing changes to ensure your environment matches Supabase.
