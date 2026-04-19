import { z } from 'zod';
import { runTask } from '../api/tasks.js';
import { resolveInputs, resolveOutput } from '../util/paths.js';
import { createProgressAdapter } from '../util/progress.js';
import { OutputPathField, writeOutputAndReport, type ToolDefinition } from './_shared.js';

const OFFICE_EXTS = ['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'];

const officeToPdfSchema = z.object({
  input_file: z
    .string()
    .min(1)
    .describe('Path to a Microsoft Office file (.doc, .docx, .xls, .xlsx, .ppt, .pptx).'),
  output_path: OutputPathField,
});

export const officeToPdfTool: ToolDefinition<typeof officeToPdfSchema> = {
  name: 'office_to_pdf',
  description:
    'Convert a Microsoft Office document (Word, Excel, or PowerPoint) to a PDF. Accepts .doc, .docx, .xls, .xlsx, .ppt, and .pptx files.',
  inputSchema: officeToPdfSchema,
  async handler(args, ctx) {
    const [input] = await resolveInputs([args.input_file], OFFICE_EXTS);
    const outputPath = resolveOutput(args.output_path, input, 'converted', 'pdf');
    const { outputBuffers, taskId } = await runTask({
      tool: 'officepdf',
      files: [input],
      onProgress: createProgressAdapter(ctx.sendProgress),
    });
    return writeOutputAndReport(
      outputPath,
      outputBuffers[0],
      `Converted Office document to PDF (task ${taskId ?? 'n/a'})`,
    );
  },
};

const htmlToPdfSchema = z.object({
  input_file: z.string().min(1).describe('Path to an .html or .htm file to convert.'),
  output_path: OutputPathField,
});

export const htmlToPdfTool: ToolDefinition<typeof htmlToPdfSchema> = {
  name: 'html_to_pdf',
  description:
    'Convert a local HTML file (.html or .htm) to a PDF. The HTML is rendered server-side; external assets referenced by the file may not be fetched.',
  inputSchema: htmlToPdfSchema,
  async handler(args, ctx) {
    const [input] = await resolveInputs([args.input_file], ['.html', '.htm']);
    const outputPath = resolveOutput(args.output_path, input, 'converted', 'pdf');
    const { outputBuffers, taskId } = await runTask({
      tool: 'htmlpdf',
      files: [input],
      onProgress: createProgressAdapter(ctx.sendProgress),
    });
    return writeOutputAndReport(
      outputPath,
      outputBuffers[0],
      `Converted HTML to PDF (task ${taskId ?? 'n/a'})`,
    );
  },
};

const imageToPdfSchema = z.object({
  input_files: z
    .array(z.string().min(1))
    .min(1)
    .describe('One or more image files (.jpg, .jpeg, .png), in the order they should appear in the PDF.'),
  output_path: OutputPathField,
});

export const imageToPdfTool: ToolDefinition<typeof imageToPdfSchema> = {
  name: 'image_to_pdf',
  description:
    'Combine one or more images (.jpg, .jpeg, .png) into a single PDF, one image per page, in the order provided.',
  inputSchema: imageToPdfSchema,
  async handler(args, ctx) {
    const inputs = await resolveInputs(args.input_files, ['.jpg', '.jpeg', '.png']);
    const outputPath = resolveOutput(args.output_path, inputs[0], 'images', 'pdf');
    const { outputBuffers, taskId } = await runTask({
      tool: 'imagepdf',
      files: inputs,
      onProgress: createProgressAdapter(ctx.sendProgress),
    });
    return writeOutputAndReport(
      outputPath,
      outputBuffers[0],
      `Converted ${inputs.length} image(s) to PDF (task ${taskId ?? 'n/a'})`,
    );
  },
};
