# Test fixtures

Unit tests create minimal PDFs on the fly in OS temp dirs; they do not rely on files in this folder.

Drop your own sample PDFs here (e.g. `sample-a.pdf`, `sample-b.pdf`) if you want to run one-off smoke tests via `npm run inspect` or direct `node dist/index.js` invocations.

The repository `.gitignore` already excludes `output/` and `tmp/` subdirectories created during local runs.
