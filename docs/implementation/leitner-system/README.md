# Leitner System Implementation Plan

## Overview

The Leitner system is a proven spaced repetition method that uses boxes (levels) to organize flashcards based on how well you know them. This document outlines the implementation plan for integrating a proper Leitner system into the Italian Flashcards application.

## Current State

The application has a **hybrid approach**:
- ✅ Database schema supports mastery levels (0-5)
- ✅ Review intervals based on mastery level
- ⚠️ Mastery level calculated by **success rate**, not traditional Leitner box movement
- ✅ Progress tracking with correct/wrong counts

**Current Logic** (`src/utils/spacedRepetition.ts:55-67`):
```typescript
// Calculates level based on overall success rate
if (successRate >= 0.9 && totalAttempts >= 5) return 5
if (successRate >= 0.8 && totalAttempts >= 4) return 4
// ... etc
```

**Problem**: This doesn't follow traditional Leitner behavior where:
- ✅ Correct answer → Move UP one level
- ❌ Wrong answer → Move DOWN (typically to level 1 or 0)

## Implementation Phases

### Phase 1: Core Leitner Box Behavior ⏳

**Goal**: Implement true Leitner box movement logic

**Changes Needed**:
1. Modify `calculateMasteryLevel` to use **incremental level changes**
2. Correct answer: `level = min(currentLevel + 1, 5)`
3. Wrong answer: `level = max(currentLevel - 2, 0)` (or reset to 1)
4. Maintain backward compatibility with existing progress data

**Files to Modify**:
- `src/utils/spacedRepetition.ts` - Update `calculateMasteryLevel()`
- `src/hooks/useProgress.tsx` - Pass current level to calculator
- `src/types/index.ts` - Add types if needed

**Success Criteria**:
- ✅ Correct answer increases level by 1 (max 5)
- ✅ Wrong answer decreases level (down to 0 or 1)
- ✅ Existing user progress data still works
- ✅ Tests pass with new behavior

---

### Phase 2: Visual Feedback and Box Representation

**Goal**: Show users which "box" their words are in

**Features**:
1. Visual representation of Leitner boxes in UI
2. Show word distribution across levels (Box 0-5)
3. Color-coded progress indicators by mastery level
4. Dashboard widget showing box statistics

**New Components**:
- `LeitnerBoxVisualizer` - Visual representation of boxes
- `MasteryLevelBadge` - Color-coded level indicator
- `BoxDistributionChart` - Bar chart of words per box

**Files to Create/Modify**:
- `src/components/LeitnerBoxVisualizer.tsx` (new)
- `src/components/MasteryLevelBadge.tsx` (new)
- `src/pages/Dashboard.tsx` - Add visualizations

---

### Phase 3: Advanced Spaced Repetition

**Goal**: Optimize review scheduling based on cognitive science

**Features**:
1. Dynamic interval adjustment based on answer speed
2. "Hard" vs "Easy" answer options (affects next interval)
3. Review history tracking (not just last_practiced)
4. Optimal review time suggestions

**Database Changes**:
```sql
-- Add review_history table
CREATE TABLE review_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  word_id INTEGER REFERENCES words(id),
  review_date TIMESTAMPTZ DEFAULT NOW(),
  correct BOOLEAN NOT NULL,
  response_time_ms INTEGER,
  difficulty_rating INTEGER CHECK (difficulty_rating IN (1,2,3,4,5)),
  previous_level INTEGER,
  new_level INTEGER
);
```

**New Features**:
- Answer difficulty buttons (Again, Hard, Good, Easy)
- Response time tracking
- Adaptive intervals based on performance history
- Review calendar showing upcoming reviews

---

### Phase 4: Statistics and Analytics

**Goal**: Provide insights into learning effectiveness

**Features**:
1. Learning velocity (words mastered per week)
2. Retention rate analysis
3. Category performance comparison
4. Time-to-mastery metrics
5. Review heatmap (calendar view)

**New Pages/Components**:
- `src/pages/Analytics.tsx` - Detailed analytics dashboard
- `src/components/LearningVelocityChart.tsx`
- `src/components/RetentionAnalysis.tsx`
- `src/components/ReviewHeatmap.tsx`

---

### Phase 5: Gamification and Motivation

**Goal**: Increase engagement through game mechanics

**Features**:
1. Daily streak tracking (with recovery options)
2. Achievement badges (milestones)
3. XP/Points system based on reviews
4. Leaderboard (optional, opt-in)
5. Daily goals with progress rings

**New Tables**:
```sql
CREATE TABLE achievements (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  achievement_type TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_type)
);

CREATE TABLE daily_goals (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  target_words_per_day INTEGER DEFAULT 20,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_practice_date DATE
);
```

---

## Technical Considerations

### Database Migration Strategy

All schema changes will use versioned migrations:
```bash
npm run create:migration "add_review_history_table"
```

### Backward Compatibility

Phase 1 changes must work with existing data:
- Users with old success-rate levels continue normally
- New level calculation applies from first new answer
- No data migration needed for Phase 1

### Performance

- Review queries optimized with proper indexes
- Client-side caching of user progress
- Lazy loading of analytics data

### Testing

Each phase requires:
- Unit tests for calculation logic
- Integration tests for database operations
- E2E tests for user flows
- Performance tests for large datasets

---

## Implementation Timeline

| Phase | Estimated Time | Priority | Dependencies |
|-------|---------------|----------|--------------|
| Phase 1 | 2-4 hours | **High** | None |
| Phase 2 | 1 day | Medium | Phase 1 |
| Phase 3 | 2-3 days | Medium | Phase 1, Phase 2 |
| Phase 4 | 2-3 days | Low | Phase 3 |
| Phase 5 | 3-5 days | Low | Phase 4 |

---

## Phase 1 Implementation Details

### Step 1: Update Type Definitions

Ensure `WordProgress` type includes all needed fields:
```typescript
interface WordProgress {
  id: string
  user_id: string
  word_id: number
  correct_count: number
  wrong_count: number
  last_practiced: string
  mastery_level: number // 0-5
}
```

### Step 2: Rewrite calculateMasteryLevel Function

**Old Approach** (success rate based):
```typescript
export const calculateMasteryLevel = (correctCount: number, wrongCount: number): number => {
  const successRate = correctCount / (correctCount + wrongCount)
  // Return level based on success rate thresholds
}
```

**New Approach** (incremental movement):
```typescript
export const calculateMasteryLevel = (
  currentLevel: number,
  correct: boolean
): number => {
  if (correct) {
    return Math.min(currentLevel + 1, 5) // Move up one level
  } else {
    return Math.max(currentLevel - 2, 0) // Move down two levels
  }
}
```

### Step 3: Update useProgress Hook

Modify `updateProgress` to pass current level:
```typescript
const currentLevel = currentProgress?.mastery_level ?? 0
const newMasteryLevel = calculateMasteryLevel(currentLevel, correct)
```

### Step 4: Add Tests

Create tests for new behavior:
```typescript
describe('Leitner System - Phase 1', () => {
  it('should increase level by 1 on correct answer', () => {
    expect(calculateMasteryLevel(2, true)).toBe(3)
  })

  it('should not exceed level 5', () => {
    expect(calculateMasteryLevel(5, true)).toBe(5)
  })

  it('should decrease level by 2 on wrong answer', () => {
    expect(calculateMasteryLevel(3, false)).toBe(1)
  })

  it('should not go below level 0', () => {
    expect(calculateMasteryLevel(0, false)).toBe(0)
  })
})
```

### Step 5: Update Documentation

Update these docs to reflect new behavior:
- `docs/dev/DATABASE.md` - Mastery level section
- `docs/dev/ARCHITECTURE.md` - Progress tracking flow
- `README.md` - Feature description

---

## FAQ

**Q: Why change from success rate to incremental levels?**
A: The traditional Leitner system is proven to be more effective for long-term retention. Incremental movement encourages consistent practice and penalizes forgetting more appropriately.

**Q: Will this break existing user progress?**
A: No. Users will continue from their current level, and the new logic applies from their next answer onward.

**Q: What if a user had level 5 with 90% success rate, then gets one wrong?**
A: Under the new system, they'll drop to level 3. This is intentional - if you forget a "mastered" word, it needs more frequent review.

**Q: Can we keep the old system as an option?**
A: Technically yes, but not recommended. The incremental system is more aligned with cognitive science research.

---

## References

- [Leitner System (Wikipedia)](https://en.wikipedia.org/wiki/Leitner_system)
- [Spaced Repetition Algorithm (SuperMemo)](https://www.supermemo.com/en/archives1990-2015/english/ol/sm2)
- [Anki Manual - Studying](https://docs.ankiweb.net/studying.html)

---

**Status**: Phase 1 ready for implementation
**Last Updated**: 2025-11-10
**Maintainer**: Development Team
