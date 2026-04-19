# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] — 2026-04-18

### Added
- Initial release.
- 18 PDF tools exposed as MCP tools: merge_pdf, split_pdf, compress_pdf, pdf_to_word, pdf_to_excel, pdf_to_powerpoint, pdf_to_jpg, office_to_pdf, html_to_pdf, image_to_pdf, rotate_pdf, add_page_numbers, add_watermark, unlock_pdf, protect_pdf, repair_pdf, ocr_pdf, extract_pdf_pages.
- Claude Code Plugin with `pdf-workflow` skill orchestrating 5 canonical multi-step workflows.
- stdio transport, distributed via npm as `pdf-toolkit-mcp`.
- Auth via env vars (`ILOVEAPI_PROJECT_PUBLIC_KEY`, `ILOVEAPI_PROJECT_SECRET_KEY`).
- Optional sandbox root (`ILOVEAPI_SANDBOX_ROOT`) to restrict filesystem access.

[Unreleased]: https://github.com/EigenCharlie/pdf-toolkit-mcp/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/EigenCharlie/pdf-toolkit-mcp/releases/tag/v0.1.0
