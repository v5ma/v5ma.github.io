# Current publication record - Stillwater Works v0.12.0

Recorded September 13, 2026. Start future work with NEXT-SESSION.md and CONTINUATION-STATE.json. This current record supersedes the historical candidate/preparation labels retained below. The following identities describe the verified gameplay release, not the later documentation-only handoff commit.

## Verified published release

Leo's Guild - Stillwater Works v0.12.0, build guild-stillwater-20260913, is published through the existing Leonardo's Guild card at https://v5ma.github.io/ and game path https://v5ma.github.io/leonardos-guild/.

PR140: https://github.com/v5ma/v5ma.github.io/pull/140

Merge: edd3f3c42c417b154a7f3d65e29def23ed633288. Pages build/deployment/status run 34739992522 succeeded. Independent public-file verification run 34739992812 succeeded. Its artifact 10311469378 was created 2026-09-13T05:29:31Z and contains leonardo-publication.json: version 0.12.0, all_match true, 241 checked public files, 50 audio files, and the homepage link present with HTTP 200. Original archive SHA256: fc63d75275afdd40bae7b50a12ba77950f153737149026c08ac22d04f30d32b4.

Native water acceptance: run 34738141071, artifact 10311532336, tested merge preview ef0169bec7a0b3e96406a9dc7cbead691703273a. Original archive SHA256: ae767683de317f196d8f1db22dacb44c22179a614bc637ea5a12ed1cb329306b. The record contains 239 model/rig/region checks and 25 fresh native water/controller checks, with no captured JavaScript or GLSL errors and an empty uncommitted source diff. The actual mission returned to town with 80 florins and restored hydraulic phase 5, retained after reload. Screenshots cover filled, drained, wading and restored states.

All twelve original PR workflow groups passed on feature head 8f2fcd735bb9709df3eab4ffe6407cab49826471. The later two-parent reconciliation 09b858b245387b7ecb5255987b6ac402395ba0dd preserved the exact tested game subtree e9369d1858aa784fc2b9b3b8b54d12c498f786fd while including concurrent sibling-game work from current master. It was not a new untested gameplay revision.

During this handoff the two mounted archives were programmatically rechecked: both archive checksums match, all 427 files inside the native source archive match its manifest, and every one of the 241 original publication hashes matches that same native manifest. This recheck is not another physical playtest. Virtual Xbox input and one declared trusted Enter audio activation were used by the browser journey; no physical Xbox/Bluetooth, speaker/headphone listening, target-device performance or owner approval is claimed.

The documentation-only handoff edits/adds Markdown and CONTINUATION-STATE.json. It does not bump the game version or modify runtime, tests, shaders, assets or saved progress. A subsequent documentation deployment will have changed documentation hashes and potentially a larger file count. Do not treat the original 241-file count as a requirement for every future deployment, or compare newly edited documents to the old receipt and call that a gameplay regression.

## Recovery and release-history interpretation

Cinder Hollow v0.11.0 was completed through PR135, merge fb49af11f286f47a17f00d77f846498ec2ef698e. It already includes recovered Steady Steps camera/rig work, safe town, the first badlands and all earlier adventures. PR118 is closed without a standalone merge; do not infer that its feature work still needs to be published. PR140 builds on that completed recovery.

Older v0.8 notes about preparation and overlapping music crossfades are historical. Quiet density, independent volume levels and exactly one music stream are the live requirements. No old preparation script or branch should be replayed on current master merely because a historical receipt still says candidate.

## Procedure for the next feature or documentation update

Read current master and release.json before writes; preserve sibling updates. Commit a coherent scoped change using non-forced updates, check the diff and retain its exact source identity. Feature acceptance must read ordinary committed runtime without test-time rewriting. Use the real-session region adapter for town-safety checks; historical raw model fixtures alone are insufficient.

For gameplay changes, retain the relevant new controller journey plus older campaign/house/story/audio/touch/renderer regressions and actual screenshot review. For documentation-only work, verify that runtime and assets are byte-identical and record document/link/JSON validation rather than inventing new gameplay test results.

After merge or an authorized direct main-branch documentation commit, await the current combined GitHub Pages deployment. The existing .github/workflows/leonardos-guild-published.yml fetches served files and checks the homepage game card. Compare its receipt with the correct merged source. A queued deployment or an early verification attempt can explain stale files: retry the read-only check after deployment, never force an older site over newer sibling changes. Keep run IDs, hashes, failure context and remaining limits in GitHub.

Actions artifacts have finite retention. CONTINUATION-STATE.json preserves verified metadata and key runtime hashes, not the complete binary archives. Retrieve and preserve full evidence when needed before expiration, or reproduce acceptance from the pinned committed sources. Do not claim an expired archive is still available. Stored records establish the historical release, not an automatic live check at every later date.

## Historical publication notes - preserved verbatim below

# Current publication procedure - Resonance

Version 0.8.0 is prepared on guild/sound-and-controller-20260911. Native acceptance must check ordinary committed runtime files, not rerun preparation over them. Merge only the tested source. The existing Pages/publication workflows must then confirm served hashes, version and homepage card. Record actual run IDs and source identity in the release PR. A release manifest or this procedure is not proof of deployment. Earlier verified receipts below remain historical.

# Browser publication

## Verified Lantern Hours publication

Version 0.5.0 is live from PR81 merge a4d5544226c1318377b85c8b82ffb1523101e912. GitHub Pages run 34280934802 and exact-byte verification run 34280935372 both succeeded on 2026-09-08. The latter's artifact 10077625688 (leonardos-guild-publication) records 147 HTTP-200 matching files and the live homepage card. Retrieved and checked on 2026-09-09; all 147 files also match the source used to begin Cycle Works. Source build: guild-lantern-hours-20260908. This is a publication receipt, not a conclusion inferred from the PR merge.

Cycle Works v0.6.0 is a candidate until its own final publication record is added. Historical receipts remain below.


This game is independently hosted at `/leonardos-guild/` and linked by its own card on the root SVGN Interactive page. It is not the downloadable, bundled alternative from the early design discussion. Its included renderer is locally hosted; normal play needs WebGL2 and no account, token or installation.

The cover is cropped and reduced from `02-neighborhood-ride.png`, an actual WebGL capture in native run 34079071537 at source 9d3e740ba4a64e03d049a3bad13954c45b056b50. The shot documents the implemented scene, not a concept image. That original run passed rendering, four deliveries, a map and a merchant purchase, then exposed an input-driver race on asynchronous dialog close; it is not treated as a full campaign pass. The next native run waits for pause to end before re-issuing keyboard inputs and verifies the homepage/card too.

Acceptance is read-only and preserves source SHA, screenshots, unit output and failures. A separate post-merge workflow verifies the served homepage and every owned runtime file against the exact merged checkout, including the local Three.js modules. Existing site entries, Paper Delivery, its editor, Rainward, Aether Reach, Dino Atlas, Theology and the modern SVGN City candidate are outside the new game's write scope.

This is a single-player first chapter, not a functioning MMO. Purchases spend earned fictional florins; no payment, membership/coupon, shared server or Supabase configuration is included. Hardware performance and player enjoyment require human review beyond the automated checks.
