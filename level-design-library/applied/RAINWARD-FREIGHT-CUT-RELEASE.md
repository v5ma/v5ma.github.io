# Rainward Freight Cut release record

Status: candidate; current native acceptance, merge and public-byte verification are not yet complete. This is not a publication receipt. Inspect PR 170 and replace this status only after the required evidence succeeds.

Game: Rainward, v0.15.0, Freight Cut. Repository: v5ma/v5ma.github.io. Implementation and current driver scope: [FREIGHT-CUT.md](../../rainward/FREIGHT-CUT.md). Canonical production work: RW-009, RW-011, RW-013 and the still-open RW-028 seven-chapter audit.

The bounded change makes the original optional receiver repair open a real, flankable loading passage shared by player motion, NPC navigation, sight and shots. It reuses the existing clinic terrace, return gate, tasks and rewards rather than adding another objective or chapter. Current and legacy saves, both Xbox presets and all three XR views remain.

The most recent retained full journey, head bbdb958e3dedffebefe722cbafed2a9e759dcd0a tested as 0a5250c223465fe0ba51a0ac755607a6e25604d5, crossed the loading passage, returned to the clinic and saved both earned components but later died at the quay. Run 35149013577, artifact 10468328822, SHA256 430b00d43a7d4265c5d556d6683380ac775d93b7a1d3ed7efa79fec886ef6240. It is not an accepted complete mission.

The current candidate corrects only the assisted driver's inner-lane flank check and energy-aware final approach, adds its model diagnostic and reconciles these documents. Production gameplay remains freight-cut-4, last changed in fd89ca22bd7a2cd8d6903c8773c9e5fb1a07af9a. The full local Node suite passes 358 checks. The revised model route completes 14 of 15 sampled schedules; one earlier market-return death remains. Model results are not native browser or human acceptance.

The original unpowered north-route browser test passed 13 assertions on head 3e40d81ee8634a5c06ab9ab90dcdfa398baab7d7, run 35141501302, artifact 10466256053. It finished with 83 health, all five enemies alive, no shots/takedowns and every optional task uncompleted. This is historical supporting evidence, not a substitute for current-head regression.

All browser journeys use actual HTTP/WebGL and ordinary synthetic controller or keyboard/DOM events. Read-only guidance and finite-medkit reactions are disclosed. XR tests use explicit controller/hand/session mocks. No physical Xbox or Quest 3, unfamiliar-player/replay mastery, full new-route headset mission, performance, comfort, final art/audio or contact-IK approval is claimed.

After acceptance, record the accepted head, actual tested merge preview, all required workflow outcomes, actual merge commit, Pages run and complete public-file hash receipt here, with durable JSON evidence beside this record. Keep failed traces and historical run IDs. The release metadata and this document alone cannot prove publication.

Rollback must be a scoped release revert that preserves concurrent sibling changes and browser saves. The next design question is whether an unfamiliar player understands the receiver's useful but flankable return and can prepare for the final quay without relying on the synthetic driver's reactions.
