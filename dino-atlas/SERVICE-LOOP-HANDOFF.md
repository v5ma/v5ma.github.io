# Service-loop continuation

## Published checkpoint / 2026-09-16

The Tidegate service-loop refit is merged, published and release-verified. Build: tidegate-20260915.2. PR 168 merged normally as 62823be5d810ecf2d78fa73f794e86a08e1bfd3c, from accepted candidate 19deee2aad696fd28016d6a94082f947066b7fe4. Release dino-tidegate-20260915.2 points to that exact merge and was published on September 16 at 19:25:00 UTC. It remains a prerelease because human and physical-device acceptance are unfinished. Do not repeat the merge or rebuild the already implemented systems.

Read verification/service-loop/publication-20260916.json first, then SERVICE-LOOP.md, TIDEGATE-CROSSING.md, AAA-ROADMAP.md and level-design-library/DINO-ATLAS-CURRENT.md. The earlier unpublished handoff is preserved verbatim at verification/service-loop/unpublished-handoff-20260915.md. Its queued-job status and older source IDs are historical, not the current continuation state.

## Implemented relationships

The existing pump house now has a real ranger-sized north service doorway at x=32, z=-2, aligned with its machinery aisle. A visible pipe/path connects that doorway to the reversible sluice and an ordinary in-reach A resupply locker at x=36, z=-4.5. The map follows actual circulation, separates boat transfers from walking and distinguishes open from unavailable crossings. Bridge signals use the same gearbox, actual herd-apron occupancy and boat-clearance conditions as the interaction guard.

The new approaches support repair, resupply, retreat through the drained lock before the bridge is repaired, a learned return to the machinery, natural herd clearance, bridge completion and a one-time report. Observation and feeder flags are not mandatory itinerary triggers. Existing front, eastern service, upper/roof, boat and helicopter access remain. This is not another island, a new wildlife population, a duplicate XR implementation or whole-campaign replacement.

## Verification that actually completed

Candidate run 35135642230 passed all eight candidate jobs. Master run 35136758566 passed all ten jobs, including separate published and release jobs. The exact merged source passed 173 Node/model/real-Rapier tests with no failures or skips; its Tidegate tour passed 31 checks, the harbor and maintenance journeys passed 14 and 13 checks, and retained Grounded, Living Herds, Storm Response and Pelagic journeys passed 22, 21, 28 and 29 checks respectively.

The separate public job 104934533678 matched all 68 manifest files and reran the 31-check Tidegate tour, both service routes totaling 27 checks, and three production miniature captures. The published reports recorded no JavaScript, shader or game HTTP errors. Release job 104940741416 succeeded. The release asset tidegate-verified-evidence.tgz contains the source and evidence collected by that workflow; its GitHub-reported digest is in the publication receipt. The closeout audited all eight downloaded merged artifacts and the published artifact, not a separate download of that aggregate release asset.

The original merge's Pages run 35136757154 was superseded/cancelled, not successful. Pages run 35137087515 deployed 6c97cfae6324ef10227d890ddc2b67e28705a2ee successfully at 18:57:06 UTC; comparison showed only a sibling Vesperfall evidence document beyond the Dino release merge. Closeout master a0ce5803b0f3bab305314187fba6075e3d0e90ce likewise differs only in sibling files. Preserve those concurrent changes.

The closeout independently matched the archived 68-file manifest and reran all 173 tests and top-level JavaScript syntax checks. It reviewed archived public reports and rendered map/miniature evidence, not a fresh local live-browser session. Public-byte matching describes the release revision at the time of that run; these later documentation-only corrections do not alter the runtime or retroactively belong to the older receipt.

The published fixed drivers reached first repair in 22.12 simulation seconds by harbor and 47.68 seconds by the northern walking/maintenance approach. Their learned home-to-machinery returns took 25.43 and 25.50 seconds. These are scripted route measurements, not human completion time, preference, understanding or proof that every approach has equal value.

## Revealing failures retained

The first north opening aimed into the gearbox pedestal; the opening and route were realigned to the clear aisle. The freestanding cabinet occupied a formerly valid walking checkpoint; its replacement is recessed into the existing wall, without a new solid in the old walking space. Step the physics world before overlap probes, because an unstepped broad-phase query missed that collision.

Native journeys then revealed an awkward bridge-control plinth and report endpoints outside ordinary stopping tolerance. The plinth was lowered within its existing footprint and route endpoints brought inside unchanged interaction reach. Finally the harbor's return from the drained bed settled lower than earlier short fixtures and caught the sluice lip at x=12.6249, y=0.7870, z=-7.8570. Two real-Rapier tests reproduced that failure. Lowering the existing 4-by-4 sluice pad from 0.4 to 0.2 units fixed it without lifting the browser ranger, weakening its driver or changing objective conditions. Retain the failure TAP files, native-recovery.json and sluice-lip-recovery-20260916.json.

## Compatibility and next work

LEVEL-PM-03a is complete as a scoped engineering subtask. LEVEL-PM-03, XR-DIO-02 and LEVEL-PM-04 remain open, as do the physical Xbox and human-animation gates. Tests use software WebGL, synthetic Xbox and explicitly mocked XR sessions, eye poses, controller rays and hand-select events. They do not certify physical Quest tracking, stereo, passthrough, room anchoring, comfort, device performance, enjoyment or production art. Classic legacy journeys retain their disclosed fixtures; Tidegate walking and service completion do not assign actors or objective state to manufacture success.

Keep dino-atlas.tidegate.v1, tidegate-crossing-v1, historical IDs, one-time report rules, every Classic namespace, control preferences and all three legal XR enclosure states. Never close both top and front. No new credits, reset or migration is introduced. Parked-vehicle poses still reset to their existing bays after reload. Before a rollback restores the north wall, move/save outside the doorway or retain that clearance until a tested migration exists; never discard an old save to hide a collision problem.

The next concrete design question is whether the high observation/feeder approach earns its extra travel through useful information and preparation after the player learns the harbor and service connection. Observe unfamiliar and returning players without coaching, inspect sightlines/camera readability at the doorway in each presentation, and compare actual decisions rather than route length alone. Do not add compulsory lookout triggers to force use of that path. Keep the source essay's goal: learned geography and operations should let players act more intentionally. Iterate observed confusion before expanding the campaign.

For another runtime change, refresh master and release identities, use a new release tag, preserve sibling work, run every documented suite, and verify public bytes/play separately. Do not reuse the immutable historical meaning of the .2 tag for later source.
