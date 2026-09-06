# Aether Reach — The Silent Network

An original first-person sky-city mechanics prototype for SVGN Interactive. This separate project does not replace Paper Delivery, Dino Atlas or the Theology Wiki. Public prototype story and art are placeholders, not private narrative material.

## Play and plan

Serve the repository root using `python -m http.server 4173` and open `/aether-reach/`, or use the public project homepage. Runtime dependencies are pinned locally. There is no package-install step, account, API key, CDN or paid service. WebGL2 is required; renderer failure produces an honest message.

Version 0.2.0 adds standard-mapped Xbox-style controls, an **experimental WebXR preview targeting Quest 3**, and a [development Kanban](./roadmap.html). The committed canonical plan is [roadmap.json](./roadmap.json): 26 tasks, 38 dependency links, acceptance criteria, evidence and separate physical-device gates. A six-sheet Excel snapshot accompanies the release handoff. Local board edits/export do not change GitHub or gameplay saves.

See [DEVICE-SUPPORT.md](./DEVICE-SUPPORT.md) for controller and headset bindings. Xbox: left stick moves, right stick looks, A jumps, Y interacts, X reloads, RT fires, LB pulses, RB reverses, View maps and Menu pauses. Menus use D-pad or left stick plus A/B. Press a controller button while the browser is focused. Unknown non-standard mappings are not guessed.

On a capable HTTPS headset browser, Enter VR (preview) requests an immersive local-floor session. It uses tracked head/controllers, left-stick movement, snap turning, an independent weapon ray and spatial status/menu panels. Physical Xbox, Quest 3 tracking, frame time and comfort have NOT been tested here. Climbing, gliding, hand tracking, full embodied reload and multiplayer are not yet implemented.

Keyboard/touch remain: WASD moves; mouse/arrow keys look; E interacts, Space jumps or releases, C reverses rails, Shift sprints/boosts, F/click fires, R reloads, Q pulses, M maps, Esc/P pauses. Pointer-lock failure leaves drag-look and keyboard look available. Checkpoints and settings stay local and versioned; denied storage is tolerated.

Restore three relays and return to Arrival Quay to broadcast. Five districts connect through five walkable bridges and five bidirectional freight lines. There are three simple patrol drones and four optional archives. You may finish on foot, ride the rails, and explore after completion. Momentum release is continuous, not a scene-loading teleport. Decorative foliage/furniture are not fully physical.

## Development and verification

`model.mjs` owns movement, collisions, combat and saves. `scene.mjs` renders authoritative world definitions. `app.mjs` owns browser UI and the fixed-step loop. `input-core.mjs` normalizes device state; `controllers.mjs` maps actions and menus; `xr-session.mjs` owns tracked space and lifecycle.

Run `node --test aether-reach/tests/*.test.mjs`. Native HTTP tests are `tests/browser.py` and `tests/launch.py`. `tests/devices.py` runs the real WebGL app with **emulated Gamepad/WebXR APIs only**; it does not assign actor position or objective state. That is integration evidence, not physical hardware certification. No test-only device implementation is imported by runtime modules.

The final source workflows are read-only and produce runtime hashes. Publication checks compare the explicit public file list to the merged bytes. See [PUBLIC_BUILD.md](./PUBLIC_BUILD.md), [ENGINE-ROADMAP.md](./ENGINE-ROADMAP.md) and [ROADMAP.md](./ROADMAP.md).

Primary references: https://threejs.org/manual/en/webxr-basics.html ; https://developer.mozilla.org/en-US/docs/Web/API/XRInputSource/gamepad ; https://developer.mozilla.org/en-US/docs/Web/API/Gamepad/mapping . Existing Three.js r177 remains pinned; see `vendor/LICENSE`.
