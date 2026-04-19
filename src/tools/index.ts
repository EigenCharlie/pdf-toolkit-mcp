export * from './_shared.js';
import { mergeTool } from './merge.js';
import { splitTool } from './split.js';
import { compressTool } from './compress.js';
import {
  pdfToWordTool,
  pdfToExcelTool,
  pdfToPowerPointTool,
  pdfToJpgTool,
} from './convertFromPdf.js';
import { officeToPdfTool, htmlToPdfTool, imageToPdfTool } from './convertToPdf.js';
import { rotatePdfTool, addPageNumbersTool, extractPdfPagesTool } from './pageOps.js';
import { unlockPdfTool, protectPdfTool } from './security.js';
import { addWatermarkTool } from './watermark.js';
import { repairPdfTool } from './repair.js';
import { ocrPdfTool } from './ocr.js';
import type { AnyToolDefinition } from './_shared.js';

export const allTools: AnyToolDefinition[] = [
  mergeTool,
  splitTool,
  compressTool,
  pdfToWordTool,
  pdfToExcelTool,
  pdfToPowerPointTool,
  pdfToJpgTool,
  officeToPdfTool,
  htmlToPdfTool,
  imageToPdfTool,
  rotatePdfTool,
  addPageNumbersTool,
  extractPdfPagesTool,
  unlockPdfTool,
  protectPdfTool,
  addWatermarkTool,
  repairPdfTool,
  ocrPdfTool,
];

export {
  mergeTool,
  splitTool,
  compressTool,
  pdfToWordTool,
  pdfToExcelTool,
  pdfToPowerPointTool,
  pdfToJpgTool,
  officeToPdfTool,
  htmlToPdfTool,
  imageToPdfTool,
  rotatePdfTool,
  addPageNumbersTool,
  extractPdfPagesTool,
  unlockPdfTool,
  protectPdfTool,
  addWatermarkTool,
  repairPdfTool,
  ocrPdfTool,
};
