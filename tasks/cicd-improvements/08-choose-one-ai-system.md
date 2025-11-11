# Task: Choose ONE AI System (Claude OR Gemini)

**Priority:** 🔴 Critical (Long-term)
**Effort:** 2-3 hours
**Type:** Architecture Decision
**Status:** ✅ Completed on 2025-11-11 (Claude retained, Gemini removed)

## Decision Summary (2025-11-11)

- Standardized on **Claude** as the single AI integration.
- Deleted all Gemini GitHub Actions workflows: `.github/workflows/gemini-dispatch.yml`, `gemini-triage.yml`, `gemini-invoke.yml`, and `gemini-scheduled-triage.yml`.
- Removed `GEMINI.md` to avoid confusing contributors about the supported system.
- Updated CI/CD documentation (task index, task 05, task 10) to reflect the Claude-only model and to note that the Gemini triage task is obsolete.
- Preserved Claude workflows (`claude.yml`, `claude-code-review.yml`) for on-demand assistance.

## Follow-up Actions

1. **Clean up GitHub secrets**: remove `GEMINI_API_KEY`, `GOOGLE_API_KEY`, and any workflow-specific Gemini secrets from the repository settings (requires repo-admin access; could not run `gh secret remove` from the sandbox because approvals are disabled).
2. **Communicate the change**: notify contributors that only `@claude` automation remains; remove instructions that reference `@gemini-cli` commands in any external docs or playbooks.
3. **Monitor Claude workflows**: run a smoke invocation (e.g., mention `@claude`) to ensure no references to deleted Gemini configuration remain in dependent scripts. `claude.yml` does not expose `workflow_dispatch`, so testing must happen via an issue/PR comment rather than `gh workflow run`.

---

## Problem

The project maintains **TWO separate AI automation systems** that perform overlapping functions:

### Claude System (2 workflows)
- `claude.yml` - responds to `@claude` mentions
- `claude-code-review.yml` - automated PR reviews (DISABLED)

### Gemini System (4 workflows)
- `gemini-dispatch.yml` - orchestrator
- `gemini-triage.yml` - issue labeling
- `gemini-review.yml` - PR reviews (DISABLED)
- `gemini-invoke.yml` - general tasks
- `gemini-scheduled-triage.yml` - hourly triage

**Duplication:** Both systems can do PR reviews and issue triage, but neither is fully utilized.

## Impact

- **Maintenance burden:** Two systems to configure, debug, and update
- **Secret sprawl:** Separate API keys, tokens, and configs
- **Cognitive load:** Contributors don't know which AI to invoke
- **Wasted execution time:** Gemini scheduled triage runs hourly (~70% of CI runtime)
- **Code volume:** ~1,400 lines of YAML for AI automation alone

## Decision Framework

### Option A: Keep Claude, Remove Gemini

**Pros:**
- Simpler system (1 workflow vs. 4)
- Claude Code action is officially supported
- Already integrated (`@claude` mentions work)
- Less configuration complexity

**Cons:**
- Lose scheduled triage capability
- Lose MCP server integrations
- Less flexible tool ecosystem

**Remove:**
- `gemini-dispatch.yml`
- `gemini-triage.yml`
- `gemini-review.yml`
- `gemini-invoke.yml`
- `gemini-scheduled-triage.yml`

**Savings:** ~1,200 lines of YAML, 5 workflows

---

### Option B: Keep Gemini, Remove Claude

**Pros:**
- More powerful (MCP servers, GitHub integration)
- Scheduled automation (triage, reviews)
- Richer tool ecosystem
- Plan-approve-execute workflow

**Cons:**
- More complex (4 workflows + orchestration)
- Requires GCP/Vertex AI setup
- Higher maintenance overhead

**Remove:**
- `claude.yml`
- `claude-code-review.yml`

**Savings:** ~200 lines of YAML, 2 workflows

---

### Option C: Hybrid Approach (NOT RECOMMENDED)

Keep both but with clear separation:
- Claude: On-demand code assistance
- Gemini: Automated triage/reviews

**Why avoid this:** Complexity remains high, no real benefit over choosing one.

## Recommended Approach

### Choose Claude (Option A) if:
- You prefer simplicity
- On-demand assistance is more valuable than automation
- You want official Anthropic support

### Choose Gemini (Option B) if:
- You need scheduled automation (triage, reviews)
- MCP server integrations are valuable
- You have GCP infrastructure

## Implementation Plan

### If choosing Claude (Option A):

```bash
# 1. Remove Gemini workflows
git rm .github/workflows/gemini-*.yml

# 2. Clean up secrets
gh secret remove GEMINI_API_KEY
gh secret remove GOOGLE_API_KEY
# ... (other Gemini-related secrets)

# 3. Update documentation
# Remove Gemini references from CLAUDE.md

# 4. Add missing features to Claude
# Consider adding scheduled tasks if needed

# 5. Commit
git commit -m "refactor: consolidate to Claude AI system, remove Gemini"
```

### If choosing Gemini (Option B):

```bash
# 1. Remove Claude workflows
git rm .github/workflows/claude*.yml

# 2. Clean up secrets
gh secret remove CLAUDE_CODE_OAUTH_TOKEN

# 3. Update documentation
# Change @claude to @gemini-cli in docs

# 4. Optimize Gemini workflows
# Fix scheduled triage frequency (see task 05)

# 5. Commit
git commit -m "refactor: consolidate to Gemini AI system, remove Claude"
```

## Acceptance Criteria

- [x] Decision documented – Option A (Claude) recorded in this task on 2025-11-11.
- [x] Unused workflows deleted – removed all `.github/workflows/gemini-*.yml` files.
- [ ] Unused secrets removed – run `gh secret remove GEMINI_API_KEY`, `gh secret remove GOOGLE_API_KEY`, etc. (requires repo admin permissions).
- [x] Documentation updated – CI/CD task README and related docs now describe the Claude-only setup; `GEMINI.md` deleted.
- [ ] Team informed of which AI to use – announce via Slack/issue for transparency.
- [ ] Remaining system tested and working – trigger `claude.yml` manually to confirm no hidden dependencies on Gemini remain.

## Benefits

- **50% reduction in AI workflows** (6 → 1-2 workflows)
- **~1,000 lines of YAML removed**
- **Simpler mental model** - one AI, one invocation pattern
- **Easier maintenance** - one system to update
- **Lower costs** - fewer API calls, runner minutes

## Migration Checklist

After choosing, verify:
- [x] All mentions of removed AI in docs are updated (Task README, Task 05, Task 10, this file)
- [ ] Secrets for removed AI are deleted
- [ ] Team knows which AI to invoke
- [ ] Remaining workflows tested
- [x] Related tasks updated (Task 05 marked obsolete, dependencies clarified)

## Timeline

- **Week 1:** Make decision, document reasoning
- **Week 2:** Remove unused workflows, clean secrets
- **Week 3:** Update docs, communicate to team
- **Week 4:** Verify everything works, close related tasks

## Related

- Completes: `tasks/cicd-improvements/01-delete-disabled-claude-review.md`
- Completes: `tasks/cicd-improvements/02-delete-disabled-gemini-review.md`
- Affects: `tasks/cicd-improvements/05-reduce-scheduled-triage-frequency.md`
