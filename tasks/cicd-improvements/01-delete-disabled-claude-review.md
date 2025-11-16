# Task: Delete Disabled Claude Code Review Workflow

**Priority:** 🔴 High (Immediate)
**Effort:** 5 minutes
**Type:** Cleanup

## Problem

The `claude-code-review.yml` workflow is explicitly disabled with `if: false` on line 15 and serves no purpose. It adds 58 lines of dead code that maintainers must read and understand, only to discover it does nothing.

## Current State

```yaml
# .github/workflows/claude-code-review.yml:15
if: false
```

The workflow exists but never runs.

## Solution

Delete the file entirely. Git history preserves it if needed later.

```bash
git rm .github/workflows/claude-code-review.yml
git commit -m "chore: remove disabled Claude code review workflow"
```

## Acceptance Criteria

- [ ] File `.github/workflows/claude-code-review.yml` no longer exists
- [ ] Commit message explains the removal
- [ ] No references to this workflow remain in documentation

## Benefits

- Reduces cognitive load for contributors
- Removes 58 lines of maintenance burden
- Clarifies which CI/CD workflows are actually active

## Related

- See: `tasks/cicd-improvements/02-delete-disabled-gemini-review.md`
- Part of: Dual AI system cleanup (task 08)
