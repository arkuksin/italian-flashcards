# Phase 1: Review Dashboard & Statistics

**Priority**: HIGH (Must Have)
**Estimated Time**: 4-6 hours
**Dependencies**: None

## Overview

Create the foundational components for the Leitner system by building a comprehensive review dashboard that shows users their daily due cards and learning statistics.

---

## Task 1: Analyze Existing Spaced Repetition Utilities

### Objective
Verify and understand the existing `getDueWords()` function and spaced repetition logic.

### Implementation Steps

1. **Read and analyze** `src/utils/spacedRepetition.ts`:
   - Review the `getDueWords()` function implementation
   - Verify interval calculations (1, 3, 7, 14, 30, 90 days)
   - Check mastery level calculation logic
   - Understand `getNextReviewDate()` function

2. **Test edge cases**:
   - New user with no progress (all words should be due)
   - User with all words mastered (no words due)
   - Words at each mastery level (0-5)
   - Timezone handling for due date calculations

3. **Document findings**:
   - Note any bugs or improvements needed
   - Verify the function signatures match current usage
   - Check if performance optimization is needed (300 words should be fast)

### Expected Output
- Understanding of current spaced repetition implementation
- List of any bugs or edge cases to fix
- Confidence that `getDueWords()` works correctly

---

## Task 2: Create ReviewDashboard Component

### Objective
Build a new component that displays daily review statistics and motivates users to review due cards.

### File to Create
`src/components/ReviewDashboard.tsx`

### Component Requirements

#### Visual Design
- Clean, card-based layout
- Prominent display of due cards count
- Color-coded mastery level breakdown
- Motivational messaging

#### Data to Display

1. **Hero Section**:
   - Total due words count (large, eye-catching)
   - Motivational text:
     - If due > 0: "Time to review!"
     - If due = 0: "All caught up! 🎉"
   - Quick action button: "Start Review"

2. **Due Words Breakdown**:
   ```
   📝 New Words (Level 0): X cards
   📚 Learning (Level 1-2): X cards
   ✅ Reviewing (Level 3-5): X cards
   ```

3. **Estimated Time**:
   - Calculate based on ~12 seconds per card
   - Display: "~5 minutes for 25 cards"

4. **Streak Information**:
   - Days in a row with reviews completed
   - Visual streak counter (🔥 5 day streak!)

5. **Preview Section**:
   - "5 more words due tomorrow"
   - "3 words due this week"

### Props Interface

```typescript
interface ReviewDashboardProps {
  dueWordsCount: number;
  dueWordsByLevel: {
    level0: number; // New
    level1_2: number; // Learning
    level3_5: number; // Reviewing
  };
  currentStreak: number;
  onStartReview: () => void;
}
```

### Implementation Details

1. **Use existing utilities**:
   ```typescript
   import { getDueWords, getNextReviewDate } from '../utils/spacedRepetition';
   ```

2. **Calculate breakdowns**:
   ```typescript
   const dueWords = getDueWords(allWords, progressMap);
   const newWords = dueWords.filter(w => !progressMap.has(w.id));
   const learningWords = dueWords.filter(w => {
     const progress = progressMap.get(w.id);
     return progress && progress.mastery_level >= 1 && progress.mastery_level <= 2;
   });
   // etc.
   ```

3. **Estimate time calculation**:
   ```typescript
   const SECONDS_PER_CARD = 12;
   const estimatedMinutes = Math.ceil((dueWordsCount * SECONDS_PER_CARD) / 60);
   ```

4. **Responsive design**:
   - Mobile: Stack vertically
   - Desktop: 2-column layout with stats on left, preview on right

### Styling Guidelines
- Use Tailwind CSS classes
- Match existing app color scheme
- Add subtle animations (fade in, number count up)
- Use existing UI patterns from the app

### Example Layout

```
┌─────────────────────────────────────┐
│     📚 25 Cards Due Today!          │
│         Time to review              │
│   [Start Smart Review Button]       │
├─────────────────────────────────────┤
│ Breakdown:                          │
│ 📝 New Words: 10                    │
│ 📚 Learning: 12                     │
│ ✅ Reviewing: 3                     │
│                                     │
│ ⏱️ Estimated time: ~5 minutes       │
│ 🔥 5 day streak!                    │
├─────────────────────────────────────┤
│ Coming up:                          │
│ • 5 words due tomorrow              │
│ • 8 words due this week             │
└─────────────────────────────────────┘
```

---

## Task 3: Enhance Statistics Component

### Objective
Update the existing Statistics component to show Leitner-specific metrics.

### File to Update
`src/components/Statistics.tsx`

### New Metrics to Add

1. **Due Words Progress**:
   ```
   Today's Review: 15/25 completed (60%)
   ```

2. **Mastery Distribution Chart**:
   - Visual bar chart or pie chart
   - Show count of words at each mastery level (0-5)
   - Color-coded by level

3. **Review History Calendar**:
   - Last 7 days
   - Show number of cards reviewed each day
   - Highlight today

4. **Average Daily Review Count**:
   - Calculate from `learning_sessions` table
   - Show trend (↑ improving, ↓ declining, → steady)

### Implementation Steps

1. **Add new data fetching**:
   ```typescript
   // Fetch learning sessions from last 7 days
   const { data: recentSessions } = await supabase
     .from('learning_sessions')
     .select('*')
     .gte('started_at', sevenDaysAgo)
     .order('started_at', { ascending: false });
   ```

2. **Calculate mastery distribution**:
   ```typescript
   const masteryDistribution = {
     level0: 0, level1: 0, level2: 0,
     level3: 0, level4: 0, level5: 0
   };

   progressMap.forEach(progress => {
     masteryDistribution[`level${progress.mastery_level}`]++;
   });
   ```

3. **Create mini chart component**:
   - Can use simple CSS-based bar chart
   - Or integrate chart library (recharts, chart.js)
   - Keep it lightweight

4. **Add to existing statistics display**:
   - Don't remove existing stats
   - Add new section titled "Leitner Progress"
   - Maintain consistent styling

### Example Addition

```
┌─────────────────────────────────────┐
│ 📊 Leitner Progress                 │
├─────────────────────────────────────┤
│ Mastery Distribution:               │
│ Level 0: ████░░░░░░ 45 words        │
│ Level 1: ███░░░░░░░ 32 words        │
│ Level 2: ██░░░░░░░░ 28 words        │
│ Level 3: ██░░░░░░░░ 21 words        │
│ Level 4: █░░░░░░░░░ 15 words        │
│ Level 5: █░░░░░░░░░ 9 words         │
│                                     │
│ Review Activity (Last 7 Days):      │
│ Mon Tue Wed Thu Fri Sat Sun         │
│  25  30  28   0  35  20  15         │
│                                     │
│ Average daily: 22 cards ↑           │
└─────────────────────────────────────┘
```

---

## Integration Points

### Update Dashboard.tsx

Add the ReviewDashboard component to the main Dashboard page:

```typescript
import ReviewDashboard from '../components/ReviewDashboard';

// In Dashboard component:
{!sessionStarted && (
  <>
    <ReviewDashboard
      dueWordsCount={dueWordsCount}
      dueWordsByLevel={dueWordsByLevel}
      currentStreak={currentStreak}
      onStartReview={handleStartSmartReview}
    />
    <Statistics {...existingProps} />
    <ModeSelection {...existingProps} />
  </>
)}
```

---

## Testing Checklist

- [ ] ReviewDashboard displays correct due count
- [ ] Breakdown by mastery level is accurate
- [ ] Time estimation is reasonable
- [ ] Streak counter works correctly
- [ ] "Start Review" button triggers session
- [ ] Statistics show mastery distribution
- [ ] Review history displays last 7 days
- [ ] All components are responsive (mobile + desktop)
- [ ] No console errors or warnings
- [ ] Performance is good with 300 words

---

## Acceptance Criteria

### Phase 1 is complete when:

1. ✅ User opens app and immediately sees how many cards are due
2. ✅ Due cards are broken down by difficulty (new/learning/reviewing)
3. ✅ User sees estimated time to complete review session
4. ✅ Statistics page shows mastery distribution chart
5. ✅ Review history shows activity for last 7 days
6. ✅ All components match existing app design language
7. ✅ Code is TypeScript type-safe with no errors
8. ✅ Components are tested and working on mobile and desktop

---

## Next Steps

After completing Phase 1, proceed to:
- **Phase 2**: Review Session Types (implement Smart Review, Practice All, Category Focus modes)

---

## Notes & Tips

- Keep components small and focused (single responsibility)
- Reuse existing styles and patterns from the app
- Use the existing `useProgress` hook for data access
- Consider loading states while calculating due words
- Add empty states (e.g., "No words due, great job!")
- Make sure dark mode works for all new components

---

**File Created**: `docs/implementation/leitner-system/phase-1-review-dashboard.md`
