# Vercel MCP Server Setup Guide

## 🎯 Overview

I've configured a Vercel MCP server in your project to enable direct access to your Vercel environment variables and configuration through MCP tools. This will allow us to check and manage your Vercel settings programmatically.

## ✅ What's Already Configured

### MCP Configuration Updated
Your `.mcp.json` now includes the Vercel MCP server:

```json
{
  "mcpServers": {
    "supabase": { ... },
    "vercel": {
      "command": "npx",
      "args": ["vercel-mcp", "VERCEL_API_KEY=${VERCEL_API_KEY}"],
      "env": {
        "VERCEL_API_KEY": "${VERCEL_API_KEY}"
      }
    }
  }
}
```

## 🔧 Required Setup Step

### Add Vercel API Key to Environment

You need to add your Vercel API key to your `.env` file. Your GitHub secret `VERCEL_TOKEN` is likely the same value.

**Option 1: Use GitHub CLI to get the token value**
```bash
# Unfortunately, GitHub secrets can't be read directly for security
# You'll need to get this from Vercel dashboard
```

**Option 2: Get API key from Vercel Dashboard**
1. Go to https://vercel.com/account/tokens
2. Create a new token or copy existing one
3. Add it to your `.env` file

**Option 3: Use the same token from your GitHub secret**
Since your GitHub Actions use `VERCEL_TOKEN`, that's likely your API key.

### Add to .env file
```bash
# Add this line to your .env file:
VERCEL_API_KEY=your_vercel_api_token_here
```

### Complete .env Example
```env
# Supabase Configuration
SUPABASE_URL=https://gjftooyqkmijlvqbkwdr.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sb_secret_Vn-6lepBjN0SNTPXjqj4pw_39XY77hB
SUPABASE_ACCESS_TOKEN=sbp_8419c0bd784828cb69d51e8fbd00251e7823ee00

# Vercel Configuration (for MCP)
VERCEL_API_KEY=your_vercel_api_token_here

# Frontend Configuration
VITE_SUPABASE_URL=https://gjftooyqkmijlvqbkwdr.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_6bQGCR5p7zgjg2sX1G3uEA_JrAiR1W2
```

## 🧪 Testing the MCP Server

After adding the API key, you can test the Vercel MCP server:

### Manual Test
```bash
# Test if the package works
npx vercel-mcp VERCEL_API_KEY=your_api_key_here
```

### Available MCP Tools

Once configured, the Vercel MCP server provides these tools:
- `list_env` - List environment variables
- `add_env` - Add environment variables
- `update_env` - Update environment variables
- `delete_env` - Delete environment variables
- `get_env` - Get specific environment variable
- Project management tools
- Deployment management tools
- Domain management tools

## 🎯 What We Can Check

Once the MCP server is running, we can:

1. **List all environment variables** by environment (Production, Preview, Development)
2. **Check current configuration** for your italian-flashcards project
3. **Add missing test environment variables** automatically
4. **Compare** current setup with required configuration

## 🚀 Next Steps

1. **Add Vercel API key** to your `.env` file
2. **Restart Claude Code** (if needed) to pick up the new MCP server
3. **Test the connection** by asking me to list your Vercel environment variables
4. **Automatically configure** missing test environment variables

## 🔐 Security Notes

- The Vercel API key in `.env` is gitignored (safe)
- Only server-side MCP tools will have access
- Same security level as your GitHub Actions

## 📞 Getting Your Vercel API Key

### From Vercel Dashboard
1. Go to https://vercel.com/account/tokens
2. Click "Create Token"
3. Name it "MCP Server Access"
4. Select appropriate scope (full access recommended)
5. Copy the token

### From GitHub Secret (if accessible)
Your `VERCEL_TOKEN` GitHub secret is likely the same value used in your workflows.

## ✅ Verification

Once setup is complete, I can:
- List your current Vercel environment variables
- Compare with required test database setup
- Add missing Preview environment variables
- Verify your production configuration

Let me know when you've added the API key, and I'll test the MCP connection!