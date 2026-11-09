# Evidence edition: Evolution Workbook

## Backlog

- Expand claim-level review beyond the selected subjects. This release is not a complete archive fact check.
- Extend the linguistic matrix into a reproducible lexical dataset and seek independent scholarly review.

## Pass 1 Proposed

EVIDENCE-20261109-01: five source-checked studies; a default archive reliability note; four evidence-led companion links; native comparison accordions; homepage and Latest entry. Canonical source files, builder, reader guide and tests form one bounded editorial-reader subsystem.

Before: published master dc7117785fdb4a66265c99e6ecd4ff7584164aee. Integration base: Gmirkin correction candidate 5a3167fbbf319df52c3e190008c543dff4b3518a. Original source bytes and all prior essays are outside the change surface. Candidate uses its own branch, not a released build.

## Pass 2 Gated

- Independent adversarial review completed. It caught a real Latest baseline-normalization regression; the fix strips only the exact new script and authorized cache token. Baseline hashes were not changed.
- 21 local checks pass across evidence, Latest and Gmirkin archive context. Deterministic outputs, link targets, source/interpretation distinctions, source-guide mapping, original Gmirkin transcript bytes, cache tokens and prior navigation invariants are covered.
- Native browser launch on the local executor is blocked by socket permissions. This is an environment failure, not a browser pass. Candidate-branch native Chromium CI subsequently passed: https://github.com/v5ma/v5ma.github.io/actions/runs/42579214908 (candidate 43cced66e54d750fd21f3f717558215ecbbf1d29).
- No timing, frame-rate or performance improvement is claimed. No A/B timing result exists. Screenshots and responsive checks are required in native browser CI at desktop and mobile viewport sizes.
- Verification compares the tested candidate with its parent and disallows archive/source changes. A focused passing suite is not a claim that every inherited repository workflow is green.

## Integrated

Candidate browser gate passed. Ready for lease-protected master update. The parent revision is the rollback reference; revert only this scoped change, never reset unrelated changes.

## Device-proven

Native Chromium browser CI passed desktop/mobile, no-JavaScript, search, comparison accordion and repeated-flow checks. This proves the tested browser/viewport scenarios, not a physical phone or the user's hardware.

## Released

Pending deployment and exact-byte public verification. Live verification must load both real reader entrypoints, the evidence studies, four archive companions, direct turn links and original transcript loading. CI artifacts and commit history carry the final gate output; do not infer publication from this workbook alone.

## Regression guards

- `test.cjs`: deterministic rendering, source links/access labels, local targets, search coverage, guide mapping, reader hooks and archaeological/dating distinctions.
- `browser-test.py`: six pages at 1440/390px, no JavaScript, comparison accordion, search/filter/reset/reload/back/popstate and repeated guide rendering; `--live` adds actual reader and archive checks.
- Existing `latest/test.cjs` and `tests/archive-context.test.cjs`: prior byte baselines, preserved Gmirkin source and its contextual correction.
- `verify-live.py`: bounded exact-byte comparison against the public origin before live browser assertions.
