# SVGN Little Planet — Copperleaf

An original playable 3D game in its own `little-planet/` folder. This follows Micah's **little-planet** reference: a miniature world with curved paths, forest, cottages, river crossings, a windmill, a market and a lighthouse. It does not replace the existing games or continue the rejected flat-city interpretation.

## A real spherical world

The character moves along a radius-32 sphere. Local up, direction, jumps, surface distances, scenery placement and cameras all follow that sphere. The main gold path circles the whole planet and meets itself. You can visit the far hemisphere and return home without a teleport, loading another map, or rotating a picture.

All geometry is procedural and original. No screenshot/video, generated concept image, commercial-game map, character, model, soundtrack or texture is included. The local Three.js modules are copied from the repository's pinned renderer with its MIT license.

## What is playable

Walk or unfold a courier bicycle; turn, brake/reverse and hop. Deliver four parcels to neighbors around the planet, then return to Mira at the post office. Discover eight neighborhoods, collect 44 trail stamps, and follow three optional trails to survey beacons. Trees, houses, rocks and mountains have bounded collision shapes. Water off the bridge slows movement. Buildings are exterior models, not enterable interiors.

W/S: forward/backward. A/D: turn. Shift: faster. Space: hop. F: walk/bicycle. E: talk, deliver or activate a nearby beacon. V: whole-world/adventure/close view. Drag: look around. M: atlas. P/Escape: pause. Touch buttons appear on touch-capable devices. Low-power graphics disables shadows without replacing the 3D world.

The two-hemisphere atlas pauses play and does not teleport. Save data is isolated under `svgn.little-planet.v1`; a reload starts you at home with completed progress preserved. Reset asks for confirmation and changes no other game's storage. There are no accounts, transactions, coupons, analytics, real device hacking or multiplayer services in this release.

## Architecture and checks

`model.mjs` is deterministic radial movement and gameplay. `scene.mjs` builds the actual WebGL2 geometry and camera; it does not alter game state. `app.mjs` integrates fixed-step controls, modals, local saves and context-loss handling. `LittlePlanet.inspect()` returns copied observations, not a mutation API.

Serve the repository with `python -m http.server 4173` and open `/little-planet/`. Run `node --test little-planet/tests/model.test.mjs` for pure movement, collision and save fixtures. The native Playwright test uses ordinary keyboard/UI actions to complete a full spherical journey and reload saved progress. It never assigns actor position, progression or the simulation clock. The read-only GitHub Actions job preserves its exact source and actual browser captures. The separate publication job hashes the deployed files against the merged source.

Finite unit fixtures are not native playthroughs. Software-rendered Chromium is not a physical-phone, controller or real-GPU performance certificate. Human enjoyment, close-camera comfort and all optional off-path approaches still need playtesting. This is a first exploration game, not GTA/Watch Dogs-scale content or a full reconstruction of a commercial reference.

## Long-term direction

- Refine the authored paths, biome silhouettes, riding animation, camera and collision readability from actual play.
- Add optional jobs, shops, interiors, broader vehicle handling and playful fictional city-device interactions on the spherical world.
- Add explicit world/quest authoring and versioned cloud saves before any account, commerce or multiplayer expansion.
- Preserve Paper Delivery and its Workshop/Ride Lab, Rainward, Aether Reach, Dino Atlas, Theology and the separate city prototype.

Technical references: https://threejs.org/docs/pages/Quaternion.html and https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/webglcontextlost_event .
