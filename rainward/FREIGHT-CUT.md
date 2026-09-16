# Rainward v0.15.0 / Freight Cut

## Intended experience and source reconciliation

Arrival with an incomplete map; learn the clinic and its raised market outlook; carry the signal battery through an exposed crossing; recognize the receiver's service cable; choose whether to open the west loading passage; recover the spindle; break sight, spend finite supplies and retreat through the newly understood connection; return to the familiar clinic; choose a quieter approach to extraction.

The reviewed repository master was 107c631a11d773ffdedbf39f5662618189bb7cc8. Rainward's latest runtime was Wayfinder 0.14.1, merged in PR 162; the permanent receipt was 78dad9840163bbacb7308118cde44a1bb4f525f6. The clinic terrace, inside-released clinic gate, route chevrons and three XR views already existed. They are reused, not reimplemented. The shared library's AGENTS, studio manual, Rainward brief, quality framework and industry notes supply the methodology; named commercial titles are analytical references, not copied layouts or externally verified production claims.

## One hypothesis and bounded change

Hypothesis: making the existing optional freight receiver repair change a real route lets knowledge of the clinic/market/freight relationship support deliberate recovery, rather than merely collecting an ammunition reward.

The original depot-west-a wall keeps its ID but is split around a 3-metre loading bay. The existing ward-radio task, still local and dependent on the clinic battery, releases its shutter. A sorting baffle screens the outside landing from the quay. The original south entrance and north exit remain open in both states. No chapter, required objective, shelter, task, reward, enemy or new control is added. The original north exit is the quicker route toward extraction; the lateral loading passage reconnects to market concealment and the clinic terrace for retreat or reapproach.

Opening is not pure advantage. It also opens a firing/sightline lane and allows the same NPC navigation to enter or leave through the bay. The sorting landing is not a safe zone. Existing crate cover, grass, smoke, bottles, stamina and search behavior remain the tools for making a retreat work. Skipping the receiver remains valid, including freight-first completion and extraction.

## Dependable physical state and readable causality

Body collision, pathfinding, line of sight and shot collision share the shutter's openOnTask state. Its graphic changes to a rolled shutter atomically with collision, avoiding an open collider under a closed-looking animation. A service cable links the existing receiver to the loading door. The physical signs and completion hint identify the opening and warn that lookouts can follow. The existing freight-manifest note retains its stable ID and now explains the circuit. The map's existing obstacle rendering removes the disabled barrier normally.

The graybox changes no arbitrary overlapping floors, body dimensions, IK targets or traversal verbs. Desktop/Xbox interaction remains Y or E. Quest interaction remains right grip or the established hand use action. XR render cutaways never change the gate's collision. The first-person, VR diorama and AR diorama remain the same simulation with the existing no-double-closed shell invariant.

## Measurements and revealing failures

The primary controlled observation uses real acceleration and swept body motion between (17,-24) and (11,-24), standing without sprint in an explicitly enemy-free model fixture. The sealed detour measured 19.90 metres / 6.60 seconds; the powered direct crossing measured 5.90 metres / 1.97 seconds. These are controlled model measurements, not human times or live encounter win rates.

A normal-start model preflight with living enemies initially returned to the exposed central market after reaching the recovery shelter and died. The revised route uses the already-existing clinic yard gate and western approach to extraction. It recovered both components, used finite medkit/smoke supplies, kept all five enemies alive and extracted. This is simulation preflight, not browser or physical-device evidence. The native journey must independently earn its supplies, traverse both buildings, repair the receiver, use the new passage, recover at the clinic, extract and reload an earned shelter checkpoint without assigning player state.

Dedicated unit fixtures additionally test the gate's three body stances, shots, sightline, actual investigating NPC traversal, original entrance reachability, one-time rewards and optional unpowered extraction. Fixture tests are not end-to-end playthroughs. Native XR regression uses explicit simulated poses and controls; it does not certify real passthrough, controller tracking or hand reliability.

## Saves, rollback and next question

The passage derives only from the existing ward-radio completed task. Checkpoint version 4 and older accepted versions, keys, item IDs, task IDs, rewards and shelter anchors are unchanged. An older save with that repair already recorded opens the passage on restoration, without replaying rewards. A save without it leaves the door sealed. Previewing a save does not change the active map. There is no localStorage clearing or migration.

Rollback is a normal revert of this release, not resetting master: old checkpoints contain no new task or field, so the preceding runtime can still load them. Keep other games and the shared library's unrelated sections intact. The library's Rainward note and existing canonical RW-009, RW-011, RW-013 and RW-028 rows record the iteration without marking the whole chapter or human gates approved.

Before calling this a locked flagship slice, observe unfamiliar players choosing between the original north exit and the recovery passage, and whether they can explain why opening the shutter changes threat access. Remaining opportunities include the quay's final observation/commitment beat, better hand-menu access under pressure, and body/contact animation. Physical Xbox/Quest, comfort, performance, final art/audio, fresh-player comprehension and replay mastery remain unverified. Publication must be established by the release PR and separate served-byte receipt, not this candidate document.
