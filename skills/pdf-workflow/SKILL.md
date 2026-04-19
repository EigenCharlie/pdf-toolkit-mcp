---
name: pdf-workflow
description: Multi-step PDF workflows using the pdf-toolkit MCP server. Use when the user wants to combine, convert, secure, OCR, or reshape PDFs and the task spans more than one tool call (e.g., "merge these PDFs and compress", "scan and OCR then convert to Word", "compress and password-protect"). Do NOT trigger for single-tool asks — call the MCP tool directly.
---

# PDF Workflow

Orchestrates common multi-step PDF pipelines using the `pdf-toolkit` MCP server. Each workflow calls the 18 MCP tools in a specific order.

## When to use
- Assemble: merge many PDFs then optimize the result
- Convert + secure: turn an Office doc into a watermarked, password-protected PDF
- Scan cleanup: repair a broken scan, OCR it, add page numbers
- Prep for email: aggressively compress + lock with a password
- Extract + OCR: pull specific pages then OCR them into Word

## Assumed tools
- merge_pdf, split_pdf, compress_pdf
- pdf_to_word, pdf_to_excel, pdf_to_powerpoint, pdf_to_jpg
- office_to_pdf, html_to_pdf, image_to_pdf
- rotate_pdf, add_page_numbers, extract_pdf_pages
- unlock_pdf, protect_pdf, repair_pdf
- add_watermark, ocr_pdf

All tools accept `input_file` or `input_files` (absolute or CWD-relative paths) and an optional `output_path`.

## Workflow 1: Assemble
**Goal**: combine N PDFs into one, then shrink, and optionally protect.

1. Call `merge_pdf(input_files=[...], output_path="<tmp>/merged.pdf")`.
2. Call `compress_pdf(input_file="<tmp>/merged.pdf", compression_level="recommended", output_path=<final>)`.
3. Optionally call `protect_pdf(input_file=<final>, password=<user-provided>)`.

## Workflow 2: Convert and secure
**Goal**: turn a Word/Excel/PPT file into a watermarked, password-protected PDF.

1. `office_to_pdf(input_file=<file>)` → <raw.pdf>.
2. `add_watermark(input_file=<raw.pdf>, mode="text", text="CONFIDENTIAL")` → <wm.pdf>.
3. `protect_pdf(input_file=<wm.pdf>, password=<pw>)` → final.

## Workflow 3: Extract and OCR
**Goal**: pull specific pages from a PDF, OCR them, then convert to Word.

1. `extract_pdf_pages(input_file=<src>, pages="3,5-9")` → <sub.pdf>.
2. `ocr_pdf(input_file=<sub.pdf>, languages=["eng"])` → <ocr.pdf>. (warn: slow for many pages)
3. `pdf_to_word(input_file=<ocr.pdf>)` → final.docx.

## Workflow 4: Prep for email
**Goal**: shrink a PDF aggressively and lock it behind a password.

1. `compress_pdf(input_file=<src>, compression_level="extreme")` → <small.pdf>.
2. `protect_pdf(input_file=<small.pdf>, password=<pw>)` → final.

## Workflow 5: Scan cleanup
**Goal**: fix a corrupt scan, OCR it, then number the pages.

1. `repair_pdf(input_file=<scan>)` → <fixed.pdf>.
2. `ocr_pdf(input_file=<fixed.pdf>, languages=["eng"])` → <ocr.pdf>.
3. `add_page_numbers(input_file=<ocr.pdf>, starting_number=1, horizontal_position="center", vertical_position="bottom")` → final.

## Notes
- If credentials are missing the tool call fails with `MISSING_CREDENTIALS`. Tell the user to set `ILOVEAPI_PROJECT_PUBLIC_KEY` and `ILOVEAPI_PROJECT_SECRET_KEY` env vars and restart Claude Code.
- `ocr_pdf` and large-PDF operations can exceed 60s. Mention that to the user before kicking off.
- Always prefer absolute paths. If the user gave relative paths, resolve against their CWD.
- Always report the final output path back to the user in your reply.
