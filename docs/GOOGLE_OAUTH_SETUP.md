# Google OAuth Setup and Integration Guide

This document explains how the Google OAuth integration works in the Italian Flashcards application and how to test it.

## Table of Contents
- [Overview](#overview)
- [Architecture](#architecture)
- [Components](#components)
- [Authentication Flow](#authentication-flow)
- [Testing Instructions](#testing-instructions)
- [Troubleshooting](#troubleshooting)

## Overview

The application uses **Supabase Auth** with **Google OAuth** for user authentication. Users can sign in using their Google account, and the application securely manages sessions and user data.

### Key Features
✅ Google Sign-In with OAuth 2.0
✅ Email/Password authentication (alternative method)
✅ Session persistence across page reloads
✅ Protected routes requiring authentication
✅ User profile display with logout functionality
✅ Automatic redirect after login
✅ Error handling and user feedback

## Architecture

### Technology Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Authentication**: Supabase Auth
- **Routing**: React Router v7
- **Styling**: Tailwind CSS
- **OAuth Provider**: Google OAuth 2.0

### Project Structure
```
src/
├── contexts/
│   └── AuthContext.tsx          # Authentication state management
├── components/
│   └── auth/
│       ├── LoginForm.tsx        # Login form with Google/Email options
│       └── UserProfile.tsx      # User profile dropdown with logout
├── pages/
│   ├── Login.tsx                # Login page (public route)
│   ├── Dashboard.tsx            # Main app (protected route)
│   └── Callback.tsx             # OAuth callback handler
├── lib/
│   └── supabase.ts              # Supabase client configuration
├── App.tsx                      # Routing configuration
└── main.tsx                     # App entry point with BrowserRouter
```

## Components

### 1. AuthContext (`src/contexts/AuthContext.tsx`)
Manages authentication state and provides auth functions throughout the app.

**Exported Functions:**
- `signInWithGoogle()` - Initiates Google OAuth flow
- `signInWithEmail(email, password)` - Email/password login
- `signUpWithEmail(email, password)` - Email/password registration
- `signOut()` - Logs out the user
- `resetPassword(email)` - Sends password reset email

**State:**
- `user` - Current authenticated user or `null`
- `session` - Supabase session object
- `loading` - Boolean indicating auth check in progress

### 2. LoginForm (`src/components/auth/LoginForm.tsx`)
Full-featured login form with:
- Email/password input fields
- Google Sign-In button
- GitHub Sign-In button (if configured)
- Toggle between Sign In and Sign Up modes
- Error and success message display
- Loading states

### 3. UserProfile (`src/components/auth/UserProfile.tsx`)
Dropdown component showing:
- User avatar (from Google profile)
- User name and email
- Sign Out button
- Provider information (Google, Email, etc.)

### 4. Callback Page (`src/pages/Callback.tsx`)
Handles OAuth redirect after successful Google authentication:
- Processes authentication tokens
- Creates Supabase session
- Redirects to Dashboard
- Error handling and user feedback

### 5. Protected Routes
The app uses React Router with protected routes:
- `/login` - Public login page
- `/auth/callback` - Public OAuth callback handler
- `/` - Protected dashboard (requires authentication)

## Authentication Flow

### Google OAuth Flow

1. **User clicks "Sign in with Google"**
   - `LoginForm` component calls `signInWithGoogle()`
   - AuthContext initiates OAuth flow via Supabase
   - User is redirected to Google's consent screen

2. **User authorizes the app on Google**
   - Google redirects back to `/auth/callback` with auth code
   - Callback page processes the authentication
   - Supabase exchanges code for session tokens

3. **Session created**
   - User object is stored in AuthContext
   - User is redirected to Dashboard (`/`)
   - Session persists across page reloads

4. **Using the app**
   - User can access protected routes
   - User profile shows in Header
   - User can navigate the flashcards app

5. **Logout**
   - User clicks "Sign Out" in UserProfile dropdown
   - AuthContext calls `signOut()`
   - Session is cleared
   - User is redirected to `/login`

### Email/Password Flow

1. **Sign Up**
   - User enters email and password
   - Supabase sends confirmation email
   - User clicks link to verify email
   - User can now sign in

2. **Sign In**
   - User enters credentials
   - Supabase validates credentials
   - Session created
   - Redirect to Dashboard

## Testing Instructions

### Prerequisites
Ensure you have:
- Google OAuth credentials configured in Google Cloud Console
- Supabase project with Google provider enabled
- Environment variables set in `.env`:
  ```env
  VITE_SUPABASE_URL=https://your-project.supabase.co
  VITE_SUPABASE_ANON_KEY=your-anon-key
  ```

### Manual Testing Checklist

#### 1. Start Development Server
```bash
npm run dev
```
The app should start at `http://localhost:5173`

#### 2. Test Google Sign-In
- [ ] Navigate to `http://localhost:5173`
- [ ] You should see the login page (not authenticated)
- [ ] Click "Sign in with Google" button
- [ ] Google consent screen should open in new window/tab
- [ ] Select your Google account
- [ ] Grant permissions to the app
- [ ] You should be redirected back to the app
- [ ] You should see the Dashboard with flashcards
- [ ] Check that your profile appears in the Header (top-right)

#### 3. Test User Profile
- [ ] Click on your profile picture/name in the Header
- [ ] Dropdown should show:
  - Your avatar image
  - Your name and email
  - "Signed in with Google"
  - "Sign Out" button

#### 4. Test Session Persistence
- [ ] Refresh the page (F5)
- [ ] You should remain logged in
- [ ] Dashboard should load immediately
- [ ] No redirect to login page

#### 5. Test Sign Out
- [ ] Click on your profile in Header
- [ ] Click "Sign Out"
- [ ] You should be redirected to `/login`
- [ ] Login form should be displayed
- [ ] Profile no longer visible in Header

#### 6. Test Protected Route Access
- [ ] While logged out, try to access `http://localhost:5173/`
- [ ] You should be automatically redirected to `/login`
- [ ] After logging in, you should be redirected back to `/`

#### 7. Test Email Authentication (Alternative)
- [ ] On login page, enter email and password
- [ ] Click "Don't have an account? Sign up"
- [ ] Enter email and password for new account
- [ ] Click "Create Account"
- [ ] Check your email for confirmation link
- [ ] Click confirmation link
- [ ] Return to app and sign in with email/password
- [ ] Should work same as Google OAuth

### Expected Behavior

✅ **Successful Login:**
- User is redirected from `/login` to `/` (Dashboard)
- User profile appears in Header
- Flashcards interface is accessible
- All features work normally

✅ **Successful Logout:**
- User is redirected from `/` to `/login`
- Profile disappears from Header
- Attempting to access `/` redirects to `/login`
- Session is cleared

✅ **Session Persistence:**
- Page refresh maintains logged-in state
- Browser tab close and reopen maintains session
- Session expires after configured timeout

### Error Scenarios to Test

❌ **OAuth Cancellation:**
- Start Google OAuth flow
- Cancel on Google consent screen
- App should show error message
- User remains on login page

❌ **Invalid Credentials (Email Auth):**
- Enter wrong email/password
- Should show error message
- Should not redirect

❌ **Network Issues:**
- Disconnect internet
- Try to log in
- Should show appropriate error message

## Troubleshooting

### Common Issues

#### 1. "Redirect URI mismatch" Error
**Problem:** Google OAuth redirect fails with error.

**Solution:**
- Check Google Cloud Console → OAuth 2.0 Client
- Ensure redirect URIs include:
  - `http://localhost:5173/auth/callback` (development)
  - `https://your-supabase-project.supabase.co/auth/v1/callback` (production)

#### 2. "Invalid login credentials" Error
**Problem:** Email/password login fails.

**Solution:**
- Verify email is confirmed (check inbox)
- Ensure password meets minimum requirements (6+ characters)
- Check Supabase dashboard for user status

#### 3. User stays on login page after Google OAuth
**Problem:** OAuth completes but doesn't redirect to Dashboard.

**Solution:**
- Check browser console for errors
- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are correct
- Check Supabase Auth logs in dashboard
- Ensure `/auth/callback` route is working

#### 4. Session doesn't persist after page refresh
**Problem:** User is logged out after refreshing page.

**Solution:**
- Check browser's localStorage (should have Supabase session)
- Verify no ad blockers or privacy extensions blocking localStorage
- Check browser console for errors during session check

#### 5. UserProfile component not showing
**Problem:** User is logged in but profile doesn't appear in Header.

**Solution:**
- Check that `user` object exists in AuthContext
- Verify `user.user_metadata` contains profile info
- Check Header component is importing and rendering UserProfile

### Debug Mode

Enable debug logging by opening browser console and checking for:
- Auth state changes: `Auth state changed: SIGNED_IN`
- Session info: Check `localStorage` for `supabase.auth.token`
- Network requests: Check Network tab for Supabase API calls

### Getting Help

If issues persist:
1. Check browser console for error messages
2. Check Supabase Auth logs in Dashboard
3. Verify all environment variables are set correctly
4. Review Google Cloud Console OAuth configuration
5. Check this documentation for similar issues

## Security Best Practices

🔒 **Environment Variables:**
- Never commit `.env` file to git (it's in `.gitignore`)
- Use only `VITE_SUPABASE_ANON_KEY` in frontend (not service role key)
- Keep Google Client Secret in Supabase only (not in frontend)

🔒 **Session Management:**
- Sessions expire automatically after timeout
- Implement session refresh in production
- Use HTTPS in production (not HTTP)

🔒 **OAuth Configuration:**
- Whitelist only trusted redirect URIs
- Use separate OAuth clients for dev/staging/production
- Regularly rotate secrets and keys

## Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [React Router Documentation](https://reactrouter.com/)
- [Project CLAUDE.md](../CLAUDE.md) - Project overview

---

**Last Updated:** 2025-10-09
**Version:** 1.0.0
