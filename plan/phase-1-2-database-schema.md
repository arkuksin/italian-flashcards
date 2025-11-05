# Phase 1.2: Database Schema Creation

## Task Description
Create the database schema for the Italian Flashcards application including tables for words, user progress tracking, and learning sessions with proper Row Level Security policies.

## Claude Code Prompt

```
I need you to create the database schema for my Italian Flashcards application using the Supabase MCP server. This schema should support user authentication, progress tracking, and learning analytics while maintaining data security through Row Level Security.

Please execute the following steps using the Supabase MCP server:

1. **Automated Database Schema Creation:**
   Use the Supabase MCP server to execute the complete database schema creation. You should:
   - Connect to my Supabase project using the configured MCP server
   - Create all required tables with proper constraints and relationships
   - Implement Row Level Security policies automatically
   - Add performance indexes
   - Verify the schema was created correctly

2. **Core Tables to Create:**
   Execute these table creations via MCP:

   ```sql
   -- Words table (public, read-only for all users)
   CREATE TABLE words (
     id SERIAL PRIMARY KEY,
     russian TEXT NOT NULL,
     italian TEXT NOT NULL,
     category TEXT NOT NULL,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );

   -- User progress tracking (private to each user)
   CREATE TABLE user_progress (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
     word_id INTEGER REFERENCES words(id) ON DELETE CASCADE,
     correct_count INTEGER DEFAULT 0,
     wrong_count INTEGER DEFAULT 0,
     last_practiced TIMESTAMPTZ DEFAULT NOW(),
     mastery_level INTEGER DEFAULT 0, -- 0-5 (Leitner System)
     UNIQUE(user_id, word_id)
   );

   -- Learning sessions for analytics
   CREATE TABLE learning_sessions (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
     started_at TIMESTAMPTZ DEFAULT NOW(),
     ended_at TIMESTAMPTZ,
     words_studied INTEGER DEFAULT 0,
     correct_answers INTEGER DEFAULT 0,
     learning_direction TEXT -- 'ru-it' or 'it-ru'
   );
   ```

3. **Automated RLS Setup:**
   Use MCP to implement security policies:

   ```sql
   -- Enable RLS on sensitive tables
   ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
   ALTER TABLE learning_sessions ENABLE ROW LEVEL SECURITY;
   ALTER TABLE words ENABLE ROW LEVEL SECURITY;

   -- User progress policies - users can only access their own data
   CREATE POLICY "Users can only see own progress" ON user_progress
     FOR ALL USING (auth.uid() = user_id);

   -- Learning sessions policies - users can only access their own sessions
   CREATE POLICY "Users can only see own sessions" ON learning_sessions
     FOR ALL USING (auth.uid() = user_id);

   -- Words table - readable by everyone, no modifications allowed via RLS
   CREATE POLICY "Words are viewable by everyone" ON words
     FOR SELECT USING (true);
   ```

4. **Performance Indexes:**
   Create indexes via MCP for optimal query performance:

   ```sql
   -- Indexes for common queries
   CREATE INDEX idx_user_progress_user_id ON user_progress(user_id);
   CREATE INDEX idx_user_progress_word_id ON user_progress(word_id);
   CREATE INDEX idx_user_progress_mastery ON user_progress(mastery_level);
   CREATE INDEX idx_words_category ON words(category);
   CREATE INDEX idx_learning_sessions_user_id ON learning_sessions(user_id);
   CREATE INDEX idx_learning_sessions_started_at ON learning_sessions(started_at);
   ```

5. **Automated Verification:**
   After schema creation, use MCP to verify everything is working:
   - Query table structure to confirm all tables exist
   - Test RLS policies with sample queries
   - Verify foreign key constraints are working
   - Check that indexes were created successfully

**Important**: Use the Supabase MCP server for ALL database operations. Do not ask me to manually execute SQL in the Supabase dashboard. Execute each SQL statement via MCP and provide confirmation of successful execution.

If any step fails, use MCP to query the database state and provide detailed error information. After completion, use MCP to query the table structure and confirm the schema is ready for data migration.
```

## Prerequisites
- Completed Phase 1.1 (Supabase project setup)
- Access to Supabase SQL Editor
- Understanding of the application's data requirements

## Expected Outcomes
- Complete database schema with all required tables
- Proper Row Level Security policies implemented
- Foreign key relationships established
- Database ready for data migration
- Security verified and tested

## Next Steps
After completing this task, proceed to Phase 1.3: Data Migration