import { z } from 'zod';
import { runTask } from '../api/tasks.js';
import { resolveInputs, resolveOutput } from '../util/paths.js';
import { createProgressAdapter } from '../util/progress.js';
import { OutputPathField, writeOutputAndReport, type ToolDefinition } from './_shared.js';

const unlockSchema = z.object({
  input_file: z.string().min(1).describe('Path to the password-protected PDF file.'),
  password: z
    .string()
    .min(1)
    .describe('The password to unlock the PDF. Handled as a secret and sent only to iLoveAPI.'),
  output_path: OutputPathField,
});

export const unlockPdfTool: ToolDefinition<typeof unlockSchema> = {
  name: 'unlock_pdf',
  description:
    'Remove password protection from a PDF. Requires the correct password. Produces an unprotected .pdf file on disk.',
  inputSchema: unlockSchema,
  async handler(args, ctx) {
    const [input] = await resolveInputs([args.input_file], ['.pdf']);
    const outputPath = resolveOutput(args.output_path, input, 'unlocked', 'pdf');
    const { outputBuffers, taskId } = await runTask({
      tool: 'unlock',
      files: [input],
      params: { password: args.password },
      onProgress: createProgressAdapter(ctx.sendProgress),
    });
    return writeOutputAndReport(
      outputPath,
      outputBuffers[0],
      `Unlocked PDF (task ${taskId ?? 'n/a'})`,
    );
  },
};

const protectSchema = z.object({
  input_file: z.string().min(1).describe('Path to the PDF file to protect.'),
  password: z
    .string()
    .min(1)
    .describe('Password to set on the PDF. Handled as a secret and sent only to iLoveAPI.'),
  output_path: OutputPathField,
});

export const protectPdfTool: ToolDefinition<typeof protectSchema> = {
  name: 'protect_pdf',
  description:
    'Add password protection to a PDF. Anyone opening the output will need the supplied password.',
  inputSchema: protectSchema,
  async handler(args, ctx) {
    const [input] = await resolveInputs([args.input_file], ['.pdf']);
    const outputPath = resolveOutput(args.output_path, input, 'protected', 'pdf');
    const { outputBuffers, taskId } = await runTask({
      tool: 'protect',
      files: [input],
      params: { password: args.password },
      onProgress: createProgressAdapter(ctx.sendProgress),
    });
    return writeOutputAndReport(
      outputPath,
      outputBuffers[0],
      `Protected PDF with password (task ${taskId ?? 'n/a'})`,
    );
  },
};
