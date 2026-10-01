# Hexagram history: review candidate

[Read the article](index.html) or [open the canonical Markdown](READING.md).

Prepared on 1 October 2026 for the Theology Wiki. This is an additive standalone article, not a replacement for an existing investigation. Fifteen source notes distinguish excavation reporting, institutional catalogues, scholarly synthesis, practitioner interpretation, a circulating claim, and access-restricted leads. The original user question is not silently converted into an author-approved historical conclusion.

## Editing and building

Edit `READING.md`, then run from the repository root:

```sh
node theology-wiki/comparative-religion/hexagram-star-of-david/build.cjs
node --test theology-wiki/comparative-religion/hexagram-star-of-david/test.cjs
node theology-wiki/comparative-religion/hexagram-star-of-david/build.cjs --check
```

The renderer requires Node.js but no external packages. The resulting HTML has its full article, bibliography, responsive styles, contents links and citation backlinks embedded. Reading needs no JavaScript or remote resources. Parent-reader navigation works when the page is served in its repository location; the standalone download retains the article and internal source links but does not include the rest of the Wiki.

## Validation completed in this editing session

Five local Node tests passed, followed by the deterministic rebuild check. The tests cover output consistency, all fifteen source definitions, internal fragment destinations, text preservation and rejection of unsafe or malformed inputs. They do not certify historical conclusions.

Native Chromium rendered the generated HTML at 1440 × 1000 and 390 × 844 with page JavaScript disabled. Both checks found fifteen source entries, working contents/source fragment navigation, and no horizontal overflow. The mobile screenshot was visually inspected. These checks loaded HTML with Playwright `set_content`; they were not public-origin or end-to-end deployment tests.

The four source/build/test/output Git blob IDs returned by the connected GitHub directory read matched those computed from the locally tested files:

| File | Git blob SHA-1 |
| --- | --- |
| READING.md | a211f9605f95d9d2310ecb393d9893c41deb9179 |
| build.cjs | ea70996a26d09a102278d474815ca4917a190d34 |
| index.html | dd4cfb819e1741bded9b14cabfd675d1b1884179 |
| test.cjs | 89bce799ec2cb469a5729bbab09151aa58576f7f |

The full repository preservation/build/browser suites were not run in this session. No production deployment, Cloudflare verification, or claim of live availability is made.

## Integration and publication boundary

The review branch starts at master commit `c935a786e758a4609f4d02a2591124300c4ee070`. The comparative-religion README links this candidate. The existing principal-reader index, search, narration, nine-study catalogue, source conversations, preservation receipts, planning files and unrelated projects are unchanged. This module builds independently; the parent builder is not modified.

Front-page navigation integration and production publication remain separate approval steps. Before release, update the canonical navigation rather than only generated output, run the applicable repository checks, and verify the actual intended public origin. Do not treat a review branch or a locally rendered page as a published release.
