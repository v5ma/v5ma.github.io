# SVGN City — First Dispatch

A separate, original third-person city game for SVGN. This project does **not** replace Paper Delivery, Route Workshop, Aether Reach, Rainward, Dino Atlas, or the Theology Wiki. It is a playable foundation, not a completed GTA/Watch Dogs-scale game.

## Reference and first chapter

The user's supplied 57-second video shows a following camera behind a bicycle on a leafy downhill paper route: porches, fences, parked/moving vehicles, pedestrians, throws, and obstacles. This implementation starts with that street-level experience rather than reusing the sky-rail layouts. All modeled buildings, vehicles, people, foliage, sky textures, branding, and missions here are newly authored procedural assets. The uploaded video, commercial-game characters, music, source code, and maps are not distributed.

The city has 45 homes, three parallel streets and three cross-street connections, a sloping residential terrace, civic garden/garage, and harbor newsroom. The horizon is background scenery; it is not an extra playable downtown. The first chapter links paper delivery, a fictional city-device interaction, and a car journey. The player may also roam, dismount, revisit streets, and deliver additional papers.

## Play

Serve the repository root, then open `/svgn-city/`. For a standalone copy of this folder, run `npm start` (uses Python 3's static server; no npm install or API key is required) and open the printed localhost address.

- W/S: accelerate, brake, reverse. A/D: steer. Shift: harder pedaling or sprint.
- Q/C: throw left/right, with nearby-mailbox aim assistance and actual projectile collisions.
- Space: bicycle hop/on-foot jump; car handbrake.
- F or E: dismount, or enter your nearby bicycle/press hatchback. Stop first.
- X: reveal fictional nearby city devices. Hold H while stopped near a scanned device to interact.
- M: map. P/Escape: pause. Drag the game view for a temporary look-around.
- The pause menu provides explicit recovery and a confirmed reset of this game's own progress.

A low-power graphics link on the title/pause screen disables shadows without changing the world or physics. The link restarts at the kiosk and retains completed progress.

Sound is opt-in synthesized ambience/effects, not a copied commercial soundtrack. Touch buttons appear on touch-capable devices. Keyboard/mouse is the initial primary target; physical mobile hardware and controllers require separate testing.

## Architecture

`model.mjs` holds deterministic movement, swept paper contact, bounded collision substeps, traffic/pedestrian agents, mission state, local save validation and fictional device logic. `art.mjs` authors the geometry and textures. `scene.mjs` owns the actual WebGL2 rendering and camera. `app.mjs` bridges normal controls, modals, storage and the fixed-step simulation. `SVGNCity.inspect()` is a read-only test observer returning copied state, not an autopilot or mutation API.

The retained Three.js files are copied exactly from the repository's pinned, MIT-licensed renderer, with LICENSE kept. No internet fetch is required during play. There is no account service, analytics, real hacking, payment flow, multiplayer backend or service worker in this prototype. Saves use only `svgn.city.first-dispatch.v1`.

## Tests and release

`npm test` runs renderer-independent fixtures. `python tests/browser.py` exercises the served repository through normal keys/UI in Chromium after installing Playwright. The high-quality renderer receives a visual smoke check; the longer software-rendered playthrough uses the user-accessible low-power graphics setting without changing the simulation clock. Its scenario completes paper deliveries, scans/links the relay, dismounts, enters the car, drives through the open gate to the newsroom, reloads the saved progress, and checks pause/recovery. Model fixtures and native browser evidence are separate. A failed run is not a passing release; see the Actions artifacts.

The homepage cover is an actual native gameplay capture from this implementation, not a concept image or frame copied from the user's reference video. The CI workflow reads committed source; it does not rewrite application files. The publication workflow compares owned public runtime files to that source.

Technical references used for implementation: Three.js WebGLRenderer documentation and color-management manual; MDN 3D collision detection. No similarity to an inspiration's commercial scale, asset quality or full feature set is claimed.
