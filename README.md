<div align="center">

# pdf-toolkit-mcp

**18 PDF operations for Claude Code, Claude Desktop, and any MCP client — via iLoveAPI.**

[![npm version](https://img.shields.io/npm/v/pdf-toolkit-mcp.svg?style=flat-square&logo=npm&color=cb3837)](https://www.npmjs.com/package/pdf-toolkit-mcp)
[![npm downloads](https://img.shields.io/npm/dm/pdf-toolkit-mcp.svg?style=flat-square&color=blue)](https://www.npmjs.com/package/pdf-toolkit-mcp)
[![License: MIT](https://img.shields.io/badge/license-MIT-yellow.svg?style=flat-square)](./LICENSE)
[![Node.js](https://img.shields.io/badge/node-%E2%89%A518-43853d.svg?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/typescript-strict-3178c6.svg?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![MCP](https://img.shields.io/badge/MCP-1.x-000000.svg?style=flat-square)](https://modelcontextprotocol.io)
[![Claude Code](https://img.shields.io/badge/Claude%20Code-plugin%20ready-7c3aed.svg?style=flat-square)](https://docs.claude.com/claude-code)
[![CI](https://img.shields.io/github/actions/workflow/status/cavr94/pdf-toolkit-mcp/ci.yml?style=flat-square&label=CI)](https://github.com/cavr94/pdf-toolkit-mcp/actions)

[Install](#-install) · [Tools](#-tool-catalog) · [Recipes](#-workflow-recipes) · [Architecture](#-architecture) · [Security](#-security-model) · [FAQ](#-faq)

</div>

---

> **Disclaimer.** `pdf-toolkit-mcp` is an **independent, community-built** open-source client. It is **not affiliated with, endorsed, sponsored, or certified by iLovePDF SL**. The project talks to the public [iLoveAPI](https://www.iloveapi.com) REST service using *your* project credentials — nothing is proxied, resold, or relicensed. "iLovePDF" and "iLoveAPI" are trademarks of iLovePDF SL; this project does not claim ownership of those marks.

---

## 📖 Table of contents

- [Why pdf-toolkit-mcp](#-why-pdf-toolkit-mcp)
- [Quick tour](#-quick-tour)
- [Install](#-install)
- [Tool catalog](#-tool-catalog)
- [Workflow recipes](#-workflow-recipes)
- [Architecture](#-architecture)
- [Configuration reference](#-configuration-reference)
- [Security model](#-security-model)
- [Development](#-development)
- [Testing & CI](#-testing--ci)
- [Releasing](#-releasing)
- [Roadmap](#-roadmap)
- [FAQ](#-faq)
- [Contributing](#-contributing)
- [License & trademarks](#-license--trademarks)
- [Credits](#-credits)

---

## 🎯 Why pdf-toolkit-mcp

| | Manual iLoveAPI | Raw `@ilovepdf/ilovepdf-nodejs` | **`pdf-toolkit-mcp`** |
| --- | :---: | :---: | :---: |
| Callable from Claude Code / Claude Desktop / any MCP client | ❌ | ❌ | ✅ |
| JWT signing + 5-step lifecycle handled for you | ❌ | ✅ | ✅ |
| Validated Zod schemas (no bad inputs reach the API) | ❌ | ❌ | ✅ |
| Path sandboxing against traversal | ❌ | ❌ | ✅ |
| Structured error codes (`RATE_LIMITED`, `PLAN_LIMIT`, …) | ❌ | partial | ✅ |
| Progress notifications during long OCR tasks | ❌ | ❌ | ✅ |
| Bundled Claude Code **skill** with multi-step pipelines | ❌ | ❌ | ✅ |
| Zero-setup install via `npx -y` | ❌ | ❌ | ✅ |

**Free for personal use.** iLoveAPI's free tier grants ~2,500 credits / month; this MCP itself is MIT-licensed and costs nothing.

---

## 🚀 Quick tour

After installation, just *talk* to Claude. The model figures out which tools to call:

```
You: Merge invoice-jan.pdf and invoice-feb.pdf into Q1.pdf, then compress it hard
     and lock it with the password "2026q1".

Claude (planning):
  1. merge_pdf     → invoice-jan.pdf + invoice-feb.pdf  →  Q1.pdf
  2. compress_pdf  → Q1.pdf                             →  Q1-compressed.pdf  (level: extreme)
  3. protect_pdf   → Q1-compressed.pdf                  →  Q1-compressed-protected.pdf

Claude (result):
  ✅ Created ~/docs/Q1-compressed-protected.pdf (312 KB, password-protected).
```

---

## 📦 Install

### Prerequisites

- **Node.js ≥ 18** (LTS recommended).
- **iLoveAPI project keys** — free tier at [developer.ilovepdf.com](https://developer.ilovepdf.com). Takes ~2 minutes:
  1. Sign up → create a project → copy `Project public key` and `Project secret key`.
  2. Export them (or drop them into your client's MCP config — examples below).

### Option A — Claude Code (CLI one-liner)

```bash
export ILOVEAPI_PROJECT_PUBLIC_KEY="project_public_xxx"
export ILOVEAPI_PROJECT_SECRET_KEY="secret_key_xxx"

claude mcp add pdf-toolkit -- npx -y pdf-toolkit-mcp
```

Restart Claude Code and all 18 tools appear in the picker. Verify with `/mcp` → you should see `pdf-toolkit: connected (18 tools)`.

### Option B — Claude Code Plugin (includes the `pdf-workflow` skill)

```
/plugin marketplace add cavr94/pdf-toolkit-mcp
/plugin install pdf-toolkit@cavr94/pdf-toolkit-mcp
```

The plugin auto-configures the MCP server *and* installs a skill that teaches Claude five canonical multi-step PDF pipelines (see [Workflow recipes](#-workflow-recipes)).

### Option C — Claude Desktop (`claude_desktop_config.json`)

<details>
<summary>Click to expand</summary>

Edit `claude_desktop_config.json` (`%APPDATA%\Claude\` on Windows, `~/Library/Application Support/Claude/` on macOS):

```jsonc
{
  "mcpServers": {
    "pdf-toolkit": {
      "command": "npx",
      "args": ["-y", "pdf-toolkit-mcp"],
      "env": {
        "ILOVEAPI_PROJECT_PUBLIC_KEY": "project_public_xxx",
        "ILOVEAPI_PROJECT_SECRET_KEY": "secret_key_xxx"
      }
    }
  }
}
```

Restart Claude Desktop — the 🔌 icon should show `pdf-toolkit` connected.
</details>

### Option D — any MCP client via stdio

```bash
ILOVEAPI_PROJECT_PUBLIC_KEY=… ILOVEAPI_PROJECT_SECRET_KEY=… npx -y pdf-toolkit-mcp
```

The server speaks the standard MCP JSON-RPC 2.0 framing over stdio. Wire it into Cursor, Windsurf, `mcphub`, `mcp-inspector`, or anything else that speaks MCP.

---

## 🧰 Tool catalog

All 18 tools are exposed with strict Zod schemas, `additionalProperties: false`, and return both a `text` summary *and* a `file://` resource URI so the client can surface the output.

### 📚 Organize

| Tool | What it does | Key inputs |
| --- | --- | --- |
| `merge_pdf` | Combine ≥ 2 PDFs in order | `input_files[]`, `output_path?` |
| `split_pdf` | Split by page ranges (`"1-3,5-7"`) or fixed chunk size | `input_file`, `ranges?`, `fixed_range?` |
| `extract_pdf_pages` | Keep a specific subset of pages | `input_file`, `pages` (`"1,3,5-9"`) |

### 🔄 Convert — from PDF

| Tool | Output | Notes |
| --- | --- | --- |
| `pdf_to_word` | `.docx` | Scanned PDFs → run `ocr_pdf` first for best results |
| `pdf_to_excel` | `.xlsx` | Works best on tabular source PDFs |
| `pdf_to_powerpoint` | `.pptx` | One slide per PDF page |
| `pdf_to_jpg` | `.zip` of `.jpg` | `mode: "pages"` renders pages; `"extract"` pulls embedded images |

### 🔄 Convert — to PDF

| Tool | Accepts | Notes |
| --- | --- | --- |
| `office_to_pdf` | `.doc`, `.docx`, `.xls`, `.xlsx`, `.ppt`, `.pptx` | Server-side rendering |
| `html_to_pdf` | `.html`, `.htm` | Local HTML only; external assets may not resolve |
| `image_to_pdf` | `.jpg`, `.jpeg`, `.png` | One image per page, preserves order |

### ✏️ Edit

| Tool | What it does | Key inputs |
| --- | --- | --- |
| `rotate_pdf` | Rotate pages 90 / 180 / 270° clockwise | `rotation`, `pages?` (default: all) |
| `add_page_numbers` | Stamp numbered footer/header | `starting_number`, `vertical_position`, `horizontal_position` |
| `add_watermark` | Text or image watermark | `mode: "text"` + `text`, OR `mode: "image"` + `image_file` |

### 🔐 Security

| Tool | What it does | Key inputs |
| --- | --- | --- |
| `unlock_pdf` | Remove known password | `input_file`, `password` |
| `protect_pdf` | Add password | `input_file`, `password` |

### 🩹 Repair / OCR

| Tool | What it does | Notes |
| --- | --- | --- |
| `repair_pdf` | Attempt structural repair on damaged PDFs | Useful before further processing |
| `ocr_pdf` | Run OCR to make scans searchable | `languages[]` (e.g. `["eng"]`, `["spa"]`, `["eng","spa"]`). ⏱ Can exceed 60s on image-heavy PDFs |

> **All tools** accept absolute or CWD-relative paths for `input_file(s)` and an **optional** `output_path` (file or directory). Defaults place the result next to the first input with a timestamped name.

---

## 🍳 Workflow recipes

The bundled `pdf-workflow` skill ([skills/pdf-workflow/SKILL.md](skills/pdf-workflow/SKILL.md)) teaches Claude five canonical multi-step pipelines. You can also run these manually — just describe the end state and Claude chains the tools for you.

<details>
<summary><b>1. Assemble</b> — merge + compress + (optional) protect</summary>

```
merge_pdf([a.pdf, b.pdf, c.pdf])
   → compress_pdf(level="recommended")
   → protect_pdf(password="…")
```
</details>

<details>
<summary><b>2. Convert & secure</b> — Office doc to locked PDF</summary>

```
office_to_pdf(report.docx)
   → add_watermark(mode="text", text="CONFIDENTIAL", opacity=30)
   → protect_pdf(password="…")
```
</details>

<details>
<summary><b>3. Extract & OCR</b> — pull pages out of a scan and make them editable</summary>

```
extract_pdf_pages(scan.pdf, pages="3-9")
   → ocr_pdf(languages=["eng"])
   → pdf_to_word
```
</details>

<details>
<summary><b>4. Prep for email</b> — shrink + lock</summary>

```
compress_pdf(big.pdf, level="extreme")
   → protect_pdf(password="…")
```
</details>

<details>
<summary><b>5. Scan cleanup</b> — repair + OCR + number</summary>

```
repair_pdf(scan_broken.pdf)
   → ocr_pdf(languages=["eng"])
   → add_page_numbers(position="bottom-center")
```
</details>

---

## 🏛 Architecture

```
┌────────────────────────────┐    stdio    ┌──────────────────────────┐
│     Claude Code / Desktop  │◀───────────▶│   pdf-toolkit-mcp server │
│   (or any MCP client)      │  JSON-RPC   │   (this repo)            │
└────────────────────────────┘             └────────────┬─────────────┘
                                                        │
                                                        ▼
                                             ┌──────────────────────┐
                                             │  @ilovepdf/          │
                                             │  ilovepdf-nodejs     │
                                             │  (JWT + HTTP)        │
                                             └──────────┬───────────┘
                                                        │
                                                        ▼  HTTPS
                                             ┌──────────────────────┐
                                             │   iLoveAPI servers   │
                                             │   api.ilovepdf.com   │
                                             └──────────────────────┘
```

### iLoveAPI 5-phase lifecycle (orchestrated in [`src/api/tasks.ts`](src/api/tasks.ts))

```
  [ 10% ]   start     →  POST /v1/start/{tool}     (server assignment + task id)
  [ 40% ]   upload    →  POST /v1/upload           (one call per file, progress scales)
  [ 50% ]   process   →  POST /v1/process          (run the tool with params)
  [ 90% ]   download  →  GET  /v1/download/{task}  (bytes → Buffer)
  [100% ]   done      →  write to disk, emit file:// resource URI
```

The server emits MCP `notifications/progress` at each boundary so your client can render a live progress bar for slow operations (OCR, large merges).

### Project layout

```
pdf-toolkit-mcp/
├── .claude-plugin/
│   ├── plugin.json           # Plugin manifest
│   └── .mcp.json             # MCP server config (npx -y pdf-toolkit-mcp)
├── skills/
│   └── pdf-workflow/
│       └── SKILL.md          # 5-recipe skill for multi-step pipelines
├── src/
│   ├── index.ts              # #!/usr/bin/env node shebang
│   ├── server.ts             # MCP stdio bootstrap
│   ├── api/
│   │   ├── client.ts         # iLoveAPI client singleton (CJS interop via createRequire)
│   │   ├── tasks.ts          # 5-phase lifecycle orchestrator
│   │   ├── errors.ts         # HTTP → structured PdfToolkitError mapping
│   │   └── types.ts          # Types + error class
│   ├── tools/                # 18 tools, one file per concern
│   │   ├── _shared.ts        # Zod fragments + writeOutputAndReport helper
│   │   ├── merge.ts  split.ts  compress.ts
│   │   ├── convertFromPdf.ts convertToPdf.ts
│   │   ├── pageOps.ts  security.ts  watermark.ts
│   │   ├── repair.ts  ocr.ts
│   │   └── index.ts          # allTools[] barrel
│   └── util/
│       ├── paths.ts          # resolveInputs/resolveOutput + sandbox enforcement
│       ├── progress.ts       # Progress adapter
│       └── logger.ts         # stderr-only logger (stdio-safe)
├── tests/
│   ├── unit/                 # client, paths, errors, tools.merge (25 tests)
│   └── integration/          # smoke.test.ts — gated on iLoveAPI creds
├── scripts/
│   └── inspector.sh          # npm run inspect → MCP Inspector UI
└── .github/workflows/
    ├── ci.yml                # ubuntu+windows × node 18/20/22
    └── publish.yml           # Publishes to npm on v* tags with --provenance
```

---

## ⚙️ Configuration reference

### Environment variables

| Variable | Required | Default | Description |
| --- | :---: | --- | --- |
| `ILOVEAPI_PROJECT_PUBLIC_KEY` | ✅ | — | Project public key from [developer.ilovepdf.com](https://developer.ilovepdf.com) |
| `ILOVEAPI_PROJECT_SECRET_KEY` | ✅ | — | Project secret key. **Never logged.** Used for local JWT signing. |
| `ILOVEAPI_SANDBOX_ROOT` | ❌ | — | Absolute path. When set, **all** input/output paths must resolve *inside* this directory — traversal attempts throw `PATH_TRAVERSAL`. |
| `PDF_TOOLKIT_DEBUG` | ❌ | — | Set to `1` to emit verbose stderr logs (request shape, phase timings). Secrets never logged. |

### Structured error codes

Every failure surfaces a `PdfToolkitError` with a stable machine-readable code:

| Code | Trigger | What to tell the user |
| --- | --- | --- |
| `MISSING_CREDENTIALS` | Env vars not set | Point them at developer.ilovepdf.com |
| `INVALID_INPUT` | HTTP 400 / Zod parse failure | Fix the arguments |
| `AUTH_FAILED` | HTTP 401 | Regenerate the project keys |
| `PLAN_LIMIT` | HTTP 402 | Free tier exhausted or tool not in plan |
| `NOT_FOUND` | HTTP 404 | Input file or task missing |
| `RATE_LIMITED` | HTTP 429 | Back off and retry |
| `TASK_LIMIT` | SDK `TaskLimit` error | Too many concurrent tasks |
| `PATH_TRAVERSAL` | Path escapes `ILOVEAPI_SANDBOX_ROOT` | Reject the request |
| `API_ERROR` | Unmapped iLoveAPI error | Check `data.http_status` + `data.iloveapi_code` |

---

## 🔒 Security model

`pdf-toolkit-mcp` is designed to be safe to install on a developer machine:

- **Stdio only.** The server never opens a network socket; it only makes outbound HTTPS calls to `api.ilovepdf.com` via the official SDK.
- **No `console.log`.** JSON-RPC over stdio would corrupt on any stray stdout write, so every log line goes through `process.stderr`.
- **Secrets never persisted.** Credentials live in env vars for the lifetime of the process and are never written to disk, log files, or tool responses.
- **JWT generated locally.** The `@ilovepdf/ilovepdf-nodejs` SDK self-signs JWTs with your secret key — no secret leaves the machine.
- **Path sandbox (opt-in).** Set `ILOVEAPI_SANDBOX_ROOT` to constrain the server to a single directory tree; any path resolving outside throws before the API is ever called.
- **Extension whitelists per tool.** `html_to_pdf` rejects `.exe`; `image_to_pdf` only accepts common raster formats, etc.
- **MIT licensed, audit-friendly.** ~2k lines of TypeScript. No obfuscation, no minification, no postinstall scripts.

---

## 👩‍💻 Development

```bash
git clone https://github.com/cavr94/pdf-toolkit-mcp.git
cd pdf-toolkit-mcp
npm install
```

### Common tasks

| Command | What it does |
| --- | --- |
| `npm run build` | Compile TypeScript → `dist/` |
| `npm run dev` | Watch-mode build |
| `npm run typecheck` | `tsc --noEmit` — fast error surface |
| `npm run lint` | ESLint on `src/` + `tests/` |
| `npm test` | Vitest unit suite (no network) |
| `npm run test:integration` | Real iLoveAPI calls (requires creds) |
| `npm run inspect` | Launch [MCP Inspector](https://github.com/modelcontextprotocol/inspector) against the local build |

### Debugging inside Claude Code

1. Build locally: `npm run build`.
2. Register the *local* dist instead of npm:
   ```bash
   claude mcp remove pdf-toolkit    # if previously registered
   claude mcp add pdf-toolkit -- node "$(pwd)/dist/index.js"
   ```
3. Set `PDF_TOOLKIT_DEBUG=1` in your shell before launching Claude Code for verbose stderr.
4. Stderr is visible with `claude mcp logs pdf-toolkit`.

---

## ✅ Testing & CI

- **Unit tests** — 25 tests across `client`, `paths`, `errors`, and `tools.merge`. Fully mocked, no network. Run with `npm test`.
- **Integration smoke test** — `tests/integration/smoke.test.ts` spins up two minimal valid PDFs and exercises a real `merge_pdf` end-to-end. Gated on `ILOVEAPI_*_KEY` env vars; automatically skipped in PR CI for security.
- **CI matrix** — [.github/workflows/ci.yml](.github/workflows/ci.yml) runs `lint → typecheck → build → test` on:
  - OS: `ubuntu-latest`, `windows-latest`
  - Node: `18`, `20`, `22`

---

## 🚢 Releasing

Publishing is automated on tag push:

```bash
npm version patch           # or minor / major
git push --follow-tags
```

The [publish workflow](.github/workflows/publish.yml) then:
1. Re-runs lint + typecheck + build + tests.
2. Publishes to npm with `--access public --provenance` (supply-chain attestation).
3. Creates a GitHub Release with auto-generated notes.

Repo secret required: **`NPM_TOKEN`** (npm *automation* token).

---

## 🗺 Roadmap

- [x] v0.1 — 18 PDF tools, stdio transport, plugin + skill, CI, npm publish
- [ ] v0.2 — Submit to `anthropics/claude-plugins-official` marketplace, add to [Smithery](https://smithery.ai), package as `.dxt` for Claude Desktop one-click install
- [ ] v0.3 — 8 image tools (resize, convert, compress, crop, rotate, watermark, upscale, remove background)
- [ ] v0.4 — Signature tools (signing flows require paid tier — gated behind env flag)
- [ ] v1.0 — Optional Streamable-HTTP transport for hosted/multi-user setups

Have a feature request? [Open an issue](https://github.com/cavr94/pdf-toolkit-mcp/issues/new).

---

## 🙋 FAQ

**Is this legal / safe / allowed by iLovePDF?**
Yes. It's a thin open-source client that uses *your* credentials — nothing is resold, relicensed, or proxied. The iLoveAPI Terms of Service explicitly permit open-source libraries using user-provided keys (several community SDKs have existed for years). This project does not ship any keys, does not use "iLovePDF"/"iLoveAPI" in its package name, and carries the required disclaimer.

**Does it cost money?**
iLoveAPI offers ~2,500 credits per month free (enough for thousands of small ops). Heavier workloads need a paid iLoveAPI plan. This MCP itself is MIT and free forever.

**Does it work offline?**
No. iLoveAPI is cloud-only, so every tool call requires internet access.

**Can I pin a specific version?**
Yes: `claude mcp add pdf-toolkit -- npx -y pdf-toolkit-mcp@0.1.0`.

**Can I self-host?**
Yes. Clone the repo, `npm run build`, and point your client at `node ./dist/index.js`. The server is entirely stateless.

**What happens if iLoveAPI is down?**
The tool returns a `PdfToolkitError` with `code: "API_ERROR"` and `data.http_status`. Claude can retry with exponential backoff on your behalf.

**Can I use this without Claude?**
Yes — any MCP-compatible client works: Cursor, Windsurf, Zed, MCP Inspector, custom clients. The server is 100% spec-compliant.

---

## 🤝 Contributing

Contributions welcome! Small checklist before opening a PR:

1. `npm run lint && npm run typecheck && npm test` → all green.
2. New tools follow the pattern in [src/tools/merge.ts](src/tools/merge.ts) (Zod schema → `runTask` → `writeOutputAndReport`).
3. Add at least one unit test.
4. Update the [Tool catalog](#-tool-catalog) in this README if you add/rename a tool.

Bug reports are even more welcome — include the tool name, the arguments, and (if safe to share) the stderr output.

---

## 📜 License & trademarks

Released under the [MIT License](./LICENSE) © 2026 Carlos.

"iLovePDF" and "iLoveAPI" are trademarks of **iLovePDF SL**. This project is an independent, community-built client and is **not affiliated with, endorsed by, sponsored by, or certified by iLovePDF SL**. The package name intentionally avoids both marks.

---

## 🙏 Credits

- [iLovePDF](https://www.ilovepdf.com) / [iLoveAPI](https://www.iloveapi.com) — the cloud PDF processing API that powers every tool call.
- [Anthropic](https://www.anthropic.com) — for [Claude](https://www.anthropic.com/claude), [Claude Code](https://docs.claude.com/claude-code), and the [Model Context Protocol](https://modelcontextprotocol.io) specification.
- [`@modelcontextprotocol/sdk`](https://www.npmjs.com/package/@modelcontextprotocol/sdk), [Zod](https://zod.dev), [Vitest](https://vitest.dev), [ESLint](https://eslint.org) — the toolchain this project stands on.
- Every contributor who reports issues, suggests tools, and sends pull requests. 🙌
