# Leitner System Implementation Guide

## Overview

This directory contains comprehensive implementation guides for adding a complete Leitner spaced repetition system to the Italian Flashcards application.

The Leitner system is a proven method for optimizing vocabulary retention using spaced repetition. Instead of reviewing all words equally, it focuses learning time on difficult words while reviewing mastered words less frequently.

---

## 📋 Implementation Phases

### [Phase 1: Review Dashboard & Statistics](./phase-1-review-dashboard.md)
**Priority**: HIGH (Must Have) | **Time**: 4-6 hours

Build the foundational components:
- Daily due cards dashboard
- Due words breakdown by mastery level
- Enhanced statistics with mastery distribution
- Review history tracking

**Key Deliverables:**
- `ReviewDashboard.tsx` component
- Enhanced `Statistics.tsx` component
- Integration with Dashboard page

---

### [Phase 2: Review Session Types](./phase-2-review-session-types.md)
**Priority**: HIGH (Must Have) | **Time**: 3-4 hours

Implement multiple review modes:
- **Smart Review**: Only due cards (Leitner-optimized)
- **Practice All**: All 300 cards
- **Category Focus**: Due cards by category

**Key Deliverables:**
- Review mode selector in `ModeSelection.tsx`
- Due words filtering logic in `Dashboard.tsx`
- Badge components showing due counts
- Session type tracking in database

---

### [Phase 3: Enhanced User Feedback](./phase-3-enhanced-feedback.md)
**Priority**: MEDIUM (Should Have) | **Time**: 2-3 hours

Add motivational feedback and clarity:
- Next review date indicator on flashcards
- Visual timeline of Leitner intervals
- Level-up celebration animations
- Enhanced progress bar with daily goals

**Key Deliverables:**
- `NextReviewIndicator.tsx` component
- `LevelUpCelebration.tsx` component
- Enhanced `ProgressBar.tsx` component
- Celebration animations and sound effects (optional)

---

### [Phase 4: User Preferences](./phase-4-user-preferences.md)
**Priority**: LOW (Nice to Have) | **Time**: 1-2 hours

Allow user customization:
- Default review mode selection
- Show/hide next review dates
- Enable/disable celebrations
- Daily goal configuration
- Sound effects toggle

**Key Deliverables:**
- Database migration for new preference fields
- `Settings.tsx` page/component
- `PreferencesContext` provider
- Integration with existing components

---

### [Phase 5: Database & Backend](./phase-5-database-backend.md)
**Priority**: MEDIUM (Should Have) | **Time**: 1-2 hours

Optimize database and backend:
- Performance indexes for queries
- PostgreSQL functions for calculations
- Computed columns (optional)
- Analytics tracking
- Caching strategy

**Key Deliverables:**
- Database migrations for indexes
- PostgreSQL functions (get_due_words_count, etc.)
- Enhanced `useProgress` hook
- Performance optimizations

---

### [Phase 6: Testing & Documentation](./phase-6-testing-documentation.md)
**Priority**: HIGH (Must Have) | **Time**: 2-3 hours

Ensure quality and maintainability:
- Comprehensive E2E tests
- Updated documentation
- User guide
- Architecture documentation
- Testing documentation

**Key Deliverables:**
- `e2e/leitner-system.spec.ts` test suite
- Updated `README.md`
- New `LEITNER_SYSTEM.md` guide
- Updated architecture and testing docs
- User guide

---

## 🎯 Quick Start

### Recommended Implementation Order

1. **Start with Phase 1** (Foundation)
   - Get due words displaying on dashboard
   - Verify existing spaced repetition logic works

2. **Then Phase 2** (Core Functionality)
   - Activate the Leitner system with Smart Review
   - This is the main value proposition

3. **Add Phase 6** (Quality Assurance)
   - Write tests early to catch issues
   - Update docs as you go

4. **Then Phase 3** (Polish)
   - Add user feedback and motivation features
   - Make the experience delightful

5. **Finally Phase 4 & 5** (Optimization)
   - Add customization options
   - Optimize performance

---

## 📊 Implementation Timeline

| Phase | Priority | Time | Dependencies |
|-------|----------|------|--------------|
| Phase 1 | HIGH | 4-6h | None |
| Phase 2 | HIGH | 3-4h | Phase 1 |
| Phase 3 | MEDIUM | 2-3h | Phase 1, 2 |
| Phase 4 | LOW | 1-2h | Phase 1-3 |
| Phase 5 | MEDIUM | 1-2h | Phase 1-4 |
| Phase 6 | HIGH | 2-3h | Phase 1-5 |
| **Total** | | **14-20h** | |

---

## ✅ Success Criteria

### The Leitner system is complete when:

1. ✅ Users see how many cards are due when opening the app
2. ✅ Smart Review shows only due cards (default mode)
3. ✅ Mastery levels progress correctly based on accuracy
4. ✅ Users know when they'll see each card next
5. ✅ Level-up celebrations motivate continued learning
6. ✅ Progress is tracked and visualized clearly
7. ✅ Users can customize their experience
8. ✅ Database queries are fast (<100ms)
9. ✅ All features have E2E test coverage
10. ✅ Documentation is complete and accurate

---

## 🔧 Technical Architecture

### Current State (Already Implemented)

The app already has:
- ✅ Mastery levels (0-5) in `user_progress` table
- ✅ Spaced repetition intervals defined
- ✅ `calculateMasteryLevel()` function
- ✅ `getDueWords()` function
- ✅ Progress tracking in Supabase

### What's Missing (To Be Implemented)

The system needs:
- ❌ UI to show due words dashboard
- ❌ Smart Review mode (filter by due words)
- ❌ Next review date display
- ❌ Level-up celebrations
- ❌ User preferences for Leitner features
- ❌ Database optimization
- ❌ Comprehensive tests

---

## 📁 File Structure

After implementation, new files will be:

```
src/
├── components/
│   ├── ReviewDashboard.tsx          # Phase 1
│   ├── NextReviewIndicator.tsx      # Phase 3
│   ├── LevelUpCelebration.tsx       # Phase 3
│   └── ui/
│       └── Badge.tsx                # Phase 2
├── pages/
│   └── Settings.tsx                 # Phase 4
├── hooks/
│   └── usePreferences.tsx           # Phase 4
└── styles/
    ├── celebrations.css             # Phase 3
    └── settings.css                 # Phase 4

supabase/migrations/
├── YYYYMMDD_add_review_mode_tracking.sql    # Phase 2
├── YYYYMMDD_add_leitner_preferences.sql     # Phase 4
├── YYYYMMDD_optimize_leitner_indexes.sql    # Phase 5
└── YYYYMMDD_add_leitner_functions.sql       # Phase 5

e2e/
├── leitner-system.spec.ts           # Phase 6
└── helpers/
    └── leitner-helpers.ts           # Phase 6

docs/
├── LEITNER_SYSTEM.md                # Phase 6
├── USER_GUIDE.md                    # Phase 6
└── implementation/
    └── leitner-system/
        ├── README.md                # This file
        ├── phase-1-review-dashboard.md
        ├── phase-2-review-session-types.md
        ├── phase-3-enhanced-feedback.md
        ├── phase-4-user-preferences.md
        ├── phase-5-database-backend.md
        └── phase-6-testing-documentation.md
```

---

## 🚀 Getting Started

### 1. Read This Overview

Understand the full scope and plan.

### 2. Choose Your Approach

**Option A: Complete Implementation (Recommended)**
- Follow all 6 phases in order
- Get full Leitner system with all features
- ~14-20 hours of work

**Option B: MVP Implementation**
- Phase 1 (Dashboard)
- Phase 2 (Smart Review)
- Phase 6 (Tests & Docs)
- ~9-13 hours for basic Leitner functionality

**Option C: Custom Implementation**
- Pick and choose phases based on needs
- Maintain dependencies (Phase 1 before Phase 2, etc.)

### 3. Start Implementation

Open [Phase 1 Guide](./phase-1-review-dashboard.md) and begin!

---

## 📚 Additional Resources

### Understanding the Leitner System

- [Wikipedia: Leitner System](https://en.wikipedia.org/wiki/Leitner_system)
- Spaced repetition research
- Learning science principles

### Project Documentation

- [Main README](../../../README.md)
- [Architecture Docs](../../dev/ARCHITECTURE.md)
- [Database Docs](../../dev/DATABASE.md)
- [Testing Guide](../../dev/TESTING.md)

### Existing Implementation

- `src/utils/spacedRepetition.ts` - Core spaced repetition logic
- `supabase/schema.sql` - Database schema
- `src/hooks/useProgress.tsx` - Progress tracking hook

---

## 🤝 Contributing

When implementing:

1. **Follow the guides** - They include best practices and gotchas
2. **Test as you go** - Don't wait until Phase 6
3. **Update docs** - Keep documentation in sync with code
4. **Ask questions** - If something is unclear, clarify first
5. **Commit frequently** - Small, focused commits

---

## 🎉 Let's Build It!

Ready to give your users a powerful, scientifically-backed learning tool?

**Start here: [Phase 1: Review Dashboard & Statistics](./phase-1-review-dashboard.md)**

---

*Last Updated: November 2025*
*Created for: Italian Flashcards Application*
*Version: 1.0*
