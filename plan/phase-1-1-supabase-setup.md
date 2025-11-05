# Phase 1.1: Supabase Project Setup

## Task Description
Set up a new Supabase project for the Italian Flashcards application to provide backend services including database, authentication, and real-time features.

## Claude Code Prompt

```
I need you to help me set up a Supabase project for my Italian Flashcards application. This is the first step in migrating from a static frontend-only app to a full-stack application with user authentication and persistent progress tracking.

Please guide me through the following steps. First try to check if it necesary or it is already solved by the project setup. Use MCP Server.

1. **Create Supabase Account & Project:**
   - Help me navigate to supabase.com and create a new account (if needed)
   - Guide me through creating a new project
   - Recommend appropriate project settings for a flashcard learning app
   - Help me choose the right region (preferably EU for GDPR compliance)

2. **Initial Project Configuration:**
   - Help me locate and securely store the project URL
   - Help me find and store the anon/public key
   - Guide me to locate the service role key (for admin operations)
   - Ensure I understand the difference between these keys

3. **Security Settings:**
   - Help me enable Row Level Security (RLS) by default
   - Configure basic project security settings
   - Set up authentication providers (email, Google, GitHub)
   - Configure redirect URLs for local development and production

4. **Environment Setup:**
   - Automatically update my existing .env file with the new Supabase credentials using the Edit tool
   - Update .env.example with the new required variables using the Edit tool
   - Ensure proper security practices for credential management

5. **MCP Server Verification:**
   After manual project setup, use the Supabase MCP server to verify the connection:
   - Test the MCP connection to the new Supabase project
   - Verify that the MCP server can access the database
   - Confirm authentication is working via MCP
   - Test basic database operations (list tables, etc.)

Expected deliverables:
- A configured Supabase project ready for database schema creation
- Updated .env file with Supabase credentials (automated)
- MCP server connection verified and working
- Ready for automated database schema creation

The project should be optimized for:
- A learning application with user progress tracking
- GDPR compliance
- Scalability for future features
- Security best practices

Please be thorough in explaining each step and any security considerations I should be aware of.
```

## Prerequisites
- Internet connection
- Email address for Supabase account
- Basic understanding of environment variables

## Expected Outcomes
- Active Supabase project
- Project credentials stored securely
- Environment variables configured
- Authentication providers enabled
- Foundation ready for database schema creation

## Next Steps
After completing this task, proceed to Phase 1.2: Database Schema Creation