# Grounded Reserve

Build: grounded-xr-20260914.1. Source baseline: master b87aeacb71d00b73992945daaba2fccdc66ab409, Dino tree d0f8c9cacdf6e30754bc8817fccb34e73078f3bc. This extends Pelagic Recovery; it does not replace the reserve or any prior activity.

## Motion and proportions

The original procedural residents now use scale-correct world-space foot contact, smooth lifted release steps, locked stance orientation, soft-reach two-bone IK, distance-driven gait and turn-in-place release. The ranger has a smaller head relative to stature, a more defined pelvis/torso, articulated thighs and shins, planted boots, arm swing, airborne release and bounded ground probes for steps. These are original procedural models, not imported artwork or scientifically validated dinosaur reconstructions. Existing animal scale calibration, collision bodies and all 64 residents are retained. Three previously calibrated reference adults remain unchanged.

The implementation is original. Design references: Daniel Holden, Inverse Kinematics and Foot Locking, https://theorangeduck.com/page/inverse-kinematics-foot-locking and https://theorangeduck.com/page/publications . No code or motion assets from those pages are bundled. Numerical tests do not substitute for human review of silhouettes, foot sliding and animation at ordinary viewing distances.

## Direct controls

Xbox A interacts, X reloads, Y boards/exits, RB cycles all tools, and the established triggers retain their mode-specific drive/fire behavior. By default D-pad left selects water and D-pad right selects the zapper immediately. D-pad up jumps and down sounds the horn. Menu > Direct D-pad tools switches back to the legacy left/right cycle. The preference uses only dino-atlas.grounded-controls.v1. Modal navigation retains A select, B back and D-pad/left-stick focus; held inputs must return to neutral after a modal transition.

## Quest / WebXR

Enter VR is available in the intro and pause menu when the browser reports immersive-vr support. Entry requires a user gesture; hand tracking is optional. The renderer uses one setAnimationLoop for both desktop and XR. XR renders the existing scene directly in stereo, bypassing the desktop-only bloom and pool scene/depth capture. Existing visual preferences are not rewritten. Rejected entry returns to desktop without replacing the game.

Tracked controls: left stick moves or steers; right stick snap-turns in 30-degree steps. Right A interacts; right B opens menus or goes back; left X reloads; left Y boards/exits. Right stick click cycles tools. On foot, right trigger fires and right grip jumps. In vehicles, right/left triggers accelerate/reverse or rise/descend; left grip aims, allowing right-trigger tool use without acceleration. Left stick click boosts. Point and trigger selects the in-world UI and consumes that press, preventing click-through firing.

Hand UI uses the browser's tracked target ray and selectstart/selectend pinch events rather than an uncalibrated custom pinch detector. Joint markers visualize available joint poses. Modal text and controls are mirrored into paginated in-world panels, including map display, options, range adjustment, checkboxes, back and page navigation. The field panel exposes core actions, turn buttons and hold-to-move/fire/vehicle controls. Hand fire aims along the view direction. Release, move off the held tile, lose tracking, hide the session or leave XR to clear held actions. Tracking removal pauses the game. Snap-turn compensation persists between frames, and UI placement resolves the headset pose through the rig-parented application camera.

API references: https://threejs.org/docs/pages/WebXRManager.html and https://www.w3.org/TR/webxr/ . WebXR support depends on the actual browser/device.

## Verification and limitations

The final local suite passed 136 Node tests, including all 124 prior tests and 12 new regression groups. These cover degenerate/unreachable IK, fixed segment lengths, scale-correct feet across 13 procedural body families and four scales, planted turning, ranger movement/airborne release, old-save isolation, tracked controller mode mapping, neutral/edge gating, snap-turn pivot persistence, parented head-pose transfer and reward-ledger round trips. The initial local-unit-receipt.json records the earlier 133-test candidate; the later CI unit-tests.tap is authoritative for its exact source commit. The local native browser is blocked by environment policy, so rendered tests run in GitHub Actions instead.

The browser test explicitly distinguishes native software-WebGL and synthetic Xbox gameplay from mocked XR lifecycle/ray/hand-select checks. Mocked XR checks are not evidence of stereo projection, headset pose quality, hand tracking accuracy, comfort, hardware performance or physical-controller certification. Public byte matching and legacy browser journeys have separate receipts in verification/grounded-xr/ and Actions artifacts after they actually run.

The legacy browser journey exposed a pre-existing economy sanitizer omission: it retained Storm Response and ranch reward IDs but discarded Living Herds and Pelagic Recovery IDs. The exact two missing IDs are now accepted by the same version-1 ledger. This preserves duplicate-reward protection without resetting balances, changing prices, removing cargo or granting replacement credits. It does not reconstruct ledger entries already discarded by an earlier build.

Still required: a physical Xbox-only regression playthrough; Quest 3 tracked-controller and hand UI sessions; stereo and per-eye shader inspection; room-scale collision/occlusion review; comfort and performance measurements; human animation/art review on every body size, steep steps and sharp turns. Smooth artificial locomotion is present; teleport locomotion is not added in this release. Maintain a clear physical play area and remain within the headset safety boundary. This is a technical work package, not completion of the AAA vertical-slice gate.

## Save compatibility and rollback

No prior save namespace is cleared or migrated. Journal, recorder, frontier, ranch, storm, herd study, optics, audio and pool mission state models remain unchanged. The existing economy schema and key remain unchanged; its valid reward-ID allowlist is extended as described above. Only the separate controls preference is new. Revert the complete Grounded Reserve merge to restore the previous runtime; the new preference key can remain inert. Do not reset the whole site's local storage.
