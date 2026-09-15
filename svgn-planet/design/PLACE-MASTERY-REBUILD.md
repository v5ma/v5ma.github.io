Neighborhood Missions: place-mastery replacement levels and spatial XR.

Direction recorded September 15, 2026. This is a design specification and an executable abstract contract, not a playable replacement level. No first-person XR, stereo diorama, AR passthrough, raised-floor traversal or replacement chapter is claimed as shipped. The live game remains Grounded Neighborhood v0.11.0.

The user's new direction takes priority over expanding prototype districts or doing presentation-only upgrades. PERF-03 remains important, but streaming and frame pacing now serve a compact authored replacement chapter. This change is not a mandate to delete saved progress or replace the other games in this shared repository.

Basis and boundaries.

The user requests first-person XR and third-person AR/VR in a diorama, with an open top, open front, or both open, never both closed. The supplied place-mastery text provides the design method: physical connections, conditional access, purposeful behavior and information must describe the same working place. Lantern Ward below is a new proposal applying that method to Neighborhood Missions; it is not an example already present in the supplied text.

Retain the supplied distinction between an encounter loop and a lasting world shortcut, between multiple entrances and genuinely different approaches, and between reaching an objective and understanding a place. Retain quiet spaces, recoverable failures, recurring opportunities, alternative-route completion and human first-visit/replay evaluation. Share these principles across games without imposing a single engine or genre. Sky Cycle remains outside the supplied cross-game plan unless separately directed.

The player promise.

The courier arrives as an outsider who can see a destination but cannot yet understand its connections. After one assignment, the courier knows how the neighborhood receives goods, moves people and handles water, and can use that knowledge to choose a better route. Progress changes the working neighborhood instead of merely incrementing a delivery counter.

One simulation, several views.

The intended presentations are the existing desktop third-person view, first-person VR at human scale, third-person diorama VR, and third-person diorama AR when the device grants an immersive-ar session. A world-anchored flat screen is a retained compatibility option, not a substitute for these new spatial modes. Native per-eye rendering must show actual level geometry and parallax. Do not duplicate the mission, create separate physics, or copy progression when switching views.

The simulation stays in game meters. A diorama transform scales and positions its visual representation only. Headset, controller and hand poses remain in their physical tracking frame; ray picking must transform consistently into the level frame. Mission interaction still checks the courier's location, reach and occlusion. Being tall enough to point at the workshop across the miniature cannot deliver its parcel remotely.

First-person VR uses an independently tracked head on a locomotion rig, not the orbit camera or a camera glued to the animated head bone. Foot IK, bicycle lean and hop animation must not forcibly bob, roll or pitch the headset. Use a calibrated standing or seated eye position, physical head tracking and separately controlled locomotion. Snap turning and optional smooth locomotion need actual comfort testing. A camera entering a wall must not reveal hidden interior content; design and test a comfortable boundary response rather than counter-moving the user's head. A mode change preserves position and objective flags, clears held actions, pauses briefly for a deliberate transition, and resumes only after input returns to neutral. It must not reset actors, reroll a puzzle or mint rewards.

Diorama VR places the miniature in a quiet virtual surroundings. Diorama AR leaves the physical environment visible through the supported session's environment blending. An unsupported or denied AR request offers an explicit VR or desktop choice; never silently call a VR scene AR. AR placement may use granted hit testing, but a manually placed adjustable stand must work when surface detection is unavailable. Do not require room scanning, depth sensing, persistent anchors or a real table as a baseline. Do not retain or upload room or hand data.

The first review target is a compact district represented at a comfortable tabletop scale, with seated and standing height, distance and size adjustments. Those dimensions are tuning targets, not hardware-certified values. Prefer a stationary miniature and clear district boundaries over continuously dragging the entire world beneath the observer. Reframe deliberately at a safe seam when necessary. Pause courier movement while moving, rotating or scaling the display. Keep the display's front defined in its own local frame so walls do not switch identity as the viewer walks around it.

The enclosure rule.

There are exactly three presets: top open with front closed; front open with top closed; and top plus front open. Default to both open. The outer side and back frame can remain for visual grounding. In first-person mode the display enclosure is absent; it is never part of the character's world collision.

Store one opening enum instead of two unconstrained booleans. Closing the final open surface automatically opens the other surface first and announces the resulting state. Animation must also respect the rule throughout its transition: open the replacement aperture before beginning to seal the old one. Invalid stored preferences fail to both open. The contract tests endpoint transitions; the eventual renderer must separately test transition frames.

Removing the outer lid does not by itself make roofs and interior floors readable. Author roofs, viewer-facing wall sections and upper-floor occluders as independent presentation groups. Expose the courier's active room or relevant floor with controlled cutaways. Preserve visible floor edges, stair connections, doorway frames and persistent landmarks. Never delete a wall's collider when hiding it for the observer, and never expose every secret or future objective simply because the shell is open.

Diorama observation can legitimately offer more spatial information than first-person view. Design for equivalent opportunities, not identical pixels. Public architecture, broad routes and visible operations may be surveyable from above. Private dialogue, tiny labels, concealed mechanisms and undiscovered interiors require appropriate courier access or discovery. Every clue essential in the diorama must also have a street-level sightline, sign, observation landing, conversation or readable mechanism in first person. No mandatory task may require changing view mode.

Low-friction control policy.

Retain the established Xbox gameplay actions: A hops, X interacts, Y mounts or docks, LB throws, RT accelerates, LT/B brakes, right stick looks, D-pad down opens jobs and View/D-pad up opens the map. Do not steal those buttons for display editing. Frequent actions remain direct in all presentations. The diorama gets dedicated frame handles for opening presets, placement and scale; those are available with a tracked ray or hand pinch and have a controller-navigable settings equivalent.

Retain the existing tracked-controller action meanings unless a measured conflict requires revision. A hand pinch on a UI element belongs to the UI, not to a simultaneous throw, hop or movement action. Direct hand controls must include reliable movement, turning, braking, interaction and Back without a floating menu covering the action. Keep neutral rearm, release hysteresis, tracking-loss pause and reconnect safety. The OS menu button remains owned by the platform. World manipulation is a distinct, explicit interaction; it cannot run concurrently with character control. Physical Xbox and Quest tests remain mandatory before calling the design comfortable or controller-complete.

Replacement chapter proposal: Lantern Ward, The Broken Delivery Loop.

The place normally works as a small delivery circuit. The depot feeds a covered market arcade, a print shop and an elevated loading route. The lantern workshop receives goods through a yard and loft. A public canal provides a second transport route. A pump gallery controls a maintenance channel and a delivery hoist. Stairs, piers, doors and loading spaces exist for those ordinary functions, not because an objective marker needs somewhere to stand.

After a storm, a jammed delivery hoist and a blue service door latched from the far side interrupt the usual circulation. The courier needs to get a workshop parcel through and reopen a useful delivery connection. There is no hidden real-time failure countdown. Completing the delivery and restoring either the blue-door connection or the hoist is sufficient; repairing every mechanism is not a mandatory replay chore. These story details are proposals, not assertions about existing NPC or machinery systems.

At the depot, the first view establishes a blue service door, the workshop bell tower beyond it, an overhead goods line, and water below the public steps. The player's own parcel and a legible address give an immediate goal. The apparently blocked direct relationship becomes the question the neighborhood will eventually answer. The opening uses a protected observation area rather than a modal tour of controls.

The street approach goes from the depot through the market arch and covered goods arcade to the receiving court. It is the simplest route for walking or cycling and offers conversations and obvious signs. A worker's cart temporarily occupies part of the arcade, but a passing bay and a walking bypass prevent a mandatory wait. A bell or conversation can create a cooperative opening. The tradeoff is traffic and less advance information, not combat in an otherwise safe neighborhood.

The rooftop approach enters the public print-shop stair hall, reaches drying terraces, crosses a roof walk and enters the workshop loading loft. It is on foot, with actual stairs and readable railings rather than a new grappling or climbing ability invented to excuse the layout. It reveals the hoist, canal and the depot roof from a useful angle. It demands more navigation and gives more information. A staircase reconnects the upper route to the arcade, allowing a player to revise a plan rather than remain trapped in a corridor choice. A missed hop has a lower landing and a return stair, not an unexplained death plane.

The canal approach uses a boat between public piers, then reaches the pump gallery and workshop court. It avoids the cart route and brings the player directly to useful infrastructure, but requires mounting, handling and docking a boat. With the channel drained, a maintenance walking route replaces that boat connection. Low water must actually change traversability; a different water shader alone does not satisfy the design. Street and roof routes remain usable in either water state. A docked or recovered boat must remain available for later travel.

The pump lever overlooks the affected channel. A moving waterline, marked gauge and exposed walkway explain its effect. It is reversible, and the mechanism refuses a transition that would strand the courier, a boat or another essential occupant. A pending transition has visible feedback and a safe cancel or completion path after interruption. The hoist has a local, legible repair rather than a remote button hidden across town. It reconnects the pump gallery and loading loft without being required for all solutions.

The spatial payoff is the blue door. When the courier opens it from the receiving court, they see the depot sign and parcel bench they encountered at the beginning. A journey that seemed to lead away from home folds back beside it. The opened connection is usable immediately and remains open after saving and loading. Later deliveries deliberately benefit from it. The gate's practical value and recognition are essential; a shortcut notification is not a substitute.

Three purposeful roles are enough for the first graybox: a postal dispatcher moving between the desk and loading bay; a market porter moving a cart between the arcade and yard; and a workshop caretaker moving between the receiving floor and loading loft. Each has readable recurring behavior and a clear response to the courier's established interaction. A character outside their normal location must still recognize the delivery outcome. Routines create options and clues; essential progress cannot depend on a single unseen appointment.

Pacing follows arrival and observation, an initial commitment, a route-changing discovery, a purposeful intervention, the return revelation and a quiet payoff. Not every meter needs a collectible or decision. Preserve a sheltered landing, a canal-side pause and an ordinary courtyard so the player can consolidate the mental map. The objective should be less interesting as a checklist than as a place understood.

The four synchronized descriptions.

The physical description is the connection graph, elevation, landings, stairs, pier transfers and circulation widths. The conditional description is the water state, blue-door latch, hoist availability and traversal modes. The behavioral description is the dispatcher's, porter's and caretaker's normal duties, reactions and recurring opportunities. The information description specifies exactly what can be seen or learned at arrival, on each approach, at the lever and on return. Keep all four near the level source and update them together.

The adjacent chapter-contract.mjs describes an abstract 12-place, 17-connection proposal, with street, roof, canal and drained-channel itineraries. It proves no metric layout, collision clearance, slope, jump, visibility, actor navigation or runtime integration. Its provisional route costs are not measurements. The model represents water occupancy as an input guard; integrating it requires actual physical occupancy checks and interruption-safe traversal state.

Build order and replacement policy.

First implement the graybox with the live game's action semantics and movement constraints, a stable local spatial frame, walkable raised floors, stairs, collision, recovery landings and real boat docking. The current spherical-surface movement and flat XR theater cannot be treated as if they already supply these features. Do not add rooftop-looking boxes before the courier can really walk on them. The player rig, collider and foot-contact ground query must agree on the same floor and surface normal.

Next connect the parcel outcome, either circulation repair, actor routines, reversible water and permanent return shortcut. Then render that same playable state in first-person stereo VR and the AR/VR diorama, with real tracked input and cutaway groups. Test controls and visibility during grayboxing, not after decoration. Performance work includes active-cell budgets and per-eye rendering costs here; do not scale or clone the entire existing planet into the headset as a substitute for designing a chapter.

Run first-visit and replay reviews before production art and before promoting the chapter to the default opening. A small review build is a production gate for the replacement, not the final ambition and not another permanent disconnected test island. If the opening succeeds, replace the rest of the prototype campaign chapter by chapter using the same method and distinct local identities. The next chapter should reinterpret a learned relationship rather than merely be larger.

Archive the existing prototype world and its layout identifiers before promotion. Preserve original v1 saves and recovery/export behavior. Do not reuse an old mission ID for a different task or reinterpret an old planet coordinate as a new room position. A legacy profile can continue in its matching archived edition or explicitly enter the new chapter at a safe checkpoint. New chapter state needs its own layout identity, independent return checkpoint and a tested reward handoff. Never mint old credits again or silently discard old objectives. The integration design must account for the current serializer dropping unknown fields, older cached clients and the existing absence of multi-tab conflict resolution. An abstract JSON round trip is not that migration test.

Acceptance gates.

A first-time player can state a plausible objective, identify at least one alternative approach, explain what a mechanism changed and find the way back without continuous coaching. On return, they recognize the depot from the new side. A returning player can deliberately take another approach and use learned connections to avoid unnecessary repetition. These are observational gates, not an automatic declaration that every player must follow a particular route.

The real controller must complete every approach. Every reachable water, gate and hoist state must preserve a safe exit and a valid completion route. Coming from an unexpected legitimate direction must satisfy the outcome. Saves at doors, piers, mode transitions and interrupted mechanisms must resume safely with exactly-once rewards. The graph tests are a supporting check, not a substitute for these physical traversals.

Desktop third-person, first-person VR, diorama VR and supported diorama AR must complete the same chapter without requiring another presentation. Test all three diorama openings, mode switches during a mission, left/right handed pointing, simultaneous pinch and button input, tracking loss, session denial, disconnect, re-entry and recovery. Validate scene geometry per eye, not just session creation. Include seated and standing physical Quest 3 sessions, Xbox USB/Bluetooth, wall/head safety, hand UI reach, readability and measured frame times.

Source and verification notes.

The design method derives from the user-supplied Pasted markdown(20260915-181134).md, especially its place-mastery framing, four descriptions, functional-place design, route tradeoffs, recoverable state changes and graybox/human acceptance requirements. The diorama aperture constraint and the decision to replace prototype levels come directly from the user's September 15 message. Proposed chapter fiction, node names, route costs and architecture are newly authored here.

The checked repository baseline is master f4185c09d9345e47b76a06172c1b171fd3863b2b and its v0.11.0 runtime 83965798b63974232e82b7678e5bdd2fb8ea34a2. Relevant implementation files are model.mjs, world.mjs, coastal-motion.mjs, grounded-motion.mjs, xr-theater.mjs, tidewater-core.mjs, save-vault.mjs and DEVELOPMENT-HANDOFF.md.

The W3C WebXR Device API documents session capability queries, user-activated requests, tracking spaces and per-eye views: https://www.w3.org/TR/webxr/ . The W3C AR module distinguishes environment blending for AR: https://www.w3.org/TR/webxr-ar-module-1/ . These API definitions do not certify any particular Quest browser build.

Three.js WebXRManager documents the tracked camera and controller paths: https://threejs.org/docs/pages/WebXRManager.html . Material documents clipping controls: https://threejs.org/docs/pages/Material.html . Check the already-vendored r177 implementation before integration; current documentation is not proof of version-specific behavior or hardware performance.
