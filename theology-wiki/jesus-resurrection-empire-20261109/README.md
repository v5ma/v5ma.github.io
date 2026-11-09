# Jesus, resurrection and empire

Published November 9, 2026. Four connected inquiries extend the existing Theology Wiki: purpose and comparative method; argument development; early creeds and angel narratives; first-century imperial pressure and Pilate.

The canonical source for this additive section is `sources/*.md`. `manifest.json` supplies titles, navigation and summaries. These are edited chapters, not private-conversation transcripts. One short authorial statement of purpose is explicitly quoted. No new private third-party correspondence or identifying material is included.

The inquiry preserves the ambitious question about recovering an unorthodox interpretation, while distinguishing textual observations, historical hypotheses, theology and alternative readings. Bibliographic and access notes are part of each chapter. Earlier studies and archival transcripts remain unchanged.

Build and validate from the repository root:

```
node theology-wiki/jesus-resurrection-empire-20261109/build.cjs
node theology-wiki/jesus-resurrection-empire-20261109/build.cjs --check
node --test theology-wiki/jesus-resurrection-empire-20261109/test.cjs
python theology-wiki/jesus-resurrection-empire-20261109/browser-test.py
node theology-wiki/latest/build.cjs --check
node --test theology-wiki/latest/test.cjs
```

The deterministic builder reuses the existing supplemental Markdown renderer. It generates complete static pages, a local full-text search index and content hashes. Search covers the chapters in this section only; main-reader search and listening are not regenerated. All chapter content and navigation remain available without JavaScript. Browser checks use installed Playwright and Chromium, serve the repository locally, and cover desktop/mobile, search, filtering, clearing, history and no-JavaScript reading.

The release adds four entries to Latest without changing earlier release entries. Public verification must compare hosted bytes against the actual published commit before reporting the release live. Passing software checks establishes navigation and publication integrity, not the truth of a historical reconstruction.

## Nag Hammadi and crucifixion extension

Five further studies, published November 9, 2026, extend the four original inquiries to nine chapters. They compare NHC VII,3 and NHC I,3, canonical ransom and victory language, institutional coercion and manuscript survival. Canonical source is still `sources/*.md`; `manifest.json` records eleven verified main-reader routes used by real wikilinks. The source distinguishes observations, historical hypotheses, constructive applications and competing views. All four earlier chapters retain their original prose and gain a short reciprocal-links section. The purpose reading map and Latest expose the new studies. The section’s search covers all nine chapters; the main reader index is not rebuilt.

Tests additionally check resolved wikilinks, citation anchors, preserved earlier prose, reciprocal connections and interpretation boundaries. `prior-source-hashes.json` fixes the four original article bodies so additive connections cannot silently replace them. The five new pages are edited research, not a verbatim publication of a private conversation.

## Mandaean origins, Constantine and Dead Sea Scrolls extension

Three further source-linked studies bring the series to twelve chapters. Each original chapter gains a bounded reciprocal connection while retaining every prior paragraph and wikilink. `origins-prior-source-hashes.json` protects the nine chapter bodies as published at f851922; the earlier four-chapter preservation receipt also remains enforced. The new sources distinguish Mandaean tradition and competing origin hypotheses, stages of fourth-century consolidation, Jewish textual plurality, and direct versus comparative connections.

The section search, navigation, reading map and Latest are rebuilt. Main-reader content, original conversations and narration assets remain unchanged. Tests cover all twelve chapters, bibliography anchors, real wikilinks, preserved text and new historical interpretation boundaries.
