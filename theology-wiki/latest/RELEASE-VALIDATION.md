# November 6 supplemental release validation

## Scope and results

This focused release adds five chapters, one proposed research protocol, a static Latest release log, and navigation links. Canonical chapter prose is unchanged. Synthetic computations demonstrate reproducibility, not empirical or theological validation.

The release coordinator reports all 29 focused Node tests passing (12 ethics, 10 prophecy, 7 Latest), both Python verification scripts passing, 217 local links checked, six canonical source hashes checked, and 12 generated-output hashes checked. Both supplemental builders and the Latest builder run deterministically. The synthetic demonstration also completes successfully.

Both main entry points match repository baseline `b121d3dad8c339097fe2acf4068f7f61337a2a09` byte-for-byte after removing exactly three added anchors (Latest and the two supplemental sections) and the depth-tools release cache tag. SHA-256 of restored baseline bytes:

- `index.html`: `5a33211a78b0bbd7abd7b7d06e5735d236655b1bd7f20b497c18b04a8f484653`
- `san-reader.html`: `406f5371fe287c072bdadebc215e34797ed9b27cc422aca7c20509a39ead0bcb`

Latest's narrower regression fixture removes only its own anchor against the prepared package's two-section navigation. These are distinct preservation checks.

## Browser and CI status

Local Chromium execution is blocked by the execution environment's socket permissions. An elevated attempt encountered the same restriction. Browser rendering, screenshots, real browser history, and JavaScript-disabled reading were therefore not locally verified.

The `Theology Latest validation` GitHub Actions workflow installs managed Chromium through Playwright and runs the portable `browser-test.py`. It covers:

- Desktop 1440px and mobile 390px rendering and horizontal overflow.
- Latest navigation from both main readers and all six new article links, with return navigation.
- Every fragment/contents link in the six articles, two section overviews, and Latest.
- Section searches, both filters, reload, article navigation, Back/Forward, empty results, reset and literal XSS/regex input.
- All nine supplemental/Latest pages with JavaScript disabled.
- JavaScript errors, failure screenshots, rendered HTML and a JSON check report.

The workflow also runs the 29 focused Node tests, both Python verification scripts, all three builds, the synthetic demonstration, and a tracked-output diff check to reject uncommitted generated changes. Browser evidence is uploaded on failure. No deployment credentials or deployment steps are used.

The first CI run passed the 28 original focused tests, builders and static verifiers, then caught the runtime navigation builder replacing the new static links. The builder now also adds Latest and both supplements, with a cache tag in each entry point. A seventh Latest regression test protects this integration. Browser QA for this correction remains pending; do not treat preparation as passed browser QA or proof of deployment.

## Separate release limits

The coordinator identified an unrelated baseline corpus validation failure; this focused workflow does not claim the whole repository passes. Keep that baseline issue separate from these additive chapter/navigation checks.

Cloudflare deployment secrets are unavailable in the checked environment. Publication is not verified by these tests. A release still requires its authorized deployment path, exact remote commit verification, and live-origin checks of the new links, pages and current deployment. Never expose secret values in this record.

External scholarly-source availability and all older release-log destinations are outside this focused browser test's assertions. Main-reader startup is exercised only to verify the Latest link.
