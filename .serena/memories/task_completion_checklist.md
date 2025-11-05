# Task Completion Checklist

When completing a task, follow these steps to ensure code quality and prevent issues:

## 1. Code Quality Checks
```bash
npm run lint                 # Run ESLint - must pass with no errors
```

## 2. Testing
```bash
npm run test:e2e            # Run Playwright E2E tests - must pass
```

## 3. Build Verification
```bash
npm run build               # Build for production - must succeed
npm run preview             # Optional: Preview the build locally
```

## 4. Database Safety (If Applicable)
If your changes involve user data or authentication:
- ✅ Verify you're using test database (`.env.local`)
- ✅ Never commit credentials or sensitive data
- ✅ Run cleanup scripts if you created test users
- ✅ Check email validator is active for email inputs

```bash
npm run test:cleanup-users  # Clean up test users (dry-run)
```

## 5. Git & Version Control
```bash
git status                  # Check what files changed
git add <files>             # Stage relevant files
git commit -m "message"     # Commit with clear message
```

## 6. Pre-Push Checklist
Before pushing to GitHub:
- [ ] All tests pass (`npm run test:e2e`)
- [ ] Lint passes (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] No console errors in browser
- [ ] Changes tested manually in browser
- [ ] No sensitive data in commits
- [ ] Branch is up to date with main

## 7. Branch Protection (For Maintainers)
If setting up branch protection:
```bash
npm run setup:branch-protection    # Configure protection rules
npm run verify:branch-protection   # Verify configuration
```

## 8. Documentation Updates
If your changes affect:
- **User-facing features**: Update CLAUDE.md
- **Setup/deployment**: Update relevant docs in `docs/`
- **API changes**: Update type definitions
- **New commands**: Update suggested_commands.md

## Common Issues to Check
- ❌ TypeScript errors in IDE
- ❌ Console warnings in browser dev tools
- ❌ Broken navigation or routing
- ❌ Dark mode display issues
- ❌ Mobile responsiveness problems
- ❌ Authentication flows broken
- ❌ Progress tracking not persisting

## Environment Variables
Before deployment, verify:
- [ ] All required env vars are set in `.env.local`
- [ ] Production env vars are set in Vercel dashboard
- [ ] No `.env` files committed to git
- [ ] API keys are valid and not expired

## Critical Reminders
⚠️ **Email Safety**: Never use fake email addresses in any database
⚠️ **Test Database First**: Always develop against test database
⚠️ **Clean Up**: Remove test users after testing
⚠️ **Branch Protection**: Main branch requires PR reviews
