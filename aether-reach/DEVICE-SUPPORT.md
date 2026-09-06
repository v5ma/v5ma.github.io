# Controller and immersive preview

The v0.2.0 candidate adds standard-mapped Xbox-style gamepad input and a feature-detected WebXR `immersive-vr` adapter targeting Quest 3. No physical Xbox or Quest 3 test has been performed in development here; model and browser-emulated device tests are distinct from physical support certification.

## Xbox / standard gamepad
Connect via your operating system, then press a button with the page focused. Left stick moves with a radial deadzone; right stick looks. A jumps/releases, Y interacts/hooks, X reloads, RT fires, LB pulses, RB reverses a rail, left-stick click boosts, View opens the atlas, Menu pauses. D-pad or left stick navigates menus; A activates and B closes. Look speed and vertical inversion are settings. A disconnected active pad pauses, and held buttons must be released after reconnect or a modal transition. Non-standard device mappings are not guessed.

## Immersive preview
Open the public game in an HTTPS WebXR-capable headset browser and use Enter VR (preview). The button is enabled only after `isSessionSupported('immersive-vr')` succeeds; `local-floor` is requested on an explicit click. The renderer uses its XR animation loop, tracked eyes and controllers. The separate locomotion rig provides left-stick walking and right-stick 30-degree snap turning. Camera-following on rails does not change headset orientation. Right trigger fires a validated controller ray, right grip interacts, A jumps/releases, B reloads, left trigger pulses, left grip reverses, X opens the atlas and Y pauses. Spatial HUD/menu panels provide status and an Exit VR action. Desktop/touch remain available after session exit or refusal.

This is not a claim that climbing, gliding, hand tracking, full embodied reload, multiplayer or polished VR comfort are complete. The current avatar uses the existing standing collision envelope. Reference-space calibration, long-session performance and physical headset comfort are explicit open gates in the roadmap. Do not infer hardware frame rate from software WebGL.

## Planning
`roadmap.json` is the committed canonical public plan; `roadmap.html` provides a local-editable Kanban with dependency IDs, acceptance criteria and evidence. Changes in the board are browser-local and exportable, not GitHub writes. The downloadable workbook is a versioned snapshot of the same plan. Private narrative remains outside all public files and workflows.

## Primary API references
- https://threejs.org/manual/en/webxr-basics.html
- https://developer.mozilla.org/en-US/docs/Web/API/XRInputSource/gamepad
- https://developer.mozilla.org/en-US/docs/Web/API/Gamepad/mapping
- https://developers.meta.com/horizon/documentation/web/browser-specs/
