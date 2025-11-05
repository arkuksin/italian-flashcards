# Phase 1.3: Data Migration

## Task Description
Migrate the existing 300 Russian-Italian word pairs from the static frontend data to the Supabase database, ensuring data integrity and proper categorization.

## Claude Code Prompt

```
I need you to migrate the existing word data from my Italian Flashcards application to the Supabase database using automated tools. The current data is stored in src/data/words.ts as a static TypeScript array, and I need to transfer all 300 word pairs to the database.

Please execute the following automated migration process:

1. **Automated Data Analysis:**
   - Use the Read tool to analyze the existing src/data/words.ts file
   - Parse the TypeScript data structure and extract all word entries
   - Automatically identify all unique categories in the dataset
   - Verify data completeness and consistency programmatically

2. **Automated Migration Execution:**
   Using the Supabase MCP server, automatically:
   - Generate the proper SQL INSERT statements from the parsed data
   - Handle special character escaping automatically
   - Preserve existing word IDs to maintain compatibility
   - Execute the migration via MCP in batches if needed

3. **Automated Data Validation:**
   Before migration, use tools to verify:
   - All words have both Russian and Italian translations
   - All categories are properly assigned
   - No duplicate entries exist
   - IDs are sequential and unique

4. **Automated Migration Execution:**
   - Execute the migration using Supabase MCP server (NOT manual SQL editor)
   - Use batch processing if needed for large datasets
   - Provide real-time feedback on migration progress
   - Handle any errors automatically with rollback if needed

5. **Automated Post-Migration Verification:**
   Use MCP to automatically verify:
   - Query total record count to confirm all 300 words were inserted
   - Verify category distribution matches original data
   - Test sample queries to ensure data accessibility
   - Confirm RLS policies allow proper word access
   - Compare random samples between original and migrated data

6. **Frontend Code Updates:**
   Automatically update the frontend code:
   - Modify the application to load words from Supabase instead of static file
   - Update the getShuffledWords function to work with database data
   - Create database helper functions for word loading
   - Ensure proper error handling for database queries

**Migration Process:**
1. Read src/data/words.ts using the Read tool
2. Parse and validate the data structure
3. Generate SQL INSERT statements automatically
4. Execute migration via Supabase MCP server
5. Verify migration success via MCP queries
6. Update frontend code to use database instead of static file

**Important**: Use automation tools throughout this process. Do NOT ask me to manually execute SQL statements or copy/paste data. The entire migration should be executed automatically using the available tools (Read, Supabase MCP, Edit tools).

If migration fails at any point, use MCP to query the database state, provide detailed error information, and attempt automatic recovery or rollback.

Expected outcome: Complete automated migration with verification that all 300 word pairs are successfully transferred to the database and the frontend is updated to use the database as the data source.
```

## Prerequisites
- Completed Phase 1.2 (Database schema creation)
- Access to src/data/words.ts file
- Supabase SQL Editor access
- Understanding of data migration best practices

## Expected Outcomes
- All 300 word pairs successfully migrated to database
- Data integrity verified and maintained
- Categories properly preserved
- Database queries working correctly
- Frontend ready to load data from database

## Next Steps
After completing this task, proceed to Phase 2.1: Install Dependencies