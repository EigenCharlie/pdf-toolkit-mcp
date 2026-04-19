import { z } from 'zod';
import { runTask } from '../api/tasks.js';
import { resolveInputs, resolveOutput } from '../util/paths.js';
import { createProgressAdapter } from '../util/progress.js';
import { OutputPathField, writeOutputAndReport, type ToolDefinition } from './_shared.js';

const pdfToOfficeSchema = z.object({
  input_file: z.string().min(1).describe('Path to the PDF file to convert.'),
  output_path: OutputPathField,
});

const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const PPTX_MIME = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';

export const pdfToWordTool: ToolDefinition<typeof pdfToOfficeSchema> = {
  name: 'pdf_to_word',
  description:
    'Convert a PDF to an editable Microsoft Word .docx document. Conversion quality depends on the source (scanned PDFs produce poor results; use ocr_pdf first if needed).',
  inputSchema: pdfToOfficeSchema,
  async handler(args, ctx) {
    const [input] = await resolveInputs([args.input_file], ['.pdf']);
    const outputPath = resolveOutput(args.output_path, input, 'converted', 'docx');
    const { outputBuffers, taskId } = await runTask({
      tool: 'pdfoffice',
      files: [input],
      params: { convert_to: 'docx' },
      outputFileName: 'converted.docx',
      onProgress: createProgressAdapter(ctx.sendProgress),
    });
    return writeOutputAndReport(
      outputPath,
      outputBuffers[0],
      `Converted PDF to Word (task ${taskId ?? 'n/a'})`,
      DOCX_MIME,
    );
  },
};

export const pdfToExcelTool: ToolDefinition<typeof pdfToOfficeSchema> = {
  name: 'pdf_to_excel',
  description:
    'Convert a PDF to a Microsoft Excel .xlsx spreadsheet. Works best when the source PDF contains clear tabular data; non-tabular PDFs may produce messy results.',
  inputSchema: pdfToOfficeSchema,
  async handler(args, ctx) {
    const [input] = await resolveInputs([args.input_file], ['.pdf']);
    const outputPath = resolveOutput(args.output_path, input, 'converted', 'xlsx');
    const { outputBuffers, taskId } = await runTask({
      tool: 'pdfoffice',
      files: [input],
      params: { convert_to: 'xlsx' },
      outputFileName: 'converted.xlsx',
      onProgress: createProgressAdapter(ctx.sendProgress),
    });
    return writeOutputAndReport(
      outputPath,
      outputBuffers[0],
      `Converted PDF to Excel (task ${taskId ?? 'n/a'})`,
      XLSX_MIME,
    );
  },
};

export const pdfToPowerPointTool: ToolDefinition<typeof pdfToOfficeSchema> = {
  name: 'pdf_to_powerpoint',
  description:
    'Convert a PDF to a Microsoft PowerPoint .pptx presentation. Each PDF page becomes an editable slide; conversion quality depends on the source.',
  inputSchema: pdfToOfficeSchema,
  async handler(args, ctx) {
    const [input] = await resolveInputs([args.input_file], ['.pdf']);
    const outputPath = resolveOutput(args.output_path, input, 'converted', 'pptx');
    const { outputBuffers, taskId } = await runTask({
      tool: 'pdfoffice',
      files: [input],
      params: { convert_to: 'pptx' },
      outputFileName: 'converted.pptx',
      onProgress: createProgressAdapter(ctx.sendProgress),
    });
    return writeOutputAndReport(
      outputPath,
      outputBuffers[0],
      `Converted PDF to PowerPoint (task ${taskId ?? 'n/a'})`,
      PPTX_MIME,
    );
  },
};

const pdfToJpgSchema = z.object({
  input_file: z.string().min(1).describe('Path to the PDF file to convert.'),
  mode: z
    .enum(['pages', 'extract'])
    .optional()
    .default('pages')
    .describe('"pages" renders each PDF page as an image; "extract" extracts embedded images only.'),
  output_path: OutputPathField,
});

export const pdfToJpgTool: ToolDefinition<typeof pdfToJpgSchema> = {
  name: 'pdf_to_jpg',
  description:
    'Convert a PDF to JPG images. In "pages" mode (default) each page becomes a JPG; in "extract" mode only embedded images are pulled out. Returns a .zip archive of the images.',
  inputSchema: pdfToJpgSchema,
  async handler(args, ctx) {
    const [input] = await resolveInputs([args.input_file], ['.pdf']);
    const outputPath = resolveOutput(args.output_path, input, 'images', 'zip');
    const { outputBuffers, taskId } = await runTask({
      tool: 'pdfjpg',
      files: [input],
      params: { pdfjpg_mode: args.mode },
      onProgress: createProgressAdapter(ctx.sendProgress),
    });
    return writeOutputAndReport(
      outputPath,
      outputBuffers[0],
      `Converted PDF to JPG (mode: ${args.mode}) (task ${taskId ?? 'n/a'})`,
      'application/zip',
    );
  },
};
