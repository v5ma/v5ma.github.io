# SVGN Little Planet

An actual 3D little-planet game in its own `svgn-planet/` folder. This is not an image, flat-city reskin, or change to Paper Delivery. The terrain is a complete sphere, the player's gravity points radially inward, and movement parallel-transports the local frame around it. The camera shows the miniature world from above, follows the player's hemisphere, and supports closer views and manual orbit.

The first expedition has a forest village, cabins, post office, turquoise river, wooden bridge, turning waterwheel, observatory, mountains, vegetable garden, moving neighbors, orbiting clouds, a far-side outpost and 16 collectible postmarks. Walk or switch to the electric unicycle. Deliver to three real mailboxes and return to the post office. Continue exploring after completion. Every object is newly authored geometry; no screenshot or franchise assets are used as a playable scene.

## Controls
WASD or arrows move relative to the camera. E interacts at a mailbox. F toggles foot/unicycle. Space hops outward from the sphere; Shift boosts. V cycles planet/close/wide framing. Drag or Q/R orbits the camera. M opens the atlas; clicking it marks a waypoint, never teleports. P/Escape pauses. Touch joystick and action controls are available on touch devices.

Serve over HTTP (`npm start` in this folder, or serve the repository and open `/svgn-planet/`). No API key or build step. The pinned Three.js renderer is copied from the existing project, including its MIT license. This isolated vanilla-module implementation follows the other static game folders instead of adding a React build pipeline. No new external dependencies or remote runtime requests.

Progress is local, isolated under `svgn.little-planet.v1`. Completed deliveries and postmarks resume; the player's position resets to the safe starting point on reload. No accounts, payments, coupons, cloud saves, combat or multiplayer are implemented here. The river is deliberately traversable at lower speed, including beneath the decorative bridge; complex hydrodynamics and bridge collision are not simulated. The three parcel locations are gameplay objectives, not automatically granted proximity counters. All other game folders remain unchanged.

`npm test` exercises pure model fixtures, including full-sphere motion, radial jumping, delivery checks, save validation and boost limits. `tests/browser.py` uses native HTTP/WebGL and ordinary input to complete the mission and travel to the far hemisphere. Its observer returns copies only; it cannot assign game state. Model samples and browser checks are distinct from a human review of visual fidelity and enjoyment. Physical-device performance is not certified by software-rendered Chromium.

Technical references: https://threejs.org/docs/pages/Quaternion.html and https://threejs.org/docs/pages/WebGLRenderer.html . The user-provided visual references guide the compact spherical-world composition; they are not distributed.

Next: more meaningful side quests and navigation, additional tiny worlds, richer vehicle handling, authored interiors, better character animation, and optional spherical level editing. These are plans, not shipped features.
