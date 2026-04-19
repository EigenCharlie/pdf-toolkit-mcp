import { z } from 'zod';
import { promises as fs } from 'node:fs';
import * as path from 'node:path';

/** MCP content item returned from a tool call. */
export type McpContent =
  | { type: 'text'; text: string }
  | { type: 'resource'; resource: { uri: string; mimeType?: string; text?: string; blob?: string } };

export interface ToolResult {
  content: McpContent[];
  isError?: boolean;
}

export interface ToolContext {
  /** Optional progress emitter passed by the MCP server. (pct 0-100, human-readable message.) */
  sendProgress?: (pct: number, msg: string) => void;
}

export interface ToolDefinition<TSchema extends z.ZodTypeAny = z.ZodTypeAny> {
  name: string;
  description: string;
  inputSchema: TSchema;
  handler: (args: z.infer<TSchema>, ctx: ToolContext) => Promise<ToolResult>;
}

// Type-erased variant for collections. Individual tools still declare
// ToolDefinition<typeof schema> for typed handlers; the array widens to this
// to avoid invariance issues between concrete ZodObjects and ZodTypeAny.
export interface AnyToolDefinition {
  name: string;
  description: string;
  inputSchema: z.ZodTypeAny;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler: (args: any, ctx: ToolContext) => Promise<ToolResult>;
}

// Reusable schema fragments
export const PdfInputsField = z
  .array(z.string().min(1))
  .min(1)
  .describe('Absolute or CWD-relative path(s) to input PDF file(s).');

export const OutputPathField = z
  .string()
  .optional()
  .describe(
    'Optional output path. If it ends with the expected extension, the file is written there. If it is a directory, the file is placed inside with a timestamped name. Defaults to the same directory as the first input.',
  );

/** Convenience helper used by every tool handler to write buffer + produce a standard MCP result. */
export async function writeOutputAndReport(
  outputPath: string,
  buffer: Buffer,
  summary: string,
  mimeType: string = 'application/pdf',
): Promise<ToolResult> {
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, buffer);
  // file:// URI, Windows-safe (forward slashes)
  const fileUri = 'file:///' + outputPath.replace(/\\/g, '/').replace(/^\//, '');
  return {
    content: [
      { type: 'text', text: `${summary}\nOutput: ${outputPath}` },
      { type: 'resource', resource: { uri: fileUri, mimeType } },
    ],
  };
}
