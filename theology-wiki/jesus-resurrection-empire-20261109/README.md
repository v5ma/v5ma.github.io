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

The deterministic builder reuses the existing supplemental Markdown renderer. It generates complete static pages, a local full-text search index and content hashes. Search covers these four chapters only; main-reader search and listening are not regenerated. All chapter content and navigation remain available without JavaScript. Browser checks use installed Playwright and Chromium, serve the repository locally, and cover desktop/mobile, search, filtering, clearing, history and no-JavaScript reading.

The release adds four entries to Latest without changing earlier release entries. Public verification must compare hosted bytes against the actual published commit before reporting the release live. Passing software checks establishes navigation and publication integrity, not the truth of a historical reconstruction.
