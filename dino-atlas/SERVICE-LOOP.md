# Tidegate: Service-loop refit

Build: tidegate-20260915.2. This refines the existing Tidegate district, not another island or a second implementation of its bridge, herd, boat or diorama systems. Baseline master: 78dad9840163bbacb7308118cde44a1bb4f525f6; prior Tidegate runtime: 33daa33d04f807d731bc9108be697ee6f8b7b1ea, released as dino-tidegate-20260915.1. The baseline comparison found no later Dino runtime changes.

## Intended player experience and hypothesis

A ranger arriving with partial knowledge can take the short harbor approach, discover the machinery's maintenance connection from inside, prepare a safe return, and reuse that connection without repeating the long observation walk. Learning the place must produce useful operational freedom, not a required sequence of visited markers.

Hypothesis: a real ranger-sized connection between sluice and machinery, maps that follow tested walkable circulation, and a reachable field cabinet will turn the previously secondary service route into a useful approach and recovery loop. The primary automated observation is successful repair, retreat through the drained lock, a second visit through that learned connection, and the final bridge/report outcome through real controls without observation/feeder flags or actor assignments. Human recognition and route preference remain separate questions.

## Reconciliation with the shared library

Read at the baseline: level-design-library/AGENTS.md, STUDIO-LEVEL-DESIGN-MANUAL.md, GAME-RECOMMENDATIONS.md, QUALITY-REVIEW-FRAMEWORK.md and INDUSTRY-REFERENCE-NOTES.md. The wildlife-fieldcraft genre section is the relevant handbook in this published folder. Its Dino flagship-crossing recommendation is already implemented by Tidegate and must not be duplicated. The library's five linked descriptions extend the user's retained four-description essay with embodiment; the original essay remains unchanged.

The transferable lenses applied here are useful reconnection, functional service architecture, readable recurring wildlife opportunities and recovery that has a viable next action. No commercial geometry, art, fiction or code is copied. The observed source defect was specific: the old map joined objective positions with straight lines through the pump house and did not distinguish unavailable crossings. The previous browser tour proved the high/feeder approach, not a no-feeder harbor completion.

## Bounded change

Physical: replace only the north ground-floor wall section with a 1.8-wide, 2.8-high maintenance opening centered at x=32, z=-2. It aligns with the aisle beside the gearbox pedestal, under the existing gallery. Foot traffic fits; the existing jeep cannot fit its collision body through the jambs. Existing fronts, service entry, roof, ramps, buildings and map bounds remain.

Conditional: a visibly piped path connects the sluice, north doorway and machine aisle. Draining the existing lock supplies the foot return while the upper bridge and lower harbor remain available. The map renders actual tested circulation polylines, marks landing transfers separately, and distinguishes raised/flooded crossings from open ones. No new itinerary trigger, key item, repair prerequisite or irreversible gate is added.

Behavioral: the existing four fictional grazers and their repeating routine are retained. A bridge signal reports the same actual gearbox, herd-clearance and boat conditions as the interaction guard. It does not equate a feeder press with clearance or predict unseen timing. The desktop text equivalent is local to the control/overlook rather than a new global waypoint feed.

Information: the northern pipe leads to a visible maintenance opening and field cabinet. The cabinet restocks the same water and battery supplies with the normal in-reach A interaction, without a pause menu. The world signal uses words as well as color. Sign textures are repainted in place to avoid per-cycle material allocations in the XR cache.

Embodiment: use the original ranger capsule, speed, camera collision resolution, vehicles, tool range and input handlers. First-person VR, VR miniature and AR miniature retain the same world truth and the three legal enclosure openings. No new camera mode or remap is introduced. The XR map mirrors the same corrected canvas. Simulated time is exposed only in the diagnostic snapshot for route measurement; tests do not change the clock.

## Likely mistakes and recovery

A player who reaches the raised bridge before fixing the gearbox is directed to genuine entry options. A player who spends water or batteries on an unsuccessful intervention can replenish them beside the maintenance entrance using A. A player who does not want to manage the feeder can use the naturally recurring apron opening. A player reaching the station but postponing the main crossing can drain the lock, return to the familiar crane/outpost, and re-enter through the learned doorway. Machinery remains reachable from multiple directions and does not require the lookout or feeder to have been visited.

The first graybox attempt placed the opening at x=30, aiming into the existing pedestal at z=6.2. Real Rapier movement stopped at approximately z=5.325 in two tests. The entrance, pipe and route were realigned to x=32 rather than deleting collision, increasing interaction range, teleporting the ranger or relaxing the original reachability criterion. The failed TAP and correction record are retained in verification/service-loop/.

## Saves, scope and evidence

Keep dino-atlas.tidegate.v1 and tidegate-crossing-v1 unchanged. Existing positions, inventory, one-time report, permanent bridge, lock and observation flags retain their sanitization and values. Opening a wall adds clearance and does not strand a prior position. The cabinet uses the existing refill operation; no new currency or repeat reward is introduced. Classic Reserve, all its keys, remaps and missions, presentation preferences, user content and vendor/license files are untouched. Parked vehicles still return to their normal bays after reload, as in the prior candidate; full vehicle-pose persistence is not claimed.

Run all Node tests and existing Tidegate/Classic browser suites. tests/service-loop.test.mjs uses labeled geometry/state fixtures; it is not an end-to-end playthrough. tests/service-loop-browser.py performs two fresh actual-input approaches, spending/restocking, lock recovery, a learned return, natural herd clearance, report and reload without assigning actor, wildlife, inventory or objective state. Report route time as measured simulation seconds for those fixed drivers, not human completion time. The native and published runs remain distinct.

Local model and collision tests run in this environment. Local Chromium navigation returns ERR_BLOCKED_BY_ADMINISTRATOR; no local rendered pass is claimed. GitHub's established native browser and public-byte pipeline supplies rendered evidence. Release receipts must name actual successful runs, source SHA, manifest, counts and limitations after completion.

Unfamiliar/returning players, physical Xbox, Quest 3 controllers and hands, real stereo/passthrough, comfort, device frame time and production-art acceptance remain open. No score or claim of enjoyment is inferred from tests. Before another district, compare the information gained from the high route against the harbor's shorter approach and test whether the new service connection makes the feeder path unintentionally redundant. Observe camera clarity through the north doorway in all presentations.

Rollback: revert the scoped refit commit using a new commit. Do not reset master, replace historical release tags or clear storage. The prior runtime can read the unchanged save schema. A safe foot checkpoint remains available if a reverted wall occupies a newer doorway position.

Technical references used for verification, not hardware certification: https://rapier.rs/docs/user_guides/javascript/character_controller/ and https://threejs.org/docs/pages/WebXRManager.html . The bundled versions are unchanged.
