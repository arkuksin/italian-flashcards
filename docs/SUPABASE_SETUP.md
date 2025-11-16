# Supabase Setup Guide for Italian Flashcards

## Overview

Your Supabase project is already configured and connected! This guide documents the setup and provides instructions for completing the database configuration.

## Current Status

### ✅ Completed
- Supabase project created (URL: `https://gjftooyqkmijlvqbkwdr.supabase.co`)
- Environment variables configured
- Supabase client libraries installed
- Client configuration created (`src/lib/supabase.ts`)
- Database schema SQL prepared
- Migration scripts ready
- MCP Server configured

### 🔄 Next Steps Required

## ⚠️ Email Bounce Prevention

**IMPORTANT**: Supabase monitors email deliverability and can temporarily restrict email sending if bounce rates are high.

### To Avoid Bounce Issues

**✅ DO**:
- ✅ **Use test database for all development and testing**
  - Local development: Already configured in `.env.local` → test database
  - Test database URL: `https://slhyzoupwluxgasvapoc.supabase.co`
  - Safe to experiment without affecting production

- ✅ **Create test users with `scripts/create-test-user.js`**
  ```bash
  npm run test:create-user
  ```
  - Bypasses email confirmation (`email_confirm: true`)
  - No emails sent = no bounce risk
  - Works instantly

- ✅ **Use real email addresses you control**
  - Your personal email: `yourname@gmail.com`
  - Email aliases: `yourname+test@gmail.com`
  - Dedicated test account: `myapp-test@gmail.com`

**❌ DON'T**:
- ❌ **Don't use throwaway email domains**
  - `@test.com`, `@example.com`, `@mailinator.com`
  - `@guerrillamail.com`, `@temp-mail.org`, `@throwaway.email`
  - These cause immediate bounces and damage sender reputation

- ❌ **Don't create test users in production database**
  - Production URL: `https://gjftooyqkmijlvqbkwdr.supabase.co`
  - Only use for actual production deployments
  - Test users here can cause bounce issues

- ❌ **Don't test signup flow with fake emails**
  - Email validation now blocks throwaway domains
  - Use script-based creation or real emails instead

### Why This Matters

High bounce rates (>5%) can cause Supabase to:
- ❌ Temporarily restrict email sending
- ❌ Block new user signups (no confirmation emails)
- ❌ Disable password resets
- ❌ Break your application for new users

### See Also

- **[Testing Best Practices](./TESTING_BEST_PRACTICES.md)** - Complete testing guidelines
- **[E2E Authentication Testing](./E2E_AUTHENTICATION_TESTING.md)** - E2E test configuration
- **[Cleanup Procedures](./CLEANUP_PROCEDURES.md)** - Maintenance procedures
- **[Bounce Logs Check](../cleanup/bounce-logs-check.md)** - Monitoring guide

---

## Step 1: Apply Database Schema

The database schema is ready in `supabase/schema.sql`. You need to execute it in your Supabase project:

1. **Go to your Supabase Dashboard**
   - Open: https://app.supabase.com/project/gjftooyqkmijlvqbkwdr
   - Navigate to the SQL Editor (left sidebar)

2. **Create the database tables**
   - Click "New Query"
   - Copy the entire contents of `supabase/schema.sql`
   - Paste it into the SQL Editor
   - Click "Run" to execute

3. **Verify the tables were created**
   - Go to Table Editor in the dashboard
   - You should see these tables:
     - `words` - Stores all vocabulary
     - `user_progress` - Tracks learning progress
     - `learning_sessions` - Records study sessions
     - `user_preferences` - User settings

## Step 2: Migrate Existing Words Data

After creating the tables, import your 300 words:

```bash
# Run the migration script
node scripts/migrate-words.js
```

This will:
- Connect to your Supabase database
- Check if words already exist
- Import all 300 words from your local data
- Verify the migration was successful

## Step 3: Configure Authentication

1. **Go to Authentication Settings**
   - In Supabase Dashboard: Authentication > Configuration

2. **Enable Email Authentication**
   - Toggle ON "Enable Email Confirmations"
   - Set your site URL: `http://localhost:5173` (for development)

3. **Add OAuth Providers (Optional but Recommended)**

   **Google OAuth:**
   - Go to Authentication > Providers > Google
   - Toggle "Enable Google provider"
   - You'll need to:
     1. Create a Google Cloud project
     2. Enable Google+ API
     3. Create OAuth 2.0 credentials
     4. Add authorized redirect URI: `https://gjftooyqkmijlvqbkwdr.supabase.co/auth/v1/callback`
     5. Copy Client ID and Secret to Supabase

   **GitHub OAuth:**
   - Go to Authentication > Providers > GitHub
   - Toggle "Enable GitHub provider"
   - You'll need to:
     1. Go to GitHub Settings > Developer settings > OAuth Apps
     2. Create a new OAuth App
     3. Set Authorization callback URL: `https://gjftooyqkmijlvqbkwdr.supabase.co/auth/v1/callback`
     4. Copy Client ID and Secret to Supabase

4. **Configure Redirect URLs**
   - Go to Authentication > URL Configuration
   - Add these URLs to "Redirect URLs":
     ```
     http://localhost:5173/**
     http://localhost:5174/**
     https://your-vercel-app.vercel.app/**
     ```

## Step 4: Security Configuration

### Row Level Security (RLS)

RLS is already configured in the schema. Verify it's working:

1. Go to Authentication > Policies in Supabase Dashboard
2. Check that policies exist for each table
3. Test with the SQL Editor:

```sql
-- Test that RLS is enabled
SELECT * FROM words; -- Should work (public read)

-- These should fail without authentication
SELECT * FROM user_progress;
SELECT * FROM learning_sessions;
```

### API Security

Your project uses these keys:
- **Anon/Public Key**: Used in the frontend (safe to expose)
- **Service Role Key**: Server-side only (NEVER expose in frontend)

Current configuration:
- `.env.local` - Contains frontend-safe variables
- `.env` - Contains server/MCP variables
- Both files are gitignored for security

## Step 5: Test the Connection

Run the verification script to ensure everything is working:

```bash
node scripts/verify-supabase.js
```

Expected output:
```
✅ Successfully connected to Supabase!
   Found 300 words in the database
✅ Supabase setup verification complete!
```

## Environment Variables Reference

### Frontend (.env.local)
```env
VITE_SUPABASE_URL=https://gjftooyqkmijlvqbkwdr.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_YOUR_ANON_KEY_HERE
```

### MCP Server (.env)
```env
SUPABASE_URL=https://gjftooyqkmijlvqbkwdr.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sb_secret_YOUR_SERVICE_ROLE_KEY_HERE
SUPABASE_ACCESS_TOKEN=sbp_YOUR_ACCESS_TOKEN_HERE
```

## Project Structure

```
italian-flashcards/
├── supabase/
│   └── schema.sql          # Database schema
├── scripts/
│   ├── verify-supabase.js  # Connection verification
│   └── migrate-words.js    # Data migration
├── src/
│   └── lib/
│       └── supabase.ts     # Supabase client config
├── .env.local              # Frontend environment vars
├── .env                    # MCP Server environment vars
└── .env.example            # Example configuration
```

## Troubleshooting

### Connection Issues
- Verify your Supabase project is not paused (free tier pauses after 1 week of inactivity)
- Check that environment variables are correctly set
- Ensure you're using the correct keys (anon key for frontend)

### Authentication Issues
- Verify redirect URLs are configured in Supabase
- Check that email confirmations are properly configured
- For OAuth, ensure callback URLs match exactly

### Database Issues
- If tables don't exist, run the schema SQL again
- Check RLS policies if you get permission errors
- Verify user is authenticated when accessing protected tables

## Next Development Steps

After setup is complete, you can:

1. **Implement Authentication UI**
   - Auth components are ready to integrate
   - Use `@supabase/auth-ui-react` for quick setup

2. **Add Progress Tracking**
   - Implement hooks to save/load user progress
   - Update progress after each answer

3. **Create User Dashboard**
   - Show learning statistics
   - Display mastery levels
   - Track daily goals

4. **Deploy to Production**
   - Update environment variables in Vercel
   - Configure production redirect URLs
   - Enable proper email templates

## Security Best Practices

1. **Never commit sensitive keys**
   - `.env` files are gitignored
   - Use environment variables in production

2. **Always use RLS**
   - Already configured in schema
   - Test policies thoroughly

3. **Validate user input**
   - Sanitize before database operations
   - Use parameterized queries (Supabase client handles this)

4. **Monitor usage**
   - Check Supabase dashboard for unusual activity
   - Set up alerts for quota limits

## Support Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Project Dashboard](https://app.supabase.com/project/gjftooyqkmijlvqbkwdr)
- [Database SQL Editor](https://app.supabase.com/project/gjftooyqkmijlvqbkwdr/editor)
- [Authentication Settings](https://app.supabase.com/project/gjftooyqkmijlvqbkwdr/auth/users)