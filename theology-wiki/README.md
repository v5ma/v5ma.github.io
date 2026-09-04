# Theology Wiki: source-based research edition

The live collection retains its established SAN-style reader at `san-reader.html`; `index.html` remains compatible. This edition develops the actual published discussions instead of replacing them with an unrelated reference encyclopedia.

The collection indexes all 354 already-public AI chats. Eight developed articles cover Apocalyptic Repair Theology, Cognitive Gnosticism, Christ as an inner model, Antichrist as a pattern of conduct, religion for conscious robots, deliberate joy, the Temple-trauma hypothesis, and Samaritan texts and sacred authority. Eight topic collections, three reading paths, explicit backlinks, source links and a focused graph connect the material. The rest of the archive remains conversation records and legacy notes, not 354 newly reviewed essays. Topic assignments are provisional.

The reader supports full-discussion keyword search, title/date/backlink sorting, source-only and article-only filters, bookmark export/restore, a paginated conversation catalogue, top-level speaker labels, search within each conversation, and links to individual turns. A user turn may contain pasted AI text; the display preserves that fact rather than inventing a new speaker. Opening a conversation checks its bytes against the recorded SHA-256 manifest when the browser supports Web Crypto. No private-repository content is copied into this edition.

Three museum pictures are bundled locally after the Metropolitan Museum of Art API identifies each as public domain. Captions retain institutional links, creator/date, collection credit and interpretive context. `data/media.json` is the machine-readable provenance record. Pictures are not evidence that an author's historical, theological or scientific proposal has been established.

## Source and build

Run `node theology-wiki/tools/build.cjs` from the repository root, then `node --test theology-wiki/tests/research.test.cjs`. No Node dependencies are needed. The build verifies the complete existing source manifest before generating the page index, search index, graph, new articles and local reader adapter. It never modifies the original chat files. Editorial source is `editorial/edition.cjs`; generated article Markdown is in `content/developed/`.

The shared SAN runtime is read, not modified. A Theology-local adapter is generated at `assets/js/theology-reader.js`. The existing interactive-project integration script receives a narrow guard so it does not overwrite the improved Theology entry point on a future game build. The project homepage, games and shared SAN shell remain outside the edit scope.

`python theology-wiki/tools/media.py` downloads and verifies the three pictures; it requires Pillow and network access. Subsequent builds verify already-bundled image hashes and do not redownload them. The dependency versions used by CI are recorded in the workflow.

Serve the repository root with `python -m http.server 4174 --bind 127.0.0.1`. Open `http://127.0.0.1:4174/theology-wiki/san-reader.html`. The reader fetches JSON and Markdown, so a local HTTP server is required; directly opening a local HTML file is not the supported path.

## Validation

`node --test theology-wiki/tests/research.test.cjs` verifies source integrity, routes, graph destinations, full-text indexing, parsing, filters, export validation and the integration guard. `python theology-wiki/tests/browser.py` uses native Chromium over HTTP; it needs Python Playwright and its Chromium install. The suite tests real source requests, locally served images and real-origin bookmark persistence, and saves screenshots and a JSON report under `theology-test-output/`.

The GitHub Actions workflow preserves the generated source on the isolated feature branch and runs native browser tests there before publication. Its artifacts are the test evidence. A successful build is not a claim that every interpretation in every archived conversation has been independently fact-checked. New articles preserve authorial reasoning and corrections while identifying historical hypotheses and AI-generated additions.

## Preservation and rollback

All original chat files and existing source-note Markdown are retained. The existing home and source-index landing pages are reorganized; old routes remain available. Git history is the reversible backup. The old generic private PR is separate from this public source-based edition.

Publishing means merging only the reviewed Theology changes and the scoped integration guard into the public repository's master branch. Never publish the private parent repository or local private archives. The public application has no accounts, analytics, external scripts, paid APIs or runtime AI calls.
