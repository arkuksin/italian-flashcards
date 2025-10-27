# Incident Report · 2025-10-14 · Supabase Email Verification

**Summary**  
New users could not complete signup because the Supabase confirmation email pointed to `http://localhost:3000/auth/callback`. Some providers silently dropped the message, and anyone who did receive it was redirected to a non-existent domain. The Supabase project still used the local development URL in its Auth configuration, so every outgoing verification email carried the wrong redirect target.

**Impact**
- Registration flow reported success but users never saw a working confirmation message.
- Verification links (when delivered) redirected to localhost, leaving accounts unconfirmed.

**Root Cause**
- `Authentication → URL Configuration → Site URL` remained set to `http://localhost:3000`.
- The redirect allow list was missing the production domain (`https://italian-flashcards-eight.vercel.app`), so Supabase substituted the Site URL in email templates.

**Fix**
1. Updated the Supabase Auth configuration via management API:
   - `site_url` → `https://italian-flashcards-eight.vercel.app`
   - `uri_allow_list` → `https://italian-flashcards-eight.vercel.app/auth/callback`, `http://localhost:5173/auth/callback`, `https://italian-flashcards-*.vercel.app/auth/callback`
2. Added `scripts/check-supabase-auth-config.js` and `npm run health:auth-config` to verify the settings programmatically.
3. Created test accounts through the production signup flow and confirmed the mail delivered within seconds and now links to `https://italian-flashcards-eight.vercel.app/auth/callback`.
4. Removed temporary test accounts from Supabase to avoid clutter.

**Verification**
- `npm run health:auth-config` passes (requires `SUPABASE_PROD_ACCESS_TOKEN`).
- Signup with `codex1760444477@tiffincrane.com` received `Confirm Your Signup` email in <10 s with the correct redirect URL.

**Follow-up**
- Run `npm run health:auth-config` after any infrastructure change or Supabase maintenance.
- Keep `cleanup/supabase-email-config.md` in sync with the current domain.
- Monitor Supabase bounce logs weekly to ensure deliverability stays green.
