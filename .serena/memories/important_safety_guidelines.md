# Important Safety Guidelines

## Critical: Email Bounce Prevention

### Why This Matters
- High email bounce rates can **suspend Supabase email sending**
- Throwaway email domains (@test.com, @mailinator.com, etc.) cause bounces
- Email validation prevents these issues automatically
- Regular cleanup prevents test user accumulation

### Email Safety Rules
✅ **DO**:
- Use test database (`.env.local`) for development
- Create test users with `npm run test:create-user`
- Use valid email addresses (even for testing)
- Clean up test users regularly
- Use `@example.com` domain for test emails

❌ **DON'T**:
- Never use fake/throwaway email addresses
- Never test directly against production database
- Never commit email credentials
- Never skip email validation

### Blocked Email Domains
The email validator blocks 14 throwaway domains:
- mailinator.com, temp-mail.org, guerrillamail.com
- 10minutemail.com, throwaway.email, maildrop.cc
- getnada.com, tempmail.com, trashmail.com
- yopmail.com, fakeinbox.com, dispostable.com
- sharklasers.com, spam4.me

### Email Validator Location
- Implementation: `src/lib/emailValidator.ts`
- Usage: `src/components/auth/LoginForm.tsx`
- Validation happens client-side before submission

## Database Safety

### Database Configuration
**Test Database** (default):
- URL: `https://slhyzoupwluxgasvapoc.supabase.co`
- Safe for all development and testing
- Default in `.env.local`
- Use for feature development

**Production Database**:
- Only in `.env.production.local`
- Use ONLY for final verification
- Requires extra caution
- Never use for testing

### Safe Development Workflow
1. ✅ Always use test database for development
2. ✅ Create test users via `npm run test:create-user`
3. ✅ Clean up test users regularly
4. ✅ Verify database URL before running operations
5. ✅ Use dry-run mode first for cleanup operations

### Database Cleanup Scripts
```bash
# Test database cleanup (safe)
npm run test:cleanup-users          # Dry-run preview
npm run test:cleanup-users --execute # Actually delete

# Production database audit (careful!)
npm run prod:list-users             # List all users
npm run prod:delete-users:dry-run   # Preview deletions
npm run prod:delete-users           # Delete with confirmation
npm run prod:cleanup-users          # Dry-run cleanup preview
```

### Health Monitoring
```bash
npm run health:check                # Monitor email bounce rates
```

## E2E Testing Safety

### Test User Credentials
- Email: `test-e2e@example.com`
- Password: `TestPassword123!`
- Environment: Test database only
- Created via: `npm run test:create-user`

### Testing Best Practices
- Tests run against Vercel preview deployments in CI
- Local tests use `http://localhost:5173`
- Test database connection configured in `.env.test.local`
- Clean up test users after test runs

### Test Documentation
- Complete guide: `docs/E2E_AUTHENTICATION_TESTING.md`
- Testing practices: `docs/TESTING_BEST_PRACTICES.md`
- Cleanup procedures: `docs/CLEANUP_PROCEDURES.md`

## Branch Protection

### Protected Branches
- **main**: Requires PR reviews, passing tests
- Direct pushes blocked
- Status checks must pass
- Automated via GitHub Actions

### Setup and Verification
```bash
npm run setup:branch-protection     # Configure protection
npm run verify:branch-protection    # Verify configuration
```

### Required Checks
- ✅ E2E tests must pass
- ✅ Lint must pass
- ✅ Build must succeed
- ✅ PR review required

## Sensitive Data

### Never Commit
- ❌ `.env.local`, `.env.production.local`
- ❌ API keys or secrets
- ❌ `client_secret_*.json` (OAuth credentials)
- ❌ `token.txt` or similar credential files
- ❌ User data or database exports

### Git Safety
- Check `.gitignore` includes sensitive patterns
- Review `git status` before committing
- Use `git diff` to verify changes
- Never use `git add .` without review

## Security Checklist

Before pushing code:
- [ ] No sensitive data in commits
- [ ] Using test database for development
- [ ] Email validation active
- [ ] No hardcoded credentials
- [ ] Environment variables properly configured
- [ ] Test users cleaned up
- [ ] All tests passing
- [ ] Lint passing

## Emergency Procedures

### If Email Bounce Rate Spikes
1. Stop creating new test users immediately
2. Run `npm run health:check` to assess damage
3. Clean up invalid users: `npm run prod:delete-users:dry-run`
4. Review bounce logs: `cleanup/bounce-logs-check.md`
5. Contact Supabase support if needed

### If Production Database Compromised
1. Change all API keys immediately
2. Review user data for anomalies
3. Check Supabase audit logs
4. Review RLS policies
5. Notify affected users if data exposed

### If Credentials Committed to Git
1. Revoke compromised credentials immediately
2. Generate new API keys
3. Update Vercel environment variables
4. Force push to remove from history (if recent)
5. Rotate all related secrets

## Contact and Resources

### Documentation
- `docs/TESTING_BEST_PRACTICES.md` - Comprehensive testing guide
- `docs/E2E_AUTHENTICATION_TESTING.md` - E2E test setup
- `docs/CLEANUP_PROCEDURES.md` - Database maintenance
- `cleanup/bounce-logs-check.md` - Email monitoring

### Supabase Resources
- Dashboard: Check project settings
- API Keys: Project Settings → API
- Database: Table Editor and SQL Editor
- Auth: Authentication settings and providers
