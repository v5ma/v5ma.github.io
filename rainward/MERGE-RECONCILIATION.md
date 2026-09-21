# Rainward merge reconciliation / 2026-09-21

This is a Rainward-only reconciliation onto current master, not a merge of old branch snapshots. The inspected baseline is fda53bedb376d54c3bad3bdacf5a15aba85dba61; its Rainward source is 03602e107a355a182a8c6e93f2d102ed4f8e88be. The version advances to 0.16.3 for the recovered runtime motion, not merely for documentation.

## PR147: recover the missing motion, retain the current characters

PR147 at 9e23d93b9cda8a32f474a5c6fc99c4953a5e2664 was never merged. Its advanced contact solver, displacement-based gait and separate swimming/treading curves were absent from the live game, which instead had Freefield's simpler foot loop. The historical final Grounded workflow passed, but that did not deliver the changes to master.

Recover grounded-motion.mjs and its applicable motion/posture tests. Integrate it through the existing footContacts call after the scene's base pose and terrain placement, not by overwriting actors.mjs or scene.mjs. This avoids two IK passes and a double terrain-height offset. Retain the exported legacy analytic solver for compatibility. Extend contact release to dodge and scale easing to the shorter stance interval at current 9-14 m/s running. The .105 sole height matches the retained skeleton, not the older branch's proportion fit.

Do not import character-proportions.mjs or the old rainworn-humans.mjs changes. The player's later feedback praises the current bodies and faces. Current geometry, skeleton binds, clothing, source GLBs, skin/face textures, material code and high-speed base gait remain byte-identical. Do not overwrite newer scene, release, controller, save or XR repairs with the old branch versions. General hand/weapon/traversal IK, arbitrary stairs and a full authored clip library remain unfinished.

## PR165: discard the incompatible Firebreak map, retain Freight Cut

PR165 at 1a8386597706a3c49f29f98fc43a0702218e9000 was never merged. Its proposed east-yard door, lowered central partition and new ward-freight-firebreak task are not in the game. Later Freight Cut already changed the same hall through the existing ward-radio repair, opening the west loading passage without adding a task/save field or reward. Blindly merging PR165 would combine incompatible wall and progression schemes or undo newer layout, save, UI and version changes.

Retain current district.mjs, freight-cut.mjs, field-tasks.mjs, supplies.mjs, scene.mjs and current source tests. Discard the old Firebreak runtime patch and its obsolete workflow; leave the original branch/PR history available as an archive. Do not apply its shared level-design-library edit because this task is limited to Rainward. The retained failed run reached the lever, loop and pickups but died near the quay; it must not be relabeled as a completed extraction. The current quay recovery/playtest opportunity remains open, not solved by this cleanup.

## Already delivered work stays delivered

PR194 XR Repair and PR214 Field Desk are already on master. Keep the four XR modes, tracked-muzzle/scope alignment, acquired clue reading, hold-B/R3 menu recovery, adjustable stationary desk, direct map/satchel/music access and truthful session-only storage warning. Do not merge those branches again or reinstate removed assembly helpers.

Correct stale continuation metadata that still described full VR as unimplemented, listed only three XR modes, or described all six other chapter layouts as unchanged despite Meridian relief. Preserve historical Undertow receipts and all human approval gates. The canonical plan and generated checklist must remain consistent.

## Validation and publication

The nested source-audit.json records protected runtime/asset hashes and exact branch decisions. Local Node tests cover the old five walking speeds plus current fast running at 30/60/120 Hz, transformed ankle residuals, water/dodge/reload/craft/heal boundaries and unchanged player objects. Failed local trials are retained rather than edited into passing evidence.

The actual WebGL benchmark compares the latest published Field Desk contact loop with the recovered adapter on the SAME retained character bodies, not the much older pre-Freefield rig. It reports all speed samples; the near-ground sample sets differ and no universal fast-run RMS or artistic improvement is claimed. Spatial and real-game compositor journeys remain distinct from this explicit animation/terrain fixture. Browser results and independent served-file hashes belong in the final delivery receipt; source presence alone is not public or physical-device approval.

Subsequent work goes directly to freshly reconciled master with non-forced updates. Do not create a PR/staging branch or temporary deployment workflow unless explicitly requested. Only Rainward paths and its own established verification workflow are changed. No private WebXR hub, engine migration, new portal, sibling game or new expedition is included.

The original user reference remains Daniel Holden's Inverse Kinematics and Foot Locking, https://theorangeduck.com/page/inverse-kinematics-foot-locking. This recovers original Rainward code from its documented branch; no external animation code, clips or weights are copied.
