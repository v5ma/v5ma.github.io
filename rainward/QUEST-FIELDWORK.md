# Rainward v0.14.0 / Quest Fieldwork

The owner selected Quest 3 playable XR as the next upgrade. This replaces the runtime's paused overlook with immersive first-person VR using the existing seven expeditions. It does not add passthrough AR, multiplayer, native packaging or the unfinished Grounded character-motion work.

## Entry and preservation

Open https://v5ma.github.io/rainward/ in Meta Quest Browser and select PLAY IN XR / CONTROLLERS or PLAY IN XR / HAND TRACKING. Grant the browser's XR permissions, then select an expedition, a new start or a shelter continuation inside the headset. Controller entry requests optional hand tracking; hand entry requires hand tracking and reports a permission/capability failure instead of falsely claiming success. Existing Quest-browser saves are retained. Desktop saves do not automatically sync across separate browsers or devices.

The original desktop Survival and Classic Xbox mappings are unchanged. All seven expeditions, finite ammunition, supplies, held crafting/healing, shelter save keys and checkpoint formats remain authoritative. XR rays steer aiming, but original body-origin line-of-fire obstruction still prevents aiming through a wall by moving a controller beyond it. Tracked movement uses the existing swept body-collision routine. Vertical head movement is not a new flight, climb or prone exploit.

## Touch controllers

Left stick moves relative to head direction; click sprints using the existing toggle/hold preference. Right stick left/right makes a released-input 30-degree snap turn. Right stick up swaps pistol/rifle; down cycles medkit/bottle/smoke. Right-stick click melees. Right trigger fires or uses the selected throwable/medkit. Right grip interacts with nearby objectives, pickups, takedowns and shelter saves. Left trigger aims; left grip holds listening. Right A jumps/vaults or surfaces in water; left grip plus A dodges. Tap right B to crouch/stand; hold it to go prone or toggle diving. Left X reloads directly. Tap left Y for the satchel; hold it to pause. In menus A selects, B goes back, left stick navigates/adjusts, right stick scrolls, and either trigger ray-selects. System/menu buttons reserved by the browser or headset are never intercepted.

## Hand tracking

Hands are drawn from the WebXR joint poses, not inferred body motion. Point and pinch for in-world buttons. Away from panels, a left pinch anchors a virtual movement stick: shift that wrist horizontally to move, release to stop. Right pinch interacts by default. Select HAND MODE: FIRE to aim with the right-hand ray and hold pinch to fire, throw or bandage. Switching modes requires releasing the pinch. Field pages provide turn left/right, reload, weapons, tools, posture, traversal, dodge, melee, listening, sprint, journal, satchel and pause. Raise an open left palm facing you to pause and bring the panel back into view. A controller/hand source change pauses active play and requires released inputs.

## In-world interface and comfort

The spatial panel mirrors the actual native buttons, sliders, selectors, expandable notes and crafting holds rather than depending on a DOM overlay. READ TEXT pages expose journal text and help. The vitals panel is also a pause/recenter target. Page changes, new dialogs and mode changes rearm only after neutral input. Held crafting remains interruptible and vulnerable in the satchel; a tracking loss cancels it by pausing. Exit XR returns to the desktop interface and preserves the current shelter state.

Default movement is slower for comfort, with an in-world normal-speed option. Turning is snapped; head rotation remains tracked, with no artificial camera roll or walking bob. XR uses reduced rendering, a 0.75 framebuffer scale request and foveation request, without overwriting saved desktop graphics preferences. First-person body visibility and the third-person cinematic postprocess are suppressed only during XR. A renderer/rig handoff keeps the same XR session across chapter changes and retry.

## Evidence boundaries

The implementation requires automated source/input tests, real HTTP/WebGL journeys with an explicitly labeled mock XR device, and the existing desktop/save/controller regressions. A mock XR device is not a physical Quest 3, real hand-tracking reliability, Meta certification, headset comfort sign-off or measured headset frame rate. Physical Quest 3 controller and hand playthroughs, speaker/headphone listening, long-session thermal/frame-time review and target-device acceptance remain open. Do not mark those gates approved based on this implementation.

The historical xr-preview.mjs and its tests remain for prior-release provenance, but scene.mjs no longer installs the paused overlook. New runtime entry points are quest-xr.mjs, xr-input.mjs and xr-panel.mjs. All changes remain scoped to Rainward and its necessary workflows.

## References

WebXR Hand Input Module: https://www.w3.org/TR/webxr-hand-input-1/

WebXR Gamepads Module: https://www.w3.org/TR/webxr-gamepads-module-1/

Meta WebXR Hands: https://developers.meta.com/horizon/documentation/web/webxr-hands/
