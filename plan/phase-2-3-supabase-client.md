# Phase 2.3: Supabase Client Configuration

## Task Description
Set up the Supabase client configuration with TypeScript support, creating the foundation for database operations and authentication in the application.

## Claude Code Prompt

```
I need you to automatically create the Supabase client configuration for my Italian Flashcards application using the Write and Edit tools. Set up the client with proper TypeScript types and create the database schema types for type-safe operations.

Please execute the following automated process:

1. **Automated Supabase Client Creation:**
   Use the Write tool to create `src/lib/supabase.ts` with the complete configuration:

   ```typescript
   import { createClient } from '@supabase/supabase-js'

   const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
   const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

   if (!supabaseUrl || !supabaseAnonKey) {
     throw new Error('Missing Supabase environment variables')
   }

   export const supabase = createClient(supabaseUrl, supabaseAnonKey)
   ```

2. **Automated TypeScript Database Types Creation:**
   Use the Write tool to create comprehensive TypeScript types file:

   ```typescript
   // Database type definitions
   export type Database = {
     public: {
       Tables: {
         words: {
           Row: {
             id: number
             russian: string
             italian: string
             category: string
             created_at: string
           }
           Insert: {
             id?: number
             russian: string
             italian: string
             category: string
             created_at?: string
           }
           Update: {
             id?: number
             russian?: string
             italian?: string
             category?: string
             created_at?: string
           }
         }
         user_progress: {
           Row: {
             id: string
             user_id: string
             word_id: number
             correct_count: number
             wrong_count: number
             last_practiced: string
             mastery_level: number
           }
           Insert: {
             id?: string
             user_id: string
             word_id: number
             correct_count?: number
             wrong_count?: number
             last_practiced?: string
             mastery_level?: number
           }
           Update: {
             id?: string
             user_id?: string
             word_id?: number
             correct_count?: number
             wrong_count?: number
             last_practiced?: string
             mastery_level?: number
           }
         }
         learning_sessions: {
           Row: {
             id: string
             user_id: string
             started_at: string
             ended_at: string | null
             words_studied: number
             correct_answers: number
             learning_direction: string
           }
           Insert: {
             id?: string
             user_id: string
             started_at?: string
             ended_at?: string | null
             words_studied?: number
             correct_answers?: number
             learning_direction?: string
           }
           Update: {
             id?: string
             user_id?: string
             started_at?: string
             ended_at?: string | null
             words_studied?: number
             correct_answers?: number
             learning_direction?: string
           }
         }
       }
     }
   }
   ```

3. **Create Typed Supabase Client:**
   Update the client to use the database types:
   ```typescript
   export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
   ```

4. **Update Existing Types:**
   Update `src/types/index.ts` to integrate with the new database types:
   - Extend the existing Word interface to match the database schema
   - Add new types for user progress and learning sessions
   - Ensure compatibility with existing code

5. **Automated Helper Functions Creation:**
   Use the Write tool to create `src/lib/database.ts` with utility functions:

   ```typescript
   // src/lib/database.ts
   import { supabase } from './supabase'

   // Get all words
   export const getAllWords = async () => {
     const { data, error } = await supabase
       .from('words')
       .select('*')
       .order('id')

     if (error) throw error
     return data
   }

   // Get user progress for a specific word
   export const getUserProgress = async (userId: string, wordId: number) => {
     const { data, error } = await supabase
       .from('user_progress')
       .select('*')
       .eq('user_id', userId)
       .eq('word_id', wordId)
       .single()

     if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows returned
     return data
   }
   ```

6. **Environment Validation:**
   Add validation to ensure the client is properly configured:
   - Check that environment variables are loaded
   - Verify client connection can be established
   - Add error handling for configuration issues

7. **Automated Testing and Verification:**
   Use the Bash tool to verify the configuration:
   - Test build process includes new types correctly
   - Verify TypeScript compilation succeeds
   - Test that environment validation works

**Important**: Use Write and Edit tools to create ALL files automatically. Do not provide code snippets for manual copying. Generate complete, working files that integrate with the existing codebase.

**Expected Outcome**: Complete Supabase client setup with TypeScript types, helper functions, and verification - all created automatically using available tools.
```

## Prerequisites
- Completed Phase 2.2 (Environment variables setup)
- Supabase project with database schema created
- Understanding of TypeScript interfaces
- Basic knowledge of Supabase client usage

## Expected Outcomes
- Properly configured Supabase client
- Comprehensive TypeScript types for database schema
- Helper functions for common operations
- Type-safe database interactions
- Ready for authentication integration

## Next Steps
After completing this task, proceed to Phase 2.4: Auth Context Implementation