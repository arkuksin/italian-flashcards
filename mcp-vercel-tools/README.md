# MCP Vercel Tools

A Model Context Protocol (MCP) server that provides comprehensive tools for managing Vercel projects, deployments, domains, and environment variables through Claude Code.

## Features

### Project Management
- **List Projects**: View all your Vercel projects
- **Get Project Details**: Get detailed information about a specific project
- **Create Project**: Create new Vercel projects with custom configurations
- **Delete Project**: Remove projects from your Vercel account

### Deployment Management
- **List Deployments**: View all deployments or filter by project
- **Get Deployment Details**: Get detailed information about a specific deployment
- **Create Deployment**: Trigger new deployments programmatically
- **Cancel Deployment**: Cancel running deployments
- **Get Deployment Logs**: Access build and runtime logs

### Domain Management
- **List Domains**: View all domains associated with a project
- **Add Domain**: Add custom domains to your projects
- **Remove Domain**: Remove domains from projects
- **Verify Domain**: Verify domain ownership

### Environment Variables
- **List Variables**: View all environment variables for a project
- **Get Variable**: Get details about a specific variable
- **Create Variable**: Add new environment variables
- **Update Variable**: Modify existing environment variables
- **Delete Variable**: Remove environment variables

## Installation

1. Clone this repository or copy the `mcp-vercel-tools` directory to your desired location.

2. Install dependencies:
```bash
cd mcp-vercel-tools
npm install
```

3. Build the TypeScript code:
```bash
npm run build
```

## Configuration

### 1. Get your Vercel API Token

1. Go to [Vercel Account Settings](https://vercel.com/account/tokens)
2. Click "Create Token"
3. Give it a name (e.g., "MCP Server")
4. Select the scope (Full Account or specific team)
5. Copy the generated token

### 2. Configure Environment Variables

You can set up your Vercel API token in two ways:

#### Option A: Using .env file (Recommended)
1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Edit the `.env` file and add your token:
   ```
   VERCEL_API_TOKEN=your_actual_token_here
   VERCEL_TEAM_ID=your_team_id_if_applicable
   ```

#### Option B: Environment Variables
Set the environment variables directly in your Claude Code configuration.

### 3. Configure Claude Code Settings

Add the following to your Claude Code settings:

If using a .env file (recommended), you only need to specify the path:

#### Windows
```json
{
  "mcpServers": {
    "vercel": {
      "command": "node",
      "args": ["C:\\path\\to\\mcp-vercel-tools\\dist\\index.js"]
    }
  }
}
```

#### macOS/Linux
```json
{
  "mcpServers": {
    "vercel": {
      "command": "node",
      "args": ["/path/to/mcp-vercel-tools/dist/index.js"]
    }
  }
}
```

If you prefer to set environment variables directly:

#### With Environment Variables
```json
{
  "mcpServers": {
    "vercel": {
      "command": "node",
      "args": ["C:\\path\\to\\mcp-vercel-tools\\dist\\index.js"],
      "env": {
        "VERCEL_API_TOKEN": "your_vercel_api_token_here",
        "VERCEL_TEAM_ID": "optional_team_id"
      }
    }
  }
}
```

### Environment Variables

- **VERCEL_API_TOKEN** (required): Your Vercel API authentication token
- **VERCEL_TEAM_ID** (optional): Team ID if you want to manage team projects

## Usage Examples

Once configured, you can use these tools in Claude Code:

### Project Management
```
# List all projects
Use the vercel_list_projects tool

# Get project details
Use the vercel_get_project tool with projectId: "my-project"

# Create a new Next.js project
Use the vercel_create_project tool with:
- name: "my-new-project"
- framework: "nextjs"

# Delete a project
Use the vercel_delete_project tool with projectId: "old-project"
```

### Deployment Management
```
# List deployments for a project
Use the vercel_list_deployments tool with projectId: "my-project"

# Get deployment details
Use the vercel_get_deployment tool with deploymentId: "dpl_xxxxx"

# Get deployment logs
Use the vercel_get_deployment_logs tool with deploymentId: "dpl_xxxxx"

# Cancel a deployment
Use the vercel_cancel_deployment tool with deploymentId: "dpl_xxxxx"
```

### Domain Management
```
# List project domains
Use the vercel_list_domains tool with projectId: "my-project"

# Add a custom domain
Use the vercel_add_domain tool with:
- projectId: "my-project"
- name: "custom.domain.com"

# Remove a domain
Use the vercel_remove_domain tool with:
- projectId: "my-project"
- domain: "old.domain.com"

# Verify domain ownership
Use the vercel_verify_domain tool with:
- projectId: "my-project"
- domain: "custom.domain.com"
```

### Environment Variables
```
# List all environment variables
Use the vercel_list_env_vars tool with projectId: "my-project"

# Create a new environment variable
Use the vercel_create_env_var tool with:
- projectId: "my-project"
- key: "API_KEY"
- value: "secret_value"
- type: "encrypted"
- target: ["production", "preview"]

# Update an environment variable
Use the vercel_update_env_var tool with:
- projectId: "my-project"
- envId: "env_xxxxx"
- value: "new_value"

# Delete an environment variable
Use the vercel_delete_env_var tool with:
- projectId: "my-project"
- envId: "env_xxxxx"
```

## Development

To modify or extend this MCP server:

1. Edit the TypeScript source files in the `src` directory
2. Run `npm run dev` to watch for changes and rebuild automatically
3. Test your changes by restarting Claude Code

## API Rate Limits

Be aware of Vercel's API rate limits:
- Default: 100 requests per 10 seconds
- Some endpoints have specific limits
- Rate limit information is returned in response headers

## Security Notes

- Never commit your API token to version control
- Use environment variables to store sensitive information
- Consider using different tokens for different environments
- Rotate tokens regularly for security

## Troubleshooting

### Server not connecting
1. Verify the path in your Claude Code settings is correct
2. Check that the TypeScript code has been compiled (`npm run build`)
3. Ensure your API token is valid and has the necessary permissions

### Permission errors
1. Make sure your API token has the required scope
2. For team projects, ensure you've set the correct VERCEL_TEAM_ID

### Tool not found
1. Restart Claude Code after updating the configuration
2. Check the server logs for any errors

## Support

For issues or questions:
1. Check the [Vercel API Documentation](https://vercel.com/docs/rest-api)
2. Review the [MCP Documentation](https://modelcontextprotocol.io)
3. Open an issue in this repository

## License

MIT