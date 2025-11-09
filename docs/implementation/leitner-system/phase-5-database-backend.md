# Phase 5: Database & Backend

**Priority**: MEDIUM (Should Have)
**Estimated Time**: 1-2 hours
**Dependencies**: Phase 1-4 (All previous features)

## Overview

Ensure the database schema fully supports the Leitner system, optimize queries for performance, add analytics capabilities, and create database functions for complex calculations.

---

## Database Schema Review

### Current Tables

**Already Implemented:**
- ✅ `words` - Vocabulary storage
- ✅ `user_progress` - Per-word mastery tracking
- ✅ `learning_sessions` - Session history
- ✅ `user_preferences` - User settings

### Verification Checklist

Ensure these fields exist and are properly indexed:

#### user_progress table
- [ ] `mastery_level INTEGER` (0-5)
- [ ] `last_practiced TIMESTAMPTZ`
- [ ] `correct_count INTEGER`
- [ ] `wrong_count INTEGER`
- [ ] Index on `(user_id, mastery_level)`
- [ ] Index on `(user_id, last_practiced)`

#### learning_sessions table
- [ ] `review_mode TEXT` (smart/all/category) - Added in Phase 2
- [ ] `category_filter TEXT` - Added in Phase 2
- [ ] Index on `(user_id, started_at DESC)`

#### user_preferences table
- [ ] All Leitner preference fields - Added in Phase 4
- [ ] Unique constraint on `user_id`

---

## Task 12: Database Schema Enhancements

### Migration 1: Add Missing Indexes

If not already present, create indexes for optimal query performance:

**File**: `supabase/migrations/YYYYMMDD_optimize_leitner_indexes.sql`

```sql
-- Optimize user_progress queries
-- Index for finding due words (mastery + last_practiced)
CREATE INDEX IF NOT EXISTS idx_user_progress_due_check
ON user_progress(user_id, last_practiced, mastery_level);

-- Index for mastery distribution queries
CREATE INDEX IF NOT EXISTS idx_user_progress_mastery_distribution
ON user_progress(user_id, mastery_level);

-- Optimize learning_sessions queries
-- Index for recent sessions by user
CREATE INDEX IF NOT EXISTS idx_learning_sessions_recent
ON learning_sessions(user_id, started_at DESC);

-- Index for analytics by review mode
CREATE INDEX IF NOT EXISTS idx_learning_sessions_mode_analytics
ON learning_sessions(user_id, review_mode, started_at DESC);

-- Add comments
COMMENT ON INDEX idx_user_progress_due_check IS
'Optimizes getDueWords() queries by covering user_id, last_practiced, and mastery_level';

COMMENT ON INDEX idx_user_progress_mastery_distribution IS
'Optimizes mastery level distribution queries for statistics';
```

### Migration 2: Add Computed Columns (Optional)

Add helper columns for common calculations:

**File**: `supabase/migrations/YYYYMMDD_add_computed_columns.sql`

```sql
-- Add accuracy percentage (calculated on write)
ALTER TABLE user_progress
ADD COLUMN accuracy_percentage DECIMAL(5,2)
GENERATED ALWAYS AS (
  CASE
    WHEN (correct_count + wrong_count) > 0
    THEN ROUND((correct_count::DECIMAL / (correct_count + wrong_count)) * 100, 2)
    ELSE 0
  END
) STORED;

-- Add total attempts
ALTER TABLE user_progress
ADD COLUMN total_attempts INTEGER
GENERATED ALWAYS AS (correct_count + wrong_count) STORED;

-- Add index on accuracy for filtering
CREATE INDEX idx_user_progress_accuracy
ON user_progress(user_id, accuracy_percentage);

COMMENT ON COLUMN user_progress.accuracy_percentage IS
'Computed column: percentage of correct answers (0-100)';

COMMENT ON COLUMN user_progress.total_attempts IS
'Computed column: total number of answer attempts';
```

### Migration 3: Add Database Functions

Create PostgreSQL functions for complex Leitner calculations:

**File**: `supabase/migrations/YYYYMMDD_add_leitner_functions.sql`

```sql
-- Function: Get due words count for a user
CREATE OR REPLACE FUNCTION get_due_words_count(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  due_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO due_count
  FROM words w
  LEFT JOIN user_progress up ON w.id = up.word_id AND up.user_id = p_user_id
  WHERE
    -- New words (never practiced)
    up.id IS NULL
    OR
    -- Words past their review interval
    (
      up.last_practiced + (
        CASE up.mastery_level
          WHEN 0 THEN INTERVAL '1 day'
          WHEN 1 THEN INTERVAL '3 days'
          WHEN 2 THEN INTERVAL '7 days'
          WHEN 3 THEN INTERVAL '14 days'
          WHEN 4 THEN INTERVAL '30 days'
          WHEN 5 THEN INTERVAL '90 days'
          ELSE INTERVAL '1 day'
        END
      ) <= NOW()
    );

  RETURN due_count;
END;
$$;

-- Function: Get mastery distribution for a user
CREATE OR REPLACE FUNCTION get_mastery_distribution(p_user_id UUID)
RETURNS TABLE(
  mastery_level INTEGER,
  word_count BIGINT
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(up.mastery_level, 0) as mastery_level,
    COUNT(*) as word_count
  FROM words w
  LEFT JOIN user_progress up ON w.id = up.word_id AND up.user_id = p_user_id
  GROUP BY COALESCE(up.mastery_level, 0)
  ORDER BY mastery_level;
END;
$$;

-- Function: Get due words by category
CREATE OR REPLACE FUNCTION get_due_words_by_category(p_user_id UUID)
RETURNS TABLE(
  category TEXT,
  due_count BIGINT
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    w.category,
    COUNT(*) as due_count
  FROM words w
  LEFT JOIN user_progress up ON w.id = up.word_id AND up.user_id = p_user_id
  WHERE
    up.id IS NULL
    OR
    (
      up.last_practiced + (
        CASE up.mastery_level
          WHEN 0 THEN INTERVAL '1 day'
          WHEN 1 THEN INTERVAL '3 days'
          WHEN 2 THEN INTERVAL '7 days'
          WHEN 3 THEN INTERVAL '14 days'
          WHEN 4 THEN INTERVAL '30 days'
          WHEN 5 THEN INTERVAL '90 days'
          ELSE INTERVAL '1 day'
        END
      ) <= NOW()
    )
  GROUP BY w.category
  ORDER BY due_count DESC, w.category;
END;
$$;

-- Function: Get user's learning statistics
CREATE OR REPLACE FUNCTION get_user_learning_stats(p_user_id UUID)
RETURNS TABLE(
  total_words INTEGER,
  words_studied INTEGER,
  mastered_words INTEGER,
  average_accuracy DECIMAL,
  current_streak INTEGER,
  total_sessions INTEGER,
  total_study_time INTEGER
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*)::INTEGER FROM words) as total_words,
    (SELECT COUNT(*)::INTEGER FROM user_progress WHERE user_id = p_user_id) as words_studied,
    (SELECT COUNT(*)::INTEGER FROM user_progress WHERE user_id = p_user_id AND mastery_level >= 4) as mastered_words,
    (SELECT ROUND(AVG(accuracy_percentage), 2) FROM user_progress WHERE user_id = p_user_id) as average_accuracy,
    0 as current_streak, -- TODO: Implement streak calculation
    (SELECT COUNT(*)::INTEGER FROM learning_sessions WHERE user_id = p_user_id) as total_sessions,
    (SELECT COALESCE(SUM(session_duration_seconds), 0)::INTEGER FROM learning_sessions WHERE user_id = p_user_id) as total_study_time;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_due_words_count TO authenticated;
GRANT EXECUTE ON FUNCTION get_mastery_distribution TO authenticated;
GRANT EXECUTE ON FUNCTION get_due_words_by_category TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_learning_stats TO authenticated;

-- Add comments
COMMENT ON FUNCTION get_due_words_count IS
'Returns the number of cards due for review for a specific user based on Leitner intervals';

COMMENT ON FUNCTION get_mastery_distribution IS
'Returns the distribution of words across mastery levels (0-5) for a user';

COMMENT ON FUNCTION get_due_words_by_category IS
'Returns the number of due words in each category for a user';

COMMENT ON FUNCTION get_user_learning_stats IS
'Returns comprehensive learning statistics for a user';
```

### Apply Migrations

```bash
# Review migrations first
npm run migrate -- --check

# Apply to test database
npm run migrate

# Verify functions were created
# (Run in Supabase SQL Editor or via psql)
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE 'get_%';
```

---

## Task 13: Update Progress Hook with Database Functions

### Objective
Use the new database functions to optimize data fetching in the frontend.

### File to Update
`src/hooks/useProgress.tsx`

### Enhanced Hook

```typescript
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface LearningStats {
  total_words: number;
  words_studied: number;
  mastered_words: number;
  average_accuracy: number;
  current_streak: number;
  total_sessions: number;
  total_study_time: number;
}

interface MasteryDistribution {
  mastery_level: number;
  word_count: number;
}

interface CategoryDueCount {
  category: string;
  due_count: number;
}

export const useProgress = () => {
  const { user } = useAuth();
  const [dueWordsCount, setDueWordsCount] = useState<number>(0);
  const [learningStats, setLearningStats] = useState<LearningStats | null>(null);
  const [masteryDistribution, setMasteryDistribution] = useState<MasteryDistribution[]>([]);
  const [categoryDueCounts, setCategoryDueCounts] = useState<CategoryDueCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadAllStats();
    }
  }, [user]);

  const loadAllStats = async () => {
    if (!user) return;

    setLoading(true);

    // Run all queries in parallel
    await Promise.all([
      loadDueWordsCount(),
      loadLearningStats(),
      loadMasteryDistribution(),
      loadCategoryDueCounts()
    ]);

    setLoading(false);
  };

  // Use database function for due words count
  const loadDueWordsCount = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .rpc('get_due_words_count', {
        p_user_id: user.id
      });

    if (data !== null) {
      setDueWordsCount(data);
    }
  };

  // Use database function for learning stats
  const loadLearningStats = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .rpc('get_user_learning_stats', {
        p_user_id: user.id
      });

    if (data && data.length > 0) {
      setLearningStats(data[0]);
    }
  };

  // Use database function for mastery distribution
  const loadMasteryDistribution = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .rpc('get_mastery_distribution', {
        p_user_id: user.id
      });

    if (data) {
      setMasteryDistribution(data);
    }
  };

  // Use database function for category due counts
  const loadCategoryDueCounts = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .rpc('get_due_words_by_category', {
        p_user_id: user.id
      });

    if (data) {
      setCategoryDueCounts(data);
    }
  };

  // Refresh specific stats (call after user answers)
  const refreshDueCount = async () => {
    await loadDueWordsCount();
  };

  const refreshStats = async () => {
    await loadAllStats();
  };

  return {
    dueWordsCount,
    learningStats,
    masteryDistribution,
    categoryDueCounts,
    loading,
    refreshDueCount,
    refreshStats
  };
};
```

### Benefits of Database Functions

1. **Performance**: Calculations run on database server
2. **Consistency**: Logic is centralized and reusable
3. **Reduced Network Traffic**: Only results are returned
4. **Easier Testing**: Can test functions directly in SQL
5. **Better Caching**: Database can optimize repeated calls

---

## Analytics & Monitoring

### Add Analytics Tracking

Track Leitner system usage for insights:

**File**: `src/utils/analytics.ts`

```typescript
import { supabase } from '../lib/supabase';

export const trackSessionAnalytics = async (
  userId: string,
  sessionId: string,
  analytics: {
    wordsLeveledUp: number;
    wordsLeveledDown: number;
    averageResponseTime: number;
    completionRate: number;
  }
) => {
  // Store in learning_sessions or separate analytics table
  await supabase
    .from('learning_sessions')
    .update({
      words_leveled_up: analytics.wordsLeveledUp,
      words_leveled_down: analytics.wordsLeveledDown,
      average_response_time: analytics.averageResponseTime,
      completion_rate: analytics.completionRate
    })
    .eq('id', sessionId);
};
```

### Optional: Add Analytics Table

For more detailed tracking:

```sql
CREATE TABLE session_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES learning_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  words_leveled_up INTEGER DEFAULT 0,
  words_leveled_down INTEGER DEFAULT 0,
  average_response_time INTEGER, -- milliseconds
  completion_rate DECIMAL(5,2), -- percentage
  created_at TIMESTAMPTZ DEFAULT now(),

  INDEX idx_session_analytics_user (user_id),
  INDEX idx_session_analytics_session (session_id)
);
```

---

## Performance Optimization

### Query Optimization Checklist

- [ ] All foreign keys have indexes
- [ ] Frequently queried columns have indexes
- [ ] Complex queries use database functions
- [ ] Use `select('*')` sparingly (select only needed columns)
- [ ] Implement pagination for large result sets

### Caching Strategy

Add simple in-memory cache for due words count:

```typescript
let dueWordsCache: {
  count: number;
  timestamp: number;
} | null = null;

const CACHE_DURATION = 60000; // 1 minute

export const getDueWordsCountCached = async (userId: string): Promise<number> => {
  const now = Date.now();

  // Return cached value if fresh
  if (dueWordsCache && now - dueWordsCache.timestamp < CACHE_DURATION) {
    return dueWordsCache.count;
  }

  // Fetch fresh data
  const { data } = await supabase.rpc('get_due_words_count', {
    p_user_id: userId
  });

  const count = data || 0;

  // Update cache
  dueWordsCache = {
    count,
    timestamp: now
  };

  return count;
};
```

### Real-time Updates (Optional)

Subscribe to progress changes for real-time due count updates:

```typescript
useEffect(() => {
  if (!user) return;

  // Subscribe to user_progress changes
  const subscription = supabase
    .channel('progress-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'user_progress',
        filter: `user_id=eq.${user.id}`
      },
      (payload) => {
        // Refresh due count when progress changes
        refreshDueCount();
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}, [user]);
```

---

## Testing Checklist

### Database Tests

Test in Supabase SQL Editor:

```sql
-- Test get_due_words_count
SELECT get_due_words_count('YOUR_USER_ID');

-- Test get_mastery_distribution
SELECT * FROM get_mastery_distribution('YOUR_USER_ID');

-- Test get_due_words_by_category
SELECT * FROM get_due_words_by_category('YOUR_USER_ID');

-- Test get_user_learning_stats
SELECT * FROM get_user_learning_stats('YOUR_USER_ID');
```

### Performance Tests

- [ ] Due words query completes in < 100ms
- [ ] Mastery distribution query completes in < 50ms
- [ ] Loading all stats completes in < 200ms
- [ ] Concurrent user queries don't slow down
- [ ] Database CPU usage is acceptable

### Integration Tests

- [ ] Frontend correctly calls database functions
- [ ] Error handling works for failed RPC calls
- [ ] Loading states display properly
- [ ] Cache invalidation works correctly
- [ ] Real-time updates trigger re-fetches

---

## Acceptance Criteria

### Phase 5 is complete when:

1. ✅ All necessary indexes are created
2. ✅ Database functions for Leitner calculations exist
3. ✅ Frontend uses database functions for queries
4. ✅ Computed columns (if added) calculate correctly
5. ✅ Query performance is optimized (< 100ms for most queries)
6. ✅ Analytics tracking is implemented
7. ✅ Caching reduces unnecessary database calls
8. ✅ All database tests pass
9. ✅ No N+1 query problems
10. ✅ Database monitoring shows healthy metrics

---

## Maintenance & Monitoring

### Database Health Checks

Create utility script:

**File**: `scripts/db-health-check.ts`

```typescript
import { supabase } from '../src/lib/supabase';

async function checkDatabaseHealth() {
  console.log('Checking database health...\n');

  // Check table row counts
  const tables = ['words', 'user_progress', 'learning_sessions', 'user_preferences'];

  for (const table of tables) {
    const { count } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });

    console.log(`${table}: ${count} rows`);
  }

  // Check for orphaned records
  const { data: orphanedProgress } = await supabase
    .from('user_progress')
    .select('id')
    .not('word_id', 'in', `(SELECT id FROM words)`);

  console.log(`\nOrphaned progress records: ${orphanedProgress?.length || 0}`);

  console.log('\nDatabase health check complete.');
}

checkDatabaseHealth();
```

### Regular Maintenance Tasks

Add to `package.json`:

```json
{
  "scripts": {
    "db:health": "ts-node scripts/db-health-check.ts",
    "db:vacuum": "psql $DATABASE_URL -c 'VACUUM ANALYZE;'",
    "db:stats": "ts-node scripts/db-stats.ts"
  }
}
```

---

## Next Steps

After completing Phase 5, proceed to:
- **Phase 6**: Testing & Documentation (E2E tests, docs updates)

---

## Notes & Tips

- Run migrations on test database first, always
- Monitor query performance in Supabase dashboard
- Use `EXPLAIN ANALYZE` for slow queries
- Set up database backup strategy
- Document all custom functions thoroughly
- Consider read replicas for scaling (future)
- Use connection pooling (Supabase provides this)

---

**File Created**: `docs/implementation/leitner-system/phase-5-database-backend.md`
