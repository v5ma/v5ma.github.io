# Rainward v0.15.0 / Freight Firebreak

## Intended experience and hypothesis

Leave the clinic with a plan, see Freight Hall from the existing terrace, choose an approach, encounter a threat, deliberately alter the hall, use a corner to recover, recognize the north loading door from the yard, recover the original spindle, and reach the original transmitter. The hypothesis is that one linked sightline/route change makes Freight Hall more useful under pursuit than another static room would.

The bounded change is inside the existing Floodgate map. A marked lever lowers a centre-aisle partition and opens the east yard door. The primary observation is whether real movement can convert a live patrol alert into a usable loop and then continue to the original objectives/extraction. Record travel distance, simulation time, damage, alerts, escapes, supplies used, deaths, and source/input/view. An automated escape is not proof that a new player understands the lever.

## Reconciliation with the shared library

Read at repository master 78dad9840163bbacb7308118cde44a1bb4f525f6: level-design-library/AGENTS.md, STUDIO-LEVEL-DESIGN-MANUAL.md, GAME-RECOMMENDATIONS.md, QUALITY-REVIEW-FRAMEWORK.md, and INDUSTRY-REFERENCE-NOTES.md. The library's Rainward brief asks for a complete survival/stealth experience, living threats, finite resources, observation and recovery, rather than another geometry-only expansion.

Wayfinder v0.14.1 already supplies the 2.4-metre clinic terrace, the inside-unlocked clinic return gate, floor cues, route journal, source-owned XR holds and all three XR views. Those are retained, not rebuilt. The previous publication manifest was checked locally against all 148 recovered files with no difference. Earlier suggestions that those features are absent are superseded by the source.

The supplied experience-spine brief contributes the sequence of observation, choice, pressure, changed understanding and recovery. The studio manual contributes conditional, behavioral, information and embodiment checks. The industry notes are analytical lenses: authored recovery spaces, functional service circulation and useful reconnection. No commercial geometry, art, fiction or unverified production claim is copied.

## What changes in the place

The front approach is a short crossing from the clinic/market terrace with early access to the lever and existing freight supplies, but exposure to the street lookout and the hall's central firing lane. The north loading approach reaches the spindle from behind that lane without operating the mechanism, but travels farther through the market/quay. Neither route is advertised as universally safe. Their exposure depends on patrol phase, noise, pace and available resources.

The east wall is split at the service door while its existing depot-east identifier remains on the north segment. The linked partition is suspended initially. Operating the nearby lever instantly switches both physical colliders and their visible representations: the partition lowers and the yard shutter folds above head height. The existing central shot/sight line is now blocked, and the east exit leads around the outside of the hall to its recognizable north loading entrance. Both ends of the partition remain navigable by the player and ordinary patrols. This is repositioning, not invulnerability or a kill arena.

The mechanism makes one normal, spatial mechanical sound and a simulated noise that can draw nearby investigators. It neither reveals enemy locations nor grants health, oxygen, ammunition, materials or rewards. Its physical lever, marked floor, cable, header and the updated existing freight manifest explain the causal relationship. The standard task journal exposes the same explanation; there is no new mandatory HUD trail or required extraction objective.

## Mistakes and recovery

The lever cannot be reached through the closed outside wall. The marked partition floor has an occupancy interlock: a live actor or player under the pending panel prevents deployment, and the interaction explains what must clear. No actor is teleported, crushed, or silently moved aside. This temporary condition can be retried when the area clears.

A player who makes noise must still leave the lever and break sight at a wall corner. Pursuers can go around the screen or through the new door. The original front and north doors remain usable before and after deployment; neither the new operation nor a specific resource is required to finish. The original clinic shelter remains a recovery/save anchor. A quiet run may leave the mechanism untouched; learning its purpose offers another option on a later visit.

## Save, input and XR contracts

All seven expedition identities, original item/objective/shelter/patrol IDs, rewards, finite inventory, enemy profiles, audio ownership, licenses and checkpoint namespaces remain. Version-4 serialization gains no fields. The optional task ward-freight-firebreak uses the existing completedTasks array; old saves load the door closed/partition raised. Saving the completed task preserves the paired state. A preview restore does not mutate the active map. Physical actor clearance is 0.32 metres radius and 1.72 metres standing height; the yard doorway is 3 metres wide and 3.3 metres high.

Keyboard E, Xbox Y, Quest right grip and the existing right-hand use pinch activate the same near-player interaction. No remote ray activation or new control binding is introduced. First-person VR and AR/VR dioramas use the same collider, visibility, sound and save state. Diorama cutaways do not open game walls. Both top and front can never be closed together. Physical Quest/Xbox, real passthrough, comfort, hand reliability and target-device performance remain separate unapproved gates.

## Acceptance and boundaries

New model fixtures check paired state, a blocked central ray, both flanking paths, the real yard loop, live-actor safety, operation locality, one-time noise/no resource grant, all original targets, old-save restore, preview isolation and ordinary sound investigation. These fixtures are labeled and are not playthrough evidence.

The new browser suite starts the actual game normally, with every authored threat alive and no fixture save or actor/resource/clock write. Device emulation drives ordinary sticks/buttons or WebXR controller/hand inputs. Desktop cases exercise full objective recovery and extraction, including a no-mechanism north route; focused XR cases exercise the new lever and loop in the selected view, not full-campaign completion. Existing campaign/save/controller/water/material/audio/XR regressions remain release gates. Native captures and traces must be inspected. Local browser navigation was blocked by administrator policy; no bypass was attempted, and native WebGL acceptance uses GitHub Actions.

The evidence directory and release PR record actual results, failures and exact tested source. These instructions alone do not establish publication. Unfamiliar-player comprehension, encounter enjoyment, final art and a 15-20 minute flagship pacing target are not approved by automated completion.

## Roadmap and next opportunity

This implements the bounded Freight Hall part of RW-012 and continues RW-009, RW-011 and RW-028 without replacing the 64-item canonical plan. The remaining question is whether a first-time player predicts the linked change before pulling and deliberately uses the resulting corner/loop after detection. Next evaluate the north loading door-to-quay finale: give observation and recovery there without turning extraction into another long commute or duplicating the new firebreak.

Rollback: revert the Freight Firebreak PR together with any compatible-save handling decision. Do not merely remove the new task definition from a build after players save it: pre-firebreak code rejects unknown completed-task IDs. A forward rollback must retain the task ID in validation (even if the mechanism is disabled) or migrate only that ID explicitly while preserving all other save content. Never clear storage or reset master.

## Revealing graybox iteration

Initial browser runs exposed an expensive blind sprint into the clinic, an old north detour that ignored the existing west terrace connection, and an entrance lever too deep in the exposed Freight aisle. The first Survival run nevertheless completed the new loop and extraction with all five threats alive. The revised lever is nearer the front entrance at (26.1, -10.3); the partition is farther north at z=-21.2, beyond a watcher's firing radius from the lever. The same occupancy interlock still applies, but its marked floor is less likely to become a stationary firing position during pursuit. The unchanged actors are not weakened or repositioned.

The north approach now explicitly reuses the west terrace descent. Its benchmark retains the same prepared smoke for the exposed quay rather than consuming it at the spindle. The existing clinic letter explains east/front versus west/north. Focused XR tests use the game's pre-existing Freight-first route, not a fixture save or a forced actor position; full desktop cases still cover both original objectives and extraction. Failures in the longer XR clinic approach remain recorded and are not claimed fixed by testing a different approach.

The earlier crossing target was under 8 metres from the deep lever. Moving the lever toward the entrance trades a few metres of crossing distance for an earlier usable decision. The revised navigation path is about 8.9 metres, so the documented native bound is under 10 metres. Other progression, resources and live-threat requirements remain unchanged. Representative before/after mechanism images use a public pause action and an explicitly simulated diorama observer pose; the test asserts that the survivor and mission clock remain unchanged.
