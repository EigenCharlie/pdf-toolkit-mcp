import { z } from 'zod';
import { runTask } from '../api/tasks.js';
import { resolveInputs, resolveOutput } from '../util/paths.js';
import { createProgressAdapter } from '../util/progress.js';
import { OutputPathField, writeOutputAndReport, type ToolDefinition } from './_shared.js';
import { PdfToolkitError } from '../api/types.js';

const watermarkSchema = z
  .object({
    input_file: z.string().min(1).describe('Path to the PDF file to watermark.'),
    mode: z
      .enum(['text', 'image'])
      .describe('"text" stamps a text watermark; "image" stamps an image file onto each page.'),
    text: z
      .string()
      .optional()
      .describe('Text to stamp. Required when mode="text".'),
    image_file: z
      .string()
      .optional()
      .describe('Path to a .jpg/.jpeg/.png image to stamp. Required when mode="image".'),
    layer: z
      .enum(['above', 'below'])
      .optional()
      .default('above')
      .describe('Whether the watermark sits above the page content or behind it.'),
    vertical_position: z
      .enum(['top', 'middle', 'bottom'])
      .optional()
      .default('middle'),
    horizontal_position: z
      .enum(['left', 'center', 'right'])
      .optional()
      .default('center'),
    rotation: z
      .number()
      .int()
      .min(0)
      .max(360)
      .optional()
      .default(0)
      .describe('Rotation in degrees (0-360). Default: 0.'),
    opacity: z
      .number()
      .int()
      .min(1)
      .max(100)
      .optional()
      .default(100)
      .describe('Opacity percentage (1-100). Default: 100.'),
    output_path: OutputPathField,
  })
  .superRefine((val, ctx) => {
    if (val.mode === 'text' && !val.text) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '`text` is required when mode="text".',
        path: ['text'],
      });
    }
    if (val.mode === 'image' && !val.image_file) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '`image_file` is required when mode="image".',
        path: ['image_file'],
      });
    }
  });

export const addWatermarkTool: ToolDefinition<typeof watermarkSchema> = {
  name: 'add_watermark',
  description:
    'Stamp a text or image watermark onto every page of a PDF. For mode="text", provide `text`. For mode="image", provide `image_file` (.jpg/.jpeg/.png). Tune placement, rotation, and opacity as needed.',
  inputSchema: watermarkSchema,
  async handler(args, ctx) {
    const [pdf] = await resolveInputs([args.input_file], ['.pdf']);
    const files = [pdf];
    if (args.mode === 'image') {
      if (!args.image_file) {
        throw new PdfToolkitError('image_file is required for mode="image"', 'INVALID_INPUT');
      }
      const [img] = await resolveInputs([args.image_file], ['.jpg', '.jpeg', '.png']);
      files.push(img);
    }
    const outputPath = resolveOutput(args.output_path, pdf, 'watermarked', 'pdf');
    const params: Record<string, unknown> = {
      mode: args.mode,
      layer: args.layer,
      vertical_position: args.vertical_position,
      horizontal_position: args.horizontal_position,
      rotation: args.rotation,
      transparency: args.opacity,
    };
    if (args.mode === 'text') params.text = args.text;
    const { outputBuffers, taskId } = await runTask({
      tool: 'watermark',
      files,
      params,
      onProgress: createProgressAdapter(ctx.sendProgress),
    });
    return writeOutputAndReport(
      outputPath,
      outputBuffers[0],
      `Added ${args.mode} watermark (task ${taskId ?? 'n/a'})`,
    );
  },
};
