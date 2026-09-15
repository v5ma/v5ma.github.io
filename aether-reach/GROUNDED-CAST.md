# Grounded Cast, version 0.11.0

This continues roadmap P02/F03 with a bounded animation refinement (F04) and adds explicit hand UI (X08). P02 is not complete: photorealistic character production, authored first-person hands and complete reload/weapon animation remain open. P01 player approval and physical I03/X04/X05 acceptance remain open.

## Character movement and sizing

The existing locally licensed CC0 cast is retained, rather than replaced with unrelated assets. Uniform render heights are 1.76 m for the courier, 1.84 m for guards, 1.88 m for officers and 2.02 m for the exceptional breacher. Limb ratios are preserved. These are deliberately selected game scales, not anthropometric measurements of particular people. The meshes remain stylized.

Walking/running clip cadence follows observed actor displacement with bounded interpolation. Existing action crossfades remain, and non-locomotion actions use their original playback rate. A render-only analytic two-bone solver keeps the knee bent and preserves segment lengths. The actual shipped foot controls are siblings of the leg chain, so their world position is resolved explicitly rather than assuming a conventional ankle child. Source bone transforms are restored before the next mixer sample; IK never accumulates into the animation.

Low foot contacts acquire world-space locks, with separate release thresholds and short blended correction. Each foot samples the same authored deck/bridge ground query as the simulation. Unsupported edges, excessive correction, airborne characters, death, abrupt turns, teleports, disabled characters and pool reuse cannot retain stale contacts. Large steps and complex moving platforms are not a solved locomotion system. There is no learned motion matching, synthesized mocap or new character collision model.

The existing cast limits remain 12 Balanced, 6 Light and 4 immersive. No additional rendering pass, character asset download, save schema, combat hitbox or mission state is introduced by the grounding code.

## Direct controller and spatial interaction

Existing Xbox defaults and user remaps are retained: A traversal, X contextual use/reload, Y carried weapon, LT aim, RT fire, LB power, RB quick power recall, left-stick rail brake/reverse, Menu pause. Existing hold gestures remain optional secondary actions, not new menu gates. Fixed A/B/D-pad menu navigation still works after remapping.

XR requests optional hand-tracking and reads XRHand joint poses plus the source's tracked target ray. Both hands have visible joint markers and rays. Open the hand once, point, and pinch to select. Each menu has visible paging, value adjustment, Back and Exit VR controls; nested dialogs use the same focus and confirmation model as Xbox. A pinch is immediate after its threshold, without a dwell timer.

Hands select UI only. Hand-exposed gamepad data cannot fire, move or cast. Switching to hands when no controller poses remain opens pause. The HUD contains a pinch-selectable Pause Menu control. Controllers remain necessary for expedition movement/combat. Missing poses, input-source changes, suspension and reference resets clear stale input. Optional feature denial leaves controller/desktop fallback available. Physical Quest 3 support is not certified by synthetic device tests.

## Reproducible checks

Run `node --test aether-reach/tests/*.test.mjs` and `python aether-reach/tests/backup_test.py` from repository root. Run `python aether-reach/tools/render-production-plan.py` and require no planning diff. The release runtime manifest includes all new modules.

With an HTTP server on port 4173 and Playwright Chromium installed, run `python aether-reach/tests/grounded-browser.py`, `DEVICE_SUITE=xr python aether-reach/tests/devices.py`, the controller journey, Bellwether district journey and Skyglass render review. Device APIs are explicitly emulated; real application actions and WebGL rendering are used. Read-only snapshots are diagnostics, not writable game hooks.

The isolated Aether grounded motion workflow preserves reports, captures, the exact tested revision and runtime hashes. The publication workflow must then show all live hashes matching the merged source. A version label alone does not establish publication. The archive workflow must separately create and clean-restore a source backup; earlier tags must not be overwritten.

## References and scope

Daniel Holden, Inverse Kinematics and Foot Locking: https://theorangeduck.com/page/inverse-kinematics-foot-locking . The implementation here is original, using analytic reach constraints and contact locking, not a copy of the article's code or its full motion-matching pipeline.

Publication index: https://theorangeduck.com/page/publications . More extensive learned/motion-matching work is future research, not an implemented feature in this release.

W3C WebXR Hand Input Module: https://www.w3.org/TR/webxr-hand-input-1/ . Its joint-pose, feature negotiation and hand source distinctions inform the input boundary.
