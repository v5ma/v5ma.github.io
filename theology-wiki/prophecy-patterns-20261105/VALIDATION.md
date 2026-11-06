# Validation of the local review package

Prepared November 5, 2026. Nothing in this package has been pushed or published.

## Passed

- Deterministic standalone build of the overview, both complete chapters and the research appendix.
- Ten JavaScript tests: deterministic output/source preservation; static reading fallback; route validation; HTML and URL safety; full-text search; scope/no-results/repeated reset; URL reload/history; submit/Escape; literal markup/regular-expression input; missing search-data fallback.
- Structural verification of four HTML pages, 106 local links and fragment anchors, 36 searchable sections, all three canonical source hashes and all six generated-output hashes. The source-prose check compares every nonblank line's word sequence against its rendered article.
- All new chapter wikilinks and links back to existing studies resolve to the new section or a route in the 443-page main-reader index at master revision b121d3dad8c339097fe2acf4068f7f61337a2a09.
- The navigation patch adds exactly one link to each of the two reader entry points. Both baseline HTML files were verified against their Git blob hashes. `git apply --check` passed, and applying the patch to an isolated temporary copy produced exactly the expected files.
- The Python synthetic demonstration was rerun in an isolated directory. Its results JSON was byte-identical to the supplied results. These are synthetic examples, not empirical validation of prophecy.
- Final chapter/protocol inputs were copied from the completed source drafts without changing their bytes.

## Not performed or blocked

- Visual/browser interaction QA was not completed. The available browser rejected a local file URL, then could not reach the executor's loopback HTTP preview. No tunnel or external publication was created. Search behavior was tested in a DOM stub, not claimed as a browser test.
- The complete repository build, the main-reader search/listening regeneration, and full archive/source checks were not run. A full checkout was unavailable, and the read connector could not retrieve the existing 8.9 MB main search index. The supplemental section has its own complete local search and does not modify that index.
- Live-origin/deployment checks were not run because publication was not authorized or attempted.

## Browser review checklist

Open the extracted `index.html`. Check both chapter routes and the mathematical appendix; contents anchors; citation anchors; previous/next links; long external citations; Markdown, code and JSON links; keyboard focus; 390px and desktop widths; print output; disabled-JavaScript reading. Search for “Brier,” filter to chapters, clear, search for “Newton,” follow a section, return, reload a saved query, use Back/Forward, submit Enter and clear with Escape. Check that no horizontal overflow occurs and that full articles remain readable if search data is unavailable.

The mathematical protocol and chapter citations have their own stated evidential limits. Successful software checks do not authenticate historical claims or establish theological conclusions.
