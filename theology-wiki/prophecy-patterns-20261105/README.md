# November 6, 2026 release

This section is part of the authorized live-wiki release of November 6, 2026. The original November 5 canonical prose is preserved unchanged. Publication adds dated navigation and release wording; the research remains open to revision. The mathematical examples, where present, are synthetic and are not empirical validation. Read [Latest](../latest/index.html) for the release navigation.

Build and test commands below remain applicable. The historical review-package notes that follow describe the state before publication, not the current release. Current checks are recorded in [the release verification notes](../latest/RELEASE-VALIDATION.md).

## Historical review-package notes: November 5

# Prophecy, patterns and correction: review edition

Open `index.html` for both chapters, the mathematical research protocol and section-level search. This supplemental section can be opened directly from an extracted folder, or served as static files. No third-party scripts, accounts, analytics, storage writes, server-side code or dependencies are required.

The two chapter Markdown files are the canonical prose inputs. They are authorial working drafts developed with AI assistance, not recovered quotations. The research appendix distinguishes its proposed methods, a structural audit of the archived forecast register, and actual synthetic computations. It does not report a completed historical validation or a mathematical proof of theology.

## Contents

- `sources/prophecy-partial-success-and-causal-feedback.md`
- `sources/prophecy-recurring-patterns-and-corrective-word.md`
- `research/pattern_validation_protocol.md`
- `research/pattern_validation_demo.py`
- `research/pattern_validation_demo_results.json`
- `research/pattern_register_audit.json`
- `research/forecast_register_snapshot.json`

The forecast-register file is a separate audit input copied from the research package, not a replacement for the wiki's live register. Its source revision and limitations are recorded by the protocol and audit.

## Rebuild and verify

With Node.js 18 or later and Python 3.10 or later:

1. `node build.cjs`
2. `node --test integration.test.cjs`
3. `python verify.py`
4. `python research/pattern_validation_demo.py`

Run commands in this directory. The builder only writes this supplemental directory. It does not touch the main reader, existing articles, prior resurrection drafts, original chats, dates, or public-corpus snapshots. Source hashes and generated-file hashes are recorded in `build-report.json`. It is deterministic for unchanged inputs.

Search covers all three texts by section, including sources. It is scoped to this supplement; the main Theology Wiki search and listening library have not been regenerated. Existing-study links open the public Theology Wiki and require an internet connection. Those routes were checked against the complete main-reader page index at repository revision b121d3dad8c339097fe2acf4068f7f61337a2a09. The three new texts, their search and research files remain available offline after extraction; the full main wiki is not bundled.

The browser receives only the static search data bundled here. Input is rendered with text nodes; no search query is sent to a server. A query can appear in the local page's URL so it can be retained on reload. Standard browser history controls apply.

## Integration and preservation

The separate `navigation.patch` adds one ordinary navigation link to each of `theology-wiki/index.html` and `theology-wiki/san-reader.html`, based on the exact master revision above. Apply only after checking the current files; do not overwrite unrelated changes. The supplemental folder is additive and independently built. Do not claim this patch establishes main-reader route/search/listening integration.

No publication, push, PR, deployment, archive snapshot or modification of the earlier resurrection chapter package was performed. Public publishing remains a separate decision.

A full repository release still requires a complete checkout, the applicable main build/tests, a review of corpus generation requirements, and live-origin checks after authorized publication. Do not regenerate or backdate the existing corpus just to make this draft look published. Keep its historical preservation records intact.

## Verification scope

See `VALIDATION.md` for the checks actually run and the browser preview limitation. This build's tests verify rendering and navigation structure, source preservation, deterministic output, wiki destinations, citations and local-search behavior. They do not independently validate every historical or theological assertion.
