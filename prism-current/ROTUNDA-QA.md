# Rotunda source and publication evidence

PR #205 records exact candidate, merge and public verification. Physical Quest/Xbox/touch approval and sustained ordinary-resolution performance are separate from all automated results.

First native run 35551508922 passed all 237 model tests, scene-menu placement/reset, actual screen launch, a paused music adjustment without state loss, and a complete Duck Armada battle. It then sampled the next button's projected position while the pedestal was still opening after completion. The click did not select the intended chapter, and the run timed out rather than claiming completion. Artifact 10618283244 (SHA-256 f764e9d393b45caf0d77759c370923f9b51892ea8ded7424b41ffbb81d9fcdbc) preserves the trace and screenshot. No uncaught script or shader error was recorded.

The input producer now waits for the actual menu-opening animation to finish before projecting a target, and explicitly confirms the chapter change. It does not assign game phase or UI position. Additional checks exercise native-shaped XR sources, hand pinch, controller navigation, room movement, actual AR opacity, preserved exit/re-entry and both complete chapters.

Source review also moves the desktop aim marker into the renderer, avoids repainting hidden menus during combat and retains the last horizontal furniture orientation when the viewer looks straight up or down. These are UI-only changes; combat core, health, scoring, boss rules and the soundtrack are unchanged.

The temporary hash transports are restricted to this named branch and exact Prism files. They must be absent from the release tree. Final verification is read-only and separately tests committed source and public GitHub Pages bytes. A workflow description or model pass is not a public-release receipt.
