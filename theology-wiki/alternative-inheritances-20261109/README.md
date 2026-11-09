# Alternative inheritances: source and navigation edition

Published as a dated editorial guide, November 9, 2026. The guide adds precise, reciprocal reading routes between Samaritan traditions, Qumran textual history and competing Christian authority. A route is labeled by its evidential relationship, not presented as proof of descent.

## Canonical inputs

- `sources/alternative-inheritances.md`: the sourced prose and access notes.
- `manifest.json`: eight verified reader routes, contextual bridge prose, six matrix rows and static companion routes.
- `reader-extension.js`: inserts separate, dated editorial panels in the main reader. It never edits original conversation text or inserts an addition inside an archived speaker turn.
- `build.cjs`: renders the guide, matrix, full-text search index and reader integration bundle. The existing vetted Markdown renderer checks all wikilink targets against `data/page-index.json`.

The existing reader already provides connections and parallel timelines. This edition improves explicit route labels and local context rather than claiming those capabilities were absent. Proposed page titles that were not actual routes were mapped to the existing slugs.

## Rebuild and validation

Run from the repository root:

```
node theology-wiki/alternative-inheritances-20261109/build.cjs
node --test theology-wiki/alternative-inheritances-20261109/test.cjs
python theology-wiki/alternative-inheritances-20261109/browser_check.py
node theology-wiki/jesus-resurrection-empire-20261109/build.cjs --check
```

`browser_check.py` exercises the local guide at desktop/mobile widths, the actual reader extension in deterministic fixtures, repeated page events, delayed archive-card rendering, navigation cleanup and search. With a complete checkout it also checks all eight real reader routes and the browser Back journey. The master workflow waits for exact published bytes before testing the live reader. Set `INHERITANCE_BASE=https://v5ma.github.io` for public deployment verification. Fixture tests alone do not claim to replace testing the full live reader. The source copies and historical archive remain unchanged; only the newer static DSS and Apocalypse of Peter chapters receive inline editorial bridges.

## Scholarly limits

Source-access limitations are stated next to the references. Dayfani's 2022 Gerizim reconstruction is reported from the university-hosted abstract, not represented as an independently verified fragment reconstruction. Published excerpts support the older harmonization discussion; the complete Tov PDF and Anderson/Giles preview were not available to this review. Community self-presentation, scholarly reconstruction and literary authority claims remain separately identified.
