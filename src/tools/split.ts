import { z } from 'zod';
import { runTask } from '../api/tasks.js';
import { resolveInputs, resolveOutput } from '../util/paths.js';
import { createProgressAdapter } from '../util/progress.js';
import { OutputPathField, writeOutputAndReport, type ToolDefinition } from './_shared.js';

const schema = z
  .object({
    input_file: z.string().min(1).describe('Path to the PDF file to split.'),
    ranges: z
      .string()
      .optional()
      .describe('Page ranges to extract, e.g. "1-3,5-7". If omitted and fixed_range is set, splits into fixed-size chunks.'),
    fixed_range: z
      .number()
      .int()
      .positive()
      .optional()
      .describe('If set, splits the PDF into chunks of this many pages each.'),
    output_path: OutputPathField,
  })
  .refine((v) => v.ranges || v.fixed_range, {
    message: 'Either "ranges" or "fixed_range" must be provided.',
  });

export const splitTool: ToolDefinition<typeof schema> = {
  name: 'split_pdf',
  description:
    'Split a PDF into multiple PDFs by page ranges (e.g. "1-3,5-7") or into fixed-size chunks. Returns a .zip archive containing the resulting PDFs.',
  inputSchema: schema,
  async handler(args, ctx) {
    const [input] = await resolveInputs([args.input_file], ['.pdf']);
    const outputPath = resolveOutput(args.output_path, input, 'split', 'zip');
    const params: Record<string, unknown> = {
      split_mode: args.ranges ? 'ranges' : args.fixed_range ? 'fixed_range' : 'ranges',
    };
    if (args.ranges) params.ranges = args.ranges;
    if (args.fixed_range) params.fixed_range = args.fixed_range;
    const { outputBuffers, taskId } = await runTask({
      tool: 'split',
      files: [input],
      params,
      onProgress: createProgressAdapter(ctx.sendProgress),
    });
    return writeOutputAndReport(
      outputPath,
      outputBuffers[0],
      `Split PDF into ${args.ranges ? `ranges ${args.ranges}` : `chunks of ${args.fixed_range} pages`} (task ${taskId ?? 'n/a'})`,
      'application/zip',
    );
  },
};
