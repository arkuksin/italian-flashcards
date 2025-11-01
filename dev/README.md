# Dev Docs Workflow

This directory contains task-specific documentation for active and completed development work.

## Directory Structure

```
dev/
├── active/          # Current tasks and features in development
│   └── [task-name]/
│       ├── plan.md      # Approved implementation plan
│       ├── context.md   # Key files, decisions, next steps
│       └── tasks.md     # Checklist of work items
└── archive/         # Completed tasks (for reference)
    └── [task-name]/
        ├── plan.md
        ├── context.md
        └── tasks.md
```

## Purpose

The dev docs workflow prevents "losing the plot" during complex feature development by:

1. **Documenting Plans** - Capturing approved implementation plans
2. **Tracking Context** - Recording key files, decisions, and context
3. **Managing Tasks** - Maintaining a checklist of work items
4. **Preserving History** - Archiving completed work for future reference

## How to Use

### Starting a New Task

1. Use planning mode to create an implementation plan
2. Run `/create-dev-docs` command to generate the three files
3. Work through tasks incrementally
4. Update context and tasks regularly

### During Implementation

- Mark tasks as completed immediately in `tasks.md`
- Add important context to `context.md` as you discover it
- Note key files and decisions in `context.md`
- Update "Last Updated" timestamps

### Before Session End

- Run `/update-dev-docs` to capture current state
- Mark completed tasks
- Note next steps in `context.md`
- This allows easy continuation in next session

### After Completion

1. Move task directory from `active/` to `archive/`
2. Keep as reference for similar future work
3. Archive provides knowledge base of past decisions

## Documentation

See [docs/dev/WORKFLOW.md](../docs/dev/WORKFLOW.md) for detailed workflow documentation.

## Example Task Structure

```
dev/active/progress-tracking/
├── plan.md
│   # Implementation plan with phases, tasks, success metrics
├── context.md
│   # Key files: useProgress.tsx, Dashboard.tsx
│   # Decisions: Using Leitner system, storing in user_progress table
│   # Next steps: Implement mastery level UI indicators
├── tasks.md
│   # [x] Create user_progress database table
│   # [x] Implement useProgress hook
│   # [ ] Add mastery level UI indicators
│   # [ ] Write E2E tests for progress tracking
```

---

**Created**: 2025-10-30
**Purpose**: Prevent context loss during complex feature development
**Based on**: [Reddit article best practices](../docs/CLAUDE_CODE_IMPROVEMENTS.md)
