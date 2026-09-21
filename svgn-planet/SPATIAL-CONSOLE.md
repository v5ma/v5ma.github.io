# Neighborhood Missions spatial console

The current native interface uses an on-demand floor rotunda or free-hand controller mount. The menu is not parented to the headset. Its position is established when opened or explicitly recentered, not continuously changed by head tilt. Height, distance, size, reduced animation and compact-card options remain independent presentation preferences.

During normal XR play the large menu and its raised button meshes are hidden. Raise the free controller for the objective/map card, or choose the floor card and look down. The card can also be disabled without disabling menus. Use the off-hand upper face button, deliberate raised pinch, or point-and-select on the floor disc to open the console. Single-hand input falls back to a floor mount instead of requiring one hand to point at its own moving menu.

Maps, mission tracking, settings, save recovery and Exit XR retain native button targets. Xbox/keyboard focus follows the visible six-row page; pointed Next/Previous remains intentional. Jobs and Choose a mission reach the existing mission list directly. Ordinary Pause defaults to Resume; destructive confirmations default to keeping progress. Mission buttons show their saved next step without advancing it.

## Reconciled riding controls

Spatial UI now offers Primary hand (existing mapping), Left trigger speed / right trigger brake, and Right trigger speed / left trigger brake. These choices apply to the Action profile only while riding. Existing saved settings keep their primary-hand mapping; choose a physical side explicitly to change it. Physical left/right choice is independent of dominant hand. The compact HUD reports the chosen mapping. Release speed to stop; off-hand grip braking remains available. Disabling trigger driving retains movement-stick-click driving.

On-foot aiming/interactions, the Courier profile and Xbox bindings remain unchanged. Presentation settings use svgn.neighborhood-spatial-console.v1. No game save or old Field Desk namespace is erased or rewritten by reading preferences. Invalid/future data is retained and changes are described as session-only when storage cannot be used.

The older Field Desk branch is not installed as a second renderer. Its useful trigger choice has been adapted into this console. No private SaaS hub, cross-site portals or A-Frame migration is included. Floor placement is estimated when optional local-floor tracking is absent; this is not room scanning or furniture detection.

## Evidence

The integration audit and external release receipt separate model tests, synthetic rendered journeys and public-file verification. Current model/input tests pass; actual physical Quest reach, readability, hand tracking, comfort and sustained frame rate still need owner testing. The browser journey retains real mission/menu/exit checks and additionally exercises left/right riding controls before restoring the default profile. A passed model is not proof of those rendered or physical outcomes.
