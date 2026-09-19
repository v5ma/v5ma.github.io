# River Prism 0.10.0: active production checklist

The owner's latest direction is the main-game rhythmic action toybox: a rising river, duck catapults, airborne fruit, bombboats, aircraft, saber lasers, grip shields and mothership combat. This is not a separate exploration detour. The complete earlier board is preserved at AAA_CHECKLIST-v090.md, with its previous archives and open reliability/accessibility tasks. No historical testing count constitutes owner approval of music or fun.

Implementation owner: Development. Creative acceptance: Micah. Physical-device acceptance: an actual Quest/Xbox/touch tester, not browser emulation. P0 means a blocker for the announced release scope; P1 means next product refinement; P2 means later expansion.

## Current playable slice

- [x] RV-01 / P1. Two approximately 89-second beat-authored chapters: Duck Armada and Mothership Channel. River tide and enemy families change across four phases; the final boss must actually be defeated before a clear is recorded.
- [x] RV-02 / P0. Eight-direction swept fruit cuts, aimed lasers, oriented projectile-blocking shields, timed stronger reflections, damage, dodging and explicit escape/failure results use one gameplay state.
- [x] RV-03 / P1. Original merged toy models, approaching analytic water, foam, caustic-like patterns and capped effects. Camera is not moved by rising water. These effects are not ray-traced fluid optics.
- [x] RV-04 / P0. Desktop and standard-controller combat; tracked XR saber/laser/shield input; accessible spatial pause/menu controls; hand pinch menu input. Full hand-tracked combat is not included.
- [x] RV-05 / P0. Separate River record namespace; original rhythm entry and release copied to rhythm.html and rhythm-release.json; all older scripts/music and save readers retained.
- [ ] RV-06 / P0 per release. Exact-source native acceptance must complete both chapters, exercise gamepad and tracked controls, preserve old saves and verify deployed hashes. Results belong in PR #193, not inferred from these implementation boxes.
- [ ] RV-HUMAN / P1. Owner play/listening feedback, unfamiliar-player readability and physical Quest/Xbox/touch comfort/performance. Neither automated success nor a screenshot closes this gate.

## Acceptance and limits

Both chapters use the existing original Undertow soundtrack. This edition is not two newly licensed or newly recorded songs. The main entry must expose the new battles without hiding them behind a side-mode link. The former note-based game and its lessons/practice remain explicitly reachable.

A saved clear requires a destroyed boss and completed song. Ignoring the boss must yield an escape; Cruise may prevent hull failure but cannot fabricate a boss kill. Failed/aborted attempts cannot become wins. Input verification must never assign actor position, health, score, time, inventory or completion to manufacture a pass.

Maintain no forced XR camera motion, readable projectile telegraphs, bounded reachable combat, same-hand shield exclusion of its gun/blade, tracking-loss pause and explicit resume. Desktop and head-tracked sidesteps/dodges are not a promise of arbitrary room-scale locomotion. AR is a transparent stage, not a furniture scan.

## Retained roadmap and next work

The previous A-03 save export/recovery, authored accessible charts, remapping, audio calibration, human onboarding review, music approval, hardware thermal/latency measurements and full platform matrix remain open under AAA_CHECKLIST-v090.md and its linked detailed archives. Retain old formats; do not clear storage or reset sibling projects.

After this first River playtest, prioritize the owner's observed problems in cut readability, enemy variety, sound and controller feel before adding another side mode. Additional chapter-specific compositions, deeper enemy patterns and measured performance improvements depend on that feedback.

F-02 source tests, F-03 normal merge/deployment with exact served-file hashes, and F-04 live gameplay plus scoped rollback are recurring obligations for every release. PR #193 records their actual state. Revert only this release on current master to roll back; do not reset unrelated game work.
