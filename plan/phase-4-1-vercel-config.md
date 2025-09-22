# Phase 4.1: Vercel Configuration

## Task Description
Configure Vercel for deployment of the full-stack Italian Flashcards application, ensuring proper routing, environment variables, and build optimization for the React + Supabase stack.

## Claude Code Prompt

```
I need you to automatically configure Vercel for deployment using the Write tool to create all configuration files. This is now a full-stack app with Supabase backend integration, authentication, and requires proper configuration for Single Page Application routing and environment variables.

Please help me with the following:

1. **Automated Vercel Configuration:**
   Use the Write tool to create `vercel.json` in the project root:

   ```json
   {
     "buildCommand": "npm run build",
     "outputDirectory": "dist",
     "framework": "vite",
     "installCommand": "npm install",
     "devCommand": "npm run dev",
     "rewrites": [
       {
         "source": "/(.*)",
         "destination": "/index.html"
       }
     ],
     "headers": [
       {
         "source": "/.*",
         "headers": [
           {
             "key": "X-Content-Type-Options",
             "value": "nosniff"
           },
           {
             "key": "X-Frame-Options",
             "value": "DENY"
           },
           {
             "key": "X-XSS-Protection",
             "value": "1; mode=block"
           },
           {
             "key": "Referrer-Policy",
             "value": "strict-origin-when-cross-origin"
           },
           {
             "key": "Content-Security-Policy",
             "value": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' *.supabase.co; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' *.supabase.co *.supabase.in wss://*.supabase.co wss://*.supabase.in"
           }
         ]
       }
     ],
     "functions": {
       "app/api/*.js": {
         "maxDuration": 10
       }
     }
   }
   ```

2. **Automated Vite Configuration Update:**
   Use the Edit tool to optimize `vite.config.ts` for production:

   ```typescript
   import { defineConfig, loadEnv } from 'vite'
   import react from '@vitejs/plugin-react'

   export default defineConfig(({ command, mode }) => {
     // Load env vars for the current mode
     const env = loadEnv(mode, process.cwd(), '')

     return {
       plugins: [react()],
       base: '/', // For Vercel deployment
       build: {
         outDir: 'dist',
         sourcemap: false, // Disable sourcemaps for production
         rollupOptions: {
           output: {
             manualChunks: {
               vendor: ['react', 'react-dom'],
               supabase: ['@supabase/supabase-js'],
               ui: ['@supabase/auth-ui-react', '@supabase/auth-ui-shared'],
               router: ['react-router-dom'],
               utils: ['date-fns']
             }
           }
         },
         chunkSizeWarningLimit: 1000
       },
       optimizeDeps: {
         exclude: ['lucide-react']
       },
       define: {
         // Ensure env vars are available at build time
         __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0')
       },
       server: {
         port: 5173,
         host: true // Allow external connections
       },
       preview: {
         port: 4173,
         host: true
       }
     }
   })
   ```

3. **Update Package.json Scripts:**
   Optimize build scripts for Vercel:

   ```json
   {
     "scripts": {
       "dev": "vite",
       "build": "tsc && vite build",
       "build:vercel": "npm run build",
       "preview": "vite preview",
       "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
       "lint:fix": "eslint . --ext ts,tsx --fix",
       "type-check": "tsc --noEmit",
       "test:e2e": "playwright test",
       "clean": "rm -rf dist",
       "analyze": "npm run build && npx vite-bundle-analyzer"
     }
   }
   ```

4. **Environment Variables Documentation:**
   Create `.env.production.example`:

   ```env
   # Production Environment Variables for Vercel
   # Copy these to your Vercel project settings

   # Supabase Configuration
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

   # Optional: Analytics
   VITE_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX

   # Optional: Error Tracking
   VITE_SENTRY_DSN=https://your-sentry-dsn

   # Build Configuration
   NODE_ENV=production
   ```

5. **Create Vercel Deployment Guide:**
   Create `docs/vercel-deployment.md`:

   ```markdown
   # Vercel Deployment Guide

   ## Prerequisites
   1. Vercel account
   2. GitHub repository
   3. Supabase project configured

   ## Deployment Steps

   ### 1. Connect GitHub Repository
   - Go to Vercel dashboard
   - Click "New Project"
   - Import your GitHub repository

   ### 2. Configure Build Settings
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

   ### 3. Environment Variables
   Add these variables in Vercel project settings:
   - `VITE_SUPABASE_URL`: Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key

   ### 4. Domain Configuration
   - Configure custom domain (optional)
   - Update Supabase auth redirect URLs

   ### 5. Supabase Configuration Updates
   Update your Supabase project settings:
   - Site URL: `https://your-app.vercel.app`
   - Redirect URLs: `https://your-app.vercel.app/**`
   ```

6. **Build Optimization:**
   - Implement code splitting for better performance
   - Optimize bundle size
   - Configure caching headers
   - Add compression

7. **Security Headers:**
   Configure appropriate security headers for the application:
   - Content Security Policy for Supabase integration
   - CORS configuration
   - XSS protection
   - Frame options

8. **Performance Optimization:**
   ```typescript
   // src/utils/performance.ts
   export const preloadCriticalResources = () => {
     // Preload Supabase client
     import('../lib/supabase')

     // Preload auth components
     import('../components/auth/LoginForm')
   }

   // Implement in main.tsx
   if (typeof window !== 'undefined') {
     // Preload resources after initial render
     setTimeout(preloadCriticalResources, 1000)
   }
   ```

9. **Monitoring and Analytics:**
   Add basic monitoring setup:

   ```typescript
   // src/lib/analytics.ts
   export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
     if (import.meta.env.PROD && import.meta.env.VITE_GOOGLE_ANALYTICS_ID) {
       // Add Google Analytics tracking
       if (typeof gtag !== 'undefined') {
         gtag('event', eventName, properties)
       }
     }
   }

   export const trackLearningSession = (
     direction: string,
     wordsStudied: number,
     accuracy: number
   ) => {
     trackEvent('learning_session_completed', {
       direction,
       words_studied: wordsStudied,
       accuracy
     })
   }
   ```

10. **Deployment Testing:**
    Create a deployment checklist:
    - Environment variables are set correctly
    - Build completes successfully
    - Authentication flow works
    - Database connections work
    - All routes resolve correctly
    - Mobile responsiveness
    - Performance metrics are acceptable

**Important**: Use Write and Edit tools to create ALL configuration files automatically. Generate complete, production-ready configurations with security headers, performance optimization, and proper build settings.

**Expected Outcome**: Complete Vercel deployment configuration with optimized build process, security headers, and performance monitoring.
```

## Prerequisites
- Completed Phase 3.2 (App.tsx Auth Integration)
- Vercel account setup
- Understanding of build processes
- Knowledge of environment variables

## Expected Outcomes
- Complete Vercel configuration
- Optimized build process
- Security headers configured
- Performance optimized
- Ready for deployment

## Next Steps
After completing this task, proceed to Phase 4.2: Environment Variables Setup