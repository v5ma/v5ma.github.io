# Theology Wiki: source-based research edition

The live collection retains its established SAN-style reader at `san-reader.html`; `index.html` remains compatible. This edition develops the actual published discussions instead of replacing them with an unrelated reference encyclopedia.

The collection indexes all 354 already-public AI chats. Fourteen developed articles now cover First Beast/Trump, the Ukraine/Russia forecast record, El in Egypt, Jesus as the Teacher of Righteousness, Moses/volcano chronology, the Kenite hypothesis, and the earlier articles on Apocalyptic Repair Theology, Cognitive Gnosticism, Christ as an inner model, Antichrist as a pattern of conduct, religion for conscious robots, deliberate joy, the Temple-trauma hypothesis, and Samaritan texts and sacred authority. Eight topic collections, five reading paths, explicit backlinks, source links and a focused graph connect the material. The rest of the archive remains conversation records and legacy notes, not 354 newly reviewed essays. Topic assignments are provisional.

The reader supports full-discussion keyword search, title/date/backlink sorting, source-only and article-only filters, bookmark export/restore, a paginated conversation catalogue, top-level speaker labels, search within each conversation, and links to individual turns. A user turn may contain pasted AI text; the display preserves that fact rather than inventing a new speaker. Opening a conversation checks its bytes against the recorded SHA-256 manifest when the browser supports Web Crypto. No private-repository content is copied into this edition.

Three museum pictures are bundled locally after the Metropolitan Museum of Art API identifies each as public domain. Captions retain institutional links, creator/date, collection credit and interpretive context. `data/media.json` is the machine-readable provenance record. Pictures are not evidence that an author's historical, theological or scientific proposal has been established.

## Source and build

Run `node theology-wiki/tools/build.cjs` from the repository root, then `node --test theology-wiki/tests/research.test.cjs`. No Node dependencies are needed. The build verifies the complete existing source manifest before generating the page index, search index, graph, new articles and local reader adapter. It never modifies the original chat files. Editorial source is `editorial/edition.cjs` and the additive `editorial/expansion.cjs`; generated article Markdown is in `content/developed/`.

The shared SAN runtime is read, not modified. A Theology-local adapter is generated at `assets/js/theology-reader.js`. The existing interactive-project integration script receives a narrow guard so it does not overwrite the improved Theology entry point on a future game build. The project homepage, games and shared SAN shell remain outside the edit scope.

`python theology-wiki/tools/media.py` downloads and verifies the three pictures; it requires Pillow and network access. Subsequent builds verify already-bundled image hashes and do not redownload them. The dependency versions used by CI are recorded in the workflow.

Serve the repository root with `python -m http.server 4174 --bind 127.0.0.1`. Open `http://127.0.0.1:4174/theology-wiki/san-reader.html`. The reader fetches JSON and Markdown, so a local HTTP server is required; directly opening a local HTML file is not the supported path.

## Validation

`node --test theology-wiki/tests/research.test.cjs` verifies source integrity, routes, graph destinations, full-text indexing, parsing, filters, export validation and the integration guard. `python theology-wiki/tests/browser.py` uses native Chromium over HTTP; it needs Python Playwright and its Chromium install. The suite tests real source requests, locally served images and real-origin bookmark persistence, and saves screenshots and a JSON report under `theology-test-output/`.

The final GitHub Actions workflow is read-only: it verifies a deterministic rebuild, runs native browser tests before publication, and compares hosted assets and repeats the browser suite after publication. Its artifacts are the test evidence. A successful build is not a claim that every interpretation in every archived conversation has been independently fact-checked. New articles preserve authorial reasoning and corrections while identifying historical hypotheses and AI-generated additions.

## Preservation and rollback

All original chat files and existing source-note Markdown are retained. The existing home and source-index landing pages are reorganized; old routes remain available. Git history is the reversible backup. The old generic private PR is separate from this public source-based edition.

Publishing means merging only the reviewed Theology changes and the scoped integration guard into the public repository's master branch. Never publish the private parent repository or local private archives. The public application has no accounts, analytics, external scripts, paid APIs or runtime AI calls.

## Source expansion and dated records

The second source edition adds six developed investigations, bringing the collection to 14 developed articles and 397 indexed routes. Each new article has an explicit claim-type label, archived background or argument references, and external sources with honest access notes. A restricted abstract is not described as a full-text review. The original eight article bodies remain in their editorial module; several generated pages gain reciprocal links to the new investigations.

`data/forecast-ledger.json` has six dated records: two archived-chat records, two publication records and two recovery leads. An export-start date is not assigned to every later turn. In particular, the October 12, 2025 update in the March-started chat retains its in-turn date. The July/August 2026 fuel-and-famine items are explicitly paraphrased context leads, not new exported conversations or independently verified timestamps. No outcome audit has been completed and no fulfilled-prediction count is presented. Proposed evaluation criteria are editorial, not claimed original preregistrations.

The forecast explorer supports text/type filters, chronological sorting, JSON export and direct links to exact author turns. The generated Markdown retains the complete register as a noninteractive counterpart. `data/external-sources.json` documents 15 research/publication references and their access scopes. Alias indexing makes the Thera/Ahmose discussion discoverable despite its original Parthians and Medes title. Source hashes and original source-note files remain unchanged.

Cache versions are refreshed on both reader entry points on each build. Newly authored wikilinks fail the build instead of being silently omitted from the graph. Roll back the scoped expansion commit to return to the initial source edition; do not reset unrelated repository history or clear stored bookmarks.


## Reader-depth edition (September 4, 2026)

The third source edition deepens the First Beast, Teacher of Righteousness and Apocalyptic Repair articles without adding unapproved first-person statements. The First Beast article works through dated primary records, the TOR article distinguishes the proposed sequence from textual constraints and elapsed-time calculations, and repair is examined through personal, community and institutional examples. These are attributed editorial syntheses, not independent certification of the hypotheses.

The homepage begins with three flagship questions and links to the remaining eleven developed articles. A new introductory guide and a ten-entry glossary connect the subjects. There are still 14 developed articles and 354 original conversations; the two additional routes are navigators, not newly recovered chats. Source history is available in an expandable section, and exact author-turn links retain source hashes and speaker labels. Print preparation expands source notes before printing.

Global search and the conversation catalogue can filter Micah's top-level turns separately from AI replies. In a speaker-filtered search, every keyword must occur in the same turn. A user turn may contain pasted AI output or quotations; the filter identifies the export speaker, not the authorship of every embedded sentence. Search snippets fetch and hash-check the matching public source bytes, with bounded caching and cancellation of stale requests. The expanded full-text/turn index is fetched on demand, not as a homepage dependency.

The connection explorer now defaults to explained relationships. Editorial relationships and article-to-source relationships have labels and reasons; the complete navigation graph remains available as a separate mode. `data/relationships.json` records 49 explained relationships and five exact author-turn anchors. `data/depth.json` contains homepage choices, glossary definitions and the proposed chronology. Chronology filters separate proposed dates, textual/manuscript constraints and arithmetic; they do not collapse those layers into a single settled history.

The six-record forecast register is unchanged. No prediction outcomes were newly assessed and no missing transcript has been silently reconstructed. Original conversations, legacy source-note Markdown, shared SAN shell, other projects and the private repository are outside the change surface.

Source changes live in `editorial/depth.cjs`, `assets/js/depth-tools.js`, `assets/css/depth.css`, the existing research adapters and `tools/build.cjs`. The expanded tests exercise source integrity, same-turn search semantics, explained graph edges, exact source anchors, responsive layout, source notes, glossary, chronology, and existing browser functions. A passing UI test is not scholarly validation of the article's conclusions. Generated files are reproducible from the source and public archive; never manually edit generated Markdown without updating its editorial source.
