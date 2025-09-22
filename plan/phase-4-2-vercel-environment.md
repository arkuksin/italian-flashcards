# Phase 4.2: Vercel Environment Variables Setup

## Task Description
Configure environment variables in Vercel for the Italian Flashcards application, ensuring secure credential management and proper environment separation between development, preview, and production.

## Claude Code Prompt

```
I need you to automatically configure environment variables and create validation systems using automated tools. This involves setting up Supabase credentials, configuring different environments, and ensuring secure deployment practices.

Please help me with the following:

1. **Vercel Environment Variables Configuration:**
   Guide me through setting up environment variables in the Vercel dashboard:

   **Production Environment:**
   ```
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   NODE_ENV=production
   ```

   **Preview Environment (for pull requests):**
   ```
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   NODE_ENV=preview
   ```

   **Development Environment:**
   ```
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   NODE_ENV=development
   ```

2. **Automated Environment Variable Validation:**
   Use the Write tool to create `src/lib/env-validation.ts`:

   ```typescript
   interface RequiredEnvVars {
     VITE_SUPABASE_URL: string
     VITE_SUPABASE_ANON_KEY: string
   }

   interface OptionalEnvVars {
     VITE_GOOGLE_ANALYTICS_ID?: string
     VITE_SENTRY_DSN?: string
     VITE_APP_VERSION?: string
   }

   type EnvVars = RequiredEnvVars & OptionalEnvVars

   export const validateEnvironment = (): EnvVars => {
     const requiredVars: (keyof RequiredEnvVars)[] = [
       'VITE_SUPABASE_URL',
       'VITE_SUPABASE_ANON_KEY'
     ]

     const missing: string[] = []
     const env: Partial<EnvVars> = {}

     // Check required variables
     for (const varName of requiredVars) {
       const value = import.meta.env[varName]
       if (!value) {
         missing.push(varName)
       } else {
         env[varName] = value
       }
     }

     if (missing.length > 0) {
       throw new Error(
         `Missing required environment variables: ${missing.join(', ')}\n` +
         'Please check your Vercel environment variables configuration.'
       )
     }

     // Add optional variables
     env.VITE_GOOGLE_ANALYTICS_ID = import.meta.env.VITE_GOOGLE_ANALYTICS_ID
     env.VITE_SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN
     env.VITE_APP_VERSION = import.meta.env.VITE_APP_VERSION || '1.0.0'

     return env as EnvVars
   }

   // Validate on import
   export const env = validateEnvironment()

   // Helper function to check if we're in production
   export const isProduction = () => import.meta.env.PROD
   export const isDevelopment = () => import.meta.env.DEV
   export const isPreview = () => import.meta.env.MODE === 'preview'
   ```

3. **Update Supabase Client Configuration:**
   Modify `src/lib/supabase.ts` to use validated environment variables:

   ```typescript
   import { createClient } from '@supabase/supabase-js'
   import { env } from './env-validation'
   import type { Database } from '../types/database'

   // Use validated environment variables
   const supabaseUrl = env.VITE_SUPABASE_URL
   const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY

   export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
     auth: {
       autoRefreshToken: true,
       persistSession: true,
       detectSessionInUrl: true,
       flowType: 'pkce' // Use PKCE flow for better security
     },
     realtime: {
       params: {
         eventsPerSecond: 2 // Limit realtime events for better performance
       }
     }
   })

   // Helper function to get the current environment
   export const getEnvironmentInfo = () => ({
     environment: import.meta.env.MODE,
     supabaseUrl: supabaseUrl,
     version: env.VITE_APP_VERSION,
     isProduction: import.meta.env.PROD
   })
   ```

4. **Supabase Auth Configuration Update:**
   Help me update Supabase project settings for Vercel deployment:

   **Authentication Settings to Update:**
   ```
   Site URL: https://your-app-name.vercel.app

   Additional Redirect URLs:
   - https://your-app-name.vercel.app
   - https://your-app-name.vercel.app/**
   - https://your-app-name-*.vercel.app (for preview deployments)
   - http://localhost:5173 (for local development)
   - http://localhost:4173 (for local preview)
   ```

5. **Environment-Specific Configuration:**
   Create `src/config/app-config.ts`:

   ```typescript
   import { env, isProduction, isDevelopment, isPreview } from '../lib/env-validation'

   export const appConfig = {
     // App information
     name: 'Italian Flashcards',
     version: env.VITE_APP_VERSION,

     // Environment flags
     environment: {
       isProduction: isProduction(),
       isDevelopment: isDevelopment(),
       isPreview: isPreview()
     },

     // Feature flags based on environment
     features: {
       analytics: isProduction() && !!env.VITE_GOOGLE_ANALYTICS_ID,
       errorReporting: isProduction() && !!env.VITE_SENTRY_DSN,
       debugMode: isDevelopment(),
       showVersionInfo: !isProduction()
     },

     // API configuration
     api: {
       supabaseUrl: env.VITE_SUPABASE_URL,
       timeout: isProduction() ? 10000 : 30000 // Longer timeout in development
     },

     // UI configuration
     ui: {
       showEnvironmentBanner: !isProduction(),
       enableDevTools: isDevelopment()
     }
   }
   ```

6. **Environment Banner Component:**
   Create a development environment indicator:

   ```typescript
   // src/components/EnvironmentBanner.tsx
   import React from 'react'
   import { appConfig } from '../config/app-config'

   export const EnvironmentBanner: React.FC = () => {
     if (!appConfig.ui.showEnvironmentBanner) {
       return null
     }

     const bannerColor = appConfig.environment.isDevelopment
       ? 'bg-green-600'
       : 'bg-yellow-600'

     const environmentName = appConfig.environment.isDevelopment
       ? 'Development'
       : 'Preview'

     return (
       <div className={`${bannerColor} text-white text-center py-1 text-sm font-medium`}>
         {environmentName} Environment - v{appConfig.version}
       </div>
     )
   }
   ```

7. **Vercel Build Configuration:**
   Create `.vercelignore`:

   ```
   # Dependencies
   node_modules
   .pnp
   .pnp.js

   # Testing
   coverage
   test-results
   playwright-report

   # Development
   .env.local
   .env.development.local
   .env.test.local
   .env.production.local

   # IDE
   .vscode
   .idea

   # Logs
   npm-debug.log*
   yarn-debug.log*
   yarn-error.log*

   # Runtime data
   pids
   *.pid
   *.seed
   *.pid.lock

   # Optional npm cache directory
   .npm

   # Optional eslint cache
   .eslintcache

   # Stores VSCode versions used for testing VSCode extensions
   .vscode-test

   # Temporary folders
   tmp/
   temp/
   ```

8. **Build-time Environment Validation:**
   Add build-time checks in `vite.config.ts`:

   ```typescript
   import { defineConfig, loadEnv } from 'vite'
   import react from '@vitejs/plugin-react'

   export default defineConfig(({ command, mode }) => {
     const env = loadEnv(mode, process.cwd(), '')

     // Validate required environment variables at build time
     const requiredVars = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY']
     const missing = requiredVars.filter(key => !env[key])

     if (missing.length > 0 && command === 'build') {
       throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
     }

     return {
       plugins: [react()],
       build: {
         rollupOptions: {
           output: {
             manualChunks: {
               'vendor-react': ['react', 'react-dom'],
               'vendor-supabase': ['@supabase/supabase-js'],
               'vendor-auth': ['@supabase/auth-ui-react', '@supabase/auth-ui-shared']
             }
           }
         }
       },
       define: {
         __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
         __COMMIT_HASH__: JSON.stringify(process.env.VERCEL_GIT_COMMIT_SHA || 'dev')
       }
     }
   })
   ```

9. **Deployment Health Check:**
   Create `src/utils/health-check.ts`:

   ```typescript
   import { supabase } from '../lib/supabase'
   import { appConfig } from '../config/app-config'

   export interface HealthStatus {
     database: boolean
     auth: boolean
     environment: string
     version: string
     timestamp: string
   }

   export const performHealthCheck = async (): Promise<HealthStatus> => {
     const timestamp = new Date().toISOString()
     let database = false
     let auth = false

     try {
       // Test database connection
       const { data, error } = await supabase
         .from('words')
         .select('count')
         .limit(1)

       database = !error
     } catch (error) {
       console.error('Database health check failed:', error)
     }

     try {
       // Test auth service
       const { data, error } = await supabase.auth.getSession()
       auth = !error
     } catch (error) {
       console.error('Auth health check failed:', error)
     }

     return {
       database,
       auth,
       environment: import.meta.env.MODE,
       version: appConfig.version,
       timestamp
     }
   }
   ```

10. **Environment Variable Security:**
    Create a security checklist and best practices guide

**Important**: Use Write and Edit tools to create environment validation files automatically. Generate complete configuration with proper validation, security checks, and error handling.

**Expected Outcome**: Complete environment variable configuration with automated validation, security best practices, and proper Vercel integration.
```

## Prerequisites
- Completed Phase 4.1 (Vercel Configuration)
- Vercel project created
- Access to Supabase project settings
- Understanding of environment variable security

## Expected Outcomes
- Environment variables properly configured in Vercel
- Environment validation implemented
- Supabase auth configured for deployment
- Security best practices implemented
- Ready for production deployment

## Next Steps
After completing this task, proceed to Phase 4.3: Deployment Checklist