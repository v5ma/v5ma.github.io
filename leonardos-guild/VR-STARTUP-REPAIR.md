Leo's Guild VR startup repair / September 21, 2026 (Pacific)

User report: entering VR froze. This is a release-blocking physical playtest report, not refuted by older synthetic XR passes. The exact played build and first-person versus diorama selection are not yet established. Scope is the existing full Vinci game and its current dedicated compositor verifier, with direct master writes and no new branch, PR, renderer, engine or workflow.

Reproduced source defects

The production app.mjs graphics-loss handler displayed #failure but registered no webglcontextrestored handler. Gamepad/XR menu routing treats #failure as the active interface. An isolated execution of the actual pre-fix handler left that blocking screen active after restoration. The failure trace is preserved in tests/vr-startup-before.txt. This is an actual source-handler reproduction with synthetic events, not a claim to reproduce the user's physical headset.

The original XR startup timer was installed only after requestReferenceSpace, renderer.xr.setSession and spatial.begin completed. A stalled floor-reference or renderer promise therefore had no deadline. Tests using the actual createGuildXR adapter reproduce both missing deadlines before the fix and verify session end, a usable launcher, named errors and rejection of late initialization afterward. Permission prompts are not timed out: the deadline starts only after the browser grants a session. Each initialization stage has a 12-second deadline and the first completed tracked frame cancels it. A callback from an earlier entry cannot overwrite a newer entry's status.

Implemented correction

xr-startup-recovery.mjs clears only the error screen owned by a graphics interruption once graphics and the scene have recovered. It preserves unrelated fatal errors, releases held input, resets elapsed time, and never automatically advances the player or resets progress. The app skips simulation and rendering while its graphics context is lost. An already playing adventure stays paused until the normal Resume action; XR startup retains its existing first-tracked-frame start/resume behavior.

The adapter now arms the startup guard before each asynchronous initialization stage. A stalled initialization requests the actual session end, explains the stage, and allows an explicit retry after end. It does not pretend that a failed browser end request succeeded, silently substitute AR/VR, or repeatedly request permission. Session/entry identity checks protect late continuations. Read-only LeonardoGuild.inspect() exposes graphics interruption/restoration counts and startup phase/deadline state; no room coordinates or diagnostic data are uploaded.

Verification

All 427 local source/model/input/scene-graph tests and all 14 design contracts pass after reconciling the actual current root runtime and all existing Node tests by SHA-256. Fifteen new tests cover graphics lifecycle, startup deadlines, stale timer ownership, real adapter initialization and application integration. The three pre-fix failures are retained. Syntax checks pass. Local ordinary HTTP browser navigation is blocked by ERR_BLOCKED_BY_ADMINISTRATOR and is not counted as browser acceptance.

The existing compositor workflow now tests ordinary committed source independently of public deployment. Earlier master run 35565268232 stopped at a stale/missing-public-file gate and never exercised VR. Baseline diagnostic run 35691064156 has separate attachment and full-Vinci journeys; its results must be read, not assumed. Existing browser recovery tests that demand #quarter-dialog must explicitly select district=quarter rather than mistake full Vinci's correct notebook for a freeze.

The added xr-startup-browser.py exercises full Vinci in first-person VR and diorama VR, explicit retry after a delayed reference-space request, real WEBGL_lose_context loss/restoration during makeXRCompatible, ordinary tracked-stick movement, actual nonblank stereo attachments, session end and re-entry. Hardware poses/timing are simulated; the GL context and textures are real. The W3C WebXR specification permits graphics-context loss/restoration during XR compatibility switching: https://www.w3.org/TR/webxr/ . This validates the test scenario, not the user's exact cause.

Build guild-vr-startup-20260921 retains version 0.14.0, full Vinci, optional Quarter history, version-2 saves, original controls, missions, equipment, audio preferences and sibling games. No accepted graphics quality or world content is removed to hide the freeze. Separate public-byte verification and native screenshots are required before calling this release publicly verified. Physical Quest entry, comfort, sustained frame time, controller/hand ergonomics and the reported freeze remain open until retested. A hard browser/GPU hang that prevents JavaScript timers from running cannot be certified as recovered by these guards.
