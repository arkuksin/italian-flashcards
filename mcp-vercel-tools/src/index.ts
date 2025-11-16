import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
// import dotenv from 'dotenv';
import { VercelClient } from './vercel-client.js';
import type {
  CreateDeploymentRequest,
  CreateProjectRequest,
  UpsertEnvironmentVariableRequest,
} from './types.js';

// Load environment variables from .env file
// dotenv.config();

import fs from 'fs';
import path from 'path';
import { parse as parseDotenv } from 'dotenv';

// .env leise (ohne Logs) laden
try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
        const parsed = parseDotenv(fs.readFileSync(envPath));
        for (const [k, v] of Object.entries(parsed)) {
            if (process.env[k] === undefined) process.env[k] = String(v);
        }
    }
} catch { /* still & silent */ }

// Environment validation - accept both VERCEL_TOKEN and VERCEL_API_TOKEN
const envSchema = z.object({
  VERCEL_TOKEN: z.string().optional(),
  VERCEL_API_TOKEN: z.string().optional(),
  VERCEL_TEAM_ID: z.string().optional(),
  VERCEL_PROJECT_ID: z.string().optional(),
});

// Parse and validate environment
const parsedEnv = envSchema.parse(process.env);

// Use VERCEL_TOKEN or fall back to VERCEL_API_TOKEN
const apiToken = parsedEnv.VERCEL_TOKEN || parsedEnv.VERCEL_API_TOKEN;
if (!apiToken) {
  throw new Error('VERCEL_TOKEN or VERCEL_API_TOKEN is required');
}

// Initialize Vercel client
const vercelClient = new VercelClient(apiToken, parsedEnv.VERCEL_TEAM_ID);

// Create MCP server
const server = new Server(
  {
    name: 'mcp-vercel-tools',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

type ToolArgs = Record<string, unknown> | undefined;

// Helper function to safely get argument values
function getArg<T>(args: ToolArgs, key: string, required: true): T;
function getArg<T>(args: ToolArgs, key: string, required?: false): T | undefined;
function getArg<T>(args: ToolArgs, key: string, required = false): T | undefined {
  if (!args || typeof args !== 'object') {
    if (required) {
      throw new McpError(ErrorCode.InvalidParams, `Missing required argument: ${key}`);
    }
    return undefined;
  }

  const value = (args as Record<string, unknown>)[key];
  if (required && (value === undefined || value === null)) {
    throw new McpError(ErrorCode.InvalidParams, `Missing required argument: ${key}`);
  }

  return value as T;
}

// Tool schemas
const tools: Tool[] = [
  // Project Management Tools
  {
    name: 'vercel_list_projects',
    description: 'List all Vercel projects',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Maximum number of projects to return',
          default: 20,
        },
        since: {
          type: 'number',
          description: 'Only return projects created after this timestamp',
        },
      },
    },
  },
  {
    name: 'vercel_get_project',
    description: 'Get details for a specific Vercel project',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'The project ID or name',
        },
      },
      required: ['projectId'],
    },
  },
  {
    name: 'vercel_create_project',
    description: 'Create a new Vercel project',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Project name',
        },
        framework: {
          type: 'string',
          description: 'Framework preset (e.g., nextjs, react, vue)',
        },
        gitRepository: {
          type: 'object',
          properties: {
            repo: {
              type: 'string',
              description: 'Repository URL or org/repo format',
            },
            type: {
              type: 'string',
              enum: ['github', 'gitlab', 'bitbucket'],
              description: 'Repository provider',
            },
          },
        },
        buildCommand: {
          type: 'string',
          description: 'Custom build command',
        },
        outputDirectory: {
          type: 'string',
          description: 'Output directory for build',
        },
        rootDirectory: {
          type: 'string',
          description: 'Root directory of the project in the repository',
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'vercel_delete_project',
    description: 'Delete a Vercel project',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'The project ID or name to delete',
        },
      },
      required: ['projectId'],
    },
  },
  // Deployment Tools
  {
    name: 'vercel_list_deployments',
    description: 'List deployments for a project or all deployments',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'Filter deployments by project ID',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of deployments to return',
          default: 20,
        },
        since: {
          type: 'number',
          description: 'Only return deployments created after this timestamp',
        },
      },
    },
  },
  {
    name: 'vercel_get_deployment',
    description: 'Get details for a specific deployment',
    inputSchema: {
      type: 'object',
      properties: {
        deploymentId: {
          type: 'string',
          description: 'The deployment ID',
        },
      },
      required: ['deploymentId'],
    },
  },
  {
    name: 'vercel_create_deployment',
    description: 'Trigger a new deployment',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Project name for the deployment',
        },
        gitSource: {
          type: 'object',
          properties: {
            ref: {
              type: 'string',
              description: 'Git branch or commit SHA',
            },
            repoId: {
              type: 'string',
              description: 'Repository ID',
            },
            type: {
              type: 'string',
              enum: ['github', 'gitlab', 'bitbucket'],
            },
          },
        },
        target: {
          type: 'string',
          enum: ['production', 'staging'],
          description: 'Deployment target',
        },
        meta: {
          type: 'object',
          description: 'Metadata for the deployment',
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'vercel_cancel_deployment',
    description: 'Cancel a running deployment',
    inputSchema: {
      type: 'object',
      properties: {
        deploymentId: {
          type: 'string',
          description: 'The deployment ID to cancel',
        },
      },
      required: ['deploymentId'],
    },
  },
  {
    name: 'vercel_get_deployment_logs',
    description: 'Get logs for a deployment',
    inputSchema: {
      type: 'object',
      properties: {
        deploymentId: {
          type: 'string',
          description: 'The deployment ID',
        },
      },
      required: ['deploymentId'],
    },
  },
  // Domain Management Tools
  {
    name: 'vercel_list_domains',
    description: 'List domains for a project',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'The project ID',
        },
      },
      required: ['projectId'],
    },
  },
  {
    name: 'vercel_add_domain',
    description: 'Add a domain to a project',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'The project ID',
        },
        name: {
          type: 'string',
          description: 'The domain name to add',
        },
        gitBranch: {
          type: 'string',
          description: 'Git branch to associate with the domain',
        },
        redirect: {
          type: 'string',
          description: 'Redirect URL for the domain',
        },
        redirectStatusCode: {
          type: 'number',
          description: 'HTTP status code for redirect (301 or 308)',
        },
      },
      required: ['projectId', 'name'],
    },
  },
  {
    name: 'vercel_remove_domain',
    description: 'Remove a domain from a project',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'The project ID',
        },
        domain: {
          type: 'string',
          description: 'The domain to remove',
        },
      },
      required: ['projectId', 'domain'],
    },
  },
  {
    name: 'vercel_verify_domain',
    description: 'Verify domain ownership',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'The project ID',
        },
        domain: {
          type: 'string',
          description: 'The domain to verify',
        },
      },
      required: ['projectId', 'domain'],
    },
  },
  // Environment Variables Tools
  {
    name: 'vercel_list_env_vars',
    description: 'List environment variables for a project',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'The project ID',
        },
      },
      required: ['projectId'],
    },
  },
  {
    name: 'vercel_get_env_var',
    description: 'Get a specific environment variable',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'The project ID',
        },
        envId: {
          type: 'string',
          description: 'The environment variable ID',
        },
      },
      required: ['projectId', 'envId'],
    },
  },
  {
    name: 'vercel_create_env_var',
    description: 'Create a new environment variable',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'The project ID',
        },
        key: {
          type: 'string',
          description: 'Environment variable name',
        },
        value: {
          type: 'string',
          description: 'Environment variable value',
        },
        type: {
          type: 'string',
          enum: ['plain', 'secret', 'encrypted', 'system'],
          description: 'Type of environment variable',
          default: 'encrypted',
        },
        target: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['production', 'preview', 'development'],
          },
          description: 'Target environments',
          default: ['production', 'preview', 'development'],
        },
        gitBranch: {
          type: 'string',
          description: 'Git branch to associate with the variable',
        },
      },
      required: ['projectId', 'key', 'value'],
    },
  },
  {
    name: 'vercel_update_env_var',
    description: 'Update an existing environment variable',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'The project ID',
        },
        envId: {
          type: 'string',
          description: 'The environment variable ID',
        },
        key: {
          type: 'string',
          description: 'New variable name',
        },
        value: {
          type: 'string',
          description: 'New variable value',
        },
        type: {
          type: 'string',
          enum: ['plain', 'secret', 'encrypted', 'system'],
          description: 'Type of environment variable',
        },
        target: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['production', 'preview', 'development'],
          },
          description: 'Target environments',
        },
      },
      required: ['projectId', 'envId'],
    },
  },
  {
    name: 'vercel_delete_env_var',
    description: 'Delete an environment variable',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'The project ID',
        },
        envId: {
          type: 'string',
          description: 'The environment variable ID to delete',
        },
      },
      required: ['projectId', 'envId'],
    },
  },
];

// Handle list tools request
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      // Project Management
      case 'vercel_list_projects': {
        const limit = getArg<number>(args, 'limit');
        const since = getArg<number>(args, 'since');
        const result = await vercelClient.listProjects(limit, since);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }
      case 'vercel_get_project': {
        const projectId = getArg<string>(args, 'projectId', true);
        const result = await vercelClient.getProject(projectId);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }
      case 'vercel_create_project': {
        const name = getArg<string>(args, 'name', true);
        const framework = getArg<string>(args, 'framework');
        const gitRepository = getArg<CreateProjectRequest['gitRepository']>(args, 'gitRepository');
        const buildCommand = getArg<string>(args, 'buildCommand');
        const outputDirectory = getArg<string>(args, 'outputDirectory');
        const rootDirectory = getArg<string>(args, 'rootDirectory');

        const createRequest = {
          name,
          ...(framework && { framework }),
          ...(gitRepository && { gitRepository }),
          ...(buildCommand && { buildCommand }),
          ...(outputDirectory && { outputDirectory }),
          ...(rootDirectory && { rootDirectory }),
        };

        const result = await vercelClient.createProject(createRequest);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }
      case 'vercel_delete_project': {
        const projectId = getArg<string>(args, 'projectId', true);
        await vercelClient.deleteProject(projectId);
        return {
          content: [
            {
              type: 'text',
              text: `Project ${projectId} deleted successfully`,
            },
          ],
        };
      }

      // Deployment Management
      case 'vercel_list_deployments': {
        const projectId = getArg<string>(args, 'projectId');
        const limit = getArg<number>(args, 'limit');
        const since = getArg<number>(args, 'since');
        const result = await vercelClient.listDeployments(projectId, limit, since);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }
      case 'vercel_get_deployment': {
        const deploymentId = getArg<string>(args, 'deploymentId', true);
        const result = await vercelClient.getDeployment(deploymentId);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }
      case 'vercel_create_deployment': {
        const name = getArg<string>(args, 'name', true);
        const gitSource = getArg<CreateDeploymentRequest['gitSource']>(args, 'gitSource');
        const target = getArg<'production' | 'staging'>(args, 'target');
        const meta = getArg<Record<string, string>>(args, 'meta');

        const deploymentRequest = {
          name,
          ...(gitSource && { gitSource }),
          ...(target && { target }),
          ...(meta && { meta }),
        };

        const result = await vercelClient.createDeployment(deploymentRequest);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }
      case 'vercel_cancel_deployment': {
        const deploymentId = getArg<string>(args, 'deploymentId', true);
        const result = await vercelClient.cancelDeployment(deploymentId);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }
      case 'vercel_get_deployment_logs': {
        const deploymentId = getArg<string>(args, 'deploymentId', true);
        const result = await vercelClient.getDeploymentLogs(deploymentId);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      // Domain Management
      case 'vercel_list_domains': {
        const projectId = getArg<string>(args, 'projectId', true);
        const result = await vercelClient.listDomains(projectId);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }
      case 'vercel_add_domain': {
        const projectId = getArg<string>(args, 'projectId', true);
        const name = getArg<string>(args, 'name', true);
        const gitBranch = getArg<string>(args, 'gitBranch');
        const redirect = getArg<string>(args, 'redirect');
        const redirectStatusCode = getArg<number>(args, 'redirectStatusCode');

        const domainRequest = {
          name,
          ...(gitBranch && { gitBranch }),
          ...(redirect && { redirect }),
          ...(redirectStatusCode && { redirectStatusCode }),
        };

        const result = await vercelClient.addDomain(projectId, domainRequest);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }
      case 'vercel_remove_domain': {
        const projectId = getArg<string>(args, 'projectId', true);
        const domain = getArg<string>(args, 'domain', true);
        await vercelClient.removeDomain(projectId, domain);
        return {
          content: [
            {
              type: 'text',
              text: `Domain ${domain} removed from project ${projectId}`,
            },
          ],
        };
      }
      case 'vercel_verify_domain': {
        const projectId = getArg<string>(args, 'projectId', true);
        const domain = getArg<string>(args, 'domain', true);
        const result = await vercelClient.verifyDomain(projectId, domain);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      // Environment Variables
      case 'vercel_list_env_vars': {
        const projectId = getArg<string>(args, 'projectId', true);
        const result = await vercelClient.listEnvironmentVariables(projectId);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }
      case 'vercel_get_env_var': {
        const projectId = getArg<string>(args, 'projectId', true);
        const envId = getArg<string>(args, 'envId', true);
        const result = await vercelClient.getEnvironmentVariable(projectId, envId);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }
      case 'vercel_create_env_var': {
        const projectId = getArg<string>(args, 'projectId', true);
        const key = getArg<string>(args, 'key', true);
        const value = getArg<string>(args, 'value', true);
        const type = getArg<'plain' | 'secret' | 'encrypted' | 'system'>(args, 'type');
        const target = getArg<string[]>(args, 'target');
        const gitBranch = getArg<string>(args, 'gitBranch');

        const envRequest = {
          key,
          value,
          type: type || 'encrypted',
          target: target || ['production', 'preview', 'development'],
          ...(gitBranch && { gitBranch }),
        };

        const result = await vercelClient.createEnvironmentVariable(projectId, envRequest);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }
      case 'vercel_update_env_var': {
        const projectId = getArg<string>(args, 'projectId', true);
        const envId = getArg<string>(args, 'envId', true);
        const key = getArg<string>(args, 'key');
        const value = getArg<string>(args, 'value');
        const type = getArg<'plain' | 'secret' | 'encrypted' | 'system'>(args, 'type');
        const target = getArg<string[]>(args, 'target');

        const updateData: Partial<UpsertEnvironmentVariableRequest> = {};
        if (key) updateData.key = key;
        if (value) updateData.value = value;
        if (type) updateData.type = type;
        if (target) updateData.target = target;

        const result = await vercelClient.updateEnvironmentVariable(projectId, envId, updateData);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }
      case 'vercel_delete_env_var': {
        const projectId = getArg<string>(args, 'projectId', true);
        const envId = getArg<string>(args, 'envId', true);
        await vercelClient.deleteEnvironmentVariable(projectId, envId);
        return {
          content: [
            {
              type: 'text',
              text: `Environment variable ${envId} deleted from project ${projectId}`,
            },
          ],
        };
      }

      default:
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown tool: ${name}`
        );
    }
  } catch (error) {
    if (error instanceof McpError) throw error;

    throw new McpError(
      ErrorCode.InternalError,
      error instanceof Error ? error.message : 'Unknown error occurred'
    );
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Vercel MCP server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
