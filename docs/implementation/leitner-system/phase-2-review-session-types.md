# Phase 2: Review Session Types

**Priority**: HIGH (Must Have)
**Estimated Time**: 3-4 hours
**Dependencies**: Phase 1 (ReviewDashboard component)

## Overview

Implement multiple review session types that allow users to choose how they want to study: Smart Review (Leitner-optimized), Practice All, or Category Focus. This activates the core Leitner system functionality.

---

## Task 4: Add Review Mode Selector

### Objective
Update the ModeSelection component to include review mode options alongside learning direction selection.

### File to Update
`src/components/ModeSelection.tsx`

### Current Behavior
Users select learning direction:
- Russian → Italian
- Italian → Russian

### New Behavior
Users select BOTH:
1. Review Mode (what cards to study)
2. Learning Direction (which side to test)

### UI Design

#### Option 1: Two-Step Selection (Recommended)
```
Step 1: Choose Review Mode
┌─────────────────────────────────────┐
│ How do you want to study today?     │
├─────────────────────────────────────┤
│ [🎯 Smart Review]        ⭐ Recommended │
│ 23 cards due for review             │
│                                     │
│ [📚 Practice All]                   │
│ All 300 cards                       │
│                                     │
│ [🏷️ Category Focus]                 │
│ Choose a specific category          │
└─────────────────────────────────────┘

Step 2: Choose Learning Direction
(existing UI)
```

#### Option 2: Combined Selection
```
┌─────────────────────────────────────┐
│ Review Mode:                        │
│ (•) Smart Review (23 due)           │
│ ( ) Practice All (300 cards)        │
│ ( ) Category Focus                  │
│                                     │
│ Learning Direction:                 │
│ (•) Russian → Italian               │
│ ( ) Italian → Russian               │
│                                     │
│ [Start Session]                     │
└─────────────────────────────────────┘
```

Choose the approach that fits better with existing UI/UX patterns.

### TypeScript Types

Add new types to `src/types/index.ts`:

```typescript
export type ReviewMode = 'smart' | 'all' | 'category';

export interface SessionConfig {
  reviewMode: ReviewMode;
  learningDirection: 'ru-it' | 'it-ru';
  categoryFilter?: string; // for category mode
}
```

### Component Updates

#### New Props for ModeSelection

```typescript
interface ModeSelectionProps {
  // Existing props
  onSelectMode: (direction: 'ru-it' | 'it-ru') => void;

  // New props
  dueWordsCount: number;
  totalWordsCount: number;
  categories: string[];
  onSelectSession: (config: SessionConfig) => void;
}
```

#### State Management

```typescript
const [selectedReviewMode, setSelectedReviewMode] = useState<ReviewMode>('smart');
const [selectedCategory, setSelectedCategory] = useState<string>('');
const [selectedDirection, setSelectedDirection] = useState<'ru-it' | 'it-ru'>('ru-it');
```

### Implementation Steps

1. **Add review mode selection UI**:
   - Three clickable cards/buttons for each mode
   - Visual indication of selected mode
   - Display relevant metadata (due count, total count)

2. **Add category dropdown** (conditional):
   - Show only when "Category Focus" is selected
   - Populate with available categories
   - Show due count per category

3. **Update "Start Session" button**:
   - Replace direct `onSelectMode()` call
   - Call new `onSelectSession()` with full config
   - Disable if no valid selection

4. **Add badges/indicators**:
   - Green badge for Smart Review: "23 due"
   - Blue badge for Practice All: "300 total"
   - Orange badge for Category: "5 due in Food"
   - Pulsing animation if many due (>30)

### Smart Review Badge Logic

```typescript
const SmartReviewBadge = ({ dueCount }: { dueCount: number }) => {
  const isUrgent = dueCount > 30;

  return (
    <div className={`badge ${isUrgent ? 'animate-pulse' : ''}`}>
      {dueCount} cards due
    </div>
  );
};
```

### Category Selector with Due Counts

```typescript
const CategorySelector = ({
  categories,
  progressMap,
  allWords,
  onSelect
}: CategorySelectorProps) => {
  const getCategoryDueCount = (category: string) => {
    const categoryWords = allWords.filter(w => w.category === category);
    const dueWords = getDueWords(categoryWords, progressMap);
    return dueWords.length;
  };

  return (
    <select onChange={(e) => onSelect(e.target.value)}>
      <option value="">Select a category...</option>
      {categories.map(cat => (
        <option key={cat} value={cat}>
          {cat} ({getCategoryDueCount(cat)} due)
        </option>
      ))}
    </select>
  );
};
```

---

## Task 5: Implement Due Words Filtering Logic

### Objective
Update the Dashboard component to filter words based on selected review mode before starting a session.

### File to Update
`src/pages/Dashboard.tsx`

### Current Flow
```
User selects direction → Load all words → Start session
```

### New Flow
```
User selects mode + direction → Filter words → Start session
```

### Implementation Steps

#### 1. Add Session Configuration State

```typescript
const [sessionConfig, setSessionConfig] = useState<SessionConfig>({
  reviewMode: 'smart',
  learningDirection: 'ru-it'
});
```

#### 2. Create Word Filtering Function

```typescript
const getWordsForSession = (config: SessionConfig): Word[] => {
  let filteredWords: Word[] = [];

  switch (config.reviewMode) {
    case 'smart':
      // Only due words
      filteredWords = getDueWords(allWords, progressMap);
      break;

    case 'all':
      // All words
      filteredWords = [...allWords];
      break;

    case 'category':
      // Category-specific due words
      const categoryWords = allWords.filter(
        w => w.category === config.categoryFilter
      );
      filteredWords = getDueWords(categoryWords, progressMap);
      break;
  }

  // Apply shuffle if enabled
  if (shuffleMode) {
    filteredWords = shuffleArray(filteredWords);
  }

  return filteredWords;
};
```

#### 3. Update Session Start Handler

```typescript
const handleStartSession = (config: SessionConfig) => {
  setSessionConfig(config);

  const sessionWords = getWordsForSession(config);

  // Handle empty state
  if (sessionWords.length === 0) {
    showEmptyStateMessage(config.reviewMode);
    return;
  }

  // Create session in database
  const sessionId = await createLearningSession({
    userId: user.id,
    learningDirection: config.learningDirection,
    reviewMode: config.reviewMode, // NEW: track review mode
    categoryFilter: config.categoryFilter
  });

  // Start session with filtered words
  setCurrentWords(sessionWords);
  setSessionStarted(true);
  setCurrentWordIndex(0);
};
```

#### 4. Add Empty State Handling

```typescript
const showEmptyStateMessage = (mode: ReviewMode) => {
  const messages = {
    smart: "🎉 No cards due right now! You're all caught up.",
    category: "No cards due in this category. Try another one!",
    all: "No words available." // Shouldn't happen with 300 words
  };

  // Show toast or modal
  toast.success(messages[mode]);
};
```

#### 5. Update Learning Sessions Table

Track which review mode was used in each session.

Add to session creation:

```typescript
const { data: session } = await supabase
  .from('learning_sessions')
  .insert({
    user_id: userId,
    started_at: new Date().toISOString(),
    learning_direction: config.learningDirection,
    review_mode: config.reviewMode, // NEW FIELD
    category_filter: config.categoryFilter // NEW FIELD
  })
  .select()
  .single();
```

---

## Task 6: Add Due Count Badges

### Objective
Add visual badges showing due card counts throughout the UI.

### Locations to Add Badges

1. **ModeSelection Component**
   - Badge on Smart Review option
   - Badge on Practice All option
   - Badge on each category option

2. **ReviewDashboard Component**
   - Hero badge showing total due
   - Mini badges on breakdown items

3. **Navigation/Header** (optional)
   - Persistent indicator showing due count
   - Helps remind users to review

### Badge Component

Create reusable badge component:

**File**: `src/components/ui/Badge.tsx`

```typescript
interface BadgeProps {
  count: number;
  variant?: 'success' | 'info' | 'warning' | 'danger';
  pulse?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const Badge: React.FC<BadgeProps> = ({
  count,
  variant = 'info',
  pulse = false,
  size = 'md'
}) => {
  const variantClasses = {
    success: 'bg-green-500 text-white',
    info: 'bg-blue-500 text-white',
    warning: 'bg-orange-500 text-white',
    danger: 'bg-red-500 text-white'
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-2'
  };

  return (
    <span
      className={`
        inline-flex items-center justify-center
        rounded-full font-semibold
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${pulse ? 'animate-pulse' : ''}
      `}
    >
      {count}
    </span>
  );
};
```

### Usage Examples

```typescript
// In ModeSelection
<div className="review-option">
  <span>Smart Review</span>
  <Badge
    count={dueWordsCount}
    variant="success"
    pulse={dueWordsCount > 30}
  />
</div>

// In ReviewDashboard
<h2>
  Cards Due Today
  <Badge count={dueWordsCount} variant="warning" size="lg" />
</h2>
```

### Pulsing Logic

Badge should pulse when:
- Due count > 30 (many cards overdue)
- User hasn't reviewed in 2+ days
- New milestone reached (e.g., 10 words mastered)

```typescript
const shouldPulse = (dueCount: number, lastReviewDate: Date | null): boolean => {
  if (dueCount > 30) return true;

  if (lastReviewDate) {
    const daysSinceReview = daysBetween(lastReviewDate, new Date());
    if (daysSinceReview >= 2) return true;
  }

  return false;
};
```

---

## Database Schema Updates

### Update learning_sessions Table

Add new columns to track review mode:

**Migration File**: `supabase/migrations/YYYYMMDD_add_review_mode_tracking.sql`

```sql
-- Add review mode tracking to learning sessions
ALTER TABLE learning_sessions
ADD COLUMN review_mode TEXT CHECK (review_mode IN ('smart', 'all', 'category')),
ADD COLUMN category_filter TEXT;

-- Add index for analytics
CREATE INDEX idx_learning_sessions_review_mode
ON learning_sessions(review_mode);

-- Add comment
COMMENT ON COLUMN learning_sessions.review_mode IS
'Type of review session: smart (due cards only), all (all cards), category (specific category)';
```

Apply migration:
```bash
npm run migrate
```

---

## Testing Checklist

### Functional Tests
- [ ] Smart Review mode shows only due cards
- [ ] Practice All mode shows all 300 cards
- [ ] Category Focus shows only cards from selected category
- [ ] Empty state appears when no cards due (smart mode)
- [ ] Session config is saved to database correctly
- [ ] Badge counts are accurate
- [ ] Pulsing animation works for urgent due counts
- [ ] Category dropdown populates with all categories
- [ ] Category due counts are correct

### UI/UX Tests
- [ ] Mode selection is intuitive
- [ ] Badges are visible and readable
- [ ] Selection state is clearly indicated
- [ ] Responsive on mobile and desktop
- [ ] Dark mode works correctly
- [ ] Smooth transitions between states

### Edge Cases
- [ ] New user (all words due in smart mode)
- [ ] Advanced user (no words due in smart mode)
- [ ] Category with 0 due cards
- [ ] Single card remaining in session
- [ ] Network offline (session still works)

---

## Acceptance Criteria

### Phase 2 is complete when:

1. ✅ User can choose between Smart Review, Practice All, and Category Focus
2. ✅ Smart Review shows ONLY due cards based on Leitner intervals
3. ✅ Practice All shows all 300 cards (existing behavior)
4. ✅ Category Focus filters by category AND shows only due cards
5. ✅ Due card counts are displayed prominently with badges
6. ✅ Empty state message appears when no cards are due
7. ✅ Session type is tracked in database for analytics
8. ✅ UI is responsive and matches app design language
9. ✅ All TypeScript types are properly defined
10. ✅ No regressions to existing functionality

---

## User Stories

**As a user, I want to...**

- See how many cards need review today, so I know my workload
- Review only due cards by default, so I follow the Leitner system efficiently
- Practice all cards if I want extra practice, so I have flexibility
- Focus on a specific category, so I can target weak areas
- See which categories have due cards, so I can prioritize learning
- Know when there are no cards due, so I feel accomplished

---

## Next Steps

After completing Phase 2, proceed to:
- **Phase 3**: Enhanced User Feedback (next review indicators, celebrations)

---

## Notes & Tips

- Default to Smart Review mode for new users (optimal learning)
- Save user's preferred mode in `user_preferences` table
- Consider adding keyboard shortcuts (1 = Smart, 2 = All, 3 = Category)
- Add analytics tracking for mode usage patterns
- Ensure mode selection is accessible (keyboard navigation, screen readers)
- Test with various due card scenarios (0, 1, 50, 300)

---

**File Created**: `docs/implementation/leitner-system/phase-2-review-session-types.md`
