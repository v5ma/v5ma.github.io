# Clouds and millennium comparison

A new editorial extension of the November 5 prophecy inquiry, published November 9, 2026. It does not claim that an earlier dialogue refuted amillennialism, and does not assign a new first-person position to the author.

Canonical prose: `sources/clouds-and-millennium.md`. `manifest.json` identifies the three verified main-reader connections. The build generates a complete static article, section-level full-text search and separate reader panels outside archived speaker turns. Latest, the purpose map and the earlier prophecy pages supply reciprocal reading routes. Original source prose and the purpose letter are pinned by `preservation.json`.

From the repository root:

```
node theology-wiki/clouds-and-millennium-20261109/build.cjs --check
node --test theology-wiki/clouds-and-millennium-20261109/test.cjs theology-wiki/latest/test.cjs
python theology-wiki/clouds-and-millennium-20261109/browser_check.py
```

Local browser tests cover the article at desktop/mobile widths, search, empty states and deterministic reader fixtures. They are not a claim to test the full reader in a sparse checkout. Set `CLOUDS_BASE=https://v5ma.github.io` to test the actual deployed reader, links, Back navigation and supplemental global search. `verify-live.py` compares all changed publication files against the hosted bytes. CI and rendering checks establish technical behavior, not the truth of a theological interpretation.
