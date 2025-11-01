# Dev Docs Workflow Guide

Comprehensive guide for using the dev docs workflow system to prevent "losing the plot" during complex feature development.

## Table of Contents

- [Overview](#overview)
- [The Problem](#the-problem)
- [The Solution](#the-solution)
- [Directory Structure](#directory-structure)
- [The Three Files](#the-three-files)
- [Workflow Steps](#workflow-steps)
- [Custom Commands](#custom-commands)
- [Best Practices](#best-practices)
- [Examples](#examples)

## Overview

The dev docs workflow is a systematic approach to managing complex feature development. It prevents context loss and helps maintain focus during long implementation sessions.

### Key Benefits

✅ **Prevent Context Loss** - Never lose track of what you're doing
✅ **Survive Compaction** - Resume work seamlessly after context reset
✅ **Document Decisions** - Record why choices were made
✅ **Track Progress** - Clear checklist of completed and pending tasks
✅ **Knowledge Base** - Archive creates reference for future work

### When to Use

Use dev docs workflow for:
- ✅ Large features requiring multiple days of work
- ✅ Complex implementations with many moving parts
- ✅ Features touching multiple files/systems
- ✅ Work that requires significant planning
- ✅ Tasks where you might lose context

Skip dev docs for:
- ❌ Small bug fixes
- ❌ Simple one-file changes
- ❌ Trivial updates
- ❌ Documentation-only changes

## The Problem

**From the Reddit Article**:
> "Claude is like an extremely confident junior dev with extreme amnesia, losing track of what they're doing easily."

**Common Issues Without Dev Docs**:
- 😵 Start implementing feature A, get distracted, end up implementing feature B
- 🔄 Context compaction happens, lose track of progress
- ❓ Can't remember what was decided in planning 30 minutes ago
- 📝 Important context scattered across many chat messages
- 🔀 Switch between multiple approaches, forget which was chosen

## The Solution

**Three Files Per Task**:
1. `plan.md` - The approved implementation plan (what to build)
2. `context.md` - Key files, decisions, next steps (how to build it)
3. `tasks.md` - Checklist of work items (progress tracking)

**Benefits**:
- 📍 Always know where you are in the implementation
- 🎯 Focus on one task at a time
- 📚 Quick reference for key files and decisions
- ⏩ Easy to continue after breaks or compaction
- 🔍 Clear audit trail of what was done

## Directory Structure

```
/dev/
├── active/                    # Current work
│   ├── auth-improvements/
│   │   ├── plan.md
│   │   ├── context.md
│   │   └── tasks.md
│   └── progress-dashboard/
│       ├── plan.md
│       ├── context.md
│       └── tasks.md
└── archive/                   # Completed work
    └── google-oauth/
        ├── plan.md
        ├── context.md
        └── tasks.md
```

## The Three Files

### 1. plan.md

**Purpose**: The approved implementation plan

**Contains**:
- Executive summary of the feature
- Implementation phases
- Detailed task breakdown
- Success criteria
- Risks and considerations
- Timeline estimates

**When to Create**: After planning mode, once plan is approved

**Example Structure**:
```markdown
# Feature: Progress Dashboard

## Executive Summary
Create a visual dashboard showing user progress with statistics and charts.

## Implementation Phases

### Phase 1: Data Layer
- Create `getProgressStats()` function
- Add aggregation queries
- Handle edge cases

### Phase 2: UI Components
- Create `ProgressDashboard` component
- Add chart visualization
- Style with Tailwind

### Phase 3: Integration
- Connect to Dashboard page
- Add navigation
- Write E2E tests

## Success Criteria
- [ ] Shows accurate statistics
- [ ] Updates in real-time
- [ ] Responsive design
- [ ] Accessible (WCAG 2.1 AA)
```

### 2. context.md

**Purpose**: Living document of key information and decisions

**Contains**:
- Key files being modified
- Important decisions made during implementation
- Technical notes and discoveries
- Next steps and blockers
- Last updated timestamp

**When to Update**: Continuously during implementation

**Example Structure**:
```markdown
# Progress Dashboard - Context

**Last Updated**: 2025-10-30 14:30

## Key Files

**Components**:
- `src/components/ProgressDashboard.tsx` - Main dashboard component
- `src/components/StatisticsCard.tsx` - Individual stat cards

**Hooks**:
- `src/hooks/useProgressStats.ts` - Data fetching and calculation

**Database**:
- `user_progress` table - Source of progress data
- `learning_sessions` table - Session statistics

## Key Decisions

**2025-10-30 14:00** - Chart Library Selection
- Chose Recharts over Chart.js
- Reason: Better TypeScript support, smaller bundle
- Trade-off: Fewer chart types, acceptable for our needs

**2025-10-30 12:30** - Data Aggregation Strategy
- Aggregate on client-side, not database
- Reason: Simpler queries, more flexible
- Trade-off: Slight performance impact for users with 1000+ words

## Next Steps

1. Implement chart tooltips (in progress)
2. Add export to CSV functionality
3. Write E2E tests for dashboard

## Blockers

None currently.

## Notes

- Remember to handle case where user has no progress yet
- Chart re-renders on every progress update (might need optimization)
```

### 3. tasks.md

**Purpose**: Checklist of work items

**Contains**:
- Granular list of tasks
- Completion status ([ ] or [x])
- Sub-tasks for complex items
- Priority indicators (optional)

**When to Update**: Mark tasks complete immediately after finishing

**Example Structure**:
```markdown
# Progress Dashboard - Tasks

**Created**: 2025-10-30
**Last Updated**: 2025-10-30 14:30

## Phase 1: Data Layer
- [x] Create `useProgressStats` hook
- [x] Add `getProgressStats()` function
- [x] Handle users with no progress
- [x] Write unit tests for calculations

## Phase 2: UI Components
- [x] Create `ProgressDashboard` component
- [x] Create `StatisticsCard` component
- [x] Implement chart with Recharts
- [ ] Add chart tooltips
- [ ] Add loading states
- [ ] Add error states

## Phase 3: Integration
- [ ] Connect to Dashboard page
- [ ] Add navigation link
- [ ] Style with dark mode support
- [ ] Write E2E tests
- [ ] Update documentation

## Optional Enhancements
- [ ] Export to CSV
- [ ] Date range filters
- [ ] Comparison with global averages
```

## Workflow Steps

### Step 1: Planning Mode

Start with planning mode for complex features:

```
You: "I want to add a progress dashboard with charts showing user statistics"

Claude: [Enters planning mode, researches codebase, creates comprehensive plan]

Claude: [Presents plan for approval]

You: "Looks good, proceed"
```

### Step 2: Create Dev Docs

**Use the command**: `/create-dev-docs`

```
You: "/create-dev-docs progress-dashboard"

Claude:
- Creates `/dev/active/progress-dashboard/` directory
- Generates `plan.md` from approved plan
- Creates initial `context.md` with discovered context
- Creates `tasks.md` with checklist from plan
```

**Alternatively, manually create**:
```bash
mkdir -p dev/active/progress-dashboard
# Create the three files manually
```

### Step 3: Implement Incrementally

Work through tasks one by one:

```
You: "Let's start with Phase 1, task 1: Create useProgressStats hook"

Claude: [Implements the hook]

Claude: [Marks task as complete in tasks.md]

You: "Good, now task 2"

Claude: [Continues with next task]
```

**Best Practice**: Work on 1-3 related tasks at a time, then review before continuing.

### Step 4: Update Context Regularly

As you implement:

```
You: "I've decided to use Recharts instead of Chart.js. Can you document this decision?"

Claude: [Updates context.md with decision and rationale]
```

**Update context when**:
- Making important technical decisions
- Discovering key files or dependencies
- Encountering blockers
- Finding edge cases
- Learning something non-obvious

### Step 5: Before Session End

**Use the command**: `/update-dev-docs`

```
You: "/update-dev-docs progress-dashboard"

Claude:
- Reviews current implementation state
- Marks completed tasks in tasks.md
- Updates context.md with current status
- Notes next steps clearly
- Updates "Last Updated" timestamps
```

This allows easy continuation in the next session.

### Step 6: Continue in New Session

Start fresh session after compaction or break:

```
You: "Continue working on the progress dashboard"

Claude:
- Reads /dev/active/progress-dashboard/plan.md
- Reads /dev/active/progress-dashboard/context.md
- Reads /dev/active/progress-dashboard/tasks.md
- Knows exactly where to continue
```

**No context loss!** Claude can pick up right where you left off.

### Step 7: Archive on Completion

When task is fully complete:

```bash
mv dev/active/progress-dashboard dev/archive/
```

Keep as reference for similar future work.

## Custom Commands

### /create-dev-docs

**Purpose**: Generate dev docs files after plan approval

**Usage**:
```
/create-dev-docs [task-name]
```

**What It Does**:
1. Creates `/dev/active/[task-name]/` directory
2. Generates `plan.md` from approved plan
3. Creates `context.md` with initial context
4. Creates `tasks.md` with checklist

**Example**:
```
You: [Approve plan for "user-notifications" feature]
You: "/create-dev-docs user-notifications"

Claude: Creates dev/active/user-notifications/ with three files
```

### /update-dev-docs

**Purpose**: Update dev docs before session end or compaction

**Usage**:
```
/update-dev-docs [task-name]
```

**What It Does**:
1. Reviews current implementation state
2. Marks completed tasks
3. Updates context with new information
4. Notes next steps
5. Updates timestamps

**Example**:
```
You: "I'm at 15% context, let's save progress"
You: "/update-dev-docs user-notifications"

Claude:
- Marks tasks 1-5 as complete
- Notes decision to use WebSockets
- Records next step: implement notification UI
- Updates timestamps
```

## Best Practices

### DO ✅

**Planning**:
- ✅ Always start with planning mode
- ✅ Review plan thoroughly before approving
- ✅ Create dev docs immediately after plan approval
- ✅ Break large features into phases

**During Implementation**:
- ✅ Work on 1-3 related tasks at a time
- ✅ Mark tasks complete immediately
- ✅ Update context.md when making decisions
- ✅ Note key files in context.md
- ✅ Run `/update-dev-docs` before low context

**Task Management**:
- ✅ Keep tasks granular (1-2 hours each)
- ✅ Use sub-tasks for complex items
- ✅ Add new tasks as you discover work
- ✅ Remove obsolete tasks

### DON'T ❌

**Planning**:
- ❌ Skip planning for complex features
- ❌ Approve vague or incomplete plans
- ❌ Start implementing before creating dev docs

**During Implementation**:
- ❌ Jump between multiple unrelated tasks
- ❌ Forget to update tasks.md
- ❌ Let context.md get stale
- ❌ Ignore important decisions

**Task Management**:
- ❌ Create tasks too large (> 4 hours)
- ❌ Leave completed tasks unmarked
- ❌ Batch task updates at the end

## Examples

### Example 1: Multi-Day Feature

**Scenario**: Implementing OAuth integration (3-day task)

**Day 1**:
```
1. Planning mode → approve plan
2. /create-dev-docs oauth-integration
3. Implement Phase 1 (Supabase config)
4. Mark completed tasks in tasks.md
5. /update-dev-docs oauth-integration
6. End of day
```

**Day 2**:
```
1. Read dev/active/oauth-integration files
2. Continue with Phase 2 (UI components)
3. Document decision to use redirect flow
4. Update context.md with decision
5. /update-dev-docs oauth-integration
6. End of day
```

**Day 3**:
```
1. Read dev/active/oauth-integration files
2. Complete Phase 3 (testing)
3. Mark all tasks complete
4. mv dev/active/oauth-integration dev/archive/
5. Feature complete!
```

### Example 2: Context Compaction Recovery

**Scenario**: Context hits 10%, need to compact

**Before Compaction**:
```
You: "We're at 10% context, let's save progress"
You: "/update-dev-docs database-migration"

Claude:
- Updates tasks.md (5 tasks complete, 3 remaining)
- Updates context.md (notes we chose approach B over A)
- Records next step: "Implement rollback mechanism"
```

**After Compaction** (new conversation):
```
You: "Continue working on database migration"

Claude:
- Reads plan.md (understands the feature)
- Reads context.md (knows approach B was chosen)
- Reads tasks.md (sees 3 tasks remain)
- Continues with rollback mechanism

No context loss!
```

### Example 3: Decision Documentation

**Scenario**: Making technical choice between two approaches

```
You: "Should we use WebSockets or polling for notifications?"

Claude: [Analyzes trade-offs, recommends WebSockets]

You: "Let's go with WebSockets. Document this decision."

Claude: [Updates context.md]

---
## Key Decisions

**2025-10-30 15:00** - Real-time Notification Method
- Chose WebSockets over polling
- Reason: Lower latency, better user experience
- Trade-off: More complex server infrastructure
- Implementation: Using socket.io library
---
```

## Integration with Planning Mode

**Recommended Workflow**:

1. **Planning Mode** → Create comprehensive plan
2. **Exit Planning** → Review and approve plan
3. **Create Dev Docs** → `/create-dev-docs [task-name]`
4. **Implement** → Work through tasks incrementally
5. **Update Docs** → `/update-dev-docs [task-name]` regularly
6. **Complete** → Archive when finished

**Why This Works**:
- Planning mode gets all the context needed
- Dev docs preserve that context across sessions
- Incremental implementation maintains focus
- Regular updates prevent context loss

## Troubleshooting

### "Claude forgot what we were doing"

**Solution**: Did you create dev docs?
```
- Read /dev/active/[task-name]/context.md
- Review last updated timestamp
- Check tasks.md for progress
```

### "Tasks.md is out of sync with reality"

**Solution**: Update it now!
```
- Mark actually completed tasks as [x]
- Add newly discovered tasks
- Remove obsolete tasks
- Run /update-dev-docs to refresh
```

### "Context.md has too much information"

**Solution**: Keep it focused
```
- Only key files (not every file touched)
- Only important decisions (not minor choices)
- Only current next steps (not entire backlog)
```

### "Lost track of which task is current"

**Solution**: Look at tasks.md
```
- Last unchecked [ ] task is current
- Use context.md "Next Steps" as guide
```

## Related Documentation

- **[Architecture Guide](./ARCHITECTURE.md)** - Component structure
- **[Testing Guide](./TESTING.md)** - Testing strategies
- **[Code Standards](./CODE_STANDARDS.md)** - Coding conventions
- **[Claude Code Improvements](../CLAUDE_CODE_IMPROVEMENTS.md)** - Implementation plan

## Additional Resources

- **[Reddit Article](https://www.reddit.com/r/ClaudeCode/comments/1oivs81/claude_code_is_a_beast_tips_from_6_months_of/)** - Original inspiration
- **Dev Docs Directory**: `/dev/` - Your active and archived tasks

---

**Last Updated**: 2025-10-30
**Maintainer**: Development team with Claude Code assistance
**Status**: Active workflow system
