import { z } from 'zod';
import { runTask } from '../api/tasks.js';
import { resolveInputs, resolveOutput } from '../util/paths.js';
import { createProgressAdapter } from '../util/progress.js';
import { PdfInputsField, OutputPathField, writeOutputAndReport, type ToolDefinition } from './_shared.js';

const schema = z.object({
  input_files: PdfInputsField.min(2).describe('Two or more PDF files to merge, in order.'),
  output_path: OutputPathField,
});

export const mergeTool: ToolDefinition<typeof schema> = {
  name: 'merge_pdf',
  description:
    'Merge two or more PDF files into a single PDF, preserving order. Outputs a .pdf file on disk and returns its path.',
  inputSchema: schema,
  async handler(args, ctx) {
    const inputs = await resolveInputs(args.input_files, ['.pdf']);
    const outputPath = resolveOutput(args.output_path, inputs[0], 'merged', 'pdf');
    const { outputBuffers, taskId } = await runTask({
      tool: 'merge',
      files: inputs,
      onProgress: createProgressAdapter(ctx.sendProgress),
    });
    return writeOutputAndReport(
      outputPath,
      outputBuffers[0],
      `Merged ${inputs.length} PDFs (task ${taskId ?? 'n/a'})`,
    );
  },
};
