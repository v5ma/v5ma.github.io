Full Vinci / Field Status repair

This continues the merged PR212 restoration rather than replacing or re-merging it. Source reconciliation used master 12d16a0db58307eede62440532f72c6ac565bf67. The recovered source artifact at 78204c4600538001e043b719dddd48d31ec93e27 had all 641 recorded SHA-256 values verified. Comparison to master showed only four Leonardo browser-driver changes, no runtime or CPU-test differences. Those latest browser drivers must be used for release runs.

The owner's full-adventure requirement remains authoritative. Normal entry starts or continues Vinci; district=quarter is an explicit optional archive. The original households, stories, routes, vehicles, badlands, water work, achievements, stable IDs and version-2 saves remain. The floor fix does not change the diorama aperture, geometry, actor coordinates, collisions, input bindings or private/public boundaries.

Hypothesis and implemented correction

The compact floor HUD used the theatre stage's estimated standing-height offset even when an actual local-floor reference was available. Scene-graph fixtures reproduced incorrect heights at 0.9, 1.2 and 1.9 meter eye heights: three failures. The display now uses the stationary desk anchor's reference floor and yaw. Local-floor displays remain 0.25 meters above that floor; local-only fallback explicitly keeps the existing estimated floor. Moving or tilting the head cannot drag this display, and invalid anchors hide it instead of inventing a position.

The compact status now distinguishes bicycle and carriage travel from on-foot equipment. It shows vehicle speed and letters while riding, health and ready/reserve sling ammunition on foot, and the actual fixed tracked-controller actions. Right B changes its displayed meaning to reload plus held interaction only for an aimed sling. Carriage help no longer suggests a jump it cannot perform. These are hints for the existing tracked XR adapter, not a remapping or a claim that the Xbox/Classic profile uses those same buttons.

Objective text wraps at measured canvas widths instead of being squeezed into a single line. Overflow is visibly abbreviated. The real minimap remains on the status canvas. The status canvas is 800 by 320 pixels on a 0.32 by 0.128 meter wrist surface, with the existing enlarged floor presentation. Detailed maps, inventory and sound remain on the summonable stationary field desk. No new omnipresent large menu, sound source or reward is added.

Evidence and limits

All 403 CPU/model/input/scene-graph tests pass, including 13 added regressions. All 14 design contracts pass. The original before-fix trace records three failed seated/standing floor cases; after correction all five floor-placement scenarios pass. The other eight new tests cover contextual controls, no invented resources, read-only state, stable anchors and text wrapping.

Local Chromium refused navigation to the ordinary HTTP game URL with net::ERR_BLOCKED_BY_ADMINISTRATOR. No local native browser, physical Quest, audible audio or comfort success is claimed. The existing compositor and full-Vinci browser workflows must rerun on this exact source. Separate served-file verification is required after merge. Until those results are recorded, this is source-verified work, not a completed physical playtest or proof of published byte identity.

Outstanding player reports

First-person and diorama entry, apparent action-button freezing, reliable immersive exit, visible aiming/projectiles, controller presentation, footsteps/music comfort and sustained Quest performance still require testing in the build the owner actually plays. This bounded pass does not claim to resolve every report. Do not erase those acceptance gates because a source test or prior emulator run passed.

Continuation and rollback

Continue NEXT01/NEXT02/F03 using the existing roadmap, not a competing new backlog. Review current master and publication evidence before writing. Keep ordinary full-Vinci entry and all save contracts. Revert only this repair's field-status module, desk integration and release documentation if necessary; never reset master or clear browser storage. The next functional pass should reproduce the owner's action/menu/exit and shot-feedback failures in the full Vinci launch path, not only in the Quarter.
