# Receiver Crosswind: V03 level-design experiment

The intended experience is to read a threatened receiver terrace, prepare one useful shelter, discover that shelter also blocks one's own shots, choose another firing angle, and recover down the familiar gallery without throwing away the encounter. On return, knowledge of the screen and stair should support a deliberate plan rather than a faster repeat of marker-following.

## Reconciliation and hypothesis

Reviewed master 78dad9840163bbacb7308118cde44a1bb4f525f6 against the released 0.12.0 source. Aether's game subtree is unchanged; sibling work and the repaired backup workflow are newer. The library's AGENTS, STUDIO-LEVEL-DESIGN-MANUAL, GAME-RECOMMENDATIONS, QUALITY-REVIEW-FRAMEWORK and INDUSTRY-REFERENCE-NOTES were read. Its requested games/aether-reach.md did not exist at the reviewed SHA. The matching uppercase Aether recommendations are the reference; a scoped game brief is added now.

The induction bench, marked conductivity, circuit gauges, opened service shutter, continuous maintenance ascent and changed return already exist in 0.12.0. None is recreated. The chosen gap is rooftop decision/recovery depth under V01 and P01, implemented as V03. The published code previously abandoned rooftop combat below y=24, cutting off the new gallery as a practical retreat.

Hypothesis: a reversible screen that changes real firing lanes, coupled to a short non-resetting retreat, creates a reason to choose and reconsider an approach using existing architecture and equipment. The primary human observation is whether an unfamiliar player can explain and exploit the shelter/shot tradeoff without coaching. That is not established by automated completion.

## Five linked descriptions

Physical: retain the 14 by 16 meter receiver terrace, original two low cover props, two exits, and all enemies. One of two 2.5-meter screens is raised. Their shared data drives rendering, movement collision, line of sight and bullets. Existing clear spaces around the screens are flanks, not additional corridors. No district area, enemies, collectibles or reward are added.

Conditional: two linked selectors are available after the Arcade is repaired. X/E changes the same cover state, both before and during the fight. The rising destination checks the courier and live NPCs and refuses closure while occupied. The old receiver and circuit prerequisites remain. This bounded two-state mechanism is not a full physics simulation.

Behavioral: the north longshot controls the receiver sightline; the other boarder still contests the exposed angle. Receiver shelter blocks the longshot, but also the player's return shot. Gallery shelter gives a clearer receiver firing lane while shielding the eastern approach. No setting promises invulnerability. Existing humanoids remain constrained by their actual movement and floor rules; they are not claimed to descend the maintenance stairs.

Information: visible recessed tracks, brass selectors, two state lamps, raised metal panels and direct cause/effect reveal which lane is screened. All cues are original functional graybox work using the existing material kit. Before activation the player can inspect the geometry without spawning the roof wave. The readable objective, maintenance note and controller prompts remain accessible aids.

Embodiment: the standing body uses the existing 0.38-meter collision radius and 1.8-meter height; crouch stays 1.04 meters. No camera is seized. First-person VR, desktop and diorama VR/AR share the solids. Render cutaways do not change protection. Reaching an XR gun through the active screen is now rejected before consuming ammo. Hands remain UI-only.

## Routes and recovery

Receiver-side movement offers shelter from the north and a longer route around the panel to shoot. The gallery-side approach is shorter but remains exposed to the other boarder. Both reconnect across the southern roof, where the familiar ladder remains. The selectors trade which angle is protected; neither removes an enemy or supplies ammunition.

Descending the existing eastern stair to its 22-meter landing preserves the original enemy IDs, enemy damage and mission stage. The player can reload or let ordinary shield recovery work, then re-enter. Waiting there cannot synchronize the receiver or earn rewards. Dropping all the way to the street still aborts the attempt and keeps circuit progress. An interlocked switch explains an occupied destination rather than closing through a character.

The selected windbreak state is an optional bounded field in the existing version-1 save. Invalid or absent fields default to gallery shelter, which leaves the legacy receiver shooting line open. Existing completed saves remain completed; no new reward is paid. Diagnostic switch/retreat counters do not persist. No localStorage namespace is removed or cleared.

## Evidence and remaining uncertainty

The recovered baseline passed 252 model tests. Nine new labeled model fixtures cover reciprocal sightline changes, actual player fire and enemy projectile collision, direct controls, interlocks, legacy saves/reward idempotence, four real-integrator flank routes, stair retreat/re-entry, supported interaction clearances and XR muzzle occlusion. Full suite: 261 passing tests locally. These fixtures deliberately initialize model state and are not browser playthroughs.

Graybox route measurements with ordinary movement integration and no threats: receiver-side 13.91 meters in 2.32 simulated seconds; gallery-side 11.87 meters in 1.97 seconds, in either screen state. These are controlled fixtures, not human completion or combat timings. The new full browser journey separately records route samples, simulation time, shots, shield/health, unchanged enemy IDs, genuine save/Continue and once-only payment using only synthetic device inputs and read-only snapshots. It starts with the rechargeable Arc Caster and buys no equipment.

Revealing failures: the first new unit test imported a nonexistent shoot symbol; it was corrected to the existing fire API, without changing the acceptance criterion. Local HTTP browser navigation was denied by the environment policy; the project's native GitHub-runner workflow is used instead. The dynamic-screen review found XR gun-origin validation using static-only solids; it now uses the same current-state solids as the actual shot. The first repository run after roadmap integration caught a duplicated V02 ID; that existing physical-route entry is preserved, and the new work now uses V03. The unsuccessful traces remain in the evidence record. The ordinary-input driver also holds X for at least 450 milliseconds when reloading, rather than assuming ten frames necessarily represent a hold.

Required native acceptance is the established six-suite chapter/controller/grounding/diorama/expedition/glide review plus the new windbreak journey. Successful CI is not publication: compare the public file manifest, play the served application, then download/restore the versioned backup. Final receipts live outside the runtime manifest in release-receipts. Physical Xbox and Quest, unfamiliar-player comprehension, returning-player choice, comfort, long-session performance and subjective combat quality remain unverified. No internal quality score is assigned.

Next opportunity: observe arrival understanding and rail decision sightlines at actual speed, while asking whether the rooftop recovery and screen affordances were useful. Reuse the current chapter and preserve IDs rather than adding another prototype district. The reference principles come from the requested SVGN library; no commercial fiction, art, map or private story is imported.
