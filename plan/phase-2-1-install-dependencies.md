# Phase 2.1: Install Dependencies

## Task Description
Install all necessary dependencies for integrating Supabase authentication, routing, and UI components into the Italian Flashcards application.

## Claude Code Prompt

```
I need you to automatically install the required dependencies for integrating Supabase authentication and additional features into my Italian Flashcards application. Execute all installation commands directly using the Bash tool.

Please execute the following automated installation process:

1. **Automated Core Supabase Dependencies Installation:**
   Use the Bash tool to execute:
   ```bash
   npm install @supabase/supabase-js @supabase/auth-ui-react @supabase/auth-ui-shared
   ```

2. **Automated Routing Dependencies Installation:**
   Use the Bash tool to execute:
   ```bash
   npm install react-router-dom
   npm install @types/react-router-dom --save-dev
   ```

3. **Automated Utility Dependencies Installation:**
   Use the Bash tool to execute:
   ```bash
   npm install date-fns
   ```

4. **Automated Dependency Verification:**
   Use the Read tool to check package.json and verify:
   - Existing React 18, TypeScript, Tailwind CSS, and Framer Motion versions are compatible
   - Check for potential conflicts with new packages

5. **Automated Post-Installation Verification:**
   Execute using Bash tool:
   - Run `npm install` to ensure clean installation
   - Execute `npm run build` to verify the build still works
   - Start development server with `npm run dev` to test functionality
   - Check for any dependency conflicts or warnings in the output

6. **Automated Package.json Updates (if needed):**
   Use Edit tool to update package.json if needed:
   - Verify that existing scripts still work
   - Add any new scripts that might be helpful for development
   - Ensure build process works with new dependencies

**Important**: Execute ALL installation commands using the Bash tool. Do not ask me to manually run npm commands in my terminal. Verify each step automatically and report the results.

**Dependency explanations:**
- `@supabase/supabase-js`: Core Supabase client for database and auth operations
- `@supabase/auth-ui-react`: Pre-built React auth components
- `@supabase/auth-ui-shared`: Shared auth UI utilities and themes
- `react-router-dom`: Client-side routing for the app
- `date-fns`: Date manipulation utilities for session tracking

**Expected Outcome**: All dependencies installed successfully with automated verification that the application still builds and runs correctly.
```

## Prerequisites
- Completed Phase 1.3 (Data migration)
- Working Node.js and npm setup
- Access to package.json file
- Internet connection for package downloads

## Expected Outcomes
- All required dependencies installed successfully
- No dependency conflicts
- Application builds and runs correctly
- TypeScript types properly resolved
- Ready for Supabase client configuration

## Next Steps
After completing this task, proceed to Phase 2.2: Environment Variables Setup