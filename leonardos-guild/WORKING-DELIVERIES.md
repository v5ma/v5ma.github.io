# Working Deliveries: WQ-PORTER

This is a named additive build of Waterwheel Quarter v0.14.0: guild-working-quarter-20260915. It is not a second city, a new save version, or a claim that all production gates have closed. The runtime baseline is published PR157, game tree 8fc826137c9f86e4e9edf84018ec7beded411d49, reconciled with master 78dad9840163bbacb7308118cde44a1bb4f525f6.

## Experience and hypothesis

The apprentice should recognize the opened arch not only as a faster way home but as part of a working household delivery circuit. Hypothesis: letting a repaired connection support visible cooperation gives the player a reason to choose and revisit the social route, without making roof and hydraulic exploration obsolete. The primary observation is whether a returning player chooses manual collection, a moving rendezvous, or the bell handoff for an understandable reason. Automated completion and scripted distances cannot answer that human question.

The five linked descriptions remain the same place. Physically, Neri follows Marta's workbench, the loading court, the repaired goods stairs, the shared gallery, the workshop descent and the open bell arch. Conditionally, the reusable service needs the reported commission, an active uncollected spindle order, the repaired loading drive and the opened arch. Behaviorally, Neri sorts goods, fetches, collects, carries, waits for a personal handoff, or returns a cancelled delivery before resuming loading work. Information comes from his visible spindle, the bell signal's posture, notebook status and existing objective marker. Embodiment uses the same support/collision functions and legal proximity/floor/visibility rules in desktop and spatial XR.

## Choice and recovery

After Leonardo starts the existing spindle delivery, manual pickup at Marta's bench still works immediately. The optional bell request trades a walk to the bench for an autonomous delivery wait. The apprentice can instead meet Neri in person along the restored route. Neither arrival nor looking from the diorama grants the spindle or pays a reward. The apprentice must take it and finish the original loft delivery. The established 15-florin/40-experience reward and every earlier reward remain unchanged.

Ring at the actual workshop-side bell with X and choose the request. A repeated request cannot spawn another actor or item. Before physical pickup, taking the spindle at Marta's bench cancels Neri's uncollected request. Once he has it, the bench cannot produce a duplicate. Request a return at the bell or intercept Neri for an in-person handoff. A cancelled carried order returns physically; it does not teleport the spindle back to the shelf. There is no deadline and no missed appointment. Close the menu to let the paused simulation proceed. Arrival waits indefinitely at the bell.

The porter completes his current small movement segment before changing destinations and checks player-equivalent floor support and collision in short substeps. A blocked connection makes him wait rather than warp. Requests cannot make him cross an unopened gate. Neri is not a new solid moving obstacle; player overlap cannot create a deadlock in peaceful Vinci. No extra map surface, hostile actor, sound source or collectible is added.

## Saves and input

The main save remains svgn.leonardos-guild.v1, outer version 2; layout and old IDs remain. The only additive saved field is normalized quarter.porterOrder: requested, ready, returning, or empty. It is valid only for the appropriate completed-case/open-connections/uncollected-spindle state. No arbitrary actor coordinates, travel clock, XR pose or physical-room data are serialized. An interrupted fetch restarts at the loading depot on reload; a ready order resumes at the bell; a returning order resumes at the bench for deposit. These are named save checkpoints, not live-travel teleports. Paid rewards and manual collection cannot duplicate.

Frequent controls, remaps, Classic/Xbox profiles, keyboard and touch remain unchanged. Requests and handoffs use the existing X/nearby UI. The same modal bridge is available to tracked controllers and hand-pinch UI. The three legal diorama openings and head-independent camera contracts remain unchanged. The native relay journey earns its entire state by ordinary input before testing a hand-pinch handoff in the actual stereo miniature.

## Reconciliation and roadmap

The public library's generic showcase-case, roof/cellar-route, persistent-repair and neighborhood-identity recommendations are already implemented by PR157. They were not rebuilt. This slice applies the still-open purposeful-routine/visible-outcome recommendation to the existing case. WQ-PORTER is a bounded advance of AAA-ROADMAP.md W04, W05 and S02, within NEXT06 and the machine-readable continuation queue. Those broad goals remain open, as do unfamiliar-player, replay, artwork and physical-device gates. All other roadmap IDs are retained.

Read the five shared library files at level-design-library/ before extending this slice. The source methodology's place-mastery and purposeful-routine sections support this application; the porter design and its timing are this implementation, not claims about any reference game's specific mechanics.

## Evidence and release discipline

Local graybox stage: 351 CPU/model/adapter checks pass, including nine new relay tests, plus the 14 retained design contracts. These check real route support, bounded continuous travel, conditional request, stopped/same-floor handoff, no autonomous reward, cancellation, a blocked gate, old-save normalization and named-checkpoint reload. No final decorative assets were imported. Small reusable spindle props and a bell signal communicate the proven model's state.

Local Chromium navigation returned ERR_BLOCKED_BY_ADMINISTRATOR; no local native acceptance is claimed. Retain that limitation. The established read-only Waterwheel workflow adds a separate relay journey to the three unchanged approaches and spatial journey. It must exercise ordinary committed source, actual controller input, pause, ready-order reload, cancellation/return, renewed dispatch, hand-pinch XR handoff, personal loft delivery and legacy departure. Archives contain the source hashes, empty source diffs, trace, reports and screenshots. Neither controller/XR emulation nor CPU fixtures count as physical-device approval.

Do not report publication from this document. Require the release PR's checks, inspect its actual captures, merge without force, then separately verify Pages, exact public runtime/assets and all five live journeys. Save the final receipt outside the game tree under release-receipts/. Failed and revealing tests remain part of the evidence.

Rollback is a new forward revert of the scoped runtime files, never a reset of master. The previous game ignores the additional order field and retains the uncollected/manual spindle state; it does not erase earned rewards. Read current master before writing so sibling games and library changes are preserved.

Next opportunity: test whether an unfamiliar player understands the visible delivery round and whether its wait offers enough useful observation to justify choosing it. Measure that against the direct bench route; shorten waits or improve the observable relationship before adding another district. Real Quest controllers/hands, actual passthrough, comfort, sustained frame times and human comprehension are unverified.
