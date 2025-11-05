# Supabase API Keys Reference

**Last Updated:** 2025-10-05

## How to Retrieve Supabase API Keys

### Method 1: Using Supabase Management API (Programmatic)

```bash
# Requires SUPABASE_ACCESS_TOKEN (found in .env file)
curl -s "https://api.supabase.com/v1/projects/{PROJECT_ID}/api-keys" \
  -H "Authorization: Bearer {SUPABASE_ACCESS_TOKEN}"
```

**Example for Test Database:**
```bash
curl -s "https://api.supabase.com/v1/projects/slhyzoupwluxgasvapoc/api-keys" \
  -H "Authorization: Bearer YOUR_SUPABASE_ACCESS_TOKEN"
```

**Example for Production Database:**
```bash
curl -s "https://api.supabase.com/v1/projects/gjftooyqkmijlvqbkwdr/api-keys" \
  -H "Authorization: Bearer YOUR_SUPABASE_ACCESS_TOKEN"
```

### Method 2: Using Supabase Dashboard (Manual)

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Settings** → **API**
4. Copy the keys under "Project API keys"

## Current Projects

### Test Database (E2E Testing)
- **Project ID:** `slhyzoupwluxgasvapoc`
- **Project Name:** Italian Flashcards Testing
- **URL:** https://slhyzoupwluxgasvapoc.supabase.co
- **Dashboard:** https://supabase.com/dashboard/project/slhyzoupwluxgasvapoc
- **Anon Key:** Retrieved via API (see `.env.test.local`)
- **Service Role Key:** Retrieved via API (stored securely)

### Production Database
- **Project ID:** `gjftooyqkmijlvqbkwdr`
- **Project Name:** arkuksin's Project
- **URL:** https://gjftooyqkmijlvqbkwdr.supabase.co
- **Dashboard:** https://supabase.com/dashboard/project/gjftooyqkmijlvqbkwdr
- **Anon Key:** Retrieved via API (see `.env.local`)
- **Service Role Key:** Retrieved via API (see `.env`)

## Environment Files

| File | Purpose | Database |
|------|---------|----------|
| `.env` | Server-side config (MCP tools) | Production |
| `.env.local` | Frontend config (Vite) | Production |
| `.env.test.local` | E2E testing config | Test |
| `.env.vercel.preview` | Vercel Preview deployments | Test |
| `.env.vercel.production` | Vercel Production deployments | Production |

## API Key Types

1. **Anon Key** (`anon`)
   - Safe for client-side use
   - Respects Row Level Security (RLS)
   - Used in frontend applications
   - Prefix: `eyJhbGc...`

2. **Service Role Key** (`service_role`)
   - ⚠️ **NEVER expose to client**
   - Bypasses RLS policies
   - Used for server-side operations
   - Prefix: `eyJhbGc...`

## Access Token Location

The Supabase Access Token (`sbp_...`) is stored in:
- **File:** `.env` (root directory)
- **Variable:** `SUPABASE_ACCESS_TOKEN`

This token is required to manage Supabase projects programmatically.

**⚠️ IMPORTANT:** Never commit the actual access token to git. It's stored in `.env` which is gitignored.

## Verifying API Keys

Test if an API key works:

```bash
# Replace {URL} and {API_KEY} with actual values
curl -s "{URL}/rest/v1/words?limit=1" \
  -H "apikey: {API_KEY}"
```

**Expected response:** JSON array (empty `[]` or with data)
**Error response:** `{"message":"Invalid API key",...}`

## Troubleshooting

### "Invalid API key" Error
1. Verify the key has no typos or extra spaces
2. Retrieve fresh keys using Method 1 or 2 above
3. Check that the key matches the correct project URL
4. Ensure the key hasn't been regenerated in the dashboard

### Update Vercel Environment Variables

**Manual Method:**
1. Vercel Preview environment variables (for E2E tests)
2. Vercel Production environment variables (for production)

Access via: https://vercel.com/your-team/italian-flashcards/settings/environment-variables

**Programmatic Method (Using Vercel API):**

```bash
# Get Vercel API token from .env file
VERCEL_API_KEY=YOUR_VERCEL_API_TOKEN
PROJECT_ID=prj_MF9abEzyIQBMVraPsD3K81CXm3o6

# List all environment variables for the project
curl -s "https://api.vercel.com/v9/projects/$PROJECT_ID" \
  -H "Authorization: Bearer $VERCEL_API_KEY"

# Get specific environment variable (Preview VITE_SUPABASE_ANON_KEY)
curl -s "https://api.vercel.com/v10/projects/$PROJECT_ID/env/qnPkN49isRnxT35r" \
  -H "Authorization: Bearer $VERCEL_API_KEY"

# Update environment variable
curl -X PATCH "https://api.vercel.com/v10/projects/$PROJECT_ID/env/qnPkN49isRnxT35r" \
  -H "Authorization: Bearer $VERCEL_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "value": "YOUR_NEW_API_KEY",
    "target": ["preview"]
  }'
```

**Environment Variable IDs:**
- Preview `VITE_SUPABASE_URL`: `G8ktRQSwkS27OoxX`
- Preview `VITE_SUPABASE_ANON_KEY`: `qnPkN49isRnxT35r`
- Preview `VITE_TEST_MODE`: `DbFvj1ZVS2xHSaDX`
- Preview `NODE_ENV`: `Hh6iZA6wx591bJh5`

**Last Updated:** 2025-10-05 - Fixed incorrect API key typo in both `.env.test.local` and Vercel Preview environment
