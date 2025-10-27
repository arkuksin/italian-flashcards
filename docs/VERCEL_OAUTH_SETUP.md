# Vercel OAuth Setup Guide

## Problem

When deploying to Vercel, OAuth authentication (Google, GitHub) may fail because Vercel creates unique preview URLs for each deployment. These URLs need to be configured in Supabase as allowed redirect URLs.

## Solution

### 1. Configure Supabase Redirect URLs

You need to add Vercel URLs to your Supabase project's allowed redirect URLs.

#### Steps:

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Authentication** → **URL Configuration**
4. In the **Redirect URLs** section, add the following patterns:

**For Production:**
```
https://your-production-domain.vercel.app/auth/callback
```

**For Preview Deployments:**
```
https://*-arkuksins-projects.vercel.app/auth/callback
https://*.vercel.app/auth/callback
```

**For Development:**
```
http://localhost:5173/auth/callback
```

5. Click **Save**

### 2. Configure OAuth Providers

For each OAuth provider (Google, GitHub), you also need to update their redirect URIs.

#### Google OAuth Configuration

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **APIs & Services** → **Credentials**
4. Click on your OAuth 2.0 Client ID
5. Under **Authorized redirect URIs**, add:

```
https://your-supabase-project.supabase.co/auth/v1/callback
```

Note: You only need to add the Supabase callback URL here. Supabase handles the redirect to your app.

#### GitHub OAuth Configuration

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click on your OAuth App
3. Update the **Authorization callback URL** to:

```
https://your-supabase-project.supabase.co/auth/v1/callback
```

### 3. Verify Vercel Environment Variables

Ensure these environment variables are set in your Vercel project:

| Variable | Value | Scope |
|----------|-------|-------|
| `VITE_SUPABASE_URL` | `https://your-project.supabase.co` | All |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key | All |

Check with:
```bash
vercel env ls
```

### 4. Test the Setup

1. **Deploy to Vercel** (or trigger a new preview deployment)
2. **Visit your Vercel preview URL** (e.g., `https://italian-flashcards-xyz.vercel.app`)
3. **Click "Sign in with Google"** or **"Sign in with GitHub"**
4. **Authorize the app** on the provider's consent screen
5. **Verify** you are redirected back to your app and logged in

## Common Issues

### Issue 1: "Redirect URI mismatch" Error

**Symptom:** Error message when trying to authenticate with OAuth

**Solution:**
- Check that you added the Vercel wildcard URLs to Supabase redirect URLs
- Verify the OAuth provider (Google/GitHub) has the correct Supabase callback URL
- Wait 5-10 minutes for changes to propagate

### Issue 2: "No session found" After Redirect

**Symptom:** User is redirected back but not logged in

**Solution:**
- Check browser console for errors
- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Vercel are correct
- Check Supabase Auth Logs in dashboard for errors

### Issue 3: Works Locally but Not on Vercel

**Symptom:** OAuth works on `localhost:5173` but fails on Vercel

**Solution:**
- Ensure Vercel URLs are added to Supabase redirect URLs (with wildcard `*`)
- Clear browser cache and cookies
- Check Vercel deployment logs for errors

## Debugging

### Check Callback URL

When the OAuth redirect happens, check the URL in your browser:

**Expected:**
```
https://your-app.vercel.app/auth/callback#access_token=...
```

**If you see an error:**
```
https://your-app.vercel.app/auth/callback#error=...&error_description=...
```

The error description will tell you what went wrong.

### Check Supabase Auth Logs

1. Go to Supabase Dashboard
2. Navigate to **Authentication** → **Logs**
3. Look for recent auth attempts
4. Check for error messages

### Browser Console

Open browser console (F12) and check for:
- Network errors (failed requests)
- Console errors (JavaScript errors)
- Auth state changes (logged by AuthContext)

## Wildcard URL Patterns

Supabase supports wildcard patterns for redirect URLs:

| Pattern | Matches |
|---------|---------|
| `https://*.vercel.app/auth/callback` | All Vercel apps |
| `https://*-username.vercel.app/auth/callback` | All apps for a specific user |
| `https://app-*.vercel.app/auth/callback` | Apps with specific prefix |

**Recommended for Vercel:**
```
https://*-arkuksins-projects.vercel.app/auth/callback
```

This will match all your Vercel preview deployments.

## Security Notes

- Always use HTTPS in production (Vercel provides this automatically)
- Keep your Supabase service role key secret (never expose in frontend)
- Use only the anon key in frontend code
- Regularly review and remove unused redirect URLs
- Consider using separate Supabase projects for development and production

## Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [GitHub OAuth Documentation](https://docs.github.com/en/developers/apps/building-oauth-apps)

---

**Last Updated:** 2025-10-27
