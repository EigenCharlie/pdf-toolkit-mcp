#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
npm run build
exec npx -y @modelcontextprotocol/inspector node dist/index.js
