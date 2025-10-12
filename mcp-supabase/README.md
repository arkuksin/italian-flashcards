# Supabase MCP Server

Custom MCP server for Supabase database operations via Claude Code.

## Setup

1. **Install dependencies:**
   ```bash
   cd mcp-supabase
   npm install
   ```

2. **Build the server:**
   ```bash
   npm run build
   ```

3. **Configure environment:**

   Create a `.env` file in the project root with:
   ```bash
   # TEST Database
   SUPABASE_TEST_URL=https://your-test-project.supabase.co
   SUPABASE_TEST_SERVICE_ROLE=your-test-service-role-key

   # PRODUCTION Database
   SUPABASE_PROD_URL=https://your-prod-project.supabase.co
   SUPABASE_PROD_SERVICE_ROLE=your-prod-service-role-key
   ```

4. **Configure MCP:**

   Copy `.mcp.json.example` to `.mcp.json` and update the `cwd` paths.

## Start Scripts

- **`start-test.sh`** - Starts MCP server with TEST database credentials
- **`start-prod.sh`** - Starts MCP server with PRODUCTION database credentials

These scripts automatically load environment variables from `../.env` and set the appropriate credentials.

## Available Tools

- `supabase_select` - Query rows from a table
- `supabase_insert` - Insert rows into a table
- `supabase_update` - Update rows in a table
- `supabase_delete` - Delete rows from a table

## Development

```bash
# Rebuild after changes
npm run build

# Test handshake
npm run test:handshake
```
