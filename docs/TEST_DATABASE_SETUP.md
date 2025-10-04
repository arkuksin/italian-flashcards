# Test Database Setup Guide

## 🎯 Overview

A separate Supabase test database has been created for automated testing and development. This ensures tests run against clean, predictable data without affecting production.

## 📊 Project Details

### Production Database
- **Name**: arkuksin's Project
- **Reference ID**: `gjftooyqkmijlvqbkwdr`
- **URL**: https://gjftooyqkmijlvqbkwdr.supabase.co
- **Dashboard**: https://app.supabase.com/project/gjftooyqkmijlvqbkwdr

### Test Database
- **Name**: Italian Flashcards Testing
- **Reference ID**: `slhyzoupwluxgasvapoc`
- **URL**: https://slhyzoupwluxgasvapoc.supabase.co
- **Dashboard**: https://app.supabase.com/project/slhyzoupwluxgasvapoc
- **Database Password**: `TestDB123!@#`

## 🚀 Quick Setup

### 1. Apply Database Schema

The database schema needs to be applied manually via the Supabase Dashboard:

1. **Go to Test Project Dashboard**
   - Open: https://app.supabase.com/project/slhyzoupwluxgasvapoc
   - Navigate to SQL Editor (left sidebar)

2. **Execute Schema**
   - Click "New Query"
   - Copy the entire contents of `test-schema.sql`
   - Paste into the SQL Editor
   - Click "Run" to execute

3. **Verify Tables Created**
   - Go to Table Editor
   - Should see: `words`, `user_progress`, `learning_sessions`, `user_preferences`

### 2. Seed Test Data

After schema is applied, run the seeding script:

```bash
node scripts/seed-test-data.js
```

This will:
- Insert 30 test words across different categories
- Create sample user progress data
- Set up test user preferences

### 3. Configure Environment Variables

#### For Local Development
Copy `.env.test.local` to `.env.local` when testing:

```env
VITE_SUPABASE_URL=https://slhyzoupwluxgasvapoc.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsaHl6b3Vwd2x1eGdhc3ZhcG9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwMDY5OCwiZXhwIjoyMDc0NTc2Njk4fQ.hxK65OHKF8ScncLF7zlcu0qEYgKAqipmtAT2UySKVwg
VITE_TEST_MODE=true
```

#### For Vercel (Testing Environment)
Add these environment variables in Vercel dashboard:

```env
VITE_SUPABASE_URL=https://slhyzoupwluxgasvapoc.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsaHl6b3Vwd2x1eGdhc3ZhcG9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwMDY5OCwiZXhwIjoyMDc0NTc2Njk4fQ.hxK65OHKF8ScncLF7zlcu0qEYgKAqipmtAT2UySKVwg
VITE_TEST_MODE=true
NODE_ENV=test
```

#### For E2E Tests
Copy `.env.test.production.example` to `.env.test.production`:

```env
PLAYWRIGHT_TEST_BASE_URL=https://your-test-deployment.vercel.app
VITE_SUPABASE_URL=https://slhyzoupwluxgasvapoc.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsaHl6b3Vwd2x1eGdhc3ZhcG9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwMDY5OCwiZXhwIjoyMDc0NTc2Njk4fQ.hxK65OHKF8ScncLF7zlcu0qEYgKAqipmtAT2UySKVwg
TEST_USER_EMAIL=test-e2e@example.com
TEST_USER_PASSWORD=TestPassword123!
```

## 🔐 API Credentials Reference

### Test Database Keys

| Key Type | Value |
|----------|--------|
| **URL** | `https://slhyzoupwluxgasvapoc.supabase.co` |
| **Anon Key** (Public) | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsaHl6b3Vwd2x1eGdhc3ZhcG9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwMDY5OCwiZXhwIjoyMDc0NTc2Njk4fQ.hxK65OHKF8ScncLF7zlcu0qEYgKAqipmtAT2UySKVwg` |
| **Service Role Key** (Server) | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsaHl6b3Vwd2x1eGdhc3ZhcG9jIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTAwMDY5OCwiZXhwIjoyMDc0NTc2Njk4fQ.sHXPnNygm8rNozI-7p4CBxIpWMk49IpqJyLam2F7lLU` |

### Access Token
- **Access Token**: `sbp_8419c0bd784828cb69d51e8fbd00251e7823ee00`

## 📚 Test Data

The test database includes:

### Test Words (30 total)
- **Nouns**: дом→casa, вода→acqua, хлеб→pane, молоко→latte, мясо→carne
- **Family**: мама→mamma, папа→papà, сын→figlio, дочь→figlia, брат→fratello
- **Colors**: красный→rosso, синий→blu, зеленый→verde, желтый→giallo, белый→bianco
- **Verbs**: быть→essere, иметь→avere, делать→fare, говорить→parlare, идти→andare
- **Numbers**: один→uno, два→due, три→tre, четыре→quattro, пять→cinque
- **Common**: да→sì, нет→no, спасибо→grazie, пожалуйста→prego, привет→ciao

### Sample User Data
- **Test User ID**: `12345678-1234-1234-1234-123456789012`
- **Progress**: Sample learning progress for first 3 words
- **Preferences**: Default settings for testing

## 🧪 Testing Workflows

### Local Testing
```bash
# Switch to test environment
cp .env.test.local .env.local

# Start development server
npm run dev

# Run against test database
npm run test:e2e
```

### CI/CD Testing (GitHub Actions)
```bash
# E2E tests automatically use test database
# when VITE_TEST_MODE=true environment variable is set
npm run test:e2e
```

### Manual Testing
1. Switch environment variables to test database
2. Verify app connects to test data
3. Run through user workflows
4. Check that data persists correctly

## 🔄 Switching Between Environments

### To Production
```bash
cp .env.example .env.local
# Update with production credentials
```

### To Test
```bash
cp .env.test.local .env.local
```

### Environment Detection
The app can detect test mode via:
```javascript
const isTestMode = import.meta.env.VITE_TEST_MODE === 'true'
```

## 🛡️ Security & Best Practices

### Test Environment Security
- ✅ Test database has same RLS policies as production
- ✅ Service role key only used in server-side scripts
- ✅ Anon key safe for frontend use
- ✅ All test credentials are separate from production

### Data Management
- 🔄 Test data can be reset by re-running `seed-test-data.js`
- 🧹 Test database should be cleaned regularly
- 📊 Monitor test database usage to stay within free tier limits

### CI/CD Integration
- 🚀 GitHub Actions can use test database for E2E tests
- 🔒 Environment variables stored as repository secrets
- 🧪 Tests run against consistent, predictable data

## 🚨 Important Notes

1. **Schema Sync**: Keep test and production schemas in sync by applying changes to both
2. **Data Reset**: Test data should be reset before major test runs
3. **Authentication**: Test users need to be created in test database auth
4. **Monitoring**: Monitor test database usage to avoid service interruption

## 🔧 Maintenance Commands

```bash
# Reset test data
node scripts/seed-test-data.js

# Verify test database connection
node scripts/verify-supabase.js

# Apply schema updates
# (Manual via Supabase Dashboard SQL Editor)

# Switch to test environment
cp .env.test.local .env.local

# Switch back to production
cp .env.production.local .env.local
```

## 📞 Support

- **Test Database Dashboard**: https://app.supabase.com/project/slhyzoupwluxgasvapoc
- **Production Database Dashboard**: https://app.supabase.com/project/gjftooyqkmijlvqbkwdr
- **Project Documentation**: `docs/SUPABASE_SETUP.md`