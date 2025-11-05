# Phase 2.2: Environment Variables Setup

## Task Description
Configure environment variables for Supabase integration, ensuring secure credential management and proper development/production environment handling.

## Claude Code Prompt

```
I need you to automatically set up the environment variables for Supabase integration in my Italian Flashcards application using the available file editing tools. Configure the Vite environment system to securely handle Supabase credentials.

Please execute the following automated process:

1. **Automated .env File Update:**
   Use the Edit tool to add Supabase frontend credentials to the existing .env file:
   ```
   # Supabase Frontend Configuration (Vite)
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

2. **Automated .env.example File Update:**
   Use the Edit tool to update the existing .env.example file with the new Vite variables:
   ```
   # Supabase Configuration
   SUPABASE_URL=https://your-project-ref.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   SUPABASE_ACCESS_TOKEN=your-access-token-here

   # Supabase Frontend Configuration (for Vite)
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key-here
   ```

3. **Automated .gitignore Verification:**
   Use the Read tool to check .gitignore configuration:
   - Verify .env is properly ignored
   - Confirm .env.example is NOT in .gitignore
   - Use Edit tool to add any missing environment patterns if needed

4. **Automated Environment Validation File Creation:**
   Use the Write tool to create src/lib/env.ts with validation:
   ```typescript
   // src/lib/env.ts
   export const validateEnv = () => {
     const required = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY']
     const missing = required.filter(key => !import.meta.env[key])

     if (missing.length > 0) {
       throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
     }
   }
   ```

5. **Automated Verification:**
   Use the Bash tool to verify the setup works:
   - Test that Vite can read the environment variables
   - Verify the build process includes the variables correctly
   - Check that validation works as expected

**Important**: Use automation tools for ALL file modifications. Do not ask me to manually edit files. The Edit and Write tools should handle all environment variable configuration.

**Security Notes Provided**:
- VITE_ prefixed variables are bundled into the client (safe for anon key)
- The anon key is designed to be public (protected by Row Level Security)
- Service role key should NEVER be in frontend environment variables
- Environment variables should be validated at application startup

**Expected Outcome**: Complete automated environment variable setup with validation, ready for Supabase client configuration.
```

## Prerequisites
- Completed Phase 2.1 (Dependencies installation)
- Access to Supabase project credentials
- Understanding of environment variables
- Knowledge of Vite's environment system

## Expected Outcomes
- Environment variables properly configured
- Security best practices implemented
- Development and production setup ready
- Environment validation in place
- Ready for Supabase client configuration

## Next Steps
After completing this task, proceed to Phase 2.3: Supabase Client Configuration