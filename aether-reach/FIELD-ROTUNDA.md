# Field Rotunda 0.15.0 owner playtest

This original public implementation follows the owner's September 20 in-scene UI request and third-person shooting feedback. It is not copied from, connected to, or a release of the private WebXR SaaS interface. No travel portals, hub navigation, external destinations, or engine migration are included. Walking-portal work remains Vesperfall-only.

## What changes

In immersive first-person VR, third-person VR/AR and the first-person AR window, the existing complete menu now rises from a compact floor rotunda. Touch Y or Xbox Menu opens it through the existing pause lifecycle. The scene and saved encounter do not reset. Merely looking down does not pause. The closed menu's button meshes are not raycast targets. A small floor summon label is available to tracked hand UI.

The rotunda is in physical local-floor coordinates under the existing XR rig, outside the world-window masking. It is not a child of the camera or the diorama and does not inherit headset roll. Its placement is captured on opening, not continuously moved with the head. Reopening recalls it near the current position. Field rotunda / UI placement is reachable from the start screen, pause and Settings. Working height, distance, rotation and panel size can be changed by controller focus or pointing/pinch and are saved separately from the expedition. Recall restores reachability; reset affects workspace preferences only. Reduced-motion preference suppresses the lift animation. Panel transforms use explicit settings; free grab/drag and two-hand scaling are not in this slice.

Compact health, shield, ammunition and the current objective default beside the left controller. Right-controller, floor-dock and hidden settings are available. Missing controller tracking falls back to the floor, not the head. These surfaces are drawn in the game's renderer. Desktop/touch retains its existing accessible HTML interface; this is not a wholesale replacement of that interface. The XR menus reuse the canonical focus/actions and render raised 3D button faces with a hit dot and press/highlight feedback.

Third-person window aiming defaults to a horizontal-friendly preset: small vertical stick drift is ignored and a deliberate horizontal sweep eases toward level aim. Large vertical input remains available. Hold the existing fine-aim trigger for unassisted full elevation, or disable Guided third-person aim. Original first-person VR and first-person AR-window aiming are not changed. Xbox bindings and remaps are preserved.

Red pellet/streak visuals now follow the real hitscan shot from its actual origin to the existing first collision. Amber impacts distinguish confirmed hits. The underlying collision, damage, recoil, ammunition and once-only reward rules do not change. These are brief visual echoes, not delayed extra damage projectiles. The existing rechargeable starter weapon and B reload remain the replenishment path; no ammo cheat or new practice progression is added.

## Preservation and acceptance

Version-1 saves, stable mission and reward IDs, legacy storage, controller remaps, first-person weapon alignment, Bellwether routes and mechanisms, the world-window geometry, asset licenses and sibling games are retained. The only simulation-model edit is the version constant. Workspace preferences use a new bounded `aether-reach.workspace.v1` record and do not write the expedition.

Run all Node and backup-input tests, the new rotunda ordinary-input journey, the retained combined window controls, portal/hand checks and GPU aperture fixtures. Gameplay tests must not assign player location, health, inventory, progression or saves to manufacture success. Source fixtures are labeled separately. Record exact-source native and separate public HTTPS receipts. See the current release receipt for actual outcomes, not this planned gate description.

Retained finding: the prior static rendering test explicitly required an opaque first-person HUD rectangle. That is intentionally superseded by the owner's no-head-panel request; its replacement requires transparent status and the new workspace adapter, while retaining no-shell-sheet and first-person combat assertions. The older portal test's box-docked status description is also superseded by explicit separate-workspace checks. Neither change removes the original obstruction/combat goals.

This is an owner playtest, not physical Quest or Xbox certification. Validate seated/standing reach, real controller/hand hit regions, head motion, simultaneous move/aim/fire/reload, visual shot clarity, comfort, sustained performance and saved placement after re-entry. A visible 3D menu is not proof that every gesture is comfortable. After usability feedback, continue arrival comprehension and rail decision visibility rather than expanding the map.
