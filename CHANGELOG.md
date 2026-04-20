# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.2] — 2026-04-20

### Fixed
- `mcpName` namespace is now `io.github.EigenCharlie/pdf-toolkit-mcp` (matching the actual GitHub username casing) so the MCP Registry's authorization check passes. The `eigencharlie` lowercase form in 0.1.1 was rejected with HTTP 403.

## [0.1.1] — 2026-04-19

### Added
- `mcpName` field (`io.github.eigencharlie/pdf-toolkit-mcp`) in `package.json` for MCP Registry discovery.
- `.claude-plugin/marketplace.json` so users can `/plugin marketplace add EigenCharlie/pdf-toolkit-mcp` → `/plugin install pdf-toolkit@pdf-toolkit`.
- `manifest.json` (MCPB v0.3) for Claude Desktop one-click install via the `.mcpb` bundle attached to GitHub Releases.

### Changed
- No runtime behavior changes vs 0.1.0. Purely distribution metadata.

## [0.1.0] — 2026-04-18

### Added
- Initial release.
- 18 PDF tools exposed as MCP tools: merge_pdf, split_pdf, compress_pdf, pdf_to_word, pdf_to_excel, pdf_to_powerpoint, pdf_to_jpg, office_to_pdf, html_to_pdf, image_to_pdf, rotate_pdf, add_page_numbers, add_watermark, unlock_pdf, protect_pdf, repair_pdf, ocr_pdf, extract_pdf_pages.
- Claude Code Plugin with `pdf-workflow` skill orchestrating 5 canonical multi-step workflows.
- stdio transport, distributed via npm as `pdf-toolkit-mcp`.
- Auth via env vars (`ILOVEAPI_PROJECT_PUBLIC_KEY`, `ILOVEAPI_PROJECT_SECRET_KEY`).
- Optional sandbox root (`ILOVEAPI_SANDBOX_ROOT`) to restrict filesystem access.

[Unreleased]: https://github.com/EigenCharlie/pdf-toolkit-mcp/compare/v0.1.2...HEAD
[0.1.2]: https://github.com/EigenCharlie/pdf-toolkit-mcp/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/EigenCharlie/pdf-toolkit-mcp/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/EigenCharlie/pdf-toolkit-mcp/releases/tag/v0.1.0
