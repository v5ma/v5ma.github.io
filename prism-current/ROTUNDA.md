# Prism Rotunda 0.11.0

This update follows the owner's Prism playtest and request for in-canvas spatial furniture. Only Prism Current and its verification files are in scope. The private hub interface, other games and portals are not part of this release.

The ordinary entry uses a scene-rendered pedestal with direct Duck Armada and Mothership AR, VR and screen choices. Unsupported immersive modes are labeled rather than silently substituted. The old semantic HTML controls remain available through F2 or Controls / Accessible text controls. This is an accessibility and recovery alternative, not the default overlay.

During combat the large panel is stowed. B/Y pauses and summons it; B/Y resumes. The pedestal anchors once near the current position and does not follow subsequent head movement. Placement controls raise/lower, bring closer/move farther, rotate and resize the panel. Reset panel and a paused thumbstick click recover defaults. These are button-based placement controls, not freeform hand-grabbing of panel corners. Only interface furniture moves, never the gameplay camera or stage.

Controller rays select the displayed panel's actual UV rectangles. The raised backing, painted label, hover feedback and picking surface share the same transform. Thumbstick navigation, A/X confirmation, native select events and hand-pinch menus remain. Grips remain shields during battle; the redesign does not claim hand-only combat.

Score, hull and combo use a compact controller-mounted display in XR, with a selectable floor-mounted alternative. Screen play uses a low scene-mounted display. Score increases and hull losses appear there as brief deltas. Existing boss health stays on the boss. The large HUD above the stage is no longer the default. Human readability and wrist alignment still require physical Quest testing.

Sound and water controls stay inside the menu. Music and effects are separate; changing them or the layout does not restart a paused encounter. AR water opacity is saved independently and changes the water material's actual alpha. The existing water flow and shader remain; this is not a new ocean simulation or physical refraction system.

The hardcoded 1.15 m lateral / 0.70 m forward positional pause is removed. Ordinary physical sidestepping and leaning no longer trigger that application restriction. Head/controller tracking loss and XR visibility changes still pause. The headset's physical safety boundary is not disabled, replaced or simulated by this change.

Ending XR now leaves the current battle paused on the browser page. Re-enter the same AR/VR mode and explicitly resume to continue it. The game does not silently convert an AR run into a desktop score category. A different chapter or explicit restart remains a new run. In-memory continuation is not a persistent mid-battle save across browser closure.

The new preferences use prism-current.rotunda.v1, separate from existing records. Core combat, hit rules, boss health, chapter music, authored waves, old score keys, classic rhythm, lessons, Practice Lab and Floodgate Recovery remain. Color-switching blades, base points for either-color cuts, revised missile interactions and visible blast-radius rules requested elsewhere in the brief are still open; they are not included in this UI publication.

Verification uses labeled pure tests and native browser input. The main suite clicks the rendered controls, transforms their panels, plays both full chapters, adjusts music while paused, checks strict native-shaped AR/VR sources, moves the simulated user beyond the former positional limits, and verifies paused exit/re-entry and preference persistence. It never assigns gameplay health, score, actor position or clocks to manufacture success. Separate full-resolution images are visual evidence, not a device frame-rate measurement.

PR #205 records exact candidate, merge, test and public-byte results, including failures. Source success and a merge are not publication receipts. Physical Quest/Xbox/touch, sustained ordinary-resolution performance, owner enjoyment and unfamiliar-player readability remain open. Rollback is a scoped revert on current master, not a repository reset or save deletion.
