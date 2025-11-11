# Task: Move Vercel Environment Check to Local Script

**Priority:** 🟡 Medium (Short-term)
**Effort:** 15 minutes
**Type:** Refactoring

## Problem

`check-vercel-env.yml` is a 127-line workflow that's manual-only (`workflow_dispatch`) and essentially a debugging script. It has no CI/CD value—it just prints information for troubleshooting Vercel configuration.

## Current State

```yaml
# .github/workflows/check-vercel-env.yml
on:
  workflow_dispatch:  # Manual trigger only
```

It's used for inspecting Vercel env vars but requires GitHub Actions UI to run.

## Solution

Convert to a local Node.js script for easier debugging:

```bash
# 1. Create the script
cat > scripts/check-vercel-env.js << 'EOF'
#!/usr/bin/env node
// Checks Vercel environment configuration
// Run: node scripts/check-vercel-env.js

import { execSync } from 'node:child_process';

console.log('🔐 Checking Vercel authentication...');
execSync('npx vercel whoami --token="$VERCEL_TOKEN"', { stdio: 'inherit' });

console.log('\n📊 Listing environment variables...');
console.log('\n🏭 PRODUCTION:');
execSync('npx vercel env ls production', { stdio: 'inherit' });

console.log('\n🔬 PREVIEW:');
execSync('npx vercel env ls preview', { stdio: 'inherit' });

console.log('\n🛠️ DEVELOPMENT:');
execSync('npx vercel env ls development', { stdio: 'inherit' });
EOF

chmod +x scripts/check-vercel-env.js

# 2. Update package.json
npm pkg set scripts.vercel:check="node scripts/check-vercel-env.js"

# 3. Update documentation
# Add to CLAUDE.md: `npm run vercel:check` - Inspect Vercel environment variables

# 4. Remove workflow
git rm .github/workflows/check-vercel-env.yml
```

## Acceptance Criteria

- [ ] New script `scripts/check-vercel-env.js` exists
- [ ] Script added to `package.json` as `vercel:check`
- [ ] Documented in `CLAUDE.md`
- [ ] Workflow file `.github/workflows/check-vercel-env.yml` deleted
- [ ] Script works locally: `npm run vercel:check`

## Benefits

- Faster debugging (no need to navigate GitHub Actions UI)
- Can be run locally during development
- Removes 127 lines from CI/CD
- Still accessible when needed

## Notes

Keep the `VERCEL_TOKEN` requirement—script users must have it set locally or in their environment.
