# Rainward v0.14.1 / Wayfinder

This polish pass improves the existing Open Diorama release. It adds no campaign slot, new required objective, geometry barrier or save migration. First-person VR, VR Diorama, AR Diorama, desktop keyboard/touch and both Xbox presets remain.

## Clinic route readability

Ten low painted chevrons follow the actual terrace approaches and clinic descent. They use the same height function as the collision floor, occupy one additional mesh, and are not an animated HUD route or automatic guidance choice. The original yard shutter sign changes to YARD RETURN OPEN when the real optional latch is completed. Its label, route-map crossing and journal status all derive from the existing completed task.

The map traces the existing navigation paths around obstacles rather than drawing straight lines through them. It distinguishes dotted garden routes, solid terrace approaches and the inside-unlocked yard return. A closed crossing is marked with an X rather than suggesting a route already open. The expandable CLINIC / TERRACE / RETURN ROUTE journal entry explains the elevation and the save-at-shelter rule. Its native summary is reachable with Xbox controls and through the XR spatial menu; READ TEXT exposes the explanation inside XR. No enemy positions are disclosed. The underlying routes, enemy statistics, objectives, supplies and detection remain unchanged.

This follows the owner's guidance to reinforce routes with architecture and more than one cue, without treating extra rooms or constant HUD popups as improvement. The remaining Floodgate and six other chapter redesigns still require graybox iteration and unfamiliar-player review.

## Spatial controls and held actions

Both tracked rays now have an endpoint cursor at the spatial panel, and the targeted row has a visible outline. Unavailable native controls retain their positions and are labeled UNAVAILABLE; they cannot be activated. Crafting displays its actual recipe percentage, a progress bar and RELEASE TO CANCEL guidance.

A spatial crafting hold belongs to the source that initiated it. Releasing or losing that hand/controller ends the hold even when another trigger remains pressed. Native A-button crafting is no longer sustained by unrelated trigger input. Mode changes, tracking loss and exit clear pointer ownership. Deliberate sustained crafting still consumes one recipe, and the game remains unpaused and vulnerable during the satchel action. No timing, inventory or refund rule is relaxed.

## Acceptance boundaries

Model checks cover input ownership, progress bounds, real floor height, route annotations and unchanged checkpoint output. New browser checks use the actual HTTP game and WebGL with explicit simulated XR device data. Their authored-kit, enemy-defeated shelter fixture isolates held actions; it is not living-enemy mission evidence. The existing first-person, AR/VR, living Natatorium, water, Xbox, save, sound and campaign regression remains required. The enhanced clinic journey retains its separately labeled geometry/save fixture.

Physical Quest 3/Xbox tests, real passthrough appearance, hand reliability, subjective comfort, device frame rate, final art/audio and unfamiliar-player pacing are not approved by automated checks. Local browser navigation was blocked by administrator policy; native browser acceptance runs on GitHub Actions. Publication is established only by the subsequent release PR and per-file public hash receipt, not this document alone.

## Technical reference

W3C WebXR Hand Input Module Level 1 and WebXR Gamepads Module Level 1 were consulted for source identity and the distinction between articulated hands and xr-standard gamepads. No platform system button is captured. References: https://www.w3.org/TR/webxr-hand-input-1/ and https://www.w3.org/TR/webxr-gamepads-module-1/ .
