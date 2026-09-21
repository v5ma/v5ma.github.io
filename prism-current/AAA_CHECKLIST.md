# Prism Current / Rotunda 0.11.1 + Water 0.1.0 production checklist

This pass implements the owner's Prism-only spatial-interface direction. Read AGENTS.md and INTEGRATION-AUDIT.md for the current direct-master maintenance decision; ROTUNDA.md and historical PR #205 retain the interface design and earlier evidence. The complete 0.10.1 board is retained at AAA_CHECKLIST-v0101.md, including all earlier task identifiers and archives. Earlier checks are not human approval of the new interface.

## Current UI milestone

- [x] UI-R01 / implementation. One scene-rendered menu for screen and XR. Direct Duck Armada and Mothership AR/VR/screen choices. Retain explicit semantic text controls as an alternative.
- [x] UI-R02 / implementation. Summonable floor pedestal, stowed during combat, with height, distance, scale and rotation controls. Placement stays world-anchored rather than following head motion. Reset is directly reachable.
- [x] UI-R03 / implementation. Painted button extents and scene picking stay aligned under transforms. Preserve rays, intersection cursor, thumbstick/A-X selection, B-Y direct start/pause/resume and hand-pinch menu access.
- [x] UI-R04 / implementation. Compact controller-mounted score, hull and combo with a floor alternative and brief actual score/damage deltas. Preserve boss health in the world.
- [x] UI-R05 / implementation. Saved AR water opacity and separate sound controls. Menu adjustment does not restart an encounter. Remove the arbitrary positional pause while keeping actual tracking/visibility recovery.
- [x] UI-R06 / implementation. End the immersive session and retain the current paused battle in memory for same-mode re-entry. Do not silently reclassify an XR score as screen play.
- [ ] UI-R07 / recurring source/public gate. Run exact-source model and actual-renderer input tests, then verify committed bytes and playable journeys on GitHub Pages. Outcomes are recorded by exact SHA in the release discussion, not inferred from code presence.
- [ ] UI-R08 / owner/device gate. Physical Quest AR/VR, Xbox, touch, seated/standing readability, sound adjustment, exit/re-entry, room movement, ordinary-resolution performance and owner approval remain open until playtested.
- [x] UI-R09 / implementation. Cancel pending audio resumes on interruption and require the same visible calibrated session before playback. Preserve the paused battle; stale promises cannot unlock or overwrite a newer request. Ten regression fixtures cover the actual component methods. Native fault-injection and public acceptance are separate gates; see INTERRUPTION-RECOVERY.md.

## Preserved work and open feedback

RV-01 through RV-06, the core chapters, old music, scoring rules, saves, native-shaped XR controller handling, classic rhythm, lessons, Practice Lab and Floodgate Recovery retain their contracts. All prior source/device gates remain documented in the archived board. No private hub code, portals or sibling-game changes are authorized by this pass.

This release does not implement color-changing blades, base rewards for either-color fruit cuts, color-match bonuses, redesigned missile counterplay or explosion-radius visualization. Those Prism playtest items remain next gameplay work. The Currentworks Water first pass below improves the main river; it does not add an FFT ocean, a soundtrack, new chapters, persistent mid-battle saving across browser closure or full hand-only combat.

A-03 save export/recovery, authored accessible charts, calibration, human onboarding, remapping and the full performance/accessibility matrix remain open under the historical board. Preserve failed traces and distinguish model fixtures, input emulation, physical-device feedback and published-file verification.

F-02 exact source tests, F-03 direct, fresh-master commit followed by separate deployment/public hashes, and F-04 live input recovery plus scoped rollback recur every release. UI implementation alone does not close them. Revert only this scoped release on current master; never reset unrelated games or clear localStorage.

## Integration reconciliation

All 14 audited Prism branch tips are already integrated; no lost branch feature or open Prism pull request was found. Keep the current 0.11.1 app and later test correction rather than merging an older snapshot again. The inspected public receipt still served the older app, which is a deployment discrepancy, not a merge conflict. See INTEGRATION-AUDIT.md for the exact evidence and outstanding features.

The owner requires direct writes to master without new PRs or staging branches. Reconcile concurrent master changes first and never force an update. The existing verification is read-only; source and public outcomes are independent. No failed check, skipped replay or historical pass closes UI-R07 or UI-R08.

## Currentworks environment modules / Pass 1

- [x] ENV-W01 / implementation. An independent WebGL2 water module and ES facade, using the host Three.js and clock. Analytic wave geometry/normals, procedural surface data, authored-depth shading, Fresnel sky approximation, foam, bounded wakes/splashes, reset and disposal.
- [x] ENV-W02 / integration. Replace only RiverArt's former water surface; preserve the recentered stage, saved AR opacity, quiet controls, input, combat, sound and scores. Observe real moving boats and actual destruction events without altering actors.
- [x] ENV-W03 / reusable source. API, coordinate/ownership limits, research, construction presets, tests and continuation notes are saved beside the module. Periodic checkpoints use direct-master writes and retain concurrent changes.
- [ ] ENV-W04 / recurring evidence gate. Consult the exact source/public reports in modules/environment/VALIDATION.md. A local object/shader pass is not a public gameplay or physical-device pass. Repeat applicable gates after subsequent source changes.
- [ ] ENV-F01 / next pass. Independently owned fire module for jets, bursts and impacts; paused-clock lifecycle, quality limits, smoke/embers and actual-event integration. No new weapon or blast damage is implied by decorative fire.
- [ ] ENV-T01 / following pass. Seeded trees/foliage with reusable construction, LOD, host-driven wind and ownership cleanup. Preserve combat sightlines and transparent AR.
- [ ] ENV-HUMAN / device and creative acceptance. Physical Quest/Xbox/touch, ordinary-resolution performance, stereo appearance, readability and owner review against the supplied visual references.

The Currentworks module README, ROADMAP and CHECKPOINT are the entry points for the next coding session. The first native CI failure exposed the root ES-module package scope; Prism's local CommonJS boundary fixes it without changing the browser code or weakening tests. The saved report retains that failure and distinguishes it from later runs.
