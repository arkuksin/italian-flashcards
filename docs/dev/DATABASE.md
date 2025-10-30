# Database Guide

Comprehensive documentation for the Italian Flashcards Supabase database, including schema, query patterns, email safety, and maintenance procedures.

## Table of Contents

- [Overview](#overview)
- [Database Architecture](#database-architecture)
- [Schema Documentation](#schema-documentation)
- [Supabase Configuration](#supabase-configuration)
- [Query Patterns](#query-patterns)
- [Email Safety (CRITICAL)](#email-safety-critical)
- [Database Maintenance](#database-maintenance)
- [Common Operations](#common-operations)
- [Troubleshooting](#troubleshooting)

## Overview

The application uses **Supabase** (PostgreSQL) for data persistence with two separate databases:

- **Production Database** - Real user data (`gjftooyqkmijlvqbkwdr.supabase.co`)
- **Test Database** - Development and testing (`slhyzoupwluxgasvapoc.supabase.co`)

### Key Features

- Row Level Security (RLS) for data protection
- Leitner spaced repetition system for progress tracking
- Real-time subscriptions (planned for future)
- Automatic timestamp management
- Type-safe queries with generated TypeScript types

## Database Architecture

### Two-Database Strategy

| Database | URL | Purpose | Users | Environment |
|----------|-----|---------|-------|-------------|
| **Production** | `gjftooyqkmijlvqbkwdr` | Real app data | Real users | Production |
| **Test** | `slhyzoupwluxgasvapoc` | Development/testing | Test users | Local dev + PR preview |

**Critical Rule**: ⚠️ NEVER test against production database

### Why Two Databases?

1. **Email Safety** - Test users don't affect production email reputation
2. **Data Isolation** - Development changes won't corrupt real user data
3. **Testing Freedom** - Break things without consequences
4. **Performance** - Test queries don't slow down production

## Schema Documentation

### Database Tables

The database consists of 3 main tables:

1. **words** - Vocabulary storage (300+ Russian-Italian pairs)
2. **user_progress** - Individual word learning progress
3. **learning_sessions** - Study session tracking

### Table: `words`

**Purpose**: Store Russian-Italian word pairs

**Schema**:
```sql
CREATE TABLE words (
  id SERIAL PRIMARY KEY,
  russian TEXT NOT NULL,
  italian TEXT NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**TypeScript Type**:
```typescript
interface Word {
  id: number
  russian: string
  italian: string
  category: string
  created_at: string
}
```

**Categories** (30 total):
```
nouns, verbs, colors, family, numbers, time, body, animals,
weather, adjectives, transport, places, food, clothing, common,
objects, emotions, professions, sports, nature, arts,
entertainment, communication, events, health, directions,
days, months, seasons, location
```

**Indexes**:
- Primary key on `id`
- Index on `category` for filtered queries
- Index on `(russian, italian)` for duplicate prevention

**RLS Policies**:
- Public read access (all users can view words)
- Admin-only write access (protect vocabulary data)

**Sample Data**:
```sql
INSERT INTO words (russian, italian, category) VALUES
  ('привет', 'ciao', 'common'),
  ('спасибо', 'grazie', 'common'),
  ('да', 'sì', 'common');
```

### Table: `user_progress`

**Purpose**: Track individual word learning progress using Leitner system

**Schema**:
```sql
CREATE TABLE user_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  word_id INTEGER NOT NULL REFERENCES words(id) ON DELETE CASCADE,
  correct_count INTEGER DEFAULT 0,
  wrong_count INTEGER DEFAULT 0,
  last_practiced TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  mastery_level INTEGER DEFAULT 0 CHECK (mastery_level >= 0 AND mastery_level <= 5),
  UNIQUE(user_id, word_id)
);
```

**TypeScript Type**:
```typescript
interface WordProgress {
  id: string
  user_id: string
  word_id: number
  correct_count: number
  wrong_count: number
  last_practiced: string
  mastery_level: number // 0-5 (Leitner System levels)
}
```

**Mastery Levels** (Leitner System):
- **Level 0**: New word (never seen)
- **Level 1**: Seen once, needs frequent review
- **Level 2**: Familiar, review every day
- **Level 3**: Known, review every 3 days
- **Level 4**: Well-known, review weekly
- **Level 5**: Mastered, review monthly

**Indexes**:
- Primary key on `id`
- Index on `user_id` for user-specific queries
- Index on `word_id` for word-specific queries
- Unique constraint on `(user_id, word_id)` to prevent duplicates

**RLS Policies**:
- Users can only access their own progress records
- Automatic `user_id` injection in queries

**Level Progression Logic**:
```typescript
// Correct answer: level up
if (correct) {
  mastery_level = Math.min(mastery_level + 1, 5)
}

// Wrong answer: level down (but not below 0)
else {
  mastery_level = Math.max(mastery_level - 1, 0)
}
```

### Table: `learning_sessions`

**Purpose**: Track study sessions for analytics and statistics

**Schema**:
```sql
CREATE TABLE learning_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  words_studied INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  learning_direction TEXT DEFAULT 'ru-it' CHECK (learning_direction IN ('ru-it', 'it-ru'))
);
```

**TypeScript Type**:
```typescript
interface LearningSession {
  id: string
  user_id: string
  started_at: string
  ended_at: string | null
  words_studied: number
  correct_answers: number
  learning_direction: 'ru-it' | 'it-ru'
}
```

**Indexes**:
- Primary key on `id`
- Index on `user_id` for user-specific queries
- Index on `started_at` for time-based queries

**RLS Policies**:
- Users can only access their own sessions
- Automatic `user_id` injection in queries

**Analytics Use Cases**:
- Calculate total study time
- Track accuracy over time
- Identify preferred learning direction
- Generate progress reports

### Row Level Security (RLS)

All tables have RLS enabled for security:

**`words` table**:
```sql
-- Allow public read access
CREATE POLICY "Anyone can view words"
  ON words FOR SELECT
  USING (true);
```

**`user_progress` table**:
```sql
-- Users can only access their own progress
CREATE POLICY "Users can view their own progress"
  ON user_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress"
  ON user_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
  ON user_progress FOR UPDATE
  USING (auth.uid() = user_id);
```

**`learning_sessions` table**:
```sql
-- Users can only access their own sessions
CREATE POLICY "Users can view their own sessions"
  ON learning_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions"
  ON learning_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

## Supabase Configuration

### Environment Variables

#### Local Development (`.env.local`)

```bash
# Test database (default for local dev)
VITE_SUPABASE_URL=https://slhyzoupwluxgasvapoc.supabase.co
VITE_SUPABASE_ANON_KEY=<test_database_anon_key>
```

#### Production (`.env.production.local`)

```bash
# Production database (ONLY for production deployments)
VITE_SUPABASE_URL=https://gjftooyqkmijlvqbkwdr.supabase.co
VITE_SUPABASE_ANON_KEY=<production_database_anon_key>
```

### Client Initialization

**Location**: `src/lib/supabase.ts`

```typescript
import { createClient } from '@supabase/supabase-js'
import type { Database } from './database-types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
```

**Type Safety**: The `Database` type ensures all queries are type-checked at compile time.

### Generating TypeScript Types

When database schema changes:

```bash
# Generate types from Supabase (requires Supabase CLI)
npx supabase gen types typescript --project-id gjftooyqkmijlvqbkwdr > src/lib/database-types.ts
```

**Manual Alternative**: Update `src/lib/database-types.ts` manually based on schema.

## Query Patterns

### Fetching Words

**Get all words**:
```typescript
const { data: words, error } = await supabase
  .from('words')
  .select('*')
  .order('id')
```

**Get words by category**:
```typescript
const { data: words, error } = await supabase
  .from('words')
  .select('*')
  .eq('category', 'common')
  .order('id')
```

**Get random words** (for shuffle mode):
```typescript
// Supabase doesn't have native random(), so fetch all and shuffle client-side
const { data: words } = await supabase
  .from('words')
  .select('*')

const shuffled = words.sort(() => Math.random() - 0.5)
```

### User Progress Queries

**Get user's progress for a word**:
```typescript
const { data: progress, error } = await supabase
  .from('user_progress')
  .select('*')
  .eq('word_id', wordId)
  .single() // RLS automatically filters by user_id
```

**Upsert progress after answer**:
```typescript
const { error } = await supabase
  .from('user_progress')
  .upsert({
    user_id: userId,
    word_id: wordId,
    correct_count: correct ? existingCount + 1 : existingCount,
    wrong_count: !correct ? existingCount + 1 : existingCount,
    mastery_level: newMasteryLevel,
    last_practiced: new Date().toISOString()
  }, {
    onConflict: 'user_id,word_id' // Update if exists
  })
```

**Get all user progress (for statistics)**:
```typescript
const { data: allProgress, error } = await supabase
  .from('user_progress')
  .select('*')
  .order('last_practiced', { ascending: false })
// RLS automatically filters by user_id
```

**Get mastered words count**:
```typescript
const { count, error } = await supabase
  .from('user_progress')
  .select('*', { count: 'exact', head: true })
  .eq('mastery_level', 5)
// RLS automatically filters by user_id
```

### Learning Session Queries

**Start a new session**:
```typescript
const { data: session, error } = await supabase
  .from('learning_sessions')
  .insert({
    user_id: userId,
    learning_direction: 'ru-it',
    started_at: new Date().toISOString()
  })
  .select()
  .single()
```

**Update session on completion**:
```typescript
const { error } = await supabase
  .from('learning_sessions')
  .update({
    ended_at: new Date().toISOString(),
    words_studied: totalWords,
    correct_answers: correctCount
  })
  .eq('id', sessionId)
```

**Get user's recent sessions**:
```typescript
const { data: sessions, error } = await supabase
  .from('learning_sessions')
  .select('*')
  .order('started_at', { ascending: false })
  .limit(10)
// RLS automatically filters by user_id
```

### Advanced Queries

**Get words user hasn't studied yet**:
```typescript
// Fetch all words
const { data: allWords } = await supabase
  .from('words')
  .select('*')

// Fetch user's progress
const { data: userProgress } = await supabase
  .from('user_progress')
  .select('word_id')

// Filter client-side
const studiedWordIds = new Set(userProgress.map(p => p.word_id))
const unstudiedWords = allWords.filter(w => !studiedWordIds.has(w.id))
```

**Get words due for review (Leitner system)**:
```typescript
const now = new Date()

const { data: dueWords } = await supabase
  .from('user_progress')
  .select('*, word:words(*)')
  .or(`
    mastery_level.eq.1.and.last_practiced.lt.${subtractDays(now, 1)},
    mastery_level.eq.2.and.last_practiced.lt.${subtractDays(now, 3)},
    mastery_level.eq.3.and.last_practiced.lt.${subtractDays(now, 7)},
    mastery_level.eq.4.and.last_practiced.lt.${subtractDays(now, 30)}
  `)
```

## Email Safety (CRITICAL)

### The Problem

High email bounce rates can cause Supabase to **restrict email sending**, breaking:
- ❌ User sign-ups (no confirmation emails)
- ❌ Password resets
- ❌ Account verification
- ❌ Authentication system

**Goal**: Maintain 0% bounce rate

### Email Validator

**Location**: `src/lib/emailValidator.ts`

**Blocked Domains** (14 throwaway domains):
```typescript
const THROWAWAY_DOMAINS = [
  'test.com', 'example.com', 'mailinator.com', 'guerrillamail.com',
  'temp-mail.org', 'throwaway.email', 'fakeinbox.com', 'invalid.com',
  'yopmail.com', '10minutemail.com', 'trashmail.com', 'tempmail.com',
  'dispostable.com', 'maildrop.cc'
]
```

**Usage**:
```typescript
import { isValidEmail, getEmailValidationError } from '@/lib/emailValidator'

const email = 'user@test.com'
if (!isValidEmail(email)) {
  const error = getEmailValidationError(email)
  console.error(error) // "Email domain '@test.com' is not allowed"
}
```

**Integrated In**:
- `src/components/auth/LoginForm.tsx` - Sign-up form validation
- `scripts/create-test-user.js` - Script-based user creation

### Safe Email Practices

✅ **DO**:
- Use test database for all testing
- Create test users with `npm run test:create-user`
- Use real emails you control: `yourname@gmail.com`
- Use email aliases: `yourname+test@gmail.com`

❌ **DON'T**:
- Use throwaway domains (@test.com, @mailinator.com)
- Create test users in production database
- Test sign-up flow with fake emails
- Use email patterns like test@*, fake@*, invalid@*

## Database Maintenance

### Cleanup Scripts

**List users in test database**:
```bash
npm run test:list-users
```

**Clean up test users (dry run - preview only)**:
```bash
npm run test:cleanup-users
```

**Delete specific users (with confirmation)**:
```bash
npm run test:delete-users
```

**Audit production database (read-only)**:
```bash
npm run prod:list-users
```

**Preview production cleanup (NEVER auto-delete from prod!)**:
```bash
npm run prod:cleanup-users
```

### Maintenance Schedule

| Task | Frequency | Command |
|------|-----------|---------|
| **Clean test users** | Weekly | `npm run test:cleanup-users` |
| **Audit production** | Monthly | `npm run prod:list-users` |
| **Check email health** | Monthly | `npm run health:check` |
| **Backup database** | Before schema changes | Manual via Supabase dashboard |

### Database Backup

**Automated Backups** (Supabase):
- Daily backups for paid plans
- Point-in-time recovery available

**Manual Backup**:
1. Go to Supabase Dashboard → Database
2. Click "Backup" tab
3. Create manual backup before major changes

**Restore from Backup**:
1. Go to Backup tab
2. Select backup to restore
3. Click "Restore"

## Common Operations

### Setup New Database

**1. Create Supabase Project**:
- Go to https://app.supabase.com
- Click "New Project"
- Note the URL and anon key

**2. Apply Schema**:
```bash
# Generate schema SQL
node scripts/apply-schema.js

# Copy output and run in Supabase SQL Editor
# https://app.supabase.com/project/[project-id]/editor
```

**3. Seed Word Data**:
```bash
node scripts/migrate-words.js
```

**4. Verify Setup**:
```bash
node scripts/verify-supabase.js
```

### Migrate Schema Changes

**1. Test Locally** (on test database):
```sql
-- Run migration SQL in test database SQL editor
ALTER TABLE user_progress ADD COLUMN new_field TEXT;
```

**2. Update TypeScript Types**:
```bash
# Regenerate types
npx supabase gen types typescript --project-id slhyzoupwluxgasvapoc > src/lib/database-types.ts
```

**3. Update Application Code**:
- Update queries to use new fields
- Add validation for new fields
- Test thoroughly

**4. Apply to Production**:
- Backup production database first
- Run migration SQL in production SQL editor
- Regenerate production types
- Deploy application update

### Reset Database

**Test Database** (safe to reset):
```bash
# Delete all user data
npm run test:cleanup-users

# Re-seed words if needed
node scripts/migrate-words.js
```

**Production Database** (⚠️ DANGEROUS):
- NEVER reset production without explicit user consent
- Always backup first
- Consider data retention policies

## Troubleshooting

### Common Issues

#### "permission denied for table X"

**Cause**: RLS policy blocking query

**Solution**:
```sql
-- Check RLS policies in Supabase dashboard
-- Table Editor → [table] → RLS tab

-- Verify user is authenticated
SELECT auth.uid(); -- Should return user ID, not NULL
```

#### "duplicate key value violates unique constraint"

**Cause**: Trying to insert duplicate `(user_id, word_id)` in `user_progress`

**Solution**: Use `upsert` instead of `insert`:
```typescript
.upsert({ ... }, { onConflict: 'user_id,word_id' })
```

#### Queries are slow

**Possible Causes**:
1. Missing indexes
2. Large table scans
3. Complex joins

**Solution**:
```sql
-- Check query plan
EXPLAIN ANALYZE SELECT * FROM user_progress WHERE user_id = '...';

-- Add indexes if needed
CREATE INDEX idx_user_progress_mastery ON user_progress(mastery_level);
```

#### Connection errors

**Symptoms**: "Failed to fetch" or timeout errors

**Possible Causes**:
1. Wrong database URL
2. Network issues
3. Supabase project paused (free tier)

**Solution**:
```bash
# Verify environment variables
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_ANON_KEY

# Check Supabase dashboard for project status
# Unpause project if needed (free tier limitation)
```

### Debugging Queries

**Enable query logging**:
```typescript
// Add to supabase client initialization
const supabase = createClient(url, key, {
  auth: { persistSession: true },
  global: {
    headers: { 'x-my-custom-header': 'debug' },
    // Log all requests
    fetch: (url, options) => {
      console.log('Supabase Query:', url, options)
      return fetch(url, options)
    }
  }
})
```

**Check Supabase logs**:
- Go to Supabase Dashboard → Logs
- Filter by time range
- Look for query errors or slow queries

## Related Documentation

- **[Testing Guide](./TESTING.md)** - E2E tests and test database usage
- **[Authentication Guide](./AUTHENTICATION.md)** - User authentication flows
- **[Architecture Guide](./ARCHITECTURE.md)** - Application data flow
- **[Deployment Guide](./DEPLOYMENT.md)** - Environment configuration

## Additional Resources

- **[Supabase Documentation](https://supabase.com/docs)** - Official Supabase docs
- **[PostgreSQL Documentation](https://www.postgresql.org/docs/)** - PostgreSQL reference
- **[Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)** - RLS best practices
- **[Leitner System](https://en.wikipedia.org/wiki/Leitner_system)** - Spaced repetition algorithm

---

**Last Updated**: 2025-10-30
**Maintainer**: Development team with Claude Code assistance
**Database Version**: PostgreSQL 15 (via Supabase)
