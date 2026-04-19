import { z } from 'zod';
import { runTask } from '../api/tasks.js';
import { resolveInputs, resolveOutput } from '../util/paths.js';
import { createProgressAdapter } from '../util/progress.js';
import { OutputPathField, writeOutputAndReport, type ToolDefinition } from './_shared.js';

const rotateSchema = z.object({
  input_file: z.string().min(1).describe('Path to the PDF file to rotate.'),
  rotation: z
    .union([z.literal(90), z.literal(180), z.literal(270)])
    .describe('Clockwise rotation in degrees. Must be 90, 180, or 270.'),
  pages: z
    .string()
    .optional()
    .default('all')
    .describe('Which pages to rotate: "all" (default), or a list like "1,3,5" or "1-5".'),
  output_path: OutputPathField,
});

export const rotatePdfTool: ToolDefinition<typeof rotateSchema> = {
  name: 'rotate_pdf',
  description:
    'Rotate pages in a PDF by 90, 180, or 270 degrees clockwise. Target specific pages with "pages" (e.g. "1,3,5" or "1-5"), or rotate all pages by default.',
  inputSchema: rotateSchema,
  async handler(args, ctx) {
    const [input] = await resolveInputs([args.input_file], ['.pdf']);
    const outputPath = resolveOutput(args.output_path, input, 'rotated', 'pdf');
    const { outputBuffers, taskId } = await runTask({
      tool: 'rotate',
      files: [input],
      params: { rotate: args.rotation, pages: args.pages },
      onProgress: createProgressAdapter(ctx.sendProgress),
    });
    return writeOutputAndReport(
      outputPath,
      outputBuffers[0],
      `Rotated PDF by ${args.rotation} degrees (pages: ${args.pages}) (task ${taskId ?? 'n/a'})`,
    );
  },
};

const pageNumbersSchema = z.object({
  input_file: z.string().min(1).describe('Path to the PDF file to stamp with page numbers.'),
  starting_number: z
    .number()
    .int()
    .positive()
    .optional()
    .default(1)
    .describe('Number to use for the first stamped page. Default: 1.'),
  pages: z
    .string()
    .optional()
    .default('all')
    .describe('Which pages to number: "all" (default) or a range like "1-5" or list "1,3,5".'),
  vertical_position: z
    .enum(['top', 'bottom'])
    .optional()
    .default('bottom')
    .describe('Vertical placement of the page number. Default: "bottom".'),
  horizontal_position: z
    .enum(['left', 'center', 'right'])
    .optional()
    .default('center')
    .describe('Horizontal placement of the page number. Default: "center".'),
  output_path: OutputPathField,
});

export const addPageNumbersTool: ToolDefinition<typeof pageNumbersSchema> = {
  name: 'add_page_numbers',
  description:
    'Stamp page numbers onto a PDF. Configure starting number, which pages to number, and placement (top/bottom + left/center/right).',
  inputSchema: pageNumbersSchema,
  async handler(args, ctx) {
    const [input] = await resolveInputs([args.input_file], ['.pdf']);
    const outputPath = resolveOutput(args.output_path, input, 'numbered', 'pdf');
    const { outputBuffers, taskId } = await runTask({
      tool: 'pagenumber',
      files: [input],
      params: {
        starting_number: args.starting_number,
        pages: args.pages,
        vertical_position: args.vertical_position,
        horizontal_position: args.horizontal_position,
      },
      onProgress: createProgressAdapter(ctx.sendProgress),
    });
    return writeOutputAndReport(
      outputPath,
      outputBuffers[0],
      `Added page numbers starting at ${args.starting_number} (task ${taskId ?? 'n/a'})`,
    );
  },
};

const extractSchema = z.object({
  input_file: z.string().min(1).describe('Path to the PDF file to extract pages from.'),
  pages: z
    .string()
    .min(1)
    .describe('Pages to extract, e.g. "1,3,5-7". Required.'),
  output_path: OutputPathField,
});

export const extractPdfPagesTool: ToolDefinition<typeof extractSchema> = {
  name: 'extract_pdf_pages',
  description:
    'Extract a subset of pages from a PDF into a new PDF. Specify pages as a list or range, e.g. "1,3,5-7".',
  inputSchema: extractSchema,
  async handler(args, ctx) {
    const [input] = await resolveInputs([args.input_file], ['.pdf']);
    const outputPath = resolveOutput(args.output_path, input, 'extracted', 'pdf');
    const { outputBuffers, taskId } = await runTask({
      tool: 'extract',
      files: [input],
      params: { pages: args.pages },
      onProgress: createProgressAdapter(ctx.sendProgress),
    });
    return writeOutputAndReport(
      outputPath,
      outputBuffers[0],
      `Extracted pages ${args.pages} (task ${taskId ?? 'n/a'})`,
    );
  },
};
