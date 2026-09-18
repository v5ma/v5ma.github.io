# Sky Cycle XR recovery 0.26.1

The September 18, 2026 physical playtest reported that AR was stuck in an unnavigable menu, controllers could not close it, and a flat plane intersected the level differently as the player's head moved. This report invalidates any interpretation of the earlier stationary-head emulation as complete Quest usability approval.

## Bounded repair

The existing Flight Deck and delivery loop treated a hidden HTML document as an inactive game even when its immersive session remained visible. The repair makes the visible XR session authoritative for immersive input and simulation; hidden or visible-blurred XR sessions still block input. Desktop visibility behavior remains unchanged.

Menu neutral detection no longer requires releasing the unused squeeze buttons. Right B has a stable back/pause identity across menu transitions and can recover a menu before the general neutral gate. Holding B must not close several nested menus or immediately reopen the one it closed. Both tracked-controller sticks can navigate menus. A on a pointed virtual footer action uses that action, not a different native focused control. Existing desktop Xbox gameplay mappings and saved remaps remain.

The direct Resume play and Resume editing now controls cancel uncommitted dialogs and return to the current activity without approving prompts. During ordinary controller riding the persistent UI plane is hidden and cannot intercept ray input. Hands retain their action bar and editors retain their tools. B reopens the full pause UI.

The AR presentation uses a fragment mask computed in fixed exhibit/world coordinates rather than the pinned renderer's view-space ClippingGroup. It creates no occluder or cap-plane mesh. Original node and classic materials retain their identities and prior mask/field values, restored on exit. The exhibit's bounds do not change with viewer pose; the original game simulation and collision remain untouched. This addresses both candidate sources of plane interference, but the exact origin of every physical-device artifact cannot be proven from a text report alone.

## Accepted software evidence

Final source 355aea4ade530d8e5e71adb70d2347200531ebc7 passed all eight applicable jobs in run 35405532420. The hosted logs record 296 game tests and 12 original soundtrack tests. Six real-game browser reports total 207 checks: AR recovery 27, VR recovery 26, AR Workspace 41, VR Workspace 40, Portal Network 20 and Waterwheel deliveries 53. A separate rendered aperture fixture has 13 checkpoints. All seven browser/fixture report source IDs and artifact ZIP digests were verified; all 47 native PNG captures and one isolated fixture PNG were reviewed. Videos were retained where produced; no end-to-end video review is claimed.

Old-code reproduction fails eight of nine targeted input regressions; the ninth verifies that non-visible XR correctly blocks input. The repaired exact functions pass those tests. These are not physical-controller results.

The hosted recovery journey uses the actual game, renderer and DOM with emulated XR controllers, no assisting Xbox, both grips held, hidden/unfocused HTML, real trigger states plus select events, held B, both sticks, nested menus, direct resume, ordinary riding, visible-blurred recovery, hand switching and XR exit. It also moves the emulated head through pitch, lateral, vertical and depth changes and captures the real stereo framebuffer. No rider, score, win or progression assignment manufactures a pass.

The separate graphics fixture tests the fragment mask from ten camera/eye poses against inside and outside colored geometry, then disables masking and verifies original material restoration. It is explicitly not the native game test. Workspace coverage retains real text entry, cancellation, undo, pan, tracking loss, playtest/return, AR/VR switching and denied re-entry. Waterwheel delivers all twelve actual packets and finishes on its first attempt; temporary credits restore on Workshop return and protected campaign/save fixtures remain unchanged. Full delivery traversal uses supported 2D after actual 3D inspection.

## Retained revealing tests

Initial candidate 72fa1c6da154881781cff5393f697bd5aba79a4d passed the targeted recovery and mask checks but failed the old Workspace test after 3D playtest: the test tried to click All menus on the controller riding panel that this repair deliberately removes. It now requires the panel absent, presses the actual tracked B shortcut, verifies pause/menu access, and continues the same editor-return assertions.

The initial delivery run served ten targets but sampled the eleventh approach too late after remote-call latency. The original throttle-release, four-frame coast and two-frame sampled B hold now execute coherently in browser animation frames. The forward-window, actual packet collision, twelve-delivery, accepted finish and save checks remain. The correction changes only acceptance scheduling, not game physics or player state. Three isolated harness tests protect input timing, timeout-without-mutation and the B shortcut. Initial failing artifacts remain identified in the receipt.

## Publication and physical retest

PR 190 contains the repair. Read verification/xr-recovery-0.26.1.json for current merge and independent 33-file publication status, followed by both public-origin AR/VR recovery journeys. A branch, local test, queued run or old version receipt is not live-release verification.

On the updated release, use AR / VR, then Enter AR or Enter VR. Right B opens pause or goes back one menu level; use Resume play to close the current menus directly. Point and trigger or use either tracked stick for menu navigation. Exit XR remains in the menu. Controller riding intentionally has no always-visible menu panel; switching to hands makes the hand action bar available.

Physical Quest 3 controller/hand ergonomics, passthrough, headset readability, tracking in real room lighting, long sessions and comfort must still be retested by the user. A moved-head screenshot with some menu content off-screen does not establish comfort across arbitrary poses; recenter remains available.

## Preservation and continuation

This is a Milestones F/G repair, not chapter work or completed AAA production. Keep all eight campaign IDs, original physics, audio ownership, saves, remaps and Workshop drafts. Preserve the separate sky-cycle/canal-choice-0.25 branch; do not overwrite it with this repair. Continue its movement-first level design only after publication. Roll back only this repair's owned runtime changes if necessary, never user storage or unrelated sibling projects.

The W3C WebXR Device API's session-visibility model and WebXR Gamepads Module's xr-standard mapping informed the repair. The pinned local Three r177 implementation remains the integration source; no new framework or external runtime dependency is added.
