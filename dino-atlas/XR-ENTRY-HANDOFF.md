# Classic Reserve VR and AR entry

## Published recovery checkpoint / 2026-09-18

Build classic-xr-entry-20260918.1 is published and verified in the regular game at https://v5ma.github.io/dino-atlas/. Runtime commit 5349808186e039b7da0de8eb00c56a094b5e4a3c is the completed launcher repair, not a pending branch. Release dino-xr-entry-20260918.1 was published at 2026-09-18T23:01:37Z. All three jobs in the scoped run 35401288351 succeeded: verify, published and release. Do not repeat the old merge or recreate the launcher.

The recovery receipt is verification/xr-entry/recovery-20260918.json, first saved in commit 848b1c3b37c35a7d891e26efc71713f8729b853f. The release includes dino-xr-entry-evidence.tgz with source and test evidence. That aggregate asset's reported digest is recorded; the recovery independently downloaded and hash-checked the separate source/candidate and published Actions archives instead.

## What the user should see

Open the regular Classic Reserve page in the headset browser. Directly beneath Start your engine is Play Classic Reserve in VR or AR, containing First-person VR, VR diorama and AR diorama. The top-bar AR / VR shortcut opens the same choices near the top of the pause menu. Tidegate is explicitly labeled as another district, not the only place that offers headset modes.

Unsupported options stay visible with a reason and Check headset again. A supported direct button requests the selected immersive session from the originating click. AR selection does not silently request VR. Successful initial entry uses the ordinary Start handler; a denied request leaves the game unstarted and recoverable. This repair exposes the existing AR diorama, not first-person AR.

## Cause and preserved behavior

The former introduction highlighted VR/AR on the separate Tidegate link. Classic's own entry button was appended below all introductory copy in a fixed, non-scrolling screen, and its three-mode selector was deep in the pause menu. The existing engine already supported those Classic modes. The repair adds a static visible entry group, a scrollable introduction and a shortcut instead of replacing the regular game.

The Classic-only import-map adapter classic-xr.js subclasses the shared XR implementation. The repair does not replace Tidegate, the character-centered full-depth portal, its accepted box dimensions or placement, automatic shell cutaway, first-person rendering, tracked/hand UI, movement, vehicles, mounted utilities, missions, rewards, control profiles or historical saves. It uses the existing presentation preference; no new save key is introduced.

## Completed evidence

Candidate and published entry runners each passed 23 checks. They exercised all three actual buttons in Classic, viewport sizes 1100x720, 900x600 and 390x844, originating click activation, rejected permission, correct session types, Xbox focus/navigation, visible unsupported-state explanations, session exit and subsequent ordinary tools. Both reports recorded no game JavaScript or HTTP errors. The candidate also passed 22 Classic tracked/hand UI checks, 15 Classic portal checks and 24 Classic Express checks. The public job independently passed another 15 Classic portal checks.

The public job matched all 71 runtime and vendor files to its source manifest before running the public launcher and portal journeys. Recovery downloaded artifacts 10571258670 and 10571006863, matched both archive SHA-256 digests, matched all 71 source files to the manifest and verified that the public hash set was identical. Recovery independently reran all 237 Node/model/physics tests with no failures or skips and syntax-checked all 57 top-level JavaScript files. Public 900x600 and 390x844 introduction captures were visually reviewed.

Reviewed master 9c26bd8c1487df75d54a290f1043131c3a8da805 retained the launcher repair. Comparison through recovery receipt commit 848b1c3b37c35a7d891e26efc71713f8729b853f showed only intervening Leo's Guild work and the new Dino receipt, with no Dino runtime replacement. Recovery updates are documentation-only, applied without resetting master or overwriting sibling work.

## Boundaries and next work

The browser evidence uses native software WebGL and actual entry handlers with synthetic Xbox input and explicitly mocked XR capabilities/session/render-session attachment. No actor, mission, inventory or progress assignments manufacture acceptance. Physical Xbox/Quest controllers and hands, real headset stereo/passthrough, compositor behavior, comfort and device performance remain unverified. The previously supplied screenshots are browser/mock captures, not headset photographs.

The recovery's direct web-reader request failed, and container HTTP requests failed DNS resolution. It therefore reviewed the completed hosted public-browser run, not a fresh local live-browser session. This scoped success does not certify every historical repository workflow: old ranger/Storm workflows showed failures, and the separate broad Tidegate published workflow was running when first inspected. Keep that distinction; do not call the entire repository green from launcher results.

The older field-operations package was already merged and its full original public/release run 35289464270 succeeded. Do not merge that branch or the older Express branch again. Existing level-design, broader mission-route coverage and physical acceptance obligations remain open. Next, address concrete headset feedback about entry, menu readability or camera pose without rebuilding the already working portal or resetting saves.
