# Portal Network v0.21.0

Build: `sky-cycle-portals-2026.09.14`. Software acceptance and merge completed September 15, 2026. This continues the existing Sky Cycle; it is not a replacement game. The authoritative publication result is in `verification/portal-network-0.21.json`; a merge alone is not publication evidence.

Exact accepted candidate: `89897e4d2379464bd37be9e54ca384925c4da84e`. PR 148 merged normally as `3383257313b74255cb61402d4ca7e21c84fbca20`, preserving concurrent sibling-game work.

## Implemented scope

The destination atlas reads an immutable catalog and resolves stable route IDs against the registered campaign. Tideglass Baths remains Portal Destination 01 at index 7; Sunrise Borough remains the home portal at index 4. All eight routes retain their indices. Both portal endpoints are finished existing routes. No coming-soon destinations are advertised as playable. Focusing a destination changes its name, color, reflection signature, descriptive preview and a rate-limited cue on the existing effects bus.

Travel explicitly starts a new route run. Dirty Workshop work blocks travel. Saved records, drafts, remaps, music and graphics preferences retain their original namespaces. Opening the atlas and backing out does not change the source document or bank unfinished progression. Nested B/back ownership remains with the top dialog.

The original courier gains an articulated visual rig with more restrained head proportions, jointed arms and legs, distance-driven wheel rotation and pedaling, lean and landing compression. An independently implemented analytic two-bone solver keeps feet on the pedals and hands on the grips. These are bicycle contacts, not walking-floor foot locks. Rendering consumes rider state without changing hitboxes, authored geometry or simulation physics. Mechanical animation follows simulation steps and freezes with pause. The legacy courier remains a fallback if the new rig is unavailable.

## Controller and XR behavior

Xbox gameplay retains existing defaults and saved remaps: A jumps, RT/X boosts, RB/B throws, LB/Y whips, Start pauses, View opens Flight Deck, and D-pad Down interacts nearby. Common actions do not require opening the atlas.

The Quest / XR button offers an explicit seated, side-on stereo diorama of the existing 3D game. The pinned Three r177 XR implementation requires WebGL. A WebGPU session must reload with `?xr=1` after the entry warning. Reload starts a route rather than preserving a provisional run. Saved progression is not migrated or cleared, and unfinished progression is not banked. Unsaved Workshop drafts block the reload.

Tracked controllers use left stick for riding/reeling, right A for jump, right trigger for paper, right grip for whip, left trigger for boost, left X for nearby interaction, right B for pause/back, and left Y for Flight Deck. Controller rays activate real menu controls. Optional hand tracking renders available hand joints and uses native hand-select events for pinch pointing rather than double-counting a separate pinch detector. An in-world action bar supports hand-only riding, jump, paper, whip, boost, interaction and pause. Normal menus are mirrored as paged actions, including slider adjustment. Recenter and Exit XR remain available.

Input is released on source loss, visibility loss, menu transitions and XR exit. Ending XR restores normal scene ownership and leaves the route paused. The original non-XR animation loop does not compete with the XR frame owner.

## Exact-source acceptance

Run `34942370330` tested candidate `89897e4d2379464bd37be9e54ca384925c4da84e`. All four scoped jobs passed: rules `104293793567`, XR `104293793810`, Sunrise `104298676653`, and Tideglass `104298676708`.

The rule suite passed 146 tests: 123 prior checks, 18 portal/rider/input checks and 5 opaque-XR-framebuffer adapter checks. The XR report passed 16 checks with the real Three XRManager, real rendered stereo target and deterministic hardware emulation. It exercises controller and native hand-select menus, riding, jumping, pause/back ownership, travel without false progression, source disconnect, exit and denied-session recovery.

Tideglass passed 25 checks and two first-attempt authored finishes: the sluice/waterline route and the dry promenade. Sunrise passed 21 checks and three first-attempt authored finishes: Market Pocket Park, direct road and coasting road. Tests use ordinary controls and the real acceptance/progression path, not player-position assignments, score assignments or forced wins. Real 3D local traversal and scenery are exercised; full-route completions use the supported 2D view on CPU CI. These are not five complete 3D playthroughs.

All 23 PNG captures in the three accepted artifacts were reviewed, including both XR eye views, hands, nested menus, desktop/mobile atlas layouts, real pools, the revealed rail and accepted finishes. Videos are retained in the artifacts but were not independently reviewed end to end. Artifact IDs, digests and publication hashes are recorded in the receipt.

## Retained failures and boundaries

The initial XR candidate rendered a blank stereo framebuffer. A strict real-framebuffer readback exposed an opaque-framebuffer integration fault in the pinned r177 WebGL backend. The scoped `xr-webgl-compat.mjs` adapter binds the native opaque framebuffer without replacing its attachments. Ordinary targets and projection-layer targets retain their original backend paths. The corrected candidate passes rendering and adapter checks; earlier failed evidence remains in workflow/PR history.

The broader legacy Cloudpost run `34942370272` is not an all-green acceptance record. Four failing startup/ride/coast/editor assertions hard-code the old total of 16 tracks, while the already-shipped Sunrise practice branch appends another track. The canal run reached an ordinary first-attempt finish but failed its stricter complete optional-sequence assertion after visiting m0, m1, m2, m3, m4 and b0. Preserve that failed trace; do not claim the entire optional canal sequence passed or rewrite its expected sequence to hide the failure. The relevant route, Sunrise, rail and grapple modules are unchanged from v0.20. A dedicated legacy-harness reconciliation and repeat of the complete optional sequence remain open.

The post-merge site-wide interactive workflow also failed its old homepage assertion that exactly three projects exist, before entering Sky Cycle. Do not remove sibling games to satisfy that obsolete assumption. This is separate from the exact-source Sky Cycle acceptance suite.

Physical Quest 3 controller and hand UX, comfort, tracking loss in real lighting, audio behavior, browser permissions, native XR layers/multiview, native WebGPU, long sessions and reference-device frame times remain unqualified. Physical Xbox testing is also open. Advanced Bezier authoring remains a pointer-required exception. This release does not add first-person cycling, walking, swimming, full-body tracking, new destinations or production motion-capture assets.

## Next work

Reconcile the legacy geometry-count assertions and rerun the complete optional canal sequence without changing gameplay or weakening the route contract. Continue the bounded water/audio sensory pass: notification density and transient intensity first, then single-owner bathhouse ambience and mechanical cues. Actual Quest 3 testing of both input modes and performance/comfort should precede further XR scene-detail increases.

## Research references

Daniel Holden, "Inverse Kinematics and Foot Locking," https://theorangeduck.com/page/inverse-kinematics-foot-locking . This implementation uses analytic geometry and original code rather than copying article code.

Daniel Holden, publications index, https://theorangeduck.com/page/publications .

W3C WebXR Device API, https://www.w3.org/TR/webxr/ .

W3C WebXR Hand Input Module, https://www.w3.org/TR/webxr-hand-input-1/ .

W3C WebXR Gamepads Module, https://www.w3.org/TR/webxr-gamepads-module-1/ .

The pinned local Three r177 `XRManager.setSession` rejects the WebGPU backend and documents `forceWebGL: true`; this release follows that implementation boundary.
