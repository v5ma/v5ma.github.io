# Evidence-led editorial edition

Canonical Markdown studies listed in `manifest.json` in `sources/` build to complete static HTML. Reuses the wiki's existing, dependency-free Markdown renderer; no source conversations, source-note Markdown, speaker labels, turn links, original manifests or previously published essays are rewritten. The section has its own search index. It does not claim inclusion in the main reader's full-text or narration index.

Build: `node theology-wiki/evidence-review-20261109/build.cjs`

Gate: `node --test theology-wiki/evidence-review-20261109/test.cjs` and `python theology-wiki/evidence-review-20261109/browser-test.py`. The browser test checks desktop/mobile/no-JavaScript pages, links, search/filter/reset/back/reload and a source-guide harness. `--live` additionally checks the actual reader, archive load and existing Gmirkin footnote on the deployed public origin.

The additive reader guide explains archive reliability for every conversation and supplies cited companions for the selected routes in `manifest.json`. It adds an evidence entry to the main home page. It neither treats source hashes as truth nor disguises earlier machine-generated replies as human scholarship. Existing reader graph and turn links remain in place.

`EVOLUTION-WORKBOOK.md` and `evolution-ledger.json` record the bounded change, before state, invariants, checks and proof level. A successful technical check is not independent scholarly peer review. Sources identify primary passages and actual access limits. The original raw records remain available for future correction.

Rollback: revert the scoped evidence-edition commit on top of current master, rather than resetting unrelated repository work. Every prior archived file is inherited unchanged from the parent tree. The build is deterministic; generated files must be regenerated after editing sources or the manifest.

## November 10 extension

Added a sixth study, Paul, James and contested authority, and four archive companions. Primary witnesses, later reception and modern interpretations remain distinct. Manifest-driven navigation and search include the new source.
