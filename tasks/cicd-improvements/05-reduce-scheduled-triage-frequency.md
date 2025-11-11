# Task: Reduce Gemini Scheduled Triage Frequency

**Priority:** 🟠 High (Short-term)
**Effort:** 5 minutes
**Type:** Optimization

## Problem

`gemini-scheduled-triage.yml` runs **every hour** (cron: `0 * * * *`) searching for unlabeled issues. This is wasteful because:

- Project gets ~1-2 issues per day
- 23 out of 24 hourly runs find nothing
- Consumes **~2,160 runner minutes/month** (70% of total CI/CD runtime)
- Burns API quota unnecessarily

## Current State

```yaml
# .github/workflows/gemini-scheduled-triage.yml:5
schedule:
  - cron: '0 * * * *'  # Runs every hour
```

**Monthly cost:** 720 runs × 3 min average = 2,160 minutes

## Solution

Change frequency to weekly:

```yaml
# .github/workflows/gemini-scheduled-triage.yml
schedule:
  - cron: '0 9 * * 1'  # Every Monday at 9:00 AM UTC
```

**OR** remove scheduled entirely and rely on on-demand triggering:

```bash
# Keep only manual trigger
on:
  workflow_dispatch:  # Run via @gemini-cli /triage when needed
```

## Acceptance Criteria

- [ ] Cron schedule changed from hourly to weekly (or removed)
- [ ] Manual trigger via `workflow_dispatch` still works
- [ ] On-demand triage via `@gemini-cli /triage` still functional
- [ ] Commit message explains the change

## Benefits

- **Saves ~2,100 runner minutes/month** (67% reduction)
- Reduces API quota consumption
- Maintains same functionality (issues still get triaged)
- Still available on-demand when needed

## Trade-offs

**Before:** Issues labeled within 1 hour
**After (weekly):** Issues labeled within 7 days
**After (on-demand):** Issues labeled when manually triggered

For a project with low issue volume, this is perfectly acceptable.

## Recommendation

**Option 1 (Conservative):** Weekly schedule
```yaml
schedule:
  - cron: '0 9 * * 1'  # Monday mornings
```

**Option 2 (Aggressive):** Remove schedule, use only on-demand
```yaml
on:
  workflow_dispatch:
  # Remove schedule entirely
```

Choose Option 2 if you're comfortable manually triggering triage or using `@gemini-cli /triage` in issue comments.

## Related

- Part of: Gemini workflow optimization
- See: `tasks/cicd-improvements/08-choose-one-ai-system.md`
