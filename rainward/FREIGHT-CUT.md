# Rainward v0.15.0 / Freight Cut

The current acceptance and publication state is recorded in [the shared release record](../level-design-library/applied/RAINWARD-FREIGHT-CUT-RELEASE.md). PR 170 is the release change. A version string, successful model diagnostic or this design document alone is not a public delivery receipt.

## Bounded experience and hypothesis

Learn the clinic and its market outlook, choose cover or a faster exposed approach, repair the freight receiver if desired, recognize its cable and newly opened loading shutter, prepare before the exposed spindle floor, and use the passage to regain the familiar clinic. A resource-aware western return then approaches the floodgate. A shelter is a saved recovery point, not an automatic refill or invulnerable room.

The hypothesis is that the existing optional receiver repair becomes consequential when it changes a usable retreat and explains a real spatial relationship. It keeps the original battery requirement, local interaction and one-time reward. Body collision, NPC navigation, sight and shots open through the same shutter. A pursuer can follow. Both original freight entrances and unpowered/freight-first extraction remain valid.

The five shared Level Design Library entry documents were re-read against current source. The clinic terrace, clinic return gate, Wayfinder UI and three XR views already existed; do not recreate them. The canonical tasks are RW-009, RW-011, RW-013 and the unfinished seven-chapter audit RW-028. Their human approval gates remain open.

## Implemented runtime / freight-cut-4

The existing ward-radio task releases the west loading shutter at (14,-24). Its visible rolled state changes with the collision opening rather than displaying a closed-looking open barrier. Receiver cable, signs, completion feedback and the original freight manifest communicate why the circuit changes the route.

The market lookout routinely patrols the lower market instead of the narrow clinic observation ramp. Its stable ID, archetype, health, damage, sight and speed are unchanged, and it can still pursue up the ramp. Observation is separated from commitment without creating inaccessible safe ground.

The fountain footprint is unchanged; its rim rises from 0.8 to 1.05 metres. Tests use actual floor heights and the named obstacle to verify that the marked edge blocks the measured crouched torso ray while leaving a standing torso exposed. Elevated and flanking threats can still look over or around it. Five faded route marks lie on open ground rather than inside collision.

The raised low aisle screen reaches the loading decision at (16.2,-24), instead of ending before the next necessary action. Its top remains 1.05 metres, with 0.6 metres of clearance for the existing prone body and older saved supply drops. Suspension lines explain the panel. Both flanks remain navigable. The exterior sorting baffle screens the loading landing from the quay without enclosing a safe room. Crate trim uses the actual bottom offset so it does not visually fill a crawl gap.

No production gameplay changed during the subsequent acceptance-driver repairs. The runtime revision originated in fd89ca22bd7a2cd8d6903c8773c9e5fb1a07af9a. Later exact-source receipts identify the accepted test driver and merge rather than treating that historical runtime commit as the final release.

## Current finite-resource acceptance route

The normal-start Classic virtual-Xbox driver prepares two medkits and one smoke using only the original rations and clinic drawer. It uses the counter, fountain edge and east grass for the market approach, reserving smoke for the spindle commitment. Medkits are used at 45 health or below rather than wasting most of their 55-point restoration at the health cap. The unchanged receiver salvage reward can support one more recipe only after a genuine clinic return.

Low cover is directional. The assisted driver may press B to stand and hold L3 to break away when a seen chasing enemy is inside the same narrow aisle. A watcher outside the west wall or east of the panel must not be mistaken for that close flank. Every such input and medical reaction is logged. These are ordinary controller actions with finite stamina, not state assignments or claims about human reaction time.

The final approach walks the protected western circulation, then uses the real passage beside the existing ruin. The approach reaches (-18,-46) by ordinary movement and must retain at least 80 stamina before committing. The final crossing follows the northern side of the existing quay pillars at z=-46 before reaching the floodgate at (0,-43), instead of letting a shortest-path driver choose their exposed z=-41 side. No geometry, hidden route, stamina grant or required objective is added for this test.

The acceptance goals remain normal start, earned supplies, both original objective components, local receiver repair with unchanged reward, actual movement across the west aperture, an earned clinic return/save, extraction with all five original enemies alive and no shots/takedowns, and genuine browser reload. Existing unpowered north-route acceptance separately keeps every optional task uncompleted and the shutters sealed. All original Rainward regressions remain required.

## Evidence classes and retained failures

Node checks cover model behavior, source contracts, saves, geometry and reward idempotence. The controlled enemy-free standing-motion comparison measured approximately 19.92 metres / 6.65 seconds sealed versus 5.90 metres / 1.97 seconds powered. It is a diagnostic of the opening, not a promise of player timing.

freight-quay-preflight.mjs samples 15 new-game schedules with initial delays of 0, 5, 10, 15 and 20 seconds and decision delays of 0.15, 0.4 and 0.8 seconds. Fourteen completed; the 15-second / 0.8-second schedule still died on the earlier market return. Every completed schedule reached the final quay preparation point with 100 stamina. This continuous-model diagnostic is not native browser, physical-device or unfamiliar-player evidence. Its failed sample remains in the output.

The previous freight-route, freight-recovery, freight-breakaway and freight-prepared preflights remain historical experiments. Do not cite their counts as acceptance of the current driver. The retained JSON reviews in evidence/freight-cut-v0.15.0/ identify native failures involving cover attribution, unused supplies, input neutral re-arming, slow crouched flight, false flank classification, and exhaustion at the final quay. Preserve those failures alongside successful traces.

The Freight Cut browser workflow uses the actual HTTP/WebGL game, synthetic Classic gamepad buttons/sticks and read-only guidance. It does not plant saves, relocate actors, grant health/inventory, remove threats or edit the clock. Four additional district AR/VR controller/hand cases use explicit device mocks. They exercise the actual scene and interface, not full headset mission completions or a real passthrough camera.

## Compatibility, release and remaining work

All seven chapter IDs, original objective positions and IDs, task IDs and rewards, checkpoint version 4, legacy migrations, chapter-bank namespaces, both Xbox presets, mouse-free menus and all three XR views remain. Legacy-drop fixtures verify old quantities can still be collected once beneath raised screens.

Acceptance, merge, Pages delivery and served-file matching are separate gates. The shared release record retains their exact IDs and hashes after they actually succeed. It supersedes earlier candidate status notes but never turns a failed trace into a pass. Roll back with a scoped release revert that preserves concurrent sibling work and browser saves; do not reset master.

Unfamiliar-player comprehension, returning-player mastery, physical Xbox and Quest 3 review, full new-route headset completion, sustained hardware performance, comfort, final art/audio and contact IK remain unapproved. This is a functional graybox upgrade to Floodgate, not an approved AAA flagship or completion of the other six chapter redesigns. The next design question is whether a new player recognizes where to prepare, why opening the receiver changes the return, and when the faster north exit is worth its exposure.
