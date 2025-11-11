# Task: Consolidate Database Secrets

**Priority:** 🟡 Medium (Short-term)
**Effort:** 30 minutes
**Type:** Refactoring / Security

## Problem

Database configuration requires **8 separate secrets** in every migration workflow:

```yaml
env:
  SUPABASE_DB_HOST: ${{ secrets.SUPABASE_DB_HOST }}
  SUPABASE_DB_PORT: ${{ secrets.SUPABASE_DB_PORT }}
  SUPABASE_DB_DATABASE: ${{ secrets.SUPABASE_DB_DATABASE }}
  SUPABASE_DB_USER: ${{ secrets.SUPABASE_DB_USER }}
  SUPABASE_DB_PASSWORD: ${{ secrets.SUPABASE_DB_PASSWORD }}
  SUPABASE_DB_SSL: ${{ secrets.SUPABASE_DB_SSL }}
  SUPABASE_DB_SSL_REJECT_UNAUTHORIZED: ${{ secrets.SUPABASE_DB_SSL_REJECT_UNAUTHORIZED }}
  SUPABASE_DB_SSL_CA_CERT_PATH: ${{ secrets.SUPABASE_DB_SSL_CA_CERT_PATH }}
```

This creates:
- Secret sprawl (16 total secrets for 2 databases)
- Configuration duplication across workflows
- Higher maintenance burden

## Solution

Consolidate into a single connection string:

```bash
# Instead of 8 secrets, use 1:
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require
```

### Implementation Steps

**1. Update migration scripts to accept DATABASE_URL:**

```typescript
// scripts/run-migrations.ts
const connectionString = process.env.DATABASE_URL || buildFromParts();

function buildFromParts() {
  // Fallback: construct from individual env vars if DATABASE_URL not set
  const { SUPABASE_DB_HOST, SUPABASE_DB_PORT, ... } = process.env;
  return `postgresql://${SUPABASE_DB_USER}:${SUPABASE_DB_PASSWORD}@${SUPABASE_DB_HOST}:${SUPABASE_DB_PORT}/${SUPABASE_DB_DATABASE}?sslmode=require`;
}
```

**2. Update workflows:**

```yaml
# .github/workflows/db-migrations.yml
env:
  DATABASE_URL: ${{ secrets.DATABASE_URL }}
  # Remove 8 individual secrets
```

**3. Add secrets to GitHub:**

```bash
# Production database
gh secret set DATABASE_URL --body "postgresql://postgres.xxx:xxx@xxx.supabase.co:6543/postgres?sslmode=require"

# Test database
gh secret set DATABASE_URL_TEST --body "postgresql://postgres.yyy:yyy@yyy.supabase.co:6543/postgres?sslmode=require"
```

**4. Update Vercel environment:**

```bash
# Set in Vercel dashboard or via CLI
vercel env add DATABASE_URL production
vercel env add DATABASE_URL preview
```

## Acceptance Criteria

- [ ] Migration scripts accept `DATABASE_URL`
- [ ] Fallback to individual env vars still works (backward compatibility)
- [ ] GitHub secrets updated with consolidated URLs
- [ ] Vercel env vars updated
- [ ] All workflows updated to use `DATABASE_URL`
- [ ] Test database connections work
- [ ] Production migrations still succeed
- [ ] Documentation updated (`docs/dev/DATABASE.md`)

## Benefits

- **Reduces secret management** - 16 secrets → 2 secrets (87% reduction)
- **Simplifies workflows** - 8 env vars → 1 env var
- **Industry standard** - Most tools expect `DATABASE_URL`
- **Easier debugging** - Single connection string to verify

## Rollout Strategy

**Phase 1: Add support**
- Update scripts to accept `DATABASE_URL`
- Keep individual env vars as fallback

**Phase 2: Add secrets**
- Add `DATABASE_URL` to GitHub and Vercel
- Test in a feature branch

**Phase 3: Migrate workflows**
- Update workflows one by one
- Verify each works before moving to next

**Phase 4: Cleanup**
- Remove old individual secrets (after confirming everything works)

## Related

- See: `docs/dev/DATABASE.md` for current connection configuration
- See: `scripts/run-migrations.ts` for connection logic
