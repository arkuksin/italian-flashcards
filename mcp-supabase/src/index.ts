import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { parse as parseDotenv } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import {
  Server as BaseServer,
} from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  CallToolResultSchema,
  ErrorCode,
  McpError,
  type Tool,
  type CallToolResult,
} from '@modelcontextprotocol/sdk/types.js';

type PrimitiveValue = string | number | boolean | null;
type ToolHandler = (input: unknown) => Promise<CallToolResult> | CallToolResult;

class ToolServer extends BaseServer {
  private readonly tools = new Map<string, { definition: Tool; handler: ToolHandler }>();

  constructor(info: { name: string; version: string }, options: ConstructorParameters<typeof BaseServer>[1]) {
    super(info, options);

    this.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: Array.from(this.tools.values()).map(({ definition }) => definition),
    }));

    this.setRequestHandler(CallToolRequestSchema, async (request) => {
      const entry = this.tools.get(request.params.name);
      if (!entry) {
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${request.params.name}`);
      }

      try {
        const result = await entry.handler(request.params.arguments ?? {});
        return CallToolResultSchema.parse(result);
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }
        if (error instanceof z.ZodError) {
          throw new McpError(
            ErrorCode.InvalidParams,
            error.issues.map((issue) => issue.message).join('; ')
          );
        }
        throw new McpError(
          ErrorCode.InternalError,
          error instanceof Error ? error.message : 'Unknown error occurred'
        );
      }
    });
  }

  addTool(definition: Tool, handler: ToolHandler) {
    if (this.tools.has(definition.name)) {
      throw new McpError(ErrorCode.InvalidParams, `Tool already registered: ${definition.name}`);
    }
    this.tools.set(definition.name, { definition, handler });
  }
}

function findEnvPath(): string | undefined {
  const candidates = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), '..', '.env'),
  ];
  return candidates.find((candidate) => existsSync(candidate));
}

function loadSupabaseConfig() {
  // Try environment variables first (for MCP server configuration)
  let supabaseUrl = process.env.SUPABASE_URL?.trim();
  let serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE?.trim() || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  // If not found in environment, try loading from .env file
  if (!supabaseUrl || !serviceRoleKey) {
    const envPath = findEnvPath();
    if (envPath) {
      const parsed = parseDotenv(readFileSync(envPath));
      supabaseUrl = supabaseUrl || parsed.SUPABASE_URL?.trim();
      serviceRoleKey = serviceRoleKey || parsed.SUPABASE_SERVICE_ROLE?.trim() || parsed.SUPABASE_SERVICE_ROLE_KEY?.trim();
    }
  }

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
  }

  return { supabaseUrl, serviceRoleKey };
}

const primitiveValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
]);

const selectInputSchema = z.object({
  table: z.string().min(1, 'table is required'),
  where: z.record(z.string(), primitiveValueSchema).optional(),
  columns: z.union([
    z.string().min(1, 'columns must be a non-empty string'),
    z.array(z.string().min(1)).nonempty('columns array must not be empty'),
  ]).optional(),
  limit: z.number().int().positive('limit must be a positive integer').optional(),
});

const insertInputSchema = z.object({
  table: z.string().min(1, 'table is required'),
  rows: z.array(z.record(z.string(), z.any())).nonempty('rows must contain at least one item'),
});

const updateInputSchema = z.object({
  table: z.string().min(1, 'table is required'),
  where: z
    .record(z.string(), primitiveValueSchema)
    .refine((value) => Object.keys(value).length > 0, 'where must include at least one condition'),
  values: z
    .record(z.string(), z.any())
    .refine((value) => Object.keys(value).length > 0, 'values must include at least one field'),
});

const deleteInputSchema = z.object({
  table: z.string().min(1, 'table is required'),
  where: z
    .record(z.string(), primitiveValueSchema)
    .refine((value) => Object.keys(value).length > 0, 'where must include at least one condition'),
});

type WhereClause = Record<string, PrimitiveValue>;

function applyWhere<T extends { eq: (column: string, value: PrimitiveValue) => T; is: (column: string, value: PrimitiveValue) => T }>(
  query: T,
  where?: WhereClause
): T {
  if (!where) {
    return query;
  }

  let current = query;
  for (const [column, value] of Object.entries(where)) {
    current = value === null ? current.is(column, null) : current.eq(column, value);
  }
  return current;
}

function toColumnSelection(columns?: string | string[]) {
  if (!columns) {
    return '*';
  }
  return Array.isArray(columns) ? columns.join(',') : columns;
}

function jsonResult(payload: unknown): CallToolResult {
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(payload ?? null, null, 2),
      },
    ],
  };
}

const { supabaseUrl, serviceRoleKey } = loadSupabaseConfig();
const supabase = createClient(supabaseUrl, serviceRoleKey);

const server = new ToolServer(
  {
    name: 'mcp-supabase',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.addTool(
  {
    name: 'supabase_select',
    description: 'Select rows from a Supabase table with optional filters',
    inputSchema: {
      type: 'object',
      properties: {
        table: { type: 'string', description: 'Supabase table name' },
        where: {
          type: 'object',
          description: 'Simple equality filters expressed as key/value pairs',
          additionalProperties: true,
        },
        columns: {
          oneOf: [
            {
              type: 'array',
              items: { type: 'string' },
              description: 'Columns to select as an array',
            },
            {
              type: 'string',
              description: 'Columns to select as a comma-separated string',
            },
          ],
        },
        limit: {
          type: 'integer',
          minimum: 1,
          description: 'Maximum number of rows to return',
        },
      },
      required: ['table'],
    },
  },
  async (input) => {
    const parsed = selectInputSchema.parse(input ?? {});
    let query = supabase.from(parsed.table).select(toColumnSelection(parsed.columns));
    query = applyWhere(query, parsed.where);
    if (parsed.limit !== undefined) {
      query = query.limit(parsed.limit);
    }

    const { data, error } = await query;
    if (error) {
      throw new McpError(ErrorCode.InternalError, error.message);
    }

    return jsonResult(data ?? []);
  }
);

server.addTool(
  {
    name: 'supabase_insert',
    description: 'Insert one or more rows into a Supabase table',
    inputSchema: {
      type: 'object',
      properties: {
        table: { type: 'string', description: 'Supabase table name' },
        rows: {
          type: 'array',
          items: { type: 'object', additionalProperties: true },
          description: 'Array of row objects to insert',
        },
      },
      required: ['table', 'rows'],
    },
  },
  async (input) => {
    const parsed = insertInputSchema.parse(input ?? {});
    const { data, error } = await supabase
      .from(parsed.table)
      .insert(parsed.rows)
      .select();

    if (error) {
      throw new McpError(ErrorCode.InternalError, error.message);
    }

    return jsonResult(data ?? []);
  }
);

server.addTool(
  {
    name: 'supabase_update',
    description: 'Update rows in a Supabase table that match the given filters',
    inputSchema: {
      type: 'object',
      properties: {
        table: { type: 'string', description: 'Supabase table name' },
        where: {
          type: 'object',
          description: 'Equality filters to select rows to update',
          additionalProperties: true,
        },
        values: {
          type: 'object',
          description: 'Column values to set during the update',
          additionalProperties: true,
        },
      },
      required: ['table', 'where', 'values'],
    },
  },
  async (input) => {
    const parsed = updateInputSchema.parse(input ?? {});
    let query = supabase.from(parsed.table).update(parsed.values);
    query = applyWhere(query, parsed.where);

    const { data, error } = await query.select();
    if (error) {
      throw new McpError(ErrorCode.InternalError, error.message);
    }

    return jsonResult(data ?? []);
  }
);

server.addTool(
  {
    name: 'supabase_delete',
    description: 'Delete rows from a Supabase table that match the given filters',
    inputSchema: {
      type: 'object',
      properties: {
        table: { type: 'string', description: 'Supabase table name' },
        where: {
          type: 'object',
          description: 'Equality filters to select rows to delete',
          additionalProperties: true,
        },
      },
      required: ['table', 'where'],
    },
  },
  async (input) => {
    const parsed = deleteInputSchema.parse(input ?? {});
    let query = supabase.from(parsed.table).delete();
    query = applyWhere(query, parsed.where);

    const { data, error } = await query.select();
    if (error) {
      throw new McpError(ErrorCode.InternalError, error.message);
    }

    return jsonResult(data ?? []);
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error('Fatal error', error);
  process.exit(1);
});
