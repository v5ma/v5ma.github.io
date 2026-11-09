# Purpose letter and reading map

The nine selected paragraphs in `letter.txt` are the full purpose letter selected for publication on November 9, 2026. They are preserved verbatim, including punctuation and paragraph order. The surrounding private exchange and unrelated material in the supplied attachment are excluded. `source-integrity.json` records the published text's SHA-256.

`reading-map.json` maps all eight existing topic collections to the letter's purpose. The descriptions are new editorial connections, distinct from the quoted letter. They link to existing developed arguments, comparative-religion and religious-development supplements, the latest Jesus/resurrection/empire inquiries, the source archive and research tools. The map preserves competing hypotheses, independent religious traditions, variable coverage and distinctions between evidence and constructive theology.

Build with `node theology-wiki/purpose/build.cjs`; check with `--check`. It regenerates the static purpose page and adds an idempotent, marked introduction to both reader entry points. Run this after a main-reader rebuild. It does not rewrite any original article, archive, recording or hash-pinned publication history. Existing reader navigation gains a permanent Start here link through the local depth-tools runtime. The Latest manifest records this edition.

Run `node --test theology-wiki/purpose/test.cjs` and `node --test theology-wiki/latest/test.cjs`. The original reader preservation hashes remain unchanged; the latter test removes only the exact new entrance blocks and cache parameter before comparing the historical bytes.

`browser-test.py` verifies the full letter at four viewport widths, keyboard and anchor navigation, local endpoints, reader routes, Back/Forward, repeated entrance clicks, and no-JavaScript access. `verify-live.py` checks all 11 published integration files against the checked-out commit before repeating browser checks on GitHub Pages. The scoped workflow runs these checks and retains screenshot evidence.

The standalone purpose page has no runtime scripts or network dependencies. It is linked prominently from both reader entrances and Latest. It is not registered as an article in the legacy global search or listening manifest, and makes no claim that the historical sources establish every conviction in the letter.
