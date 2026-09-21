# Dino Atlas: Field Rotunda

Build ranger-spatial-console-20260920.2. Scope: the full Classic Reserve and Tidegate games, retaining the existing three XR modes. This is a focused interface refit, not an engine migration or another demonstration level.

## Playtest changes

The full field-controls panel is hidden during normal XR play. Right B still opens the ordinary pause menu; the summoned workspace stays at its captured floor-relative pose instead of following the headset. A small floor slate and a tracked wrist/controller slate provide Menu and Field controls actions for hand-ray selection. Merely looking down does not open a menu or pause the game.

The workspace has an animated pedestal and raised button faces. Pointing shows a contrast highlight and an intersection dot. Its direct tabs are Resume, Map, Missions, Field, Workspace and Leave XR. Height, distance and size controls are available through Workspace. The reset places it for the current seated or standing viewpoint. Changes affect only the personal interface, not the diorama's accepted size, placement, orientation or full-depth portal. The interface is rendered by the existing game canvas.

Compact status shows vehicle identity and exit, tool/ammunition, speed or altitude, the current goal and an interaction hint. It attaches to a tracked grip or hand wrist when available, otherwise falls back to a small floor slate. Field controls intentionally reveal the existing hand hold-to-move/fire actions without pausing play. Hide field controls removes the full panel and its hit target immediately; held actions clear on release and existing tracking/session transitions.

The original screen-mode DOM HUD and accessible launcher remain available. This pass does not claim a complete canvas-native rewrite of every screen interface, freeform two-hand panel dragging, first-person AR, or physical headset acceptance. The only new saved key is dino-atlas.spatial-console.v1; no previous keys, missions, rewards, control profiles or vehicle positions are reset.

## Reference and privacy boundary

This implements the supplied September 20 player feedback about a persistent face-blocking field board, direct controls and a deliberately summoned personal workspace. It contains no private hub source, review file, authentication, destination URLs or assets. No sphere/walking/cross-site portals are added to Dino Atlas. The existing character-centered diorama remains a view into this game's own world.

Three WebXRManager grip and hand spaces and WebXR local-floor reference spaces informed the implementation. A reference floor is not foot tracking or persistent room anchoring. Vendor versions and licenses are unchanged. Technical references: https://threejs.org/docs/pages/WebXRManager.html and https://www.w3.org/TR/webxr/ .

## Verification contract

Run all Node tests and syntax checks. The new spatial-console-browser.py runs separately in Classic and Tidegate with actual input and the production renderer, mocking only unavailable XR sessions/poses and gamepad input. It must demonstrate clear play, real movement, stable menu pose under head motion, workspace/map tabs, controller adjustments, hand summon/movement/release, real session exit and unchanged rewards/preferences. Public file matching and public browser journeys are separate from local/candidate evidence.

The earlier grounded hand test now deliberately summons Field controls before selecting hand movement; it no longer assumes a permanently visible board. No gameplay outcome is assigned to manufacture acceptance. Physical Quest 3 controllers/hands, wrist orientation, readable sizing, stereo/passthrough, comfort, sustained performance and user approval remain open. Keep failures and exact run identities in the handoff rather than describing queued checks as passed.

## Additional interaction pass

The .2 refinement adds deliberate 15-degree workspace rotation steps (bounded to 60 degrees each way), preserving the captured placement and independent game-portal transform. Rotation uses the existing personal-preference key; missing values default to zero.

Visible personal UI owns the whole surface. Nonbutton text and blank panel regions consume trigger/pinch input without selecting an action or firing through the slate. The press remains consumed until release even after pointing away. Hidden ancestors remove their descendants from picking. Nearby overlapping personal surfaces are resolved by actual ray distance. Gameplay controls and mounted weapon rules are unchanged.

Pointer feedback now identifies the actual button object, so identical plus/minus labels do not highlight every setting. The direct navigation tabs and compact Menu/Field controls receive contrasting hover feedback. Compact helicopter guidance distinguishes the Active stick-altitude layout from Legacy trigger piloting.

Four ray/feedback assertions failed on the recovered .1 runtime and passed after repair. The final local model suite contains 254 passing tests; new native checks cover workspace rotation, unchanged diorama placement, repeated-label feedback, visible-slate input ownership, release/rearm and ordinary tool firing. Native and public results must be recorded separately. These tests do not certify physical Quest/Xbox devices or human comfort.
