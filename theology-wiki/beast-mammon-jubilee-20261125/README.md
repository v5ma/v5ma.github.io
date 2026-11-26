# Beast, Mammon, Jubilee, and Second Temple Witnesses Edition (2026-11-25)

This standalone, deterministic Theology Wiki cluster adds five source-audited pages and a master navigation hub (`index.html`) without modifying any preserved historical corpus bytes in `theology-wiki/content/`, `theology-wiki/public-corpus/`, or `theology-sources/`.

## Rebuild and verify

```bash
node theology-wiki/beast-mammon-jubilee-20261125/build.cjs
node --test theology-wiki/beast-mammon-jubilee-20261125/test.cjs
```

## Architecture

- Editable source prose lives in `sources/*.md`.
- `build.cjs` renders clean semantic HTML, accessible responsive tables (`.matrix`), local offline search (`search-index.json`, `search-data.js`), and `build-report.json`.
- Reciprocal site-wide wiki links are registered through `theology-wiki/connections/` (`static-paths.json`, `editorial-links.json`, `build.py`), `theology-wiki/discover/` (`routes.json`, `build.py`), and `theology-wiki/latest/` (`manifest.json`, `build.cjs`).
