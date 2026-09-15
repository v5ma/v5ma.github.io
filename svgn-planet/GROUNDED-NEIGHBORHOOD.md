# Grounded Neighborhood / v0.11.0

This upgrade advances M0 SAVE-02 and the requested controller, character and Quest paths. It does not certify AAA art, physical Xbox latency, Quest comfort or real-device performance.

## Direct actions

Xbox retains A hop, X interact, Y mount/dock, LB throw, RT accelerate and LT/B brake. Jobs remain on D-pad down; the map remains on View and D-pad up. Sticks, triggers and buttons must return to neutral after a menu closes or a different controller takes over. There is no new gameplay menu for routine actions.

## Save recovery

The primary key and v1 schema remain `svgn.paper-delivery-3d.v1`. Its `.backup`, `.pending` and `.unreadable` siblings belong only to this game. The original `svgn.little-planet.v1` is read but never deleted or changed. Existing delivery/mission IDs, credits, Homecoming and Tidewater fields continue through the original serializer.

Each transaction validates data, verifies a backup of the current valid primary, verifies a staged write, and then verifies the primary write. A valid primary wins over an uncommitted staging record on reload. When the primary is corrupt, a valid staging record or backup can recover it. Unreadable primary data is quarantined before replacement. A newer schema or an unreadable-only save blocks automatic writes until an explicit recovery decision. Quota and security failures are visible and preserve prior data. This is recoverable localStorage, not cloud sync or an atomic multi-tab database; simultaneous editing in two tabs is not supported.

Menu / Save recovery and export offers Save now, current-progress export, original-data export, backup restore, and validated text import. Replacement requires a separate confirmation with Keep current progress focused by default. B cancels without replacement. Export uses browser downloads; text entry and operating-system dialogs are outside the in-game controller/XR UI. Backups are rolling recovery copies, not an unlimited version history. Keep an exported copy before resetting a route.

## Courier and contacts

The original procedural courier now has an approximately 1.82 m body and 0.24 m head, articulated knees and elbows, smaller shoes/hands, clothing and backpack straps. Independent analytic two-link IK places feet and hands. Ground contacts retain world-space targets; stride phase follows traveled distance, with no idle leg cycling. Ride, air, boat and teleport changes release stale locks. Reach softening limits full extension and short transitions reduce pose changes. Bicycle feet target visible pedals and hands target the handlebar. Physics, cruise speed and rewards are unchanged.

This is still a procedural hero, not a skinned production character or motion-captured animation. The pooled background residents are unchanged. Foot contacts use the existing planet/road ground surface, not arbitrary stair, roof or interior collision raycasts. Human approval of gait, intersections, clothing and all poses remains open. Target-space invariants do not certify every rendered contact.

## Quest XR comfort theater

Use Enter Quest XR comfort theater on the title screen or in Menu, from a WebXR browser over HTTPS. The flat game is displayed on a world-anchored screen; this is not a stereo game world, room-scale walking or mixed-reality passthrough. Native headset tracking moves the viewer independently of the game's globe camera. The theater uses a fixed 1280x720 game render target and two bounded tracking pools with up to 25 joints each. Low graphics is selected during XR and the previous setting is restored on exit.

Tracked controllers provide pointing rays and grip poses. Left stick moves, right stick looks, left trigger accelerates, left grip brakes, right trigger interacts, right grip throws, right A hops and right B mounts/docks. Left X opens Menu and left Y opens jobs. Pointing at a UI control gives it priority over gameplay.

Tracked hands use thumb-tip/index-tip distance with separate pinch and release thresholds. Menus are rendered as native 3D panels, not DOM overlays. Buttons, checkboxes, ranges and select choices are reachable; long menus have previous/next pages and Back. The signal-repair timing indicator is drawn live. Hand-only play has hold-to-move, hold-to-brake and camera-look buttons plus direct actions. Releasing a hand movement control applies braking. Missing poses, input-source changes, headset visibility changes and session end clear held input and pause. Text import must be prepared through browser text entry. Postcard image capture is omitted inside XR; the photo activity and reward still work.

Physical Quest 3/Touch Plus/hand tracking and a named desktop/Xbox USB/Bluetooth matrix require real-device sign-off. Synthetic WebXR checks test code paths, not headset usability, tracking accuracy, frame rate or motion sickness. A browser can deny entry or not support hand tracking; desktop play remains available.

## References and authorship

Daniel Holden, Inverse Kinematics and Foot Locking (2026-07-30): https://theorangeduck.com/page/inverse-kinematics-foot-locking . This release independently implements an analytic solver and contact lifecycle inspired by the technique; no code, animation or models were copied from that article.

Daniel Holden, Publications: https://theorangeduck.com/page/publications . Motion matching and authored animation are future research directions, not implemented claims in this release.

W3C, WebXR Hand Input Module Level 1: https://www.w3.org/TR/webxr-hand-input-1/ . Joint poses are read only while an XR session is active and are neither stored nor transmitted.

Three.js WebXRManager: https://threejs.org/docs/pages/WebXRManager.html . Runtime uses the already-vendored r177 engine. Synthetic acceptance exercises the native session and render-target path; no new runtime CDN dependency is introduced.
