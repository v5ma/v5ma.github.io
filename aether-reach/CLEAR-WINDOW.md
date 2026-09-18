# Clear Window 0.14.1: physical playtest response

The owner reported that released 0.14.0 AR diorama was unplayable: a head-correlated translucent sheet still obstructed play, and moving, aiming, firing and reloading were not a workable combination. Earlier synthetic passes did not establish physical usability. X10 must not be described as physically approved.

## Diagnosis and bounded repair

The old view still rendered six faint shell membranes with depth testing disabled. Decorative clouds were large camera-facing sprites. Neither is gameplay geometry; window modes now render a thin frame without filled faces and suppress only explicitly marked cloud backdrops. The gameplay status ribbon has a fully transparent background. Explicit menus remain pause-only and room-anchored. Custom ShaderMaterial draw hooks explicitly refresh per-eye uniforms. These are concrete source corrections; exact physical attribution of the owner's sheet remains unverified without a headset reproduction.

Diorama right-stick input previously provided only horizontal orbit. The avatar's aim was then overwritten by a tracked pointer intersection, and firing required that pointer to hit the aperture and an in-range target. This made empty-space shots impossible and combined aiming unclear. Window combat now uses both right-stick axes and the ordinary avatar-origin firing ray. A controller's pointing pose operates menus only. Left-stick movement, right-stick aim, trigger fire and dedicated reload can coexist.

## Controls

In third-person AR/VR windows and the first-person AR window, the left stick moves and the right stick aims. Right trigger fires; left trigger gives fine aim. B reloads directly, even near an interactable. Right grip uses the nearby interaction, A traverses/jumps, X swaps carried weapons, left grip casts the selected power, left-stick click sprints and right-stick click crouches/folds. Y pauses. The pause menu retains map, settings, equipment and other less frequent commands. Both hands still operate spatial menus; they do not provide hand-only combat or locomotion.

Xbox keeps its existing bindings and saved remaps: left/right sticks move/aim, RT fires, LT aims, X uses/reloads, A traverses, Y swaps and Menu pauses. Original first-person VR retains its existing tracked-weapon controls. No remap or expedition storage is cleared.

## First-person AR replacement

The existing first-person-ar presentation ID now selects First-person diorama AR / passthrough window. Its initial physical eye maps to the normal player eye rather than the old giant miniature viewpoint. The center of the fixed window maps to the stick-controlled aim. Head parallax/roll changes the view but never moves or aims the avatar. Near first-person geometry remains visible inside the aperture; the room outside stays transparent. The display footprint, height, scale preference and legal top/front cutaway settings persist. There is no room scanning, physical obstacle detection, flat video panel, second simulation or level rewrite.

## Evidence and limits

Run all Node tests, six backup-input tests, portal-render-browser.py, portal-browser.py and window-browser.py. The new real-application journey supplies six-button synthetic Touch devices and combines movement, both aim axes, both triggers and reload before testing pitch/roll/lean and genuine hand-operated Exit. It does not assign actor state, health, inventory, mission progress or saved data. Rendering fixtures explicitly test first-person near geometry as well as third-person full depth.

The local environment has no network DNS and Chromium navigation is administratively blocked; local model tests are not browser passes. Use completed native runner reports and then the separate public HTTPS run. Retain failures. Physical Quest stereo/passthrough, simultaneous-control usability, absence of the reported sheet, comfort/readability/performance and physical Xbox pairing remain unverified until player/device testing.

Version-1 saves, mission IDs, rewards, collision rules, Bellwether progress, original VR and sibling games are protected. Rollback uses a forward Aether-only commit, never a reset of master or player storage. The next design target remains arrival/rail visibility after these physical usability blockers are resolved.
