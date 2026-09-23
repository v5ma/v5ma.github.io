# Field Ready / Neighborhood Missions 0.18.1

This is a playable control and continuation update on the existing main entry, not another world replacement. Currentworks water, optics, trees, cloudlets, Toon archive props, all old missions and the upper archive remain unchanged.

## What changes

The main Map button now opens the Lantern Ward mission map while that district owns play. Controls opens its own mission/tools menu. The camera button becomes Recenter camera there, and dragging the scene turns the ward camera and movement direction instead of manipulating the parked original-city camera. Returning to the city retains its original handlers. Xbox View/M still open the same map; keyboard C/right-stick click recenters. XR controller and hand routing remains with the existing native implementation.

The adventure launch button shows the next saved task before entry. A new player starts Highline, a returning player continues it, and a player who completed Highline can launch or continue The Unsent Call directly. When both arcs are complete, the button offers exploration. It does not reset stages, grant equipment/rewards or teleport to an objective. The original Start riding option remains. Initial district-launch buttons are disabled until the existing city assets are ready, preventing a play session that never actually started. Explicit case selection now saves before returning control.

The normal-play objective uses the same actual supported entrance/elevation cue as the XR objective card, rather than merely saying to open the map. Control hints distinguish keyboard, touch, on-foot Xbox action and vehicle controls. The save line reflects the district's real save result. Ward-only layout rules separate the objective from the control line and give the minimap a stable column. The touch action is called Interact rather than incorrectly labeling every action Deliver.

Escape or P during initial scenery preparation now cancels the pending trip, rather than resuming the city and letting the pending operation silently switch districts later. A cancelled asynchronous failure cannot reopen a failure menu. Unknown saves/preferences remain retained. No city, ward, resident, Watch or campaign ledger is reset.

## Evidence and continuity

The baseline runtime remains 5656f520321d5b92120bf463976f2281aa8f49d3; initial current-master review was 8174b7e793e87e45264fe3565b030ef03a17b169. The comparison showed no intervening Neighborhood runtime changes, only the prior evidence receipts. The previous public Currentworks/Highline job 107012351340 in run 35806168381 is now successful. That does not make the whole old matrix green: market, legacy-grounded and standalone-portal suites failed and others were cancelled.

This update passes 477 local tests, with 102 frozen legacy hashes unchanged. Fifteen new contracts cover launch previews, saved stages, actual selection with unchanged coordinates/rewards, active-district event routing, pointer ownership, cancellation, hints and cleanup. The first new cleanup test found Node's boolean-capture removal did not remove a listener; explicit matching capture options fix cleanup without weakening the test.

Local Chromium starts but cannot acquire WebGL2, so local model and DOM checks do not certify GPU rendering or physical devices. tests/field-ready-browser.py exercises real main-entry keyboard, synthetic Xbox, pointer drag/recenter, maps, save/reload and narrow-screen layout. The existing source/public Highline jobs run it before the unchanged eight-mode environment and full Highline/Unsent Call journeys. No new workflow, publisher, branch or PR is required. Read tests/field-ready-evidence/public-receipt.json for independently observed results; pending/cancelled tests are not passes.

Next: obtain the owner's control/readability feedback, inspect remaining source/public reports, and continue the planned systemic archive encounter and South Cable Exchange chapter only after the immediate play path is reliable. The exchange is still a future lead. Keep this document, FUTURE-DIRECTION.md, DEVELOPMENT-HANDOFF.md and evidence current beside the game. Preserve concurrent sibling work with direct, non-forced master updates.
