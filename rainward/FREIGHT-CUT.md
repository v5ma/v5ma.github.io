# Rainward v0.15.0 / Freight Cut

This is a release candidate until its exact-source native checks, merge and served-file receipt succeed. The last verified public gameplay is Wayfinder v0.14.1. PR 170 contains this continuation; a version string or this document is not a publication receipt.

## Experience and current design

Learn the clinic and its market outlook, choose a covered transfer or a quicker exposed crossing, repair the freight receiver if desired, recognize its cable and the newly opened loading shutter, prepare behind the sorting screen before committing to the spindle floor, and use the loading passage to regain the known clinic. Recovery prepares the final western approach to the floodgate; it is not an automatic refill or safe zone.

The shared Level Design Library's five entry documents were re-read against the actual PR source and the current master, 060f97bfa1c985279d980b13412947a395e83486. The recovered candidate was d3813798400788480b33c0742c89ec60b6e88a5f, tested as merge preview b1fc53c0c8f6bdab5f5b9d5d37f788a767e7d2a2. The clinic terrace, clinic return gate, Wayfinder UI and three XR views already existed. Do not recreate them. Apply this work to RW-009, RW-011, RW-013 and the unfinished seven-chapter audit RW-028 in production-plan.json. Their human approvals remain open.

The hypothesis is that the existing receiver repair becomes meaningful when it changes a usable retreat and the player has a viable preparation state before the next exposed movement. The repair keeps its original battery requirement, local interaction and one-time reward. It opens collision, NPC navigation, sight and shots through the same west shutter. The opening can admit a pursuer; it is not a player-only advantage. Both original freight entrances and unpowered/freight-first extraction remain valid.

## Recovery iteration / freight-cut-4

The previous native run passed 355 model checks but died near (-5,-15), still carrying two medkits and one smoke. The earlier flat-height cover assertion also attributed an occlusion to the wrong object. Those failures are retained, not converted into success. See evidence/freight-cut-v0.15.0/recovery-review-20260916.json and GitHub run 35125142607, journey artifact 10459801092.

The market lookout now patrols the lower market rather than routinely occupying the narrow clinic observation ramp. Its stable ID, archetype, health, damage, sight, speed and ability to pursue up the ramp are unchanged. This separates the observation beat from the initial commitment without turning the terrace into inaccessible safe ground.

The existing fountain keeps its footprint but its rim rises from 0.8 to 1.05 metres. At the tested south-side position the old rim did not block the real crouched torso ray. The new rim blocks that ground-level line while leaving the standing torso exposed. Tests use actual floor heights and named obstacles, not an arbitrary first hit or a flat-floor proxy. Elevated or flanking threats can still look over or around the cover.

The existing aisle screen extends from the receiver-side turn to the loading decision at (16.2,-24), instead of ending before the next necessary action. Its top stays at 1.05 metres, with 0.6 metres of ground clearance for prone movement and older saved supply drops. Thin suspension lines explain the raised panel. The north and south flanks remain navigable. The separate sorting baffle still screens the outside landing from the quay. The crate-band rendering now includes each obstacle's bottom offset, so raised pieces do not grow misleading trim down through their crawl gaps.

Five faded approach marks lie on open ground and follow the fountain's south side, rather than placing a mark inside its collision volume. The loading decision sign identifies the exposed spindle floor and west return. The receiver cable, shutter state signs, original manifest note and completion hint continue to explain causality without adding an objective or menu.

## Finite preparation and evidence boundaries

The revised native route prepares one medkit and two smokes using only the original rations and clinic drawer. It does not stop to craft while a lookout is closing behind the aisle screen. One smoke screens the market commitment; the second is used before crossing the spindle floor. The receiver's unchanged salvage reward can support further preparation after an actual clinic return. No additional supply, reward or shelter is introduced.

The Classic browser driver reads state to steer virtual Xbox sticks and may press the existing D-pad-up medkit control when health is below 55. These synthetic reactive inputs are logged. They are not health assignments, invulnerability or evidence of human reaction time. Mode changes, crafting, stance, smoke, interactions, saves and reload use the actual game/UI. Failure traces retain every attempted recovery. This is an assisted software acceptance route, not an unfamiliar-player pacing approval.

The reproducible freight-recovery-preflight.mjs diagnostic varies initial waiting and decision delays across 15 Classic model-action schedules. It retains unsuccessful schedules as well as successful ones. Model outcomes are not native-browser or hardware results. The controlled, enemy-free standing-motion comparison measured approximately 19.92 metres / 6.65 seconds with the shutter sealed and 5.90 metres / 1.97 seconds with it powered. These measurements are diagnostics, not player timing promises.

The old freight-route-preflight.mjs and its historical results describe an earlier route experiment; they must not be cited as acceptance of this revision. The permanent Freight Cut workflow also exercises the actual district scene through four explicit AR/VR controller/hand mocks. Those are presentation/input checks, not full new-route headset completions. All existing Rainward regression suites remain release gates.

## Compatibility and remaining work

Seven chapter IDs, objective IDs and positions, task IDs, original task rewards, checkpoint version 4, old checkpoint migration, chapter-bank namespaces, both Xbox presets and all three XR views remain. Raised-screen legacy-drop fixtures verify that the original quantities can still be collected once. No character size, animation authority, damage rule, renderer shortcut or automatic game-state grant is introduced.

Publication requires green checks on the actual candidate, a scope-safe merge preserving sibling work, successful Pages delivery, and a separate comparison of served files against that source. Retain source archives, logs, native video, failure traces, earned checkpoints and the final receipt. Revert the Rainward-scoped change if needed; never reset master or erase saves.

Unfamiliar-player comprehension, replay reasoning, physical Xbox and Quest 3 sessions, full new-route headset completion, sustained hardware performance, comfort, final art/audio and character contact IK remain unapproved. The next design question is whether a new player recognizes where to prepare, why opening the receiver changes the return, and when the shorter north exit is worth its exposure. The other six chapter redesigns remain unfinished.
