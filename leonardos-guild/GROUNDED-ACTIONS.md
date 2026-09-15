# Grounded Actions - v0.13.0

Build: guild-grounded-20260914. This is an upgrade of the existing Leonardo's Guild, not a replacement or a separate XR game. The existing homepage entry and /leonardos-guild/ address remain.

## Owner feedback and scope

The owner asked to put frequent interactions on readily available buttons, minimize menu friction, improve character proportions/motion using the supplied IK references, and support Xbox plus Quest 3 controller/hand UI. This slice addresses the feedback portion of NEXT01 and input hardening within NEXT02; it advances C01/C02 and F03. It does not close the broad production gates, claim owner playtest approval, or substitute for NEXT03's later second-basin content.

## Direct controls

On the Console Xbox profile, tap LB to swap to the previous tool. From a fresh session this alternates staff and sling. A selection made in the wheel updates that history. Hold LB for 220 ms to open the existing equipment wheel, including its variants; releasing commits the choice. Cancel, menu transitions and disconnects do not produce an accidental tap. A remains jump/nearby authorized stair, X remains interaction/reload while aiming, Y remains mount/dismount or a field dressing in the badlands, LT/RT remain aim/use, and View/Menu remain map/pause. Classic, keyboard and touch controls are retained. No automatic tool swap, extra sound cue or save migration was added.

## Character motion

Original shared-mesh characters now have a smaller head, longer forearms and adjusted leg proportions without rescaling the actor, collision geometry or world. Their displacement-driven gait feeds an original analytic two-bone leg solver. Stance feet retain world-space anchors while the body moves. Reach limits, stable knee poles, real floor samples, jump/ride/crouch release, floor-transition resets and a short smoothed swing release prevent overstretch and abrupt contact changes. A paused render restores the same joint solution. Contacts and tool history are transient; no serialized IK state is introduced.

This is procedural animation, not motion capture or finished production retargeting. Soles retain level world orientation and a locked yaw; terrain-normal sole tilt, toe/heel articulation and broader animation/art review remain open. The revision is not a promise of photorealistic characters.

## Quest / WebXR mode

Select Enter seated XR from the title or pause screen in a compatible secure WebXR browser. The mode is an immersive, head-tracked seated theatre: the existing third-person game is drawn once to a reused 1024 by 576 GPU texture and displayed in front of the user. The surrounding panel, pointers and hands are rendered in stereo. It is not first-person room-scale movement or a stereo rendering of the entire game world. Moving the headset does not move the saved player or advance the character's walking phase.

Tracked controllers use the left stick for movement, the right stick for game-camera turning, left trigger for aim/brake and right trigger for the equipped tool. Right A jumps, right B interacts, left X swaps tools, left Y opens Dispatch, left grip opens the equipment wheel and right grip dodges. Point a controller ray and press its trigger to operate the panel. Existing Xbox input remains available in XR when no XR gameplay input is active.

Hand tracking is requested as an optional feature. Point with the hand ray and pinch thumb/index to select. The lower toolbar has held movement, turning, aim, tool-use and operation controls; release the pinch to stop. The side panel exposes the existing interactions, maps, equipment, pause/settings and safe Exit XR action. Menus and long descriptions are paged rather than silently truncated; text entry uses the existing controller keyboard. The map panel draws the actual map canvas. Menus invoke existing DOM handlers/reducers rather than parallel quest, shop or inventory logic.

A trigger or pinch must be released after connection/tracking loss before it can act. UI selection cannot leak into shooting, and complete input-tracking loss pauses the game. Denied or unsupported XR leaves the ordinary game available. No external loader, account, remote asset, second renderer, per-frame canvas capture or GPU readback is used. The one game render target and a maximum of four input-source slots are reused across sessions.

## Saves, audio and validation

The main key remains svgn.leonardos-guild.v1, outer version 2. Existing sessionState/attachFrontier, region, cistern, household, reward and vehicle state remain. Audio/controller preference keys and the one-music-stream policy are unchanged. Town safety, both earlier regions, all houses and water missions are retained.

Run npm --prefix leonardos-guild test. Serve the repository root on port 4173 for browser journeys. New tests are grounded-browser.py and xr-browser.py. The latter emulates only WebXR hardware/session input; the ordinary committed app, local Three.js, WebGL shaders, raycasting, UI handlers and movement reducer run normally. Original steady, water, frontier, campaign, house, story, audio, service, cycling and touch suites remain release gates. The water test reads the current release version rather than hardcoding the historical 0.12.0 identifier.

Local model checks are not proof of browser operation. CI archives exact source hashes, ordinary-source snapshots, reports and actual renderer screenshots. The release PR and independent publication workflow establish deployment status and exact served bytes; an unmerged branch is not a published game.

Physical Quest 3 controllers/hands, hardware Xbox USB/Bluetooth, subjective comfort, listening and target-device frame times have not been tested by this environment. Software XR emulation is not hardware certification. Keep those acceptance tasks open.

## Maintenance

quick-actions.mjs owns only the tap/hold recognizer and transient last-tool history. foot-ik.mjs owns cosmetic contacts/IK, character-rig/motion own shared geometry and displacement poses. guild-xr.mjs owns optional sessions and the single-renderer theatre; xr-input.mjs owns input normalization/latches; xr-panel.mjs bridges existing menus. The main renderer uses one setAnimationLoop; never add a second requestAnimationFrame simulation loop. Restore the XR framebuffer after the mono game pass, and restore ordinary camera sizing on exit.

scripts/prepare-grounded.py and grounded-edits.json are a one-time hash-checked source integration recipe, not a runtime or test-time rewriter. Do not rerun it over later edits. After integration maintain the ordinary committed modules directly. Keep sibling games and concurrent master changes.

## Reference basis

Daniel Holden, Inverse Kinematics and Foot Locking, July 30, 2026: https://theorangeduck.com/page/inverse-kinematics-foot-locking . His publications index is https://theorangeduck.com/page/publications . These informed the algorithmic direction; no article text, character art or motion dataset was imported.

The WebXR Device API and Hand Input specification define optional hand tracking, joint poses and XR sessions: https://www.w3.org/TR/webxr/ and https://www.w3.org/TR/webxr-hand-input-1/ . The pinned local Three.js WebXRManager implements the rendering boundary: https://threejs.org/docs/pages/WebXRManager.html .
