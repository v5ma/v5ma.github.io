# Prism Current / Rotunda 0.11.0 production checklist

This pass implements the owner's Prism-only spatial-interface direction. Read ROTUNDA.md and PR #205 for exact scope and observed tests. The complete 0.10.1 board is retained at AAA_CHECKLIST-v0101.md, including all earlier task identifiers and archives. Earlier checks are not human approval of the new interface.

## Current UI milestone

- [x] UI-R01 / implementation. One scene-rendered menu for screen and XR. Direct Duck Armada and Mothership AR/VR/screen choices. Retain explicit semantic text controls as an alternative.
- [x] UI-R02 / implementation. Summonable floor pedestal, stowed during combat, with height, distance, scale and rotation controls. Placement stays world-anchored rather than following head motion. Reset is directly reachable.
- [x] UI-R03 / implementation. Painted button extents and scene picking stay aligned under transforms. Preserve rays, intersection cursor, thumbstick/A-X selection, B-Y direct start/pause/resume and hand-pinch menu access.
- [x] UI-R04 / implementation. Compact controller-mounted score, hull and combo with a floor alternative and brief actual score/damage deltas. Preserve boss health in the world.
- [x] UI-R05 / implementation. Saved AR water opacity and separate sound controls. Menu adjustment does not restart an encounter. Remove the arbitrary positional pause while keeping actual tracking/visibility recovery.
- [x] UI-R06 / implementation. End the immersive session and retain the current paused battle in memory for same-mode re-entry. Do not silently reclassify an XR score as screen play.
- [ ] UI-R07 / recurring source/public gate. Run exact-source model and actual-renderer input tests, then verify committed bytes and playable journeys on GitHub Pages. Outcomes are recorded by exact SHA in PR #205, not inferred from code presence.
- [ ] UI-R08 / owner/device gate. Physical Quest AR/VR, Xbox, touch, seated/standing readability, sound adjustment, exit/re-entry, room movement, ordinary-resolution performance and owner approval remain open until playtested.

## Preserved work and open feedback

RV-01 through RV-06, the core chapters, old music, scoring rules, saves, native-shaped XR controller handling, classic rhythm, lessons, Practice Lab and Floodgate Recovery retain their contracts. All prior source/device gates remain documented in the archived board. No private hub code, portals or sibling-game changes are authorized by this pass.

This release does not implement color-changing blades, base rewards for either-color fruit cuts, color-match bonuses, redesigned missile counterplay or explosion-radius visualization. Those Prism playtest items remain next gameplay work. It also does not add a new ocean shader, soundtrack, new chapters, persistent mid-battle saving across browser closure or full hand-only combat.

A-03 save export/recovery, authored accessible charts, calibration, human onboarding, remapping and the full performance/accessibility matrix remain open under the historical board. Preserve failed traces and distinguish model fixtures, input emulation, physical-device feedback and published-file verification.

F-02 exact source tests, F-03 normal merge/deployment with public hashes, and F-04 live input recovery plus scoped rollback recur every release. UI implementation alone does not close them. Revert only this scoped release on current master; never reset unrelated games or clear localStorage.
