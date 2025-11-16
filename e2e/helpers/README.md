# E2E Test Helpers

This directory contains utility functions for E2E tests.

## reset-gamification.ts

Provides functions to reset and manage gamification data for E2E tests.

### Problem It Solves

E2E tests share a common test user across multiple test runs. Over time, this user accumulates:
- Thousands of review history entries
- High XP totals (tens of thousands)
- Very high levels (100+)
- Many achievements

This accumulated data causes test failures because:
1. **Race conditions**: Initial level display may show stale/loading state (level 1) while the database has the real high level (100+)
2. **Navigation triggers reload**: After navigating and returning, gamification data reloads from database showing the true high level
3. **Test assertions fail**: Tests expect level to stay constant during navigation, but it jumps from 1 (stale) to 100+ (real)

### Solution

The `resetGamificationData()` function:
- Resets the test user's gamification data before each test suite
- Ensures tests start with a clean slate (Level 1, 0 XP, no achievements)
- Prevents data accumulation between test runs
- Eliminates race condition issues

### Usage

```typescript
import { resetGamificationData } from './helpers/reset-gamification'

test.describe('My Test Suite', () => {
  test.beforeAll(async () => {
    await resetGamificationData()
  })

  // Your tests here
})
```

### What Gets Reset

- **daily_goals**: XP, level, streak data reset to defaults
- **achievements**: All achievements deleted
- **user_progress**: All learning progress deleted
- **review_history**: All review history deleted

### Error Handling

The reset function is designed to fail gracefully:
- If authentication fails, it logs a warning and continues
- Tests will run with existing data if reset fails
- This prevents reset failures from blocking all tests
