import { z } from 'zod';
import { runTask } from '../api/tasks.js';
import { resolveInputs, resolveOutput } from '../util/paths.js';
import { createProgressAdapter } from '../util/progress.js';
import { OutputPathField, writeOutputAndReport, type ToolDefinition } from './_shared.js';

const ocrSchema = z.object({
  input_file: z.string().min(1).describe('Path to the PDF file to OCR.'),
  languages: z
    .array(z.string().min(2))
    .optional()
    .default(['eng'])
    .describe(
      'ISO 639-2/T 3-letter language codes to detect (e.g. ["eng"], ["spa"], ["eng","spa"]). Default: ["eng"].',
    ),
  output_path: OutputPathField,
});

export const ocrPdfTool: ToolDefinition<typeof ocrSchema> = {
  name: 'ocr_pdf',
  description:
    'Run OCR on a PDF to make scanned text selectable/searchable. Accepts one or more language codes (e.g. "eng", "spa"). Large or image-heavy PDFs can take more than 60 seconds.',
  inputSchema: ocrSchema,
  async handler(args, ctx) {
    const [input] = await resolveInputs([args.input_file], ['.pdf']);
    const outputPath = resolveOutput(args.output_path, input, 'ocr', 'pdf');
    const { outputBuffers, taskId } = await runTask({
      tool: 'pdfocr',
      files: [input],
      params: { ocr_languages: args.languages },
      onProgress: createProgressAdapter(ctx.sendProgress),
    });
    return writeOutputAndReport(
      outputPath,
      outputBuffers[0],
      `OCR complete (languages: ${args.languages.join(', ')}) (task ${taskId ?? 'n/a'})`,
    );
  },
};
