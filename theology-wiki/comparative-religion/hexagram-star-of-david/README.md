# Before the Star of David: The Hexagram’s Shared History

[Read the article](index.html) or [open the canonical Markdown](READING.md).

Research draft for the Theology Wiki, revised 1 October 2026. The article develops the history of an ancient, multicultural geometric form and its later Jewish national identification. Eighteen source notes cover Armenian archaeology, Hindu and Buddhist meanings, Islamic objects, Jewish manuscripts and institutions, and specific cases of modern political reception.

This revision adds Simonyan’s illustrated 2025 Armenian archaeological paper, a Hindu community source for Shatkona, Alec Mishory’s flag history, and the Ardath and Iran Air reception examples. It replaces the earlier point-by-point rebuttal structure with a historical narrative. Dating notes preserve the distinction between the verified Bronze Age find and the still-untraced third-millennium claim. The JTA report’s indexed-only access is recorded in its source note.

## Editing and building

Edit `READING.md`, then run from the repository root:

```sh
node theology-wiki/comparative-religion/hexagram-star-of-david/build.cjs
node --test theology-wiki/comparative-religion/hexagram-star-of-david/test.cjs
node theology-wiki/comparative-religion/hexagram-star-of-david/build.cjs --check
```

The dependency-free Node renderer produces a complete static page with responsive styles, a contents menu, numbered sources and citation backlinks. Reading requires no JavaScript or remote resources. Parent navigation requires the rest of the Wiki; a standalone copy retains the full article and internal navigation.

## Validation of this revision

Five local Node tests passed, followed by the deterministic rebuild check. Tests cover exact generated output, all eighteen source definitions, unique fragment destinations, preservation of key text and access notes, and rejection of malformed or unsafe inputs.

Native Chromium, driven through Playwright with page JavaScript disabled, checked the generated HTML at 1440 × 1000 and 390 × 844. Both checks found eighteen sources, no horizontal overflow, and working contents and citation navigation. The mobile screenshot was visually inspected. These tests used `set_content`; they were local rendering checks, not tests of the public deployment.

GitHub’s write responses returned the same Git blob SHA-1 values as the locally tested files:

| File | Git blob SHA-1 |
| --- | --- |
| READING.md | a88c718d080997d5b173ec7acc2922370780b210 |
| build.cjs | ef3bd26d621a1eb59ab76baa23e7df26b75b2fb5 |
| index.html | ff2c18638237819bed5a7feac096d8d1acb0497c |
| test.cjs | 1f51e21b3d5e862fdf71de6c8a868feebdcee19c |

## Review and publication

This work updates draft PR #226 on `theology/hexagram-history-2026-10-01`; the branch originated at master commit `c935a786e758a4609f4d02a2591124300c4ee070`. It is an additive standalone module linked from the comparative-religion README. The main-reader navigation, search, narration, study catalogue, original conversations, preservation receipts and unrelated projects are not modified by this revision.

Author approval, main-reader integration and production publication remain separate steps. The full repository build and preservation suites were not run, and no production deployment or live-origin verification is claimed.
