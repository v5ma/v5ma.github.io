# November 6, 2026 release

This section is part of the authorized live-wiki release of November 6, 2026. The original November 5 canonical prose is preserved unchanged. Publication adds dated navigation and release wording; the research remains open to revision. The mathematical examples, where present, are synthetic and are not empirical validation. Read [Latest](../latest/index.html) for the release navigation.

Build and test commands below remain applicable. The historical review-package notes that follow describe the state before publication, not the current release. Current checks are recorded in [the release verification notes](../latest/RELEASE-VALIDATION.md).

## Historical review-package notes: November 5

# Jesus, Easter and the practice of mercy

This is an unpublished local review edition of one new chapter and two earlier companion chapters. Open `index.html` to read and search all three. The new chapter is **Would Jesus Oppose the Resurrection Gospel? Kingdom, Mercy, and the Authority of Easter**.

The earlier companions, **Early resurrection accounts and source criticism** and **Christianity After Bodily Resurrection? Faith, Formation, and Possible Futures**, retain their complete canonical Markdown from the earlier review package. They are included for continuity, not relabeled as newly written or published.

The chapter's historical counterfactual is not presented as a recovered speech by Jesus. It distinguishes a critique of resurrection belief being used to evade ethical obligations from the stronger claim that Jesus would reject every resurrection proclamation.

## Related prophecy material

The adjacent `prophecy-patterns-20261105` section is the unchanged earlier review edition of the prophecy chapters and mathematical appendix. The new chapter's reading sidebar links to its discussions of belief, power, truthful correction and repair. These are thematic connections, not evidence of literary dependence or empirical proof. The earlier mathematical demonstrations remain synthetic.

## Sources and rebuild

Canonical prose is in `sources/`. The HTML is derived from those files. Source and generated-output hashes are recorded in `build-report.json`.

From this directory:

1. `node build.cjs`
2. `node --test integration.test.cjs`
3. `python verify.py`

Node.js 18+ and Python 3.10+ are sufficient; no third-party packages are required. The builder writes only this section. Search runs locally over these three complete chapters and their source notes. It does not query a server, write browser storage or modify the main wiki search index. A query can remain in the page URL for reload and history navigation.

The new and companion chapters, their contents links, and their search remain readable from the extracted package. Existing public-wiki and scholarly-source links require an internet connection. The return links deliberately distinguish those published studies from the new unpublished material.

## Proposed wiki navigation

The package supplies two alternatives, not two patches to apply together:

- `combined-navigation.patch` adds both the prophecy section and this new ethics section to the two main-reader entry points, based on verified master b121d3dad8c339097fe2acf4068f7f61337a2a09.
- `jesus-ethics-navigation.patch` adds only the new ethics section if the prior proposed prophecy navigation patch has already been applied locally.

Review the current files before applying either. Copy the additive section directories; do not overwrite unrelated work. Neither patch changes archive records, existing article bodies, reader source routes, forecast dates or the main listening library.

No push, pull request, merge, deployment, or new archive snapshot was performed. Public publication remains a separate decision. The full main-reader build/search/listening integration is not claimed. See `VALIDATION.md` for checks and limits.
