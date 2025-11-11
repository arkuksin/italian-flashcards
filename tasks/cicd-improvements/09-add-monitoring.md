# Task: Add Production Monitoring

**Priority:** 🟡 Medium (Long-term)
**Effort:** 3-4 hours
**Type:** Infrastructure

## Problem

The project has **no continuous monitoring** of production. You only discover issues when:
- Users report them
- Manual testing reveals problems
- Smoke tests fail (if implemented)

There's no visibility into:
- Deployment success rates
- Error rates in production
- Performance degradation
- API availability

## Solution

Implement a three-layer monitoring strategy:

### Layer 1: Deployment Monitoring (Essential)

Track deployment outcomes and alert on failures.

**Implementation:**

```yaml
# .github/workflows/deployment-monitor.yml
name: Deployment Monitor

on:
  deployment_status:

jobs:
  track-deployment:
    runs-on: ubuntu-latest
    steps:
      - name: Record deployment
        uses: actions/github-script@v7
        with:
          script: |
            const status = context.payload.deployment_status.state;
            const env = context.payload.deployment_status.environment;

            if (status === 'failure' && env === 'production') {
              await github.rest.issues.create({
                owner: context.repo.owner,
                repo: context.repo.repo,
                title: '🚨 Production Deployment Failed',
                body: `**Environment:** ${env}\n**Status:** ${status}\n**Deployment:** ${context.payload.deployment_status.target_url}`,
                labels: ['production', 'deployment-failure', 'automated']
              });
            }
```

**Acceptance Criteria:**
- [ ] Creates issue on production deployment failure
- [ ] Tracks deployment status in GitHub
- [ ] Notifies team (via GitHub issue)

---

### Layer 2: Error Tracking (Recommended)

Capture and report JavaScript errors in production.

**Options:**

**Option A: Sentry (Recommended)**
```typescript
// src/main.tsx
import * as Sentry from "@sentry/react";

if (import.meta.env.PROD) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: "production",
    tracesSampleRate: 0.1, // 10% of transactions
  });
}
```

**Option B: LogRocket**
```typescript
import LogRocket from 'logrocket';

if (import.meta.env.PROD) {
  LogRocket.init('your-app/id');
}
```

**Option C: Custom Error Boundary + Webhook**
```typescript
// src/ErrorBoundary.tsx
class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    if (import.meta.env.PROD) {
      fetch('/api/log-error', {
        method: 'POST',
        body: JSON.stringify({ error, errorInfo })
      });
    }
  }
}
```

**Acceptance Criteria:**
- [ ] Error tracking service integrated
- [ ] Production errors reported automatically
- [ ] Source maps uploaded for debugging
- [ ] Team receives error notifications

---

### Layer 3: Performance Monitoring (Optional)

Track performance metrics and detect regressions.

**Options:**

**Option A: Vercel Analytics (Built-in)**
```typescript
// Already available in Vercel dashboard
// Enable: Vercel Dashboard → Project → Analytics
```

**Option B: Web Vitals Monitoring**
```typescript
// src/main.tsx
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function sendToAnalytics(metric) {
  // Send to your analytics endpoint
  fetch('/api/analytics', {
    method: 'POST',
    body: JSON.stringify(metric)
  });
}

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

**Option C: Lighthouse CI**
```yaml
# .github/workflows/lighthouse.yml
name: Lighthouse CI

on:
  push:
    branches: [main]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: treosh/lighthouse-ci-action@v9
        with:
          urls: 'https://italian-flashcards.vercel.app'
          uploadArtifacts: true
```

**Acceptance Criteria:**
- [ ] Performance metrics collected
- [ ] Regression alerts configured
- [ ] Dashboard for monitoring trends

---

## Recommended Implementation Order

**Phase 1 (Week 1): Essential Monitoring**
1. Add deployment status tracking
2. Set up basic error boundary

**Phase 2 (Week 2): Error Tracking**
1. Choose error tracking service (Sentry recommended)
2. Integrate into app
3. Test error reporting
4. Configure notifications

**Phase 3 (Week 3): Performance Monitoring**
1. Enable Vercel Analytics (if available)
2. Add Web Vitals tracking (optional)
3. Set up Lighthouse CI (optional)

## Cost Analysis

| Service | Cost | Value |
|---------|------|-------|
| Deployment monitoring | $0 (GitHub Actions) | High |
| Sentry | $0-29/mo (free tier: 5k errors) | High |
| LogRocket | $0-99/mo (free tier: 1k sessions) | Medium |
| Vercel Analytics | $10/mo (included in Pro) | High |
| Lighthouse CI | $0 (GitHub Actions) | Medium |

**Recommendation:** Start with free tiers, upgrade only if needed.

## Acceptance Criteria

- [ ] Layer 1 (Deployment) implemented and working
- [ ] Layer 2 (Errors) chosen and configured
- [ ] Team can view metrics in dashboard
- [ ] Alerts configured for critical issues
- [ ] Documentation updated with monitoring guides

## Benefits

- **Catch issues before users do** - Proactive problem detection
- **Faster debugging** - Error traces, stack maps, breadcrumbs
- **Performance insights** - Identify slow pages, regressions
- **Better UX** - Fix issues users encounter
- **Data-driven decisions** - Metrics inform priorities

## Related

- Complements: `tasks/cicd-improvements/07-add-production-smoke-tests.md`
- See: `docs/dev/DEPLOYMENT.md` for deployment process
- See: Vercel Dashboard for built-in analytics
