# Dino Atlas source reconciliation / 2026-09-20

## Authority and scope

This is the Dino Atlas reconciliation, not Vesperfall or another sibling game. Audited master: 26eb4459f7437415f224c9737c4c507f2d551243. Its Dino tree is 268820fd7c1a39af1faebf513159c0c7f2a7cbc2. The normal development target is master directly, using current per-file contents or a checked, non-forced fast-forward commit. Do not create a pull request, feature branch, source-transport payload or staging workflow for routine game updates unless the user explicitly requests it.

No open PR titled Dino was returned by the current repository search. The two open search results mentioning Dino elsewhere were other games' PRs; they are not ours to change. Inventory found 23 Dino-prefixed historical branches. This is not a claim that every historical branch has been independently played or every line re-reviewed. The detailed audit concentrated on the recent delivered feature chain and the two older branches with unique absent runtime modules. Repository compare uses a merge base: a squashed branch can remain divergent even after its changes were incorporated. Divergence alone is not evidence that gameplay is missing.

## Keep the current delivered implementation

The latest rotunda source is already in master through 1796de4cb0a2a3b2d4197f07d67da13791fedcf8 (PR217). The separate bootstrap closed-workspace guards from PR218 are also present. Changes from that merge through the audited master did not modify Dino runtime files. Do not replay the .1/.2/.3 branches over the final .3 source.

Express is already integrated, not a separate unmerged prerequisite. active-controls.js is the exact blob eb3563682234cda12dfde3c3aaac103dd1946415 from c6f0991604a564b3d21eb29c68b2237c11a8c3fc. The mounted mission catalog is the exact blob d9a1ffbb951753c440271f4eb80c914f9d8126b2 from field-operations head76ce868c933e9f8c9f3097d38ab351331bc74bc3. The current field-operations implementation retains the actual-animal-collider correction, blob c6d9ee73be780877f2dc68f236d6a349e75a7b22. All twelve assignments, four vehicle equipment profiles, saved control presets and the unlimited-duration speed policy remain.

The combined package merged at ac0ec69882cdca97ca773f1fdc855d0948fc344d and has release dino-field-operations-20260917.1, published 2026-09-18T01:26:01Z. Fresh review of run35289464270 confirms all18 jobs succeeded, including published job105436825402 and release job105446444916. These are historical engineering results for that source, not new physical-device acceptance or proof of every mission route on today's build.

Keep the current full-world character-centered portal, not the original finite-map diorama. Keep the Classic AR/VR entry adapter, the service-loop routes and sluice-lip correction, the current world/animal/vehicle physics, all established save keys, nonduplicating rewards, licenses and private/public boundaries. No current gameplay module or vendor asset is changed by this reconciliation.

## Fix the missed integration and rewrite stale instructions

The normal npm test command had never been brought forward: it ran only tests/unit.test.mjs and passed10 prototype tests. npm check similarly checked only six prototype JavaScript files. package.json now runs the entire maintained test suite, and scripts/check-source.mjs checks every top-level owned JavaScript entry plus owned scripts, scanning runtime HTML/CSS/JavaScript for unresolved conflict markers without executing gameplay.

Eight additional integration contracts protect the actual Classic/Tidegate loader chain, the mounted catalog, all four equipment profiles, the Pelagic/Living Herds ledger, bootstrap hiding and literal relative imports. They also enforce complete normal test commands and a read-only master validation job. Three assertions failed before the packaging/workflow repair; all eight pass afterward. This is repository/model evidence, not a manufactured mission playthrough.

The existing dino-spatial-console.yml no longer contains the completed patch decoder, source-commit/source-push step, feature-branch trigger or model-job write permission. It validates exact committed master source and retains all existing model, spatial, entry, portal, Express, public-byte/public-browser and gated archival-release checks. No new workflow is added. The separate broader dino-tidegate.yml and other games' workflows are untouched; this is not a claim that all historical CI duplication has been eliminated.

AGENTS.md and the main, Express, field-operations and rotunda handoffs now identify the current authority and distinguish merged code, historical public verification and still-open current acceptance. Their prior versions are retained verbatim under history/before-reconciliation-20260920/. The roadmap closes only the already verified portal, Express, guidance and declared field-operation engineering items. Physical, human, full-route coverage and rotunda public acceptance remain separate.

## Work the game did not receive: do not silently discard it

The older dino-northstar-signature-20260912 head456741a2fea01b26b191225de10d15fa6f5a8a8b contains a Canopy Circuit, exterior ascent, canopy presentation and dedicated reward/save model that are absent from current master. That branch also retains source-restore payloads and two preparation workflows. It is not a clean ready-to-replay release. The current roadmap explicitly keeps the signature facility unfinished. Decision: preserve the branch and its provenance, reject the old whole-ranger/entry/workflow replacement, and require a focused port to current interactions, collision, saves and XR before enabling its unique mission.

The older dino-crew-canopy-20260912 headf4a5bf4dc426231ca503940d0dd3cf7faa8b6072 contains seven named staff, a separate introduction assignment, licensed rigged human assets, avatar options and Fieldlight shaders that are also absent. This is distinct from the delivered rescue crew/android field assignments. Its latest returned workflow run34718008692 is a failed integration/verification run; its prose claiming a release is not evidence that it shipped. Decision: preserve this work in the existing branch; port staff/rigging only after reconciling current ranger IK, crew interaction, portal material handling, asset licenses and all saved identities. Do not replace newer Coastal Light/Pelagic shaders with the older parallel Fieldlight stack by default.

A concrete conflict makes a wholesale copy unsafe: the old crew economy sanitizer accepts Northstar/crew IDs but omits aaa:pelagic-recovery. The maintained sanitizer retains Pelagic and Living Herds. Importing the old sanitizer would lose existing duplicate-payout protection. Any later port must extend, never replace, the current accepted reward-ID set and test mixed old/new saves. No old branch, asset, license or historical release is deleted in this audit.

Canvas-native screen HUDs, freeform panel manipulation and first-person AR are not hidden completed merges. They remain unimplemented/deferred scope as documented. Private hub source and travel portals stay excluded from Dino.

## Evidence and publication limits

The repaired full command passes265 tests with zero failures/skips. The source checker passes60 syntax checks and scans70 owned runtime/script files for conflict markers. The repository receipt records the prior10-test command, the three red integration assertions and the exact transcript hashes. Full unabridged transcripts are retained in the accompanying Dino-Atlas-Integration-Audit-20260920.zip conversation artifact; test-summary.txt contains a labeled extraction, not a fabricated full transcript. The current bootstrap CSS was compared to the exact GitHub blobs; it was not replaced by the older artifact copy. Target documents and workflow were likewise checked against current GitHub blob identities before editing.

This pass changes test entry points, a source checker, integration tests, documentation and the existing validation workflow, not gameplay. The visual build identity stays ranger-spatial-console-20260920.3. Local HTTP/DNS access to the live route failed and the web reader could not read it, so no new public-browser pass is claimed here. A successful master commit is not proof of a served build or a successful archival .3 release. Current deployment results must be checked separately, never inferred from the historical field-operations release.

All existing physical Xbox/Quest, real hand poses, stereo/passthrough, comfort/performance, player understanding and broader mission-route gates remain open. The next content port, when undertaken, should recover the unique staff/facility work through the current systems rather than reintroduce its obsolete entry, economy, rendering or CI infrastructure.

The four-file packaging/workflow repair was written directly to master at7330b797d7524af747b87559fbfbb6b7f3c5c1c1. A stale non-fast-forward attempt was rejected; the repair was then rebuilt on4c58f1bbf99dee417ad2d2f35a821bef66190d7b after confirming its intervening changes were Prism-only. No force update or new pull request was used.
