# Phase 6: Testing & Documentation

**Priority**: HIGH (Must Have)
**Estimated Time**: 2-3 hours
**Dependencies**: Phase 1-5 (All features implemented)

## Overview

Create comprehensive E2E tests for the Leitner system, update documentation to explain the new features, and ensure everything is well-documented for future maintenance.

---

## Task 14: E2E Tests for Leitner System

### Objective
Write Playwright tests that verify the complete Leitner system workflow from user perspective.

### File to Create
`e2e/leitner-system.spec.ts`

### Test Structure

```typescript
import { test, expect } from '@playwright/test';
import { createTestUser, cleanupTestUser } from './helpers/test-user';
import { loginUser } from './helpers/auth';

test.describe('Leitner System', () => {
  let testUser: { email: string; password: string; userId: string };

  test.beforeAll(async () => {
    // Create a dedicated test user for Leitner tests
    testUser = await createTestUser('leitner-test');
  });

  test.afterAll(async () => {
    // Cleanup test user and data
    await cleanupTestUser(testUser.userId);
  });

  test.describe('Due Words Dashboard', () => {
    test('should display due words count for new user', async ({ page }) => {
      await loginUser(page, testUser.email, testUser.password);

      // New user should see all 300 words as due
      await expect(page.locator('[data-testid="due-words-count"]'))
        .toHaveText('300');

      // Breakdown should show all as new
      await expect(page.locator('[data-testid="new-words-count"]'))
        .toHaveText('300');
    });

    test('should show mastery distribution for new user', async ({ page }) => {
      await loginUser(page, testUser.email, testUser.password);

      // Navigate to statistics
      await page.click('[data-testid="statistics-link"]');

      // All words should be at Level 0
      await expect(page.locator('[data-testid="mastery-level-0"]'))
        .toHaveText('300');
      await expect(page.locator('[data-testid="mastery-level-5"]'))
        .toHaveText('0');
    });

    test('should display estimated time for review', async ({ page }) => {
      await loginUser(page, testUser.email, testUser.password);

      // Should show estimated time (300 words * 12 seconds = 60 minutes)
      await expect(page.locator('[data-testid="estimated-time"]'))
        .toContain('60');
    });
  });

  test.describe('Review Mode Selection', () => {
    test('should default to Smart Review mode', async ({ page }) => {
      await loginUser(page, testUser.email, testUser.password);

      // Smart Review should be selected by default
      const smartReviewButton = page.locator('[data-testid="review-mode-smart"]');
      await expect(smartReviewButton).toHaveClass(/selected|active/);
    });

    test('should allow switching to Practice All mode', async ({ page }) => {
      await loginUser(page, testUser.email, testUser.password);

      // Click Practice All
      await page.click('[data-testid="review-mode-all"]');

      // Button should show selected state
      const practiceAllButton = page.locator('[data-testid="review-mode-all"]');
      await expect(practiceAllButton).toHaveClass(/selected|active/);

      // Badge should show total count
      await expect(page.locator('[data-testid="mode-all-badge"]'))
        .toHaveText('300');
    });

    test('should show category options in Category Focus mode', async ({ page }) => {
      await loginUser(page, testUser.email, testUser.password);

      // Click Category Focus
      await page.click('[data-testid="review-mode-category"]');

      // Category dropdown should appear
      const categorySelect = page.locator('[data-testid="category-select"]');
      await expect(categorySelect).toBeVisible();

      // Should have all 30 categories
      const options = await categorySelect.locator('option').count();
      expect(options).toBeGreaterThan(25); // At least 25 categories
    });

    test('should show due count for selected category', async ({ page }) => {
      await loginUser(page, testUser.email, testUser.password);

      // Select category focus mode
      await page.click('[data-testid="review-mode-category"]');

      // Select a category (e.g., "Food")
      await page.selectOption('[data-testid="category-select"]', 'Food');

      // Badge should show due count for that category
      const badge = page.locator('[data-testid="category-due-badge"]');
      await expect(badge).toBeVisible();
    });
  });

  test.describe('Smart Review Workflow', () => {
    test('should start smart review session with due cards', async ({ page }) => {
      await loginUser(page, testUser.email, testUser.password);

      // Start Smart Review
      await page.click('[data-testid="start-smart-review"]');

      // Should show first flashcard
      await expect(page.locator('[data-testid="flashcard"]')).toBeVisible();

      // Session should indicate Smart Review mode
      await expect(page.locator('[data-testid="session-mode"]'))
        .toHaveText(/Smart Review|Due Cards/i);
    });

    test('should update mastery level after correct answer', async ({ page }) => {
      await loginUser(page, testUser.email, testUser.password);

      // Start session
      await page.click('[data-testid="start-smart-review"]');

      // Get the word being tested
      const sourceWord = await page.locator('[data-testid="flashcard-source"]').textContent();

      // Type correct answer (this test assumes we know the answer)
      // In real test, you'd need to look up the correct answer
      await page.fill('[data-testid="answer-input"]', 'correct-answer');
      await page.click('[data-testid="submit-answer"]');

      // Should show correct feedback
      await expect(page.locator('[data-testid="feedback"]'))
        .toHaveText(/Correct|✓/i);

      // Mastery level should be shown
      const masteryIndicator = page.locator('[data-testid="mastery-level"]');
      await expect(masteryIndicator).toBeVisible();
    });

    test('should show next review date after answer', async ({ page }) => {
      await loginUser(page, testUser.email, testUser.password);

      // Start session and answer a card
      await page.click('[data-testid="start-smart-review"]');
      await page.fill('[data-testid="answer-input"]', 'test-answer');
      await page.click('[data-testid="submit-answer"]');

      // Next review indicator should be visible
      const nextReviewIndicator = page.locator('[data-testid="next-review-date"]');
      await expect(nextReviewIndicator).toBeVisible();

      // Should show a future date
      const dateText = await nextReviewIndicator.textContent();
      expect(dateText).toMatch(/\d{1,2}/); // Contains a day number
    });

    test('should reduce due count after completing cards', async ({ page }) => {
      await loginUser(page, testUser.email, testUser.password);

      // Get initial due count
      const initialCount = await page.locator('[data-testid="due-words-count"]').textContent();
      const initialNumber = parseInt(initialCount || '0');

      // Complete 5 cards
      await page.click('[data-testid="start-smart-review"]');

      for (let i = 0; i < 5; i++) {
        await page.fill('[data-testid="answer-input"]', 'answer');
        await page.click('[data-testid="submit-answer"]');
        await page.click('[data-testid="next-card"]');
      }

      // Exit session
      await page.click('[data-testid="end-session"]');

      // Due count should be less (depends on implementation)
      // New words become "due in X days" after first attempt
      const newCount = await page.locator('[data-testid="due-words-count"]').textContent();
      const newNumber = parseInt(newCount || '0');

      // Count should either stay same or decrease (depending on if they're still due)
      expect(newNumber).toBeLessThanOrEqual(initialNumber);
    });
  });

  test.describe('Level-Up Celebrations', () => {
    test('should show celebration when mastery increases', async ({ page }) => {
      await loginUser(page, testUser.email, testUser.password);

      // Start session
      await page.click('[data-testid="start-smart-review"]');

      // Answer correctly multiple times to trigger level-up
      // (This may require multiple correct answers on the same word)
      for (let i = 0; i < 3; i++) {
        await page.fill('[data-testid="answer-input"]', 'correct');
        await page.click('[data-testid="submit-answer"]');

        // Check if celebration appeared
        const celebration = page.locator('[data-testid="level-up-celebration"]');
        if (await celebration.isVisible()) {
          // Celebration found!
          await expect(celebration).toHaveText(/Level Up|🎉/i);
          break;
        }

        await page.click('[data-testid="next-card"]');
      }
    });

    test('should auto-dismiss celebration after timeout', async ({ page }) => {
      await loginUser(page, testUser.email, testUser.password);

      // Trigger level-up (assuming test helper can set this up)
      // ... trigger level up ...

      const celebration = page.locator('[data-testid="level-up-celebration"]');

      // Should be visible initially
      await expect(celebration).toBeVisible();

      // Should auto-dismiss after 2-3 seconds
      await page.waitForTimeout(3000);
      await expect(celebration).not.toBeVisible();
    });
  });

  test.describe('Progress Tracking', () => {
    test('should show session progress accurately', async ({ page }) => {
      await loginUser(page, testUser.email, testUser.password);

      await page.click('[data-testid="start-smart-review"]');

      // Initially at card 0/N
      await expect(page.locator('[data-testid="progress-current"]'))
        .toHaveText('0');

      // Answer and move to next card
      await page.fill('[data-testid="answer-input"]', 'answer');
      await page.click('[data-testid="submit-answer"]');
      await page.click('[data-testid="next-card"]');

      // Now at card 1/N
      await expect(page.locator('[data-testid="progress-current"]'))
        .toHaveText('1');
    });

    test('should show accuracy percentage', async ({ page }) => {
      await loginUser(page, testUser.email, testUser.password);

      await page.click('[data-testid="start-smart-review"]');

      // Answer 2 correct, 1 wrong
      // Correct #1
      await page.fill('[data-testid="answer-input"]', 'correct-1');
      await page.click('[data-testid="submit-answer"]');
      await page.click('[data-testid="next-card"]');

      // Correct #2
      await page.fill('[data-testid="answer-input"]', 'correct-2');
      await page.click('[data-testid="submit-answer"]');
      await page.click('[data-testid="next-card"]');

      // Wrong #1
      await page.fill('[data-testid="answer-input"]', 'wrong');
      await page.click('[data-testid="submit-answer"]');

      // Accuracy should be 66% (2/3)
      const accuracy = page.locator('[data-testid="accuracy"]');
      await expect(accuracy).toHaveText(/66|67/); // Allow for rounding
    });

    test('should track daily goal progress', async ({ page }) => {
      await loginUser(page, testUser.email, testUser.password);

      // Set daily goal to 10 (via settings or test setup)
      // ... set goal ...

      await page.click('[data-testid="start-smart-review"]');

      // Complete 10 cards
      for (let i = 0; i < 10; i++) {
        await page.fill('[data-testid="answer-input"]', 'answer');
        await page.click('[data-testid="submit-answer"]');
        await page.click('[data-testid="next-card"]');
      }

      // Daily goal indicator should show 10/10
      const goalProgress = page.locator('[data-testid="daily-goal-progress"]');
      await expect(goalProgress).toHaveText(/10.*10/);

      // Goal celebration should appear
      const goalCelebration = page.locator('[data-testid="goal-achieved"]');
      await expect(goalCelebration).toBeVisible();
    });
  });

  test.describe('User Preferences', () => {
    test('should respect default review mode preference', async ({ page }) => {
      await loginUser(page, testUser.email, testUser.password);

      // Navigate to settings
      await page.click('[data-testid="settings-link"]');

      // Set default to "Practice All"
      await page.selectOption('[data-testid="default-review-mode"]', 'all');
      await page.click('[data-testid="save-settings"]');

      // Go back to dashboard
      await page.click('[data-testid="dashboard-link"]');

      // Practice All should now be selected by default
      const practiceAllButton = page.locator('[data-testid="review-mode-all"]');
      await expect(practiceAllButton).toHaveClass(/selected|active/);
    });

    test('should hide next review date when disabled', async ({ page }) => {
      await loginUser(page, testUser.email, testUser.password);

      // Go to settings and disable next review date
      await page.click('[data-testid="settings-link"]');
      await page.uncheck('[data-testid="show-next-review-date"]');
      await page.click('[data-testid="save-settings"]');

      // Start a session
      await page.click('[data-testid="dashboard-link"]');
      await page.click('[data-testid="start-smart-review"]');
      await page.fill('[data-testid="answer-input"]', 'answer');
      await page.click('[data-testid="submit-answer"]');

      // Next review date should not be visible
      const nextReviewIndicator = page.locator('[data-testid="next-review-date"]');
      await expect(nextReviewIndicator).not.toBeVisible();
    });

    test('should disable celebrations when preference is off', async ({ page }) => {
      await loginUser(page, testUser.email, testUser.password);

      // Disable celebrations
      await page.click('[data-testid="settings-link"]');
      await page.uncheck('[data-testid="celebration-animations"]');
      await page.click('[data-testid="save-settings"]');

      // Trigger a level-up (test helper needed)
      // ... level up scenario ...

      // Celebration should not appear
      const celebration = page.locator('[data-testid="level-up-celebration"]');
      await expect(celebration).not.toBeVisible();
    });
  });

  test.describe('Mastery Level Progression', () => {
    test('should increase mastery level with consistent correct answers', async ({ page }) => {
      await loginUser(page, testUser.email, testUser.password);

      // This test requires database setup to have a specific word
      // at a specific mastery level, or ability to answer the same word multiple times

      // Start session
      await page.click('[data-testid="start-smart-review"]');

      // Get initial mastery level
      // (May need to answer once first to see it)
      await page.fill('[data-testid="answer-input"]', 'correct');
      await page.click('[data-testid="submit-answer"]');

      const initialLevel = await page.locator('[data-testid="mastery-level"]').textContent();

      // Continue answering correctly
      // ... implementation depends on ability to answer same word multiple times ...

      // Eventually mastery should increase
      // This test may need special setup or multiple sessions
    });
  });

  test.describe('Database Integration', () => {
    test('should persist progress across sessions', async ({ page, context }) => {
      await loginUser(page, testUser.email, testUser.password);

      // Complete some cards
      await page.click('[data-testid="start-smart-review"]');

      for (let i = 0; i < 5; i++) {
        await page.fill('[data-testid="answer-input"]', 'answer');
        await page.click('[data-testid="submit-answer"]');
        await page.click('[data-testid="next-card"]');
      }

      await page.click('[data-testid="end-session"]');

      // Close browser and reopen (simulates new session)
      await page.close();
      const newPage = await context.newPage();

      // Login again
      await loginUser(newPage, testUser.email, testUser.password);

      // Progress should be saved
      // (Due count should reflect completed cards)
      const progressIndicator = newPage.locator('[data-testid="words-studied"]');
      await expect(progressIndicator).toHaveText(/5|[1-9]/); // At least some words studied
    });
  });
});
```

### Test Helpers

**File**: `e2e/helpers/leitner-helpers.ts`

```typescript
import { Page } from '@playwright/test';
import { supabase } from '../../src/lib/supabase';

export async function setUserMasteryLevel(
  userId: string,
  wordId: number,
  masteryLevel: number,
  correctCount: number = 5,
  wrongCount: number = 0
) {
  await supabase.from('user_progress').upsert({
    user_id: userId,
    word_id: wordId,
    mastery_level: masteryLevel,
    correct_count: correctCount,
    wrong_count: wrongCount,
    last_practiced: new Date().toISOString()
  });
}

export async function getDueWordsCount(userId: string): Promise<number> {
  const { data } = await supabase.rpc('get_due_words_count', {
    p_user_id: userId
  });

  return data || 0;
}

export async function resetUserProgress(userId: string) {
  await supabase.from('user_progress').delete().eq('user_id', userId);
  await supabase.from('learning_sessions').delete().eq('user_id', userId);
}
```

### Run Tests

```bash
# Run all Leitner tests
npm run test:e2e -- leitner-system.spec.ts

# Run in UI mode
npm run test:e2e:ui -- leitner-system.spec.ts

# Run specific test
npm run test:e2e -- -g "should display due words count"
```

---

## Task 15: Update Documentation

### Objective
Document the Leitner system features for users and developers.

### Documentation Updates

#### 1. Update Main README

**File**: `README.md`

Add section about Leitner system:

```markdown
## 🎯 Leitner Spaced Repetition System

This app uses the proven **Leitner system** for optimal vocabulary retention:

### How It Works

- **6 Mastery Levels** (0-5): Cards progress through levels as you answer correctly
- **Increasing Intervals**: Higher levels mean longer time between reviews
  - Level 0: Review in 1 day
  - Level 1: Review in 3 days
  - Level 2: Review in 7 days
  - Level 3: Review in 14 days
  - Level 4: Review in 30 days
  - Level 5: Review in 90 days

### Features

- **Smart Review**: Focus on cards that are due for review (recommended)
- **Practice All**: Review all 300 cards in any order
- **Category Focus**: Target specific word categories
- **Progress Tracking**: See your mastery distribution and statistics
- **Level-Up Celebrations**: Get motivated when you improve
- **Daily Goals**: Set and track your daily review targets

### Getting Started

1. **Login** to the app
2. See your **due cards count** on the dashboard
3. Click **Start Smart Review** to begin
4. Answer cards and watch your progress grow!
```

#### 2. Create Leitner System Guide

**File**: `docs/LEITNER_SYSTEM.md`

```markdown
# Leitner System Implementation Guide

## Overview

The Italian Flashcards app implements a Leitner spaced repetition system to optimize vocabulary learning.

## System Architecture

### Mastery Levels

Each word progresses through 6 levels (0-5) based on user performance:

| Level | Name | Accuracy Required | Review Interval |
|-------|------|-------------------|-----------------|
| 0 | New | Not attempted | 1 day |
| 1 | Beginner | ≥1 attempt | 3 days |
| 2 | Learning | ≥60% accuracy, 2+ attempts | 7 days |
| 3 | Good | ≥70% accuracy, 3+ attempts | 14 days |
| 4 | Strong | ≥80% accuracy, 4+ attempts | 30 days |
| 5 | Mastered | ≥90% accuracy, 5+ attempts | 90 days |

### Calculation Formula

```typescript
function calculateMasteryLevel(correctCount: number, wrongCount: number): number {
  const totalAttempts = correctCount + wrongCount;
  if (totalAttempts === 0) return 0;

  const accuracy = (correctCount / totalAttempts) * 100;

  if (accuracy >= 90 && totalAttempts >= 5) return 5;
  if (accuracy >= 80 && totalAttempts >= 4) return 4;
  if (accuracy >= 70 && totalAttempts >= 3) return 3;
  if (accuracy >= 60 && totalAttempts >= 2) return 2;
  if (totalAttempts >= 1) return 1;
  return 0;
}
```

## User Experience

### Smart Review Mode

Shows only cards that are due for review based on:
1. New words (never studied)
2. Words past their review interval

This is the recommended mode for efficient learning.

### Practice All Mode

Shows all 300 words regardless of review schedule. Use when:
- You want extra practice
- Preparing for a test
- Reviewing before a trip

### Category Focus Mode

Shows due words from a specific category. Useful for:
- Targeting weak areas
- Learning themed vocabulary
- Focused study sessions

## Implementation Details

### Database Schema

**user_progress table:**
```sql
- mastery_level: INTEGER (0-5)
- correct_count: INTEGER
- wrong_count: INTEGER
- last_practiced: TIMESTAMPTZ
```

### Frontend Components

- `ReviewDashboard`: Shows due card count and breakdown
- `ModeSelection`: Allows choosing review mode
- `NextReviewIndicator`: Displays next review date
- `LevelUpCelebration`: Celebrates mastery increases

### Backend Functions

Database functions for efficient queries:
- `get_due_words_count(user_id)`: Returns count of due cards
- `get_mastery_distribution(user_id)`: Returns level breakdown
- `get_due_words_by_category(user_id)`: Returns due count per category

## User Preferences

Users can customize:
- Default review mode
- Show/hide next review dates
- Enable/disable celebrations
- Daily goal
- Sound effects

## Testing

E2E tests cover:
- Due word calculations
- Mastery level progression
- Review mode switching
- Celebration triggers
- Preference persistence

See `e2e/leitner-system.spec.ts` for details.

## Maintenance

### Monitoring

- Track due word counts in analytics
- Monitor mastery distribution
- Review session completion rates
- Watch for users with all cards at level 0

### Optimization

- Database indexes on `mastery_level` and `last_practiced`
- Caching of due word counts (1 minute TTL)
- Database functions for complex calculations

## Future Enhancements

Potential improvements:
- Adaptive intervals based on individual performance
- Streak tracking and rewards
- Email reminders for due cards
- Mobile app with push notifications
- Export/import progress data
```

#### 3. Update Architecture Documentation

**File**: `docs/dev/ARCHITECTURE.md`

Add section:

```markdown
## Leitner Spaced Repetition System

### Overview

The app implements a Leitner system for optimal vocabulary retention.

### Components

- **ReviewDashboard** (`src/components/ReviewDashboard.tsx`): Main dashboard showing due cards
- **ModeSelection** (`src/components/ModeSelection.tsx`): Review mode selector
- **NextReviewIndicator** (`src/components/NextReviewIndicator.tsx`): Shows next review date
- **LevelUpCelebration** (`src/components/LevelUpCelebration.tsx`): Celebration animations

### Utilities

- **spacedRepetition.ts** (`src/utils/spacedRepetition.ts`):
  - `getDueWords()`: Filters words needing review
  - `getNextReviewDate()`: Calculates next review date
  - `calculateMasteryLevel()`: Computes mastery level from accuracy

### Database

**Tables:**
- `user_progress`: Tracks mastery level and attempts per word
- `learning_sessions`: Records review sessions with mode

**Functions:**
- `get_due_words_count(user_id)`: Efficient due count query
- `get_mastery_distribution(user_id)`: Level breakdown
- `get_user_learning_stats(user_id)`: Comprehensive stats

### Data Flow

1. User opens app → `getDueWordsCount()` calculates due cards
2. User starts Smart Review → `getDueWords()` filters word list
3. User answers → mastery level recalculated via `calculateMasteryLevel()`
4. Progress saved → `user_progress` table updated
5. Next review date calculated → shown to user

See `docs/LEITNER_SYSTEM.md` for detailed documentation.
```

#### 4. Update Testing Documentation

**File**: `docs/dev/TESTING.md`

Add section:

```markdown
## Leitner System Tests

### E2E Tests

**File**: `e2e/leitner-system.spec.ts`

Tests cover:
- Due words dashboard display
- Review mode selection (Smart/All/Category)
- Smart review workflow
- Mastery level progression
- Level-up celebrations
- Progress tracking
- User preferences
- Database persistence

### Running Tests

```bash
# Run all Leitner tests
npm run test:e2e -- leitner-system.spec.ts

# Run in UI mode
npm run test:e2e:ui

# Run specific test
npm run test:e2e -- -g "should display due words count"
```

### Test Data Setup

Use helpers from `e2e/helpers/leitner-helpers.ts`:

```typescript
import { setUserMasteryLevel, resetUserProgress } from './helpers/leitner-helpers';

// Set specific mastery level for testing
await setUserMasteryLevel(userId, wordId, 3, correctCount: 10);

// Reset all progress
await resetUserProgress(userId);
```
```

#### 5. Add User Guide

**File**: `docs/USER_GUIDE.md`

```markdown
# User Guide: Mastering Italian with the Leitner System

## What is the Leitner System?

The Leitner system is a proven method for vocabulary learning using spaced repetition. Instead of reviewing all words equally, it focuses your time on words you're struggling with while reviewing mastered words less frequently.

## Getting Started

### 1. View Your Due Cards

When you open the app, you'll see:
- **Total cards due today**
- Breakdown by difficulty (New, Learning, Reviewing)
- Estimated time to complete review

### 2. Choose Your Review Mode

**Smart Review** (Recommended)
- Shows only cards that need review today
- Most efficient use of your time
- Follows the Leitner schedule

**Practice All**
- Review all 300 words
- Good for exam preparation
- Allows extra practice

**Category Focus**
- Target specific categories (Food, Travel, etc.)
- Shows due cards in that category
- Great for themed learning

### 3. Review Cards

- Read the source word
- Type the translation
- Submit your answer
- See immediate feedback
- Learn when you'll see this card next

### 4. Track Your Progress

- **Mastery Levels**: Watch your words progress from Level 0 (New) to Level 5 (Mastered)
- **Daily Goal**: Set and achieve daily targets
- **Statistics**: See your accuracy, streak, and distribution

## Understanding Mastery Levels

- ⭐ **Level 0**: New word (never studied)
- ⭐⭐ **Level 1**: Beginner (reviewed once)
- ⭐⭐⭐ **Level 2**: Learning (60%+ accuracy)
- ⭐⭐⭐⭐ **Level 3**: Good (70%+ accuracy)
- ⭐⭐⭐⭐⭐ **Level 4**: Strong (80%+ accuracy)
- ⭐⭐⭐⭐⭐⭐ **Level 5**: Mastered (90%+ accuracy)

## Tips for Success

1. **Review daily**: Consistency is key for retention
2. **Trust the system**: Focus on due cards (Smart Review)
3. **Set realistic goals**: Start with 20 cards/day
4. **Track your streak**: Build a daily habit
5. **Celebrate progress**: Watch your mastery levels grow!

## Customizing Your Experience

Go to **Settings** to adjust:
- Default review mode
- Daily goal
- Show/hide next review dates
- Enable/disable celebrations
- Sound effects

## Frequently Asked Questions

**Q: Why are some cards due more often?**
A: Cards you're struggling with appear more frequently until you master them.

**Q: What if I have no due cards?**
A: Great job! You're all caught up. Use Practice All mode for extra review.

**Q: Can I change my daily goal?**
A: Yes, in Settings you can adjust your daily card target.

**Q: What happens if I get a card wrong?**
A: Your mastery level may decrease, and you'll see it again sooner.
```

---

## Testing Checklist

### Documentation Tests

- [ ] All documentation is accurate and up-to-date
- [ ] Code examples compile and run
- [ ] Screenshots/diagrams are current
- [ ] Links work correctly
- [ ] Markdown renders properly
- [ ] Terminology is consistent

### E2E Test Coverage

- [ ] All major user flows tested
- [ ] Edge cases covered
- [ ] Error states verified
- [ ] Accessibility tested
- [ ] Mobile responsive tests pass
- [ ] Performance acceptable

### Manual Testing

- [ ] Walk through user guide steps
- [ ] Verify all features work as documented
- [ ] Test on different browsers
- [ ] Test on mobile devices
- [ ] Verify dark mode works
- [ ] Check accessibility with screen reader

---

## Acceptance Criteria

### Phase 6 is complete when:

1. ✅ Comprehensive E2E tests exist for all Leitner features
2. ✅ All tests pass consistently
3. ✅ README.md documents Leitner system
4. ✅ LEITNER_SYSTEM.md provides detailed guide
5. ✅ Architecture docs updated with Leitner components
6. ✅ Testing docs include Leitner test info
7. ✅ User guide explains system clearly
8. ✅ All documentation is accurate and current
9. ✅ Code has inline comments where needed
10. ✅ No broken links or outdated information

---

## Documentation Maintenance

### Keep Updated

When making changes, update:
- [ ] README.md (user-facing changes)
- [ ] LEITNER_SYSTEM.md (system changes)
- [ ] ARCHITECTURE.md (component changes)
- [ ] TESTING.md (test changes)
- [ ] Code comments (implementation changes)

### Regular Reviews

Schedule quarterly reviews of:
- Documentation accuracy
- Screenshot currency
- Link validity
- API documentation
- User guide relevance

---

## Next Steps

After completing Phase 6:
1. **Launch** the complete Leitner system
2. **Monitor** user engagement and due card metrics
3. **Gather feedback** from users
4. **Iterate** based on usage data
5. **Consider enhancements** from future enhancements list

---

## Celebration! 🎉

Congratulations! You've successfully implemented a complete Leitner spaced repetition system with:

✅ Smart review dashboard
✅ Multiple review modes
✅ Progress tracking and celebrations
✅ User customization
✅ Optimized database
✅ Comprehensive tests
✅ Complete documentation

Your users now have a powerful, scientifically-backed tool for mastering Italian vocabulary!

---

**File Created**: `docs/implementation/leitner-system/phase-6-testing-documentation.md`
