# Spatial Workspace v0.26

User-requested AR/VR and menu continuity slice. Baseline is master dd4a9d2a35ea667fd33f3ed2b597aeda15cb27e5, whose runtime matches the accepted v0.24 tree. The separate Canal Choice v0.25 branch c946e556d1a4d970e4e406d09b7a1f547ae0e8a7 remains unmerged and must not be discarded. Its immediate short-pinch pause dispatch is retained here; its chapter geometry is not overwritten or claimed as shipped. Version 0.26 reserves a distinct release identity rather than reusing the unfinished 0.25 identifier.

## Player experience

The same rider, route, physics, objectives and saved documents remain active in ordinary play, stereo VR and room-composited AR. During riding, controls stay below the principal view. Opening a menu pauses safely, exposes readable paged controls, and returns to the parent instead of unexpectedly resuming. AR clips the continuous 3D game around a following seated exhibit; it is not a new bounded level. Head orientation remains independent.

## Implementation

Native WebXR extends the pinned Three r177 renderer rather than nesting a second A-Frame renderer and application lifecycle. The existing scene and node materials are re-used in 3D. Explicit immersive-ar and immersive-vr requests use optional hand tracking and local-floor support. AR clears alpha outside the exhibit and uses the browser's composition; no camera images, room scan, hit-test or persistent anchors are requested. Manual recenter, scale, height, distance and rotation are available. Physical passthrough and anchoring accuracy remain hardware checks.

Supported 2D and Workshop views are live floating canvases. The Workshop ray dispatches ordinary pointer gestures; tracking loss cancels unfinished capture. The actual menu elements own every action: buttons, select/range/number adjustments, checkbox/radio states, expandable sections, text fields and reading pages. A headset keyboard commits through input/change events. Unknown disconnected or disabled controls cannot be activated from stale entries. Native synchronous confirmation/prompt guards are cancelled before changes and replayed only after explicit approval of the same question on the same control. Browser-owned file pickers, external links and reloads use a deliberate exit-and-continue handoff, not a pretend in-headset OS dialog.

Xbox input remains available beside tracked controllers; saves and remaps stay in their original owners. No new movement buttons or simulation updates are added. The ordinary input loop yields to XR, and exit restores scene, renderer and editor ownership. This does not certify advanced freehand Bezier ergonomics, all possible imported drafts, account/network actions, real Xbox hardware or physical Quest comfort.

## Acceptance and mapping

Maps to canonical AAA-ROADMAP Milestone F (input/editor/accessibility) and G (rendering/resilience), with the shared library's embodiment and same-game-truth requirements. The new browser journey must exercise both selected session types, actual stereo rendering, AR alpha outside the clipped exhibit, tracked riding, hand pinch pause, sound select and checkbox, live 2D riding, text edits, cancelled document replacement, undo, editor drag and lost tracking, playtest/return, exit and denied entry. Prior chapter and save regressions remain required. Pure/model assertions, native software and physical testing are separate classes. Use verification/spatial-workspace-0.26.json for exact acceptance and publication evidence.

## Remaining work

Complete Canal Choice independently after reconciling its branch with this shared input/UI implementation. Keep the speed/brake and whip chapter goals intact. Native file dialogs remain a browser handoff; physical Quest 3 passthrough, controllers, hands, lighting, readability, comfort and long sessions require actual device observations. Do not call this first-person cycling, swimming, full-body tracking or physical-device approval.

## Primary implementation references

A-Frame official documentation: https://aframe.io/docs/ . WebXR Device API: https://www.w3.org/TR/webxr/ . WebXR Hand Input: https://www.w3.org/TR/webxr-hand-input-1/ . Pinned local Three r177 source is authoritative for renderer integration. No external scene, game code or assets are copied into this release.
