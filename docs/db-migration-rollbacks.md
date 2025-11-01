# Database Migration Rollbacks

While the migration runner executes every SQL file inside a transaction, some operations can still have lasting effects (e.g., data deletions). This guide summarizes the manual steps required to recover from failed deployments or accidental schema changes.

## Before you deploy

- Enable automated database backups in Supabase for production projects.
- For high-risk migrations, take a manual snapshot immediately before running the change.
- Communicate the migration plan with the team and schedule deployments during low-traffic windows.

## Responding to a failed migration

1. **Identify the failure**
   - Review the CLI output from CI, Vercel, or local runs to determine which migration failed.
   - Because migrations run inside a transaction, schema changes in the failing file are rolled back automatically.

2. **Assess data impact**
   - If the migration included data updates (`UPDATE`, `DELETE`, `INSERT`), verify whether any statements executed before the failure. Use Supabase's query history to confirm.
   - If data was altered, plan a compensating migration to restore the expected state.

3. **Create a corrective migration**
   - Never modify the failing migration file directly.
   - Generate a new migration using `npm run create:migration` that either fixes the SQL or reverts the previous change.
   - Document why the rollback was necessary in the new file's comments.

4. **Restore from backup if needed**
   - For destructive failures (e.g., accidental table drops), restore the Supabase backup taken before deployment.
   - Coordinate with stakeholders before initiating a restore—backups replace the entire database, so downstream services may experience downtime.

## Rolling back in production

- Pause any background jobs or API traffic that might reapply failing migrations.
- Restore the backup or apply corrective migrations as described above.
- Re-run `npm run migrate` once the database is back to a healthy state to ensure all migrations succeed.

## Additional tips

- Keep rollback instructions with the migration file to reduce guesswork when incidents occur.
- Use feature flags or phased rollouts to reduce the blast radius of schema changes.
- Regularly test restoring backups in a staging environment so the team remains confident in the process.
