# Rainward / authored level-design contract

The September 15 owner brief changes the production target from larger prototype maps to intentional, dense, interconnected places. Its source is Pasted text(20260915-173014).txt, SHA256 b7b3d4870d5e88471d396a7a13382b5ab5572aa7110d331af17ace4ae5468c17. This document applies the brief's terminology to Rainward; it does not independently verify the brief's descriptions of Naughty Dog production. The shared methodology is reusable, but this implementation changes no sibling game.

## The experience spine comes before geometry

Every replacement begins with a written emotional and mechanical sequence. For the Floodgate clinic-market seam, the sequence is shelter, orientation, route choice, observation or concealment, discovery of the evacuated ward, recovery of the original signal battery, release of the inside-barred yard gate, recognition of the earlier rain garden, recovery, and return toward the existing extraction objective. The battery, spindle and extraction remain the same mission. The first replacement is a playable graybox, not the complete approved 15-20 minute flagship slice.

For every beat, record what the player knows on arrival, what they can learn before committing, which action changes their understanding, where they can retreat, and the spatial transition into the next beat. A beat that adds distance but no decision, discovery, contrast or necessary recovery should be cut. Measured first-time-player comprehension and enjoyment, not a passing graph test, determine whether the sequence succeeds.

## Wide-linear alternatives must differ

A route is meaningful when it changes exposure, information, resource risk, traversal, or narrative understanding. Parallel corridors with the same enemies and outcome do not qualify. The initial clinic replacement preserves the garden approach for concealment and recovery, creates a market-facing terrace for observation, and provides a west ramp through the collapsed end of the ruin. Both elevated approaches connect to a descent into the existing battery room. Their convergence keeps the chapter legible without requiring an enormous open world.

The terrace is 2.4 metres above street level. Its rendered surface and character floor use the same height function. Retaining parapets close unwalkable edges; the three ramps provide continuous, physical transitions rather than invisible teleport links. This is a single navigable heightfield with elevated routes, not a claim that the engine now supports arbitrary overlapping floors, ladders, mantling or authored window jumps. Those need separate navigation and animation work.

## Buildings must reconnect

The clinic is no longer only a rectangular container reached through one unchanged route. The new north opening joins its battery room to the raised market terrace. A west yard shutter can be released only from inside. The resulting return loop reconnects the clinic to the rain garden and changes the meaning of the earlier locked boundary. It is an optional shortcut, not a new extraction requirement, resource reward, or remote menu unlock.

The shutter's visible opening, body collision and pathfinding agree. Its open state is an ordinary completed task stored at the original shelters. Old checkpoints restore the shutter closed. Previewing a checkpoint must not modify the active map's gate. Returning through the area should let the player recognize where they have been from a newly useful perspective; this needs an unfamiliar-player review as well as automated route checks.

## Combat topology and information

Each serious encounter must identify an observation position, sightline lanes, concealment distinct from hard cover, a flanking connection, at least one line-of-sight break, and a recovery route. Cover should not imply permanent safety, and a high position should trade exposure for information rather than give invulnerability. Enemy navigation must be able to use relevant connections too. The new terrace is present in the same navigation data used by patrols; this is not proof that every patrol's behavior is already well staged.

The current increment retains authored enemy identities, damage, ammunition and supplies. Its isolated geometry journey deliberately defeats enemies in a fixture so it can diagnose collision, camera and save failures. That fixture is not encounter-balance evidence. Normal-start living-enemy campaign tests remain separate. A dedicated unfamiliar-player stealth-to-combat-to-recovery study on the recut is still required before claiming its pacing or fairness is approved.

## Architecture, causality and contrast

The market terrace, clinic entrance, visible yard latch and original rain garden provide recognizable orientation anchors. Paint and readable physical signage reinforce the traversal direction rather than silently adding a compulsory HUD path. Original evacuation trolleys and the inside-released shutter connect the story of a ward moving north to the route the player opens. The intention is environmental causality, not just a room filled with decorative debris.

Quiet shelter space should contrast with exposed observation; the sheltered garden should contrast with hard urban edges; the enclosed clinic should contrast with the terrace and its outlook. The existing rain, music and finite survival systems remain. New bespoke environmental audio, full authored story staging, and final lighting/art are not claimed by the graybox. Playtest first, move or remove geometry, then spend effort on final detail.

## Level Grammar, version 1

The first concrete vocabulary consists of stable objective and shelter anchors, approach routes with explicit purposes, shared collision/render height surfaces, boundary obstacles, observation areas, and task-linked return gates. floodgate-recut.mjs records route purposes and physical coordinates, and tests/recut.test.mjs walks those coordinates through the actual swept body motion. This is the start of the shared grammar, not a shipped general-purpose level editor.

The next vocabulary needs explicit contracts for stairs, doors, interior floors, ledges, window crossings, crawlspaces, ladders, water exits, cover/concealment nodes, patrol transitions, environmental audio, and hand/foot targets. Each should identify collision authority, allowed approach direction, clearance, animation contact, accessibility alternative, save implications and tests. An interaction anchor is not automatically a working traversal mechanic. Do not turn planned grammar nouns into claimed features.

## One campaign, three XR views

First-person VR evaluates human-scale proportions and body clearance. Third-person VR and AR expose the level as a real stereo miniature with optional top and front cutaways. These are views of the same active world, not separate missions or a flat theatre screen. The viewer can move around the display without moving the survivor. Controller or hand locomotion still controls the character, and all objective, obstruction and resource rules stay in the game simulation.

The allowed shell configurations are both open, top open/front closed, and front open/top closed. The closed/closed state is not representable by the validated preference schema. World-volume clipping affects rendering only. It never opens collision walls, removes gameplay barriers, or changes what enemies can detect. Diorama viewing intentionally offers a different visual perspective; equal information or equal difficulty across viewpoints is not assumed. Test observation, surprise, navigational clarity and targeting in each view.

The current AR placement is a recenterable reference-space display. Surface detection, plane placement, persistent room anchors, scene-depth occlusion and a claim of a physically tested passthrough view are not part of this release. Physical Quest 3 tracking, comfort, controller/hand usability and frame-time review remain open.

## Replacement sequence and gates

The Floodgate clinic-market seam is the first implemented graybox replacement. Its existing garden, battery, spindle, shelters and chapter slot are retained. The rest of the Floodgate still needs the same systematic pass, particularly the route from the clinic's recovery loop toward the extraction climax. Do not mark the whole chapter redesigned or the flagship slice approved.

The Drowned Conservatory should next be planned around readable vertical horticultural layers, water-route choices and a return reveal. Bellweather Terminus should be planned as a clock concourse with workshop and dispatch alternatives that converge at the signal bridge. Meridian Ward should use interconnected occupied interiors and streets; Breakwater Signal should make height, wind-exposed movement and sheltered recovery meaningful; Whiteout Market should use contrasting visibility, recognizable sheltered thresholds and route memory; Northlight Natatorium should contrast observation from dry decks, submerged component recovery and dry service-space objectives. These are proposed replacement briefs, not newly built layouts. Preserve each chapter's authored identity and progression while replacing its geometry in reviewed increments.

No replacement graduates from graybox on the strength of screenshots alone. Require physical route traversal, objectives and extraction, old-save restoration, finite-resource tests, controller-complete menus and gameplay, XR view checks, readable before/after captures, and retained failures. Then conduct an unfamiliar-player session recording hesitation, backtracking, lost orientation, intended and actual route choice, damage, recovery, optional discovery and elapsed time. Named art, sound, comfort and hardware reviews remain independent gates. Do not label automated success as AAA certification.
