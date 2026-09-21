# Prism Current / River Prism Rotunda 0.11.0

The ordinary index.html entry now presents a scene-rendered pedestal with direct AR, VR and screen-play choices for Duck Armada and Mothership Channel. Read ROTUNDA.md for this release's controls, placement, movement, HUD, sound, opacity and paused-XR recovery behavior. The previous README and dependency/history notes are preserved at README-v0101.md.

B/Y pauses or resumes in XR. The rotunda rises when summoned and stows during battle. Point and trigger, hand pinch, or thumbstick/A-X selects its controls. Placement can be adjusted without moving the camera; a paused XR thumbstick click resets it. Score, hull and combo appear on a compact controller display or an optional floor display, not a head-mounted dashboard. The game no longer pauses merely for moving outside the former small positional rectangle; genuine tracking and visibility interruptions still pause.

In screen play, use the rendered buttons, keyboard navigation or an Xbox-style controller. P or Menu pauses. F2 and Controls / Accessible text controls retain semantic HTML controls as an alternative. Combat bindings and the existing soundtrack are unchanged. AR opacity and layout preferences have an isolated saved namespace.

Exit XR ends the actual session and leaves the current battle paused in memory. Re-enter the same AR/VR mode and explicitly resume to continue it. This does not promise persistence of an unfinished encounter after closing the browser.

The retained rhythm.html entry still provides the previous tracks, lessons and Practice Lab. Floodgate Recovery remains at water-mission/index.html. Existing score formats and completed progress are preserved. No other game, private hub implementation or portal system is included.

The active board is AAA_CHECKLIST.md. QA.md, ROTUNDA-QA.md and PR #205 distinguish exact-source tests, public-file verification and physical-device acceptance. User feedback remains authoritative even where emulated tests passed. This is a focused UI playtest release, not a claim that the whole attached brief, color-bonus scoring, new hazard rules, new music or every AAA gate has been implemented.
