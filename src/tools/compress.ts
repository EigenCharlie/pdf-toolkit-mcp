import { z } from 'zod';
import { runTask } from '../api/tasks.js';
import { resolveInputs, resolveOutput } from '../util/paths.js';
import { createProgressAdapter } from '../util/progress.js';
import { OutputPathField, writeOutputAndReport, type ToolDefinition } from './_shared.js';

const schema = z.object({
  input_file: z.string().min(1).describe('Path to the PDF file to compress.'),
  compression_level: z
    .enum(['low', 'recommended', 'extreme'])
    .optional()
    .default('recommended')
    .describe('Compression strength. "extreme" yields the smallest file but may lose quality.'),
  output_path: OutputPathField,
});

export const compressTool: ToolDefinition<typeof schema> = {
  name: 'compress_pdf',
  description:
    'Reduce the file size of a PDF. Choose compression_level "low", "recommended" (default), or "extreme". Outputs a .pdf file on disk and returns its path.',
  inputSchema: schema,
  async handler(args, ctx) {
    const [input] = await resolveInputs([args.input_file], ['.pdf']);
    const outputPath = resolveOutput(args.output_path, input, 'compressed', 'pdf');
    const { outputBuffers, taskId } = await runTask({
      tool: 'compress',
      files: [input],
      params: { compression_level: args.compression_level },
      onProgress: createProgressAdapter(ctx.sendProgress),
    });
    return writeOutputAndReport(
      outputPath,
      outputBuffers[0],
      `Compressed PDF (level: ${args.compression_level}) (task ${taskId ?? 'n/a'})`,
    );
  },
};
