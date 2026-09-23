# Open Channel / Neighborhood Missions 0.19.0

This pass adds a systems encounter inside the existing workshop and upper archive, not a new district. After Highline and The Unsent Call, the adventure button offers Play Open Channel; the same case appears in Missions. Old saved stages and rewards are retained. South Cable Exchange remains a future story destination.

## Playable choice

Sal asks the player to answer the original operator. The uplink needs 3 game power units. Main supply provides 4 and public lighting uses 2, leaving only 2 available. The player can descend to Neri's workshop reserve cell, connect 2 extra units and return to the archive with the street still lit. Alternatively, the shorter archive route diverts the public-light feeder and frees 2 units immediately. Both routes send the same reply and earn the same 140 credits once. Neither is a mandatory moral choice or a hidden scoring penalty.

The reserve cell is on the workshop floor at (17.5, 0, 7.7). The feeder is in the upper reading room at (-18.4, 10.8, -4.15). The uplink is at the reading desk at (-21.5, 10.8, -4.6). Use the ordinary interaction while nearby: E, Xbox X, or the existing XR interaction mapping. Reach and wall visibility are checked. No remote click grants a result. No controller remap, head-locked menu, timer, damage, new renderer or standalone hacking interface is introduced.

Both switches are reversible before transmission. An underpowered send explains the deficit and the two alternatives; it does not reset the circuit or any other progress. A numerical world-space diagram and shared desktop/XR status show available supply, the 3-unit demand and whether public lighting is on or diverted. Existing street-lamp materials visibly dim during diversion; ambient scene illumination stays readable. The acknowledgement at the nearby archive receiver releases the transfer and restores street service. Return to Sal for the reward and a route-specific debrief.

Switching to another mission safely suspends the temporary lighting effect. Returning to Open Channel restores the saved circuit choice. Completed routing returns both switches to their normal state while retaining whether the player transmitted using reserve power or the shorter diversion. The circuit is a small authored game system, not a physical electrical simulation. There is no live multiplayer effect on another player's street lighting.

## Preservation and continuation

The implementation adds campaign ID channel and a validated routing record; it does not rewrite previous story stages, chapter/layout IDs, credits or physics. Old saves without routing receive its idle default. Stage/outcome inconsistencies and unknown routing versions are rejected with original data retained. The original city, Highline, Unsent Call, five older campaign cases, Currentworks modules, Xbox/controller/hand paths, eight native views, 32 m height safety boundary and 102 frozen legacy files remain.

Rolling back to an older campaign parser after earning channel progress would reject that newer save. Retain/export it rather than clearing storage or dropping the new ID to force compatibility. Work directly on current master without resetting or force-pushing shared history.

This iteration maps to the existing DESIGN-02, LEVEL-01, ACCESS-03 and SAVE-01 records. Their human approval gates are not upgraded to verified on the strength of simulation tests. The game roadmap and generated workbook are updated, not replaced with a new checklist.

## Evidence boundaries

Baseline runtime: 11ee033f4a9f86a4291d537cb324c20d0d428454. Master was first reviewed at 7518b8e007bb0debdd474f8ff25fbfa41dd3d69f. The planning checkpoint is eae41a85b5212ca3c5b6f56efcae206fb6e2a63d. Prior live artifact 10732860550 was downloaded and read: Field Ready passed 7 checks, Currentworks passed 11, and Highline/Unsent Call passed 15. Those outcomes do not certify unrelated inherited suites.

The complete local suite now passes 491 checks, including all previous regressions, ten new circuit/save contracts, two actual Three-object presentation tests and two fresh input-only trilogy journeys. One full journey chooses reserve power; the other tests denial, diversion and return. Each physically walks from a new save through the preceding arcs, earns exactly 500 combined new-arc credits, and leaves the chapter, resident and Watch ledgers unchanged. Separate unit fixtures are explicitly labelled; they are not claimed as played journeys.

The existing source/public Highline browser journey is extended, not replaced. It first completes the old arcs using real input, then tests an underpowered send, Xbox feeder toggles, actual street-bulb changes, native stereo AR presentation/ray Resume, a genuine circuit save/reload, reserve-cell travel, transmission, acknowledgement and the exactly-once reward. This browser route reverses the direct diversion before committing a reserve-powered transmission. Full direct-route completion has input-only model evidence unless a later receipt records a native run. The prior controls and eight-mode graphics journeys remain in the same existing workflows.

Local Chromium still cannot acquire WebGL2. Hosted rendering, public served bytes, broader regression matrices, physical Quest/Xbox/hand sessions, comfort and sustained performance are distinct checks. The actual implementation SHA, reports, images, failed attempts and publication result belong in tests/open-channel-evidence/public-receipt.json; do not infer success from a queued job.

Next: review whether unfamiliar players notice and understand both routes without coaching, whether the numerical diagram is readable from real headset poses, and whether the reserve detour feels worthwhile. Then deepen an encounter or build the South Cable Exchange with actual traversable geometry. Keep this note, FUTURE-DIRECTION.md, DEVELOPMENT-HANDOFF.md and the evidence receipt current beside the game.
