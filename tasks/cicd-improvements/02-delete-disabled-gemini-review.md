# Task: Delete Disabled Gemini Review Workflow

**Priority:** 🔴 High (Immediate)
**Effort:** 5 minutes
**Type:** Cleanup

## Problem

The `gemini-review.yml` workflow is explicitly disabled with `if: ${{ false }}` on line 22 and never executes. It contains 281 lines of complex PR review logic that appears functional but is completely inactive.

## Current State

```yaml
# .github/workflows/gemini-review.yml:22
if: ${{ false }}
```

The workflow has extensive MCP server configuration, Docker integration, and review criteria—all unused.

## Solution

Delete the file entirely. Git history preserves it if you ever need to restore it.

```bash
git rm .github/workflows/gemini-review.yml
git commit -m "chore: remove disabled Gemini review workflow"
```

## Acceptance Criteria

- [x] File `.github/workflows/gemini-review.yml` no longer exists
- [x] Commit message explains the removal
- [x] No references to this workflow remain in `gemini-dispatch.yml`

## Benefits

- Removes 281 lines of misleading code
- Eliminates confusion about which AI does PR reviews
- Reduces complexity in the Gemini workflow ecosystem

## Related

- See: `tasks/cicd-improvements/01-delete-disabled-claude-review.md`
- Part of: Dual AI system cleanup (task 08)
