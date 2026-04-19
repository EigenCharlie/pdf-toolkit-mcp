import { z } from 'zod';
import { runTask } from '../api/tasks.js';
import { resolveInputs, resolveOutput } from '../util/paths.js';
import { createProgressAdapter } from '../util/progress.js';
import { OutputPathField, writeOutputAndReport, type ToolDefinition } from './_shared.js';

const repairSchema = z.object({
  input_file: z.string().min(1).describe('Path to the damaged PDF file to repair.'),
  output_path: OutputPathField,
});

export const repairPdfTool: ToolDefinition<typeof repairSchema> = {
  name: 'repair_pdf',
  description:
    'Attempt to repair a damaged or malformed PDF. Useful for scanned PDFs that fail to open or render correctly in some readers. Produces a .pdf file on disk.',
  inputSchema: repairSchema,
  async handler(args, ctx) {
    const [input] = await resolveInputs([args.input_file], ['.pdf']);
    const outputPath = resolveOutput(args.output_path, input, 'repaired', 'pdf');
    const { outputBuffers, taskId } = await runTask({
      tool: 'repair',
      files: [input],
      onProgress: createProgressAdapter(ctx.sendProgress),
    });
    return writeOutputAndReport(
      outputPath,
      outputBuffers[0],
      `Repaired PDF (task ${taskId ?? 'n/a'})`,
    );
  },
};
