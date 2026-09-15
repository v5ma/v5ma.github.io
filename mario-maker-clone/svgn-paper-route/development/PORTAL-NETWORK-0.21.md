# Portal Network v0.21.0

Build: `sky-cycle-portals-2026.09.14`. This is a continuation of the existing Sky Cycle, not a replacement game. Acceptance and publication remain pending until the exact-source receipt records successful runs and public hashes.

## Implemented scope

The destination atlas now reads an immutable catalog and resolves stable route IDs against the registered campaign. Tideglass Baths remains Portal Destination 01 at index 7; Sunrise Borough remains the home portal at index 4. Both endpoints are finished existing routes. No coming-soon destinations are advertised as playable. Focusing a destination changes its name, color, reflection signature, descriptive preview and a rate-limited cue on the existing effects bus.

Travel explicitly starts a new route run. Dirty Workshop work blocks travel. Existing saved records, drafts, remaps, music and graphics preferences retain their original namespaces. Opening the atlas and backing out does not change the source document or bank unfinished progression. Nested B/back ownership remains with the top dialog.

The original courier gains an articulated visual rig with more restrained head proportions, jointed arms and legs, distance-driven wheel rotation and pedaling, lean and landing compression. An independently implemented analytic two-bone solver keeps feet on the pedals and hands on the grips. Contacts here are bicycle contacts, not walking-floor foot locks. Rendering consumes the rider state; it does not change hitboxes, authored geometry or simulation physics. Mechanical movement follows simulation steps and freezes with pause. The legacy courier remains a fallback if the new rig is unavailable.

## Controller and XR behavior

Xbox gameplay retains the existing defaults and saved remaps: A jumps, RT/X boosts, RB/B throws, LB/Y whips, Start pauses, View opens Flight Deck, and D-pad Down interacts nearby. These common actions do not require opening the atlas.

The Quest / XR button offers an explicit seated, side-on stereo diorama of the existing 3D game. Three r177's XR implementation requires WebGL; a WebGPU session must reload with `?xr=1` after the entry warning. The game never silently migrates saves or banks the abandoned run. Unsaved Workshop drafts block the reload.

Tracked controllers use left stick for riding/reeling, right A for jump, right trigger for paper, right grip for whip, left trigger for boost, left X for nearby interaction, right B for pause/back, and left Y for Flight Deck. Controller rays activate real menu controls. The session requests optional hand tracking, renders available hand joints and uses native hand-select events for pinch pointing rather than double-counting a separate pinch detector. An in-world action bar supports hand-only riding, jump, paper, whip, boost, interaction and pause. Normal menus are mirrored as paged, readable actions, including slider adjustment. Recenter and Exit XR remain available.

Input is released on source loss, visibility loss, menu transitions and XR exit. Ending XR restores normal scene ownership and leaves the route paused. The original non-XR animation loop does not compete with the XR frame owner.

## Evidence and limitations

Pure tests cover immutable catalog resolution, dirty-draft gates, preservation boundaries, IK lengths and contacts, paused animation, XR mappings, trigger suppression and neutral-input barriers. Native tests cover real route completion, nested controller dialogs and save continuity. The dedicated XR test uses a deterministic hardware facade with the real Three XRManager and stereo render target. It is software evidence, not physical Quest 3, Xbox, hand-tracking quality, native WebGPU or hardware frame-time certification.

Physical Quest 3 controller and hand UX, comfort, tracking loss in real lighting, audio behavior, browser permissions, long sessions and frame-time budgets remain open. Advanced Bezier editor authoring remains a pointer-required exception. This release does not add first-person cycling, walking, swimming, full-body tracking, new destinations or production motion-capture assets.

## Research references

Daniel Holden, "Inverse Kinematics and Foot Locking," https://theorangeduck.com/page/inverse-kinematics-foot-locking . The implementation uses the analytic geometric idea, not copied article code.

Daniel Holden, publications index, https://theorangeduck.com/page/publications .

W3C WebXR Hand Input Module, https://www.w3.org/TR/webxr-hand-input-1/ .

W3C WebXR Gamepads Module, https://www.w3.org/TR/webxr-gamepads-module-1/ .

The pinned local Three r177 `XRManager.setSession` rejects the WebGPU backend and documents `forceWebGL: true`; this release follows that implementation boundary.
