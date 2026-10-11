# Teacher identity article: depth-restoration review

Review-only expansion based on master c6e2b09f79c0bb3bd0a0e45b54b72c35d1ca1852. The initial save was an editorial draft. Publication has since been requested and remains gated on the integration and validation described below.

## Scope

- Expand the canonical `editorial/authorial-articles/jesus-teacher-of-righteousness-hypothesis.md`, preserving its explicit personal-identity hypothesis and existing historical constraints.
- Restore the constructive founder/community/succession explanation, dated development of the comparison method, eight worked comparison areas and counterexamples, the Judea–Egypt institutional proposal, CD/Daniel/11Q13 distinctions, and a challenge-and-revision record.
- Cite verified passages already present in the public archive. Preserve author/AI attribution and distinguish conversation snapshot dates from individual turn timestamps. No new private transcripts or private conversation URLs are included.
- Keep the existing article title, route, source metadata, bibliography metadata and September 18 formulation history. Update only this article's metadata date to October 11, 2026.
- Regenerate the single developed Markdown article and its identical public-corpus projection. Add focused regression tests. Do not alter legacy `depth.cjs` or any original source conversation.

## Verification completed

- All 17 inputs in the pinned retrieval bundle matched their Git blob hashes.
- The focused renderer reproduced the baseline generated article byte-for-byte before editing.
- Four complete public archive projections were retrieved from the pinned GitHub tree and matched their blob hashes. Linked line ranges were checked for attribution and content.
- Four focused tests passed: canonical-to-generated reproduction, equality of the public projection, resolution of every article wikilink, and preservation of the strong hypothesis with chronology/attribution/privacy controls.
- The canonical body contains 35 wikilinks to 20 distinct existing pages, embedded where their arguments are relevant.
- Textual review corrected the 4Q525 poverty comparison, selected CD for concrete Sabbath regulations, retained the plural messianic figures in 1QS IX, and separated Daniel's week segments from the restored 11Q13 II.18 citation.

Run the focused checks with:

    node --test theology-wiki/tests/teacher-depth.test.cjs

## Not completed; required before publication

The available verified source bundle is a subset of the repository. The full site builder, aggregate Node suite, browser tests, and publication checks were not run locally. Passing the focused tests is not a full-site pass.

Search postings, graph/backlinks, page-index reading time/date, listening JSON and transcripts, product derivatives, public-corpus manifests/indexes, and any affected recorded-media freshness checks still need an authorized full-checkout rebuild and validation. Existing recordings were not regenerated and their hashes were not changed to imply freshness. The generated target in this review is intentionally limited to the article itself and its matching public Markdown projection.

Keep this pull request in draft until derivative rebuilding and aggregate validation pass. The subsequent publication request authorizes merging this reviewed expansion and checking the deployed result; it does not authorize bypassing failed checks.

## Research boundaries

The argument remains a conjecture with distinct identity, transmission, and shared-milieu alternatives. The 34 candidate parallels and ten counterexamples in the public September archive were AI-generated; their earlier confidence/Bayesian scores are not evidential results. Newly restored prose is edited exposition, not an ancient translation or verbatim recovered user quotation.

The four checked public archive snapshots document 2025 development. Additional recovered reports of September 2026 conversations were not promoted into the public chronology without matching public anchors; the existing September 18, 2026 formulation is retained with its original attribution.

## Integration continuation

After the initial save, the argument was refined to keep development history and exported message numbers in a separate end section. The body remains direct, theory-centered exposition.

The production product builder regenerated the Teacher listening document and transcript. A narrowly scoped preservation receipt chains the revised article to its prior approved edition while retaining the exact historical canonical fixture and all original receipt checks. A bounded publication-amendment command checks committed Git bytes before refreshing only the changed article and its provenance records, leaving the complete conversation archive unchanged. Nineteen focused article, preservation, and publication-amendment tests pass locally. Full-checkout CI verification is pending.

The full builder now uses the existing Theology-local reader source instead of the retired shared-shell path. Its generated adapter was checked byte-for-byte against the currently published adapter, including the existing disabled routes. The read-only CI job exposes bounded compressed text differences for review without granting write permissions or masking failed checks.
