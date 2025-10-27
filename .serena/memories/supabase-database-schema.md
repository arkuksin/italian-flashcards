# Supabase Database Schema

## Database Configuration

### Test Database
- **Project ID**: slhyzoupwluxgasvapoc
- **URL**: https://slhyzoupwluxgasvapoc.supabase.co
- **Usage**: E2E Tests, local development
- **MCP Server Name**: `supabase`

### Production Database
- **Project ID**: gjftooyqkmijlvqbkwdr
- **URL**: https://gjftooyqkmijlvqbkwdr.supabase.co
- **Usage**: Live production app
- **Frontend**: Uses VITE_SUPABASE_URL in .env

## Tables (Both Databases)

Both test and production databases have the same 4 tables:

### 1. words
Russian-Italian word pairs
- `id` (integer, primary key)
- `russian` (text)
- `italian` (text)
- `category` (text)
- `created_at` (timestamp)

### 2. user_preferences
User settings and preferences
- `id` (uuid, primary key)
- `user_id` (uuid)
- `dark_mode` (boolean, default: false)
- `default_learning_direction` (text, default: 'ru-it')
- `shuffle_mode` (boolean, default: false)
- `daily_goal` (integer, default: 20)
- `notification_enabled` (boolean, default: true)
- `created_at` (timestamp)
- `updated_at` (timestamp)

### 3. learning_sessions
Learning session tracking
- `id` (uuid, primary key)
- `user_id` (uuid)
- `started_at` (timestamp)
- `ended_at` (timestamp)
- `words_studied` (integer, default: 0)
- `correct_answers` (integer, default: 0)
- `wrong_answers` (integer, default: 0)
- `learning_direction` (text)
- `session_duration_seconds` (integer)
- `created_at` (timestamp)

### 4. user_progress
Per-word learning progress
- `id` (uuid, primary key)
- `user_id` (uuid)
- `word_id` (integer, foreign key to words.id)
- `correct_count` (integer, default: 0)
- `wrong_count` (integer, default: 0)
- `last_practiced` (timestamp)
- `mastery_level` (integer, default: 0)
- `created_at` (timestamp)
- `updated_at` (timestamp)

## MCP Tools Usage

Use these exact table names with MCP Supabase tools:
```
mcp__supabase__supabase_select(table="words")
mcp__supabase__supabase_select(table="user_preferences")
mcp__supabase__supabase_select(table="learning_sessions")
mcp__supabase__supabase_select(table="user_progress")
```

## Data Status (as of 2025-10-12)

**Test Database:**
- words: Has data (300+ Russian-Italian word pairs)
- user_preferences: Empty
- learning_sessions: Empty
- user_progress: Empty

## API Access

Direct REST API access works:
```bash
curl "https://[PROJECT_ID].supabase.co/rest/v1/[TABLE_NAME]" \
  -H "apikey: [ANON_KEY]" \
  -H "Authorization: Bearer [SERVICE_ROLE_KEY]"
```

Credentials stored in `.env` file.