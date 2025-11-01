# Authentication Guide

Comprehensive documentation for authentication and security in the Italian Flashcards application, including OAuth flows, session management, and security best practices.

## Table of Contents

- [Overview](#overview)
- [Authentication Architecture](#authentication-architecture)
- [Authentication Flows](#authentication-flows)
- [Component Details](#component-details)
- [Session Management](#session-management)
- [Security Features](#security-features)
- [User Management](#user-management)
- [Testing Authentication](#testing-authentication)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

## Overview

The application uses **Supabase Auth** for authentication with multiple sign-in methods:

- **Email/Password** - Traditional authentication
- **Google OAuth** - Sign in with Google account
- **Session Persistence** - Remember users across browser sessions
- **Protected Routes** - Require authentication to access

### Key Features

✅ Multiple authentication methods
✅ Secure password hashing (bcrypt via Supabase)
✅ OAuth 2.0 integration
✅ Session tokens with automatic refresh
✅ Row Level Security (RLS) for data protection
✅ Email confirmation (optional)
✅ Password reset functionality

## Authentication Architecture

### Technology Stack

**Backend**:
- Supabase Auth (PostgreSQL-based)
- OAuth 2.0 (Google)
- JWT tokens for session management
- bcrypt for password hashing

**Frontend**:
- React Context API for state management
- Protected route wrappers
- Automatic token refresh
- Session persistence

### Data Flow

```
User Action (Login/OAuth)
    ↓
AuthContext handles request
    ↓
Supabase Auth API
    ↓
PostgreSQL auth.users table
    ↓
JWT tokens generated
    ↓
Session stored (localStorage)
    ↓
User authenticated
    ↓
Protected routes accessible
```

### Project Structure

```
src/
├── contexts/
│   └── AuthContext.tsx           # Global auth state
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx         # Login/signup form
│   │   └── UserProfile.tsx       # Profile dropdown
│   └── ProtectedRoute.tsx        # Route guard
├── pages/
│   ├── Login.tsx                 # Login page
│   ├── Dashboard.tsx             # Protected main page
│   └── Callback.tsx              # OAuth callback
└── lib/
    ├── supabase.ts               # Supabase client
    └── emailValidator.ts         # Email validation
```

## Authentication Flows

### Email/Password Sign Up

```
1. User fills registration form
   ├── Email address
   ├── Password (min 8 characters)
   └── Password confirmation
       ↓
2. Email validation (blocks throwaway domains)
       ↓
3. Supabase Auth creates user
   ├── Password hashed with bcrypt
   ├── User record in auth.users table
   └── Confirmation email sent (if enabled)
       ↓
4. User confirms email (if required)
       ↓
5. User can log in
```

**Code Example**:
```typescript
const { error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'securePassword123',
  options: {
    emailRedirectTo: `${window.location.origin}/auth/callback`
  }
})
```

### Email/Password Sign In

```
1. User enters credentials
   ├── Email
   └── Password
       ↓
2. Supabase Auth validates
   ├── Lookup user by email
   ├── Compare password hash
   └── Check email confirmed
       ↓
3. Session created
   ├── JWT access token (1 hour)
   ├── Refresh token (persistent)
   └── User metadata
       ↓
4. Redirect to Dashboard
```

**Code Example**:
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'securePassword123'
})
```

### Google OAuth Flow

```
1. User clicks "Sign in with Google"
       ↓
2. Redirect to Google OAuth consent screen
   ├── User selects Google account
   ├── Grants permissions (email, profile)
   └── Google generates authorization code
       ↓
3. Redirect to /auth/callback
   ├── URL contains authorization code
   ├── Supabase exchanges code for tokens
   └── Creates or updates user account
       ↓
4. Session established
   ├── JWT tokens stored
   ├── User profile populated
   └── Redirect to Dashboard
       ↓
5. User authenticated
```

**Code Example**:
```typescript
const { error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/auth/callback`,
    queryParams: {
      access_type: 'offline',
      prompt: 'consent'
    }
  }
})
```

### OAuth Callback Handler

**Location**: `src/pages/Callback.tsx`

```typescript
// Extract tokens from URL
const { data, error } = await supabase.auth.getSession()

if (error) {
  // Show error, redirect to login
}

if (data.session) {
  // Session established, redirect to dashboard
  navigate('/')
}
```

### Sign Out Flow

```
1. User clicks "Sign Out"
       ↓
2. AuthContext.signOut() called
       ↓
3. Supabase Auth revokes session
   ├── Invalidate JWT tokens
   ├── Clear localStorage
   └── Clear cookies
       ↓
4. User state set to null
       ↓
5. Redirect to /login
```

**Code Example**:
```typescript
const { error } = await supabase.auth.signOut()
```

## Component Details

### AuthContext

**Location**: `src/contexts/AuthContext.tsx`

**Purpose**: Global authentication state management

**Provides**:
```typescript
interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  signInWithGoogle: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
}
```

**Session Persistence**:
```typescript
// Listen for auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  setSession(session)
  setUser(session?.user ?? null)
  setLoading(false)
})
```

**Usage**:
```typescript
import { useAuth } from '@/contexts/AuthContext'

function Component() {
  const { user, signIn, signOut } = useAuth()

  if (!user) {
    return <div>Please log in</div>
  }

  return <div>Welcome, {user.email}</div>
}
```

### LoginForm

**Location**: `src/components/auth/LoginForm.tsx`

**Features**:
- Email/password input with validation
- Google OAuth button
- Toggle between sign in/sign up modes
- Error message display
- Loading states
- Email validation (blocks throwaway domains)

**Email Validation**:
```typescript
import { isValidEmail, getEmailValidationError } from '@/lib/emailValidator'

if (!isValidEmail(email)) {
  setError(getEmailValidationError(email))
  return
}
```

**Form Submission**:
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()

  if (isSignUp) {
    await signUp(email, password)
  } else {
    await signIn(email, password)
  }
}
```

### UserProfile

**Location**: `src/components/auth/UserProfile.tsx`

**Features**:
- User avatar display
- User name and email
- Sign out button
- OAuth provider badge
- Dropdown menu

**User Avatar**:
```typescript
// Google OAuth provides avatar_url
const avatarUrl = user.user_metadata?.avatar_url

<img
  src={avatarUrl || '/default-avatar.png'}
  alt="User avatar"
  className="w-8 h-8 rounded-full"
/>
```

### ProtectedRoute

**Location**: `src/components/ProtectedRoute.tsx`

**Purpose**: Guard routes that require authentication

**Implementation**:
```typescript
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingSpinner />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
```

**Usage**:
```typescript
<Routes>
  <Route path="/login" element={<Login />} />
  <Route
    path="/"
    element={
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    }
  />
</Routes>
```

## Session Management

### JWT Tokens

**Access Token**:
- **Lifetime**: 1 hour
- **Purpose**: Authenticate API requests
- **Storage**: Memory + localStorage
- **Refresh**: Automatic via refresh token

**Refresh Token**:
- **Lifetime**: Persistent (until revoked)
- **Purpose**: Obtain new access tokens
- **Storage**: Encrypted in localStorage
- **Security**: HttpOnly cookies (if configured)

### Token Refresh

**Automatic Refresh**:
```typescript
// Supabase handles automatic refresh
// Checks token expiry before each request
// Refreshes if expired (< 60s remaining)

supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'TOKEN_REFRESHED') {
    console.log('Token refreshed:', session)
  }
})
```

**Manual Refresh**:
```typescript
const { data, error } = await supabase.auth.refreshSession()
```

### Session Storage

**LocalStorage Keys**:
```
supabase.auth.token - Encrypted tokens
supabase.auth.user - User metadata
```

**Session Persistence**:
```typescript
// Sessions persist across browser restarts
// Clear only on explicit sign out or token expiry
```

## Security Features

### Row Level Security (RLS)

**Purpose**: Database-level access control

**Implementation**:
```sql
-- Example RLS policy
CREATE POLICY "Users can only access their own data"
  ON user_progress
  FOR ALL
  USING (auth.uid() = user_id);
```

**Automatic Enforcement**:
- All queries automatically filtered by `user_id`
- No manual access control needed in application code
- Protection against data leaks

### Password Security

**Hashing**:
- Algorithm: bcrypt
- Cost factor: 10 (Supabase default)
- Salt: Unique per password

**Requirements** (enforced client-side):
- Minimum 8 characters
- At least one uppercase letter (recommended)
- At least one number (recommended)
- At least one special character (recommended)

**Best Practices**:
```typescript
// Enforce strong passwords
const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/

if (!PASSWORD_REGEX.test(password)) {
  throw new Error('Password does not meet requirements')
}
```

### Email Validation

**Location**: `src/lib/emailValidator.ts`

**Blocked Domains** (14 throwaway domains):
```typescript
const THROWAWAY_DOMAINS = [
  'test.com', 'example.com', 'mailinator.com',
  // ... and 11 more
]
```

**Why**: Prevent email bounces that damage Supabase sender reputation

**Validation**:
```typescript
export function isValidEmail(email: string): boolean {
  // Check format (RFC 5322)
  if (!EMAIL_REGEX.test(email)) return false

  // Check domain blacklist
  const domain = email.split('@')[1].toLowerCase()
  if (THROWAWAY_DOMAINS.includes(domain)) return false

  return true
}
```

### OAuth Security

**PKCE Flow** (Proof Key for Code Exchange):
- Prevents authorization code interception
- Required for public clients (SPAs)
- Automatically handled by Supabase

**State Parameter**:
- Prevents CSRF attacks
- Validates callback is from legitimate OAuth flow
- Automatically generated by Supabase

**Redirect URI Validation**:
- Must match registered URIs in Supabase/Google
- Prevents unauthorized redirects
- Configured in Supabase dashboard

## User Management

### Creating Users

**Email/Password** (normal sign-up):
```typescript
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'securePassword123'
})
```

**Test Users** (script-based, bypasses email):
```bash
npm run test:create-user
```

**Script Implementation**:
```javascript
// scripts/create-test-user.js
const { data, error } = await supabase.auth.admin.createUser({
  email: 'test@example.com',
  password: 'testPassword123',
  email_confirm: true, // Skip email confirmation
  user_metadata: {
    name: 'Test User'
  }
})
```

### Listing Users

```bash
# Test database users
npm run test:list-users

# Production database users (read-only)
npm run prod:list-users
```

### Deleting Users

```bash
# Delete specific users (with confirmation)
npm run test:delete-users

# Clean up test users
npm run test:cleanup-users
```

### User Metadata

**Default Fields**:
```typescript
interface User {
  id: string                    // UUID
  email: string                 // Email address
  created_at: string            // ISO timestamp
  last_sign_in_at: string       // ISO timestamp
  app_metadata: {               // Protected, server-only
    provider: string            // 'email' | 'google'
  }
  user_metadata: {              // Public, client-accessible
    name?: string               // User's name
    avatar_url?: string         // Profile picture URL
  }
}
```

**Updating Metadata**:
```typescript
const { error } = await supabase.auth.updateUser({
  data: {
    name: 'New Name',
    custom_field: 'value'
  }
})
```

## Testing Authentication

### Test User Credentials

**Email/Password**:
```
Email: test-e2e@example.com
Password: [stored in GitHub Secrets]
Database: Test DB (slhyzoupwluxgasvapoc.supabase.co)
```

### E2E Authentication Tests

**File**: `e2e/real-auth.spec.ts`

**Test Scenarios**:
1. Email/password sign in
2. Google OAuth sign in (mocked in tests)
3. Sign out
4. Protected route access
5. Session persistence
6. Invalid credentials

**Example Test**:
```typescript
test('should sign in with email and password', async ({ page }) => {
  await page.goto('/login')

  await page.fill('[data-testid="email-input"]', TEST_USER_EMAIL)
  await page.fill('[data-testid="password-input"]', TEST_USER_PASSWORD)
  await page.click('[data-testid="sign-in-button"]')

  // Should redirect to dashboard
  await expect(page).toHaveURL('/')
  await expect(page.locator('[data-testid="user-profile"]')).toBeVisible()
})
```

### Manual Testing

**Test Sign Up**:
1. Go to `/login`
2. Click "Sign Up"
3. Enter email and password
4. Submit form
5. Check email for confirmation (if enabled)
6. Confirm email
7. Sign in

**Test Google OAuth**:
1. Go to `/login`
2. Click "Sign in with Google"
3. Select Google account
4. Grant permissions
5. Should redirect to dashboard
6. Verify user profile shows Google info

**Test Session Persistence**:
1. Sign in
2. Close browser
3. Reopen browser
4. Navigate to app
5. Should still be signed in

## Troubleshooting

### Common Issues

#### "Invalid login credentials"

**Possible Causes**:
1. Wrong email or password
2. Email not confirmed
3. User doesn't exist
4. Wrong database (production vs test)

**Solutions**:
- Verify credentials are correct
- Check email for confirmation link
- Create user if needed: `npm run test:create-user`
- Check environment variables point to correct database

#### OAuth Redirect Loop

**Symptoms**: Keeps redirecting between OAuth and callback

**Possible Causes**:
1. Misconfigured redirect URI
2. Session not being stored
3. Cookie/localStorage issues

**Solutions**:
- Check redirect URI in Supabase dashboard matches app URL
- Verify localStorage is enabled in browser
- Clear browser cache and cookies
- Check browser console for errors

#### Session Expires Immediately

**Symptoms**: User signed out after page refresh

**Possible Causes**:
1. Token refresh failing
2. LocalStorage cleared
3. Supabase project configuration

**Solutions**:
- Check browser localStorage for auth tokens
- Verify Supabase project is active (not paused)
- Check network tab for failed refresh requests
- Ensure `persistSession: true` in Supabase client config

#### "Email rate limit exceeded"

**Symptoms**: Cannot send confirmation/reset emails

**Possible Causes**:
1. Too many email requests in short time
2. Supabase email rate limiting
3. Email bounces causing restrictions

**Solutions**:
- Wait 60 seconds before retrying
- Use test user creation script (bypasses email)
- Check Supabase dashboard for email delivery issues
- Verify email isn't on throwaway domain blacklist

### Debugging Authentication

**Check Auth State**:
```typescript
// In browser console
const { data } = await supabase.auth.getSession()
console.log('Session:', data.session)
console.log('User:', data.session?.user)
```

**Check LocalStorage**:
```javascript
// In browser console
Object.keys(localStorage).forEach(key => {
  if (key.includes('supabase')) {
    console.log(key, localStorage.getItem(key))
  }
})
```

**Enable Debug Logging**:
```typescript
// In supabase.ts
const supabase = createClient(url, key, {
  auth: {
    debug: true, // Logs all auth operations
    persistSession: true
  }
})
```

## Best Practices

### Security Checklist

- [ ] Use HTTPS in production (✅ automatic with Vercel)
- [ ] Validate email format and domain
- [ ] Enforce strong password requirements
- [ ] Enable email confirmation for production
- [ ] Use Row Level Security (RLS) on all tables
- [ ] Never expose service role key client-side
- [ ] Implement rate limiting for auth endpoints
- [ ] Log authentication events for audit
- [ ] Use secure, HttpOnly cookies when possible
- [ ] Rotate API keys periodically

### User Experience

✅ **DO**:
- Show clear error messages
- Provide loading states during auth
- Remember user's last visited page
- Auto-focus email input on login page
- Support keyboard navigation
- Provide "Forgot Password" link
- Show password requirements upfront

❌ **DON'T**:
- Store passwords in plain text (ever!)
- Log passwords or tokens
- Show detailed error messages (security risk)
- Allow weak passwords
- Ignore email validation
- Skip loading states

### Testing

**Always Test**:
- Sign up flow (email + OAuth)
- Sign in flow (email + OAuth)
- Sign out
- Protected route access
- Session persistence
- Token refresh
- Password reset
- Invalid credentials handling

## Related Documentation

- **[Testing Guide](./TESTING.md)** - E2E authentication tests
- **[Database Guide](./DATABASE.md)** - User data storage
- **[Architecture Guide](./ARCHITECTURE.md)** - Auth context and components
- **[Deployment Guide](./DEPLOYMENT.md)** - Environment configuration

## Additional Resources

- **[Supabase Auth Docs](https://supabase.com/docs/guides/auth)** - Official Supabase auth guide
- **[OAuth 2.0 Spec](https://oauth.net/2/)** - OAuth protocol documentation
- **[JWT.io](https://jwt.io/)** - JWT token decoder and validator
- **[OWASP Auth Cheatsheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)** - Security best practices

---

**Last Updated**: 2025-10-30
**Maintainer**: Development team with Claude Code assistance
**Auth Provider**: Supabase Auth
