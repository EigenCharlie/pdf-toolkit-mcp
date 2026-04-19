import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { allTools } from './tools/index.js';
import { PdfToolkitError } from './api/types.js';
import { log } from './util/logger.js';

export async function main(): Promise<void> {
  const server = new Server(
    { name: 'pdf-toolkit-mcp', version: '0.1.0' },
    { capabilities: { tools: {} } },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: allTools.map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: zodToJsonSchema(t.inputSchema, { target: 'jsonSchema7' }) as Record<
        string,
        unknown
      >,
    })),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (req) => {
    const { name, arguments: rawArgs } = req.params;
    const tool = allTools.find((t) => t.name === name);
    if (!tool) {
      throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }

    const progressToken = (req.params as { _meta?: { progressToken?: string | number } })._meta
      ?.progressToken;

    const sendProgress = progressToken
      ? (pct: number, msg: string) => {
          server
            .notification({
              method: 'notifications/progress',
              params: { progressToken, progress: pct, total: 100, message: msg },
            })
            .catch(() => {
              /* swallow — progress is best-effort */
            });
        }
      : undefined;

    try {
      const parsed = tool.inputSchema.parse(rawArgs ?? {});
      const result = await tool.handler(parsed, { sendProgress });
      return {
        content: result.content,
        isError: result.isError,
      };
    } catch (err) {
      if (err instanceof PdfToolkitError) {
        log.error(`Tool ${name} failed`, { code: err.code, data: err.data });
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: `Error (${err.code}): ${err.message}`,
            },
          ],
        };
      }
      if (err instanceof McpError) throw err;
      const message = err instanceof Error ? err.message : String(err);
      log.error(`Tool ${name} unexpected error`, { message });
      return {
        isError: true,
        content: [{ type: 'text', text: `Unexpected error: ${message}` }],
      };
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
  log.info(`pdf-toolkit-mcp ready (${allTools.length} tools registered)`);
}
