# Sky Cycle XR recovery 0.26.1

The September 18, 2026 physical playtest reported that AR was stuck in an unnavigable menu, controllers could not close it, and a flat plane intersected the level differently as the player's head moved. This report invalidates any interpretation of the earlier stationary-head emulation as complete Quest usability approval.

## Bounded repair

The existing Flight Deck and delivery loop treated a hidden HTML document as an inactive game even when its immersive session remained visible. The repair makes the visible XR session authoritative for immersive input and simulation; hidden or visible-blurred XR sessions still block input. Desktop visibility behavior remains unchanged.

Menu neutral detection no longer requires releasing the unused squeeze buttons. Right B has a stable back/pause identity across menu transitions and can recover a menu before the general neutral gate. Holding B must not close several nested menus or immediately reopen the one it closed. Both tracked-controller sticks can navigate menus. A on a pointed virtual footer action uses that action, not a different native focused control. Existing desktop Xbox gameplay mappings and saved remaps remain.

A direct Resume play or Resume editing now control cancels uncommitted dialogs and returns to the current activity without approving prompts. During ordinary controller riding the persistent UI plane is hidden and cannot intercept ray input. Hands retain their action bar and editors retain their tools. B reopens the full pause UI.

The AR presentation uses a fragment mask computed in fixed exhibit/world coordinates rather than the pinned renderer's view-space ClippingGroup. It creates no occluder or cap-plane mesh. Each original node material's previous mask is preserved and restored on XR exit. The exhibit's bounds do not change with viewer pose; the original game simulation and collision remain untouched. This addresses both candidate sources of plane interference, but the exact origin of every physical-device artifact cannot be proven from a text report alone.

## Evidence gates

Local reproduction executes the old controller code and fails eight of nine targeted input regressions; the ninth verifies that non-visible XR correctly blocks input. The repaired exact functions pass these tests. The local full suite passes 292 game tests and 12 original soundtrack tests. These are not physical-controller results.

The hosted recovery journey uses the actual game, renderer and DOM with emulated XR controllers, no assisting Xbox, both grips held, hidden/unfocused HTML, real trigger states plus select events, held B, both sticks, nested menus, direct resume, ordinary riding, visible-blurred recovery, hand switching and XR exit. It also moves the emulated head through pitch, lateral, vertical and depth changes and captures the real stereo framebuffer. No rider, score, win or progression assignment manufactures a pass.

An additional isolated graphics fixture tests the fragment mask from ten camera/eye poses against inside and outside colored geometry, then disables the mask and verifies material restoration. It is explicitly not the native game test. Existing AR/VR Workshop, Portal Network and twelve-delivery regressions remain separate.

Read verification/xr-recovery-0.26.1.json for actual hosted results, exact source, retained failures, reviewed captures, merge and independent 33-file publication check. A branch, local test, queued run or old version receipt is not live-release verification. Physical Quest 3 controller ergonomics, passthrough, headset readability and comfort must still be retested by the user.

## Preservation and continuation

This is a Milestone F/G repair, not chapter work. Keep all eight campaign IDs, original physics, audio ownership, saves, remaps and Workshop drafts. Preserve the separate sky-cycle/canal-choice-0.25 branch; do not overwrite it with this repair. Roll back only this repair's owned runtime changes if necessary, never user storage or unrelated sibling projects.

The W3C WebXR Device API's session-visibility model and WebXR Gamepads Module's xr-standard mapping informed the repair. The pinned local Three r177 implementation remains the integration source; no new framework or external runtime dependency is added.
