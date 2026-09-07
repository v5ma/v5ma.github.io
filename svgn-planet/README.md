# SVGN.io Paper Delivery — 3D Neighborhood

The existing browser application at `/svgn-planet/`, corrected after the user reported an early exit, an unreadably small character, unwanted Little Planet branding and a mismatch with their visual references. The URL stays stable; this is not a new game folder.

## Play

The default view follows a full-size courier through a residential street, not the center of the globe. Choose an electric unicycle or bicycle, walk the sidewalks, throw the news toward raised mailbox flags, complete eight deliveries, and return to the depot. Completing a round leaves free exploration running; there is no time limit or automatic navigation away.

WASD/arrows move, Q throws a paper within range, E delivers or interacts nearby, F mounts/dismounts, Space hops, Shift boosts, V changes the camera, M opens the route map, and P/Escape pauses. Drag to orbit the camera. Phones have a joystick and action buttons. Vehicle selection is also available in the pause menu.

## Reliability changes

Phone automatic graphics disable shadow maps, cap the drawing-buffer pixel budget and render at 30 fps. The title and paused screen do not keep redrawing unnecessarily. Shared static geometry is instanced. A graphics interruption displays an in-game recovery message. The graphics recovery extension is retained before loss, and application recovery runs after Three.js has rebuilt its renderer state.

Progress writes use `svgn.paper-delivery-3d.v1`. Compatible legacy progress can be read from `svgn.little-planet.v1`; that old key is never written or cleared. Invalid completed-save flags are rejected. Blocked storage does not stop a new session. The pause menu asks before resetting this route.

## Visual direction and limits

The neighborhood contains porch houses, windows and shutters, picket fences, sidewalks, street trees, mailbox flags, hills, a procedural daylight sky, a garden, two walking neighbors and visual traffic. These are original procedural meshes, not reference screenshots embedded as gameplay. The curved surface remains the world topology; the overview is optional.

This remains a stylized first route, not the rendering quality or scope of the supplied commercial references. Cars currently provide scenery rather than a collision/damage system. Buildings have no interiors. There is no multiplayer, paid account system or world editor in this particular 3D application. The separately hosted side-scroller and its workshop are unchanged.

## Verification

`npm test` runs model, geometry and presentation tests. The read-only GitHub Actions workflow also plays the real HTTP application in Chromium through ordinary keyboard/touch controls and injects a WebGL context interruption to exercise recovery. Its desktop route completes all deliveries and returns to the depot; its touch scenario lasts at least sixty seconds.

The exact two-second exit reported on the user's device has not yet been independently reproduced. Software-rendered Chromium and emulated touch do not certify physical iPhone/Safari performance or diagnose an operating-system tab termination. Test failures remain visible in Actions history; only final passing runs may be described as verified. The public-release workflow compares deployed bytes against the merged source.

Three.js is bundled locally with its MIT license in `vendor/LICENSE`.
