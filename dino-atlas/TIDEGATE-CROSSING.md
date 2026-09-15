# Tidegate Crossing / place-mastery replacement candidate

Build: tidegate-20260915.1. The September 15, 2026 user direction replaces prototype-first level production with place mastery and adds first-person VR, third-person VR diorama and third-person AR diorama. This is the first authored district candidate for that replacement, not a claim that every old level is rebuilt or that human quality gates have passed. Enter at tidegate.html. The original index.html remains the Classic Reserve compatibility route, preserving all earlier activities and saves.

## A working place, then a disruption

The ranger learns how a herd moves between a bridge apron, forage and shelter, then uses that understanding to reopen a crossing safely. The place normally connects a familiar ranger outpost to a two-floor pump house through a supply bridge. The bridge gearbox is offline and animals occupy its east apron. The orange crane marks home; the amber station mast marks the destination. The first view reveals the broken relationship, not a list of unrelated icons.

The physical description is one finite district: two riverbanks, the high observation route, the always-open north bridge, lower-harbor landings, a reversible maintenance crossing, a pump-house floor and gallery, external ramps and roof, the shelter/feeder and the broken supply bridge. Routes loop back into useful locations rather than ending in separate anonymous corridors. Actual Rapier bodies and the existing RangerPerson controller govern clearance and ramps.

The conditional description distinguishes travel modes. Walking and a jeep need an open crossing; the boat uses the lower harbor and can bypass the long approach without repairing machinery remotely. The helicopter remains available and can land, but the gearbox and bridge controls require the ranger on foot within reach. Draining the lock exposes a maintenance crossing without closing the lower harbor. Reflooding is rejected while the ranger occupies the crossing; draining or lowering a bridge is rejected when the boat is in the affected part of the channel. No route is an invisible mandatory objective trigger. Permanent repair survives save/resume.

The behavioral description uses four purposeful fictional grazer actors, not a whole-population simulation. They move along an explicit outside lane between forage, apron and shelter, avoiding the pump-house footprint. Their normal cycle provides recurring clearance opportunities. The feeder offers sustained redirection; the existing non-injurious water/zapper tools and horn can alert them toward refuge. They settle again. The bridge checks their real positions rather than equating 'pressed feeder' with 'animals clear.' These behaviors are authored gameplay abstractions, not validated animal ecology.

The information description combines silhouettes, elevation, signs, material paths, visible machinery and a map. The overlook places the player above the route before committing. The sluice wheel and affected water are visible together. The pump-house machinery has a service aisle, a front entry, an upper gallery and a roof approach. Returning over the repaired supply bridge reveals the same orange crane beside the original report point. The payoff is 'I know how this connects,' not merely a completion counter.

## Meaningful approaches and deliberate limits

The high route is longer but offers observation and early shelter control. The harbor route is faster and bypasses the herd's ground corridor, but lands at a less informative approach and requires leaving the boat for hands-on work. The service route uses infrastructure knowledge, including the reversible lock, and joins the machinery aisle. The roof is reachable by physical ramps and aircraft, not a decorative inaccessible platform. Local circulation and the lasting bridge shortcut have different jobs.

This candidate reuses the existing gamepad input, ranger locomotion, tool/ammunition model, procedural actors, stance animation and audio engine. Its additional scene is compact and authored. It does not yet replace all districts, provide production character art, integrate its report with the Classic Reserve economy, save every parked vehicle pose, implement route streaming or establish human enjoyment. Its one-time report is district completion rather than a new credit grant. On resuming the district, vehicles begin at their parking bays while the safe foot checkpoint and permanent mechanisms persist.

## XR presentation contract

First-person VR uses the ordinary life-size game world. Third-person VR and AR instead show the actual 3D scene at miniature scale with binocular depth when run in a real immersive session. They are not a flat-screen theater. AR explicitly requests immersive-ar with a transparent background; VR explicitly requests immersive-vr. Unsupported or rejected AR never silently substitutes VR. Device support must be detected at runtime. Hand tracking remains optional.

The miniature is manually placed in front of the viewer in the current session; it is not advertised as a detected real tabletop, persistent spatial anchor, physical-surface collision or room scan. Its default width is 2.4 meters, adjustable from 1.2 to 3.2. The viewer remains independent of the ranger and can look around the model. Snap turns rotate the display rather than dragging the viewer with the character. Recenter is explicit. First-person and diorama VR can switch inside a VR session without resetting the level. Changing between VR and passthrough AR requires a new user-initiated session.

Exactly three valid enclosure presets exist: top and front open; top open with front closed; front open with top closed. There is no both-closed state in UI or preference sanitization. The base, sides, rear, front and roof are real meshes, and the scene is clipped to the display volume. The pump-house roof can hide visually while the ranger is inside in diorama mode; this does not remove its collision. Opening the display is a visibility choice, not permission to fire or interact through game-world walls.

Simulation positions, physics, speed, tool range and saved coordinates remain in original game units. Only the render pass applies the miniature transform, restored in finally. A tabletop tool pointer picks an aim point; a shot still originates at the ranger, consumes the same ammunition and obeys the actual world's collision and range. No remote repairs, god-hand teleports or bypassing gates are introduced. One renderer.setAnimationLoop drives desktop and XR.

Xbox A interacts, X reloads, Y boards/exits, left/right D-pad select water/zapper and RB cycles. Menu navigation is controller-complete. Tracked XR and hand rays use the same action handlers and in-world menus, with release/neutral/tracking-loss gates. The hand panel remains next to the miniature, not on top of the playable space. Controls for a real headset and screen-space readability still require physical-device testing.

## Save and replacement policy

Classic Reserve gameplay keys are untouched. Tidegate uses dino-atlas.tidegate.v1 and layout identity tidegate-crossing-v1. Diorama preferences use dino-atlas.presentation.v1. No site-storage reset or silent location migration occurs. The old reserve remains available while this replacement candidate earns acceptance. Replacing the entry experience should not erase an existing expedition or strand a player in incompatible new geometry.

Future district replacement must retain a stable authored layout identity, portable inventory/achievements where compatible, explicit entry/return points, one-time rewards, known-safe spawn validation and a recoverable old save. Do not silently load coordinates from one layout into another. Do not edit any sibling game or Sky Cycle for this Dino task.

## Evidence and remaining gates

The unit suite covers aperture invariants, scale/ray/clip transforms, save isolation, alternative outcome ordering, bridge persistence, herd routes, reversible lock safety and actual Rapier high-route/interior/shortcut traversal. Model tests are not evidence of rendered quality. The native browser tour uses real movement and collision with synthetic Xbox input; its XR segment explicitly mocks sessions, controller pose matrices and hand selection, not headset eye projections or physical passthrough. Record results only after the corresponding run succeeds.

Human acceptance is still required: unfamiliar players identify a plan, recognize another approach, explain the herd/sluice change and recognize the return connection without coaching. Returning players should exploit their knowledge rather than repeat compulsory exposition. Record confusion, unintentional dominant routes, stuck points, aiming/framing issues and replay friction. Physical Xbox, Quest 3 Touch Plus, hand tracking, stereo/AR compositing, comfort, readability and device performance remain open. No passing script or screenshot substitutes for these gates.

The next level is not authorized by a room count or a green test alone. Iterate Tidegate's relationships and staging from actual evidence before expanding the replacement campaign. Use design/PLACE-MASTERY-SOURCE.md as the user-supplied conceptual basis; do not silently replace its terms with an unrelated methodology.

## Sources

The user's supplied 'Pasted markdown(20260915-181129).md' is retained verbatim in design/PLACE-MASTERY-SOURCE.md. The user supplied the three presentation modes and enclosure invariant directly. The concrete geometry, finite rules and implementation above are development work derived from that direction, not claims that the source essay describes an already existing level.

Meta WebXR mixed reality: https://developers.meta.com/horizon/documentation/web/webxr-mixed-reality/ . Three.js WebXRManager: https://threejs.org/docs/pages/WebXRManager.html . W3C WebXR Device API: https://www.w3.org/TR/webxr/ . These document API behavior, not physical qualification of this game.
