# Prism Current / Color Match 0.13.0 + Clear Shoals production checklist

The priority remains the owner's AR playtest: easy entry, clear health and points, understandable targets, slower enemies, healing, late bosses and unobstructed room visibility. Current code is Color Match 0.13.0 with AR Tide 0.1.1 and Water Optics 0.2.0. FUTURE-DIRECTION.md and modules/environment/CLEAR-SHOALS-RESULT.md are the current continuation/evidence entry points. Earlier receipts preserve history, not approval of every later runtime.

Read AGENTS.md. Write directly to fresh master without force, PRs or staging branches. Preserve concurrent changes, existing ledgers, retained modes and private boundaries. Earlier stable task identifiers remain in the versioned boards and module receipts.

## Playability and controls

- [x] PLAY-01 / implementation. Saved Easy, Normal, Hard and Ultra Hard profiles; Easy first-play default. Quantity, timing and recovery vary without changing soundtrack speed. A paused run retains its original difficulty.
- [x] PLAY-02 / implementation. Slower ducks and aircraft throw repeated fruit/block patterns. Purple blocks can be cut, shot or shielded. No invulnerable red missile emitter. Spiked bombs appear only on Hard/Ultra Hard.
- [x] PLAY-03 / implementation. One-time mint plus-sign healing cases; slice, shoot or touch to heal to at most 100. Missing a case does not hurt the player.
- [x] PLAY-04 / implementation. Large numeric HEALTH, thick fill bar, explicit damage/healing/low-health feedback and controller/floor status. Cached and prepared status textures; no head-locked dashboard.
- [x] PLAY-05 / implementation. Admiral Quack and mothership enter only in the final phrase. Clears require actual boss defeat and song completion.
- [x] PLAY-06 / preservation. Chapter/input/difficulty/Cruise records; old River, pacing, Classic, lesson and expedition stores unchanged. Color Match uses its own ledger.
- [ ] PLAY-07 / recurring reliability. A focused source Clear Shoals full Easy AR journey passes, but its first public counterpart paused early. Preserve separate AR Tide/Field Guide/legacy failures and actual retry results. No blanket green claim.
- [ ] PLAY-08 / owner/device. Quest AR control feel, health/target contrast, enjoyable pacing, Xbox/touch and sustained frame times.
- [x] PLAY-09 / direct Resume. A fresh B/Y edge is not discarded by a prior pointer action; preserve latches and tracking/session checks.
- [x] COLOR-01 / implementation. Direct independent saber colors, redundant symbols, valid either-blade base rewards and additive match bonuses. Enlarged Easy fruit badges remain visible. New scoring does not overwrite earlier ledgers.

## Spatial interface

- [x] UI-R01 / implementation. Shared rendered screen/XR menu, supported direct chapter entries and F2 semantic controls.
- [x] UI-R02 / implementation. Summonable world-anchored pedestal with height, distance, scale, rotation and reset.
- [x] UI-R03 / implementation. Picking follows painted controls; visible rays/cursor, thumbstick/A-X, direct B/Y and hand-menu support. No advertised hand-only combat.
- [x] UI-R04 / implementation. Health, points, combo and matching feedback stay compact; boss health remains in the world.
- [x] UI-R05 / implementation. Saved opacity and separate sound. Ordinary movement does not invoke the former arbitrary position box; real visibility/tracking recovery remains.
- [x] UI-R06 / implementation. Actual XR exit with paused page-memory recovery for matching-mode re-entry.
- [ ] UI-R07 / repeated native/public validation. Every runtime change reopens its relevant input and interruption checks.
- [ ] UI-R08 / physical approval. Seated/standing visibility, comfort, sound, movement, session recovery and device performance.
- [x] UI-R09 / implementation. Cancel stale asynchronous resumes without overwriting newer operations.
- [x] UI-GUIDE / implementation. Three FlexSurface teaching cards on AR pre-battle/paused Controls; hidden during combat and excluded from picking. Not an HTML-backed UI replacement.

## Reusable environment

- [x] ENV-W01 / implementation. Water 0.1.0 geometry, analytic derivatives, CPU query, pausable clock, bounded wakes/splashes, quality and ownership.
- [x] ENV-F01 / implementation. Fire 0.1.3 bursts/jets/impacts, smoke/embers, fixed budgets and loading preparation. Actual destruction bursts only in Prism; no new flamethrower or cosmetic-to-damage equivalence.
- [x] ENV-T01 / implementation. Trees 0.1.3 seeded geometry, prebuilt detail, shared root-fixed wind and cleanup.
- [x] ENV-AR / implementation. Two compact islands, tree plantings, clouds and grass in Duck Armada AR. Saved minimal scenery, near-viewer hiding, quiet clock and unchanged target corridor. Screen/VR and Mothership preserve their intended presentation.
- [x] SH-W01 / implementation. Reversible Water Optics 0.2.0 on existing water; no change to geometry, height query, wakes, saved opacity or game state.
- [x] SH-W02 / implementation. Original pebble data, seeded slope/moment filtering, reference-depth refracted-light caustics and MIT-attributed Fresnel. Two loading-time textures; no new scene pass, FFT renderer or copied texture asset.
- [x] SH-W03 / local/source evidence. 431 model/data tests, 19 actual-Three optics checks and 26 native focused source checks including a full Easy AR battle. Object tests are not GPU or hardware evidence.
- [ ] SH-W04 / full public reliability. First corrected public test matched all 25 loaded runtime files and passed 18 checks before a frame pause. Read the recorded unchanged retry separately. Preserve the first opacity-test failure and corrected surface-overlap interpretation.
- [ ] ENV-HUMAN / physical and creative acceptance. Actual Quest appearance, ordinary-resolution frame times, thermals, stereo consistency, room/target visibility and owner judgment.

## Open work and recurring gates

Color switching and matching bonuses are implemented; do not recreate them. Richer boss phases, authored new chapters, new soundtracks, optional rehearsal and understandable spiked-bomb danger radii remain separate work. Decorative radius is not gameplay damage. No full fluid solver, real-room refraction, hand-only combat, private hub or portals are included.

Clear Shoals caustics are precomputed at a reference depth then advected, not live geometric-wave focusing. Opacity applies per surface; distant overlaps may compound it. Zero opacity and AR near-viewer fade remain. Keep these limits explicit in reuse docs.

F-02 exact-source checks, F-03 fresh-master write plus separate deployment/hash inspection, and F-04 actual input/recovery with scoped rollback recur each release. A successful source run or screenshot cannot erase a public failure or substitute for physical approval. Preserve the 0.35-second safeguard, original input/score requirements and failed traces. Never clear localStorage or reset sibling work.
