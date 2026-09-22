# Field Clarity handoff / 2026-09-22

## Current runtime and deployment

The runtime is ranger-field-clarity-20260922.1, written directly to master at d1a2218e7a2244fe3877a0a9061355c6c0b947c8. No PR, feature branch, transport helper or new workflow was created for this recovery. The earlier b736121c35f1b62b9a4c981e55a9cbd166557ddc is its recovered floor-feedback baseline, not the final instructions/layout repair.

GitHub Pages run 35751403964 successfully deployed cba5c1beee4263c75297ee2753e3277d02497fcd, deploy job 106828618491. Comparison with d1a2218 showed only intervening sibling changes and no Dino replacement. The regular Classic Reserve and Tidegate therefore contain the repair. At this checkpoint, the separate scoped public-browser job 106832155972 in run 35750258792 is queued; the archival release has not been claimed complete. Deployment, source-browser acceptance and separate public-browser acceptance are different records.

## What changed

The floor guide is visible during ordinary XR play and contains the actual live map, selected mission and step, HERE interaction prompt, selected tool and current controls. White marks the player and gold the current goal. Classic uses its existing live minimap; Tidegate maintains a compact route map when its full map is closed. The short LIVE MAP title and bounded legend no longer overlap the mission column.

Actual notification and radio text are copied to a separate floor message surface. Each message lasts 2 wall-clock seconds, fading during the last 0.4 seconds even when simulation is paused. The last twelve remain readable in Help. The persistent map, goal and HERE prompt do not expire. Looking around does not drag the guide with the head; summon or Bring floor guide here deliberately captures another pose. Floor height and scale are adjustable for seated or standing use.

The default diorama aperture is 2 m tall instead of approximately 0.565 m at the old default width. Height is adjustable from 0.6 to 4 m and width from 0.8 to 4.8 m. The current displayed character-center height is preserved during resizing. Full world depth through the sides/rear, automatic shell transparency, real game collision and three legal opening states remain unchanged. No separate miniature game or infinite terrain is introduced.

Menu / sizes exposes Menu smaller/larger, Diorama smaller/larger and Box shorter/taller directly. Menu scale is independent of the box; the floor display has its own scale and height. Controller focus brings the appropriate spatial page into view. Existing settings and progress are not cleared.

The new ranger-guidance.js describes the selected device/profile. Guided lessons no longer tell Active Quest players to drive with their aim/fire triggers. On-foot first patrol explains boarding. Keyboard instructions use actual keyboard/mouse controls; Legacy Quest correctly describes grip aiming. HERE removes obsolete A suffixes when the actual action uses grip. These changes describe existing controls rather than silently remapping them or changing mission targets.

## Controls for the playtest

Look down for Map, What to do / controls and Menu / sizes. Help shows the current objective, nearby interaction, selected control profile and recent messages. Quest Active uses either grip to interact, LT to aim, RT to use the tool, X to reload, Y to board/exit, A to jump or brake/hover, B for menu/back and right-stick click for Map. The left stick moves or steers; helicopter altitude uses the right stick vertically. Existing Xbox Familiar/Active and Quest Legacy profiles remain selectable and receive different help.

Refresh or reopen the game tab after an update; never clear site storage as an update procedure. The regular game remains at https://v5ma.github.io/dino-atlas/ and Tidegate at https://v5ma.github.io/dino-atlas/tidegate.html.

## Completed source evidence

All four source jobs in run 35750258792 passed: model, Classic browser, Tidegate browser and entry. The model suite passed 285 tests with zero failures or skips; the checker passed 62 JavaScript syntax files and scanned 72 owned runtime/script files for conflict markers. The downloaded exact-source archive was independently checked against all 74 manifest files and rerun locally with the same 285 passing tests.

Classic source-browser reports passed 22 floor-feedback checks, 30 spatial-menu checks, 15 portal checks and 24 Express checks. Tidegate passed 22 floor-feedback checks, 29 spatial-menu checks, 15 portal checks and 22 Express checks. The entry job passed 23 launcher checks and 22 Grounded tracked/hand/tool checks. Those reports recorded no captured game JavaScript, shader or HTTP errors within their declared scopes.

The prior Grounded walking assertion failed after a fixed 1.4-second stick pulse. The final runner keeps the same required physical displacement and normal stick input but waits for actual motion, with a 30-second failure limit and added diagnostics. It passed on the final source without teleporting the ranger, changing physics or reducing the displacement requirement. The four genuine pre-repair guidance/layout failures are retained in verification/field-clarity/clarity-before-20260922.tap.

All four downloaded source artifacts had matching SHA-256 digests: model 10704816152, Classic 10707036353, Tidegate 10705812057 and entry 10706101557. Actual Classic and Tidegate floor-guide renderer captures were reviewed. Their head/session/controller poses are mocks, not physical headset photographs.

## Remaining boundaries and continuation

Use the existing read-only dino-spatial-console.yml and run 35750258792 to finish separate public verification and the new dino-field-clarity-20260922.1 archival release. Do not recreate a queue workaround, PR, branch or publisher. Do not report a queued or skipped job as successful. Append an actual publication receipt once the served-byte, public-game and release jobs complete.

The current source checks are engineering evidence, not physical Xbox/Quest acceptance, real hand tracking, stereo/passthrough, room comfort, performance or unfamiliar-player understanding. UI-09b/UI-09c, wider field-mission coverage and place-mastery gates remain open. Screen DOM remains the accessible fallback, not a finished canvas-only screen rewrite. All original missions, rewards, cargo identities, saves, mounted tools, Express rules and sibling work are preserved. No private hub code/assets, engine migration or new travel portal was included.
