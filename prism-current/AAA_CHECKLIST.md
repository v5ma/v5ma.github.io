# Prism Current / Friendly Current 0.12.2 production checklist

The current priority is the owner's physical playtest: easier entry, clear health, comprehensible incoming objects, slower ducks/aircraft, healing supplies and late bosses. PLAYABILITY-CHECKPOINT.md and qa/friendly-current-public.json identify the exact current runtime and test outcomes. Implementation, deployed bytes, complete automated acceptance and physical/creative approval are distinct.

Read AGENTS.md. Write directly to freshly reconciled master without force, PRs or staging branches. Preserve concurrent changes, old records, retained modes and private boundaries. Earlier stable task IDs remain in AAA_CHECKLIST-v0101.md and versioned module receipts. INTEGRATION-AUDIT.md describes a historical snapshot, not current live status.

## Friendly Current playability

- [x] PLAY-01 / implementation. Easy first-play default with four individually selected, saved profiles: Easy, Normal, Hard, Ultra Hard. Different item/enemy spacing, pass residence, travel time, health supplies, damage and boss endurance. Paused preferences cannot relabel an encounter.
- [x] PLAY-02 / implementation. Slower ducks and aircraft make repeated fruit/purple-block throws. Purple blocks support slice, laser and shield interactions. No red missile emitter. Spiked bombs occur only on Hard and Ultra Hard.
- [x] PLAY-03 / implementation. One-time mint plus-symbol health cases, collected by slice, laser or contact. Cap at HEALTH 100, no missed-case penalty and no resurrection of a failed run. Easier modes provide more supplies.
- [x] PLAY-04 / implementation. Large numeric HEALTH gauge, thick fill bar, low-health/damage/healing labels and controller/floor status. Stage-anchored rather than head-locked. Cache unchanged content and prepare its textures before audio.
- [x] PLAY-05 / implementation. No boss actor until the final phrase. Crowned paddlewheel Admiral Quack with twin fruit mortars and an actual upstream entrance. Mothership also arrives late. Clears require boss defeat and song completion.
- [x] PLAY-06 / preservation. Separate chapter/input/difficulty/Cruise records. Leave old River, Classic, lesson and expedition records untouched. Retain scenic modules, audio lifecycle, controller/hand-menu paths, drawing-buffer reuse and frame safeguards.
- [ ] PLAY-07 / recurring complete evidence. Runtime c5c426dd matched 124 public files and passed the 35-check source tracked AR/VR journey, including both Easy boss clears after actual damage, healing and block interactions. Its public tracked replay stopped after seven checks on a rendering pause. Preserve that failure and the separate desktop/companion results; do not mark the entire job green.
- [ ] PLAY-08 / owner/device approval. Physical Quest Easy playtest, health visibility, control feel, enjoyable mode progression, Xbox/touch and sustained ordinary-resolution performance.
- [x] PLAY-09 / direct Resume implementation. A new B/Y edge is not discarded by a previous pointer action's debounce. Keep native/polled latches, held-button edges and session/controller checks. Production-dispatcher fixtures and the completed source tracked journey exercise immediate Back-to-B recovery.

## Spatial interface

- [x] UI-R01 / implementation. Shared rendered screen/XR menu, supported direct chapter entry and explicit semantic-control alternative.
- [x] UI-R02 / implementation. Summonable pedestal with height, distance, scale, rotation and reset; no head-following placement.
- [x] UI-R03 / implementation. Painted controls and transformed picking agree; preserve rays, contact cursor, thumbstick/A-X, B/Y and hand menus.
- [x] UI-R04 / implementation. Explicit health, score and combo feedback, controller/floor options and world-associated boss health.
- [x] UI-R05 / implementation. Saved AR opacity and independent sound; ordinary room movement does not trigger the former arbitrary positional pause. Keep tracking/visibility recovery.
- [x] UI-R06 / implementation. Actual session end preserves a paused encounter in page memory for matching-mode re-entry, without reclassifying the score.
- [ ] UI-R07 / current source/public reliability. Repeat applicable journeys after code changes; historical Pass4 success is not a later-build approval.
- [ ] UI-R08 / physical and creative approval. Seated/standing visibility, comfort, mode entry, sound, movement, exit/re-entry and performance on actual hardware.
- [x] UI-R09 / implementation. Cancel stale audio resumes and preserve newer operations; require a visible calibrated matching session. The current named interruption reports are separate from this implementation box.

## Preserved graphics foundations and historical evidence

- [x] ENV-W01 / implementation. Independent water/ES facade, differentiated waves, authored-bed shading, sky approximation, foam, wakes/splashes, query and cleanup.
- [x] ENV-W02 / integration. Actual River observations under the recentered stage with saved opacity and quiet/quality controls.
- [x] ENV-W03 / reuse. API, coordinates, ownership, presets, research and tests beside source.
- [x] ENV-W04 / historical named tests. Water13 and object37 passed in the named Pass4 build; repeat relevant checks for later runtime changes.
- [x] ENV-F01 / implementation. Independent burst/jet/impact volume APIs, smoke, bounded embers/lights, clock, deduplication and cleanup.
- [x] ENV-F02 / integration. Actual destruction bursts and pre-audio preparation with renderer restoration; no persistent extra target or unrequested weapon.
- [x] ENV-F03 / historical named tests. Fire24 and object64 passed in the named Pass4 build; current failures remain separately recorded.
- [x] ENV-T01 / implementation. Seeded palm/alder/willow skeletons, prebuilt detail levels, real leaves, shared wind and explicit ownership.
- [x] ENV-T02 / integration. Eight grounded bank trees outside the action corridor; hidden in AR and Mothership.
- [x] ENV-T03 / historical named tests. Trees22 and object83 passed in the named Pass4 build; screenshots are not device benchmarks.
- [ ] ENV-HUMAN / device and artistic approval. Named-device timing, thermals, stereo appearance, visibility and owner judgment against reference imagery.
- [x] ENV-C01 / implementation. Avoid redundant same-ratio drawing-buffer resets while preserving actual quality changes.
- [x] ENV-C02 / implementation. Shared water/ground profile, wet banks, irregular stones, narrow reeds and reused sky texture.
- [x] ENV-C03 / historical diagnostics. Bounded optional frame/input diagnostics and negative/fixed resize reproduction, without lowering the frame safeguard.

Pass4 runtime 52b054d1a29411d5f1d302cbefb791aacb9eb89f passed 162 native checks per source/public job, 322 model tests and 117 public-file matches. modules/environment/PUBLIC-PASS4.json preserves exact receipts. Those results remain historical after intentional Friendly Current gameplay changes. The current local suite passes 359 model/lifecycle tests; full native outcomes are in the playability receipt.

## Remaining work

Either-blade ordinary rewards are implemented. Color-changing blades and color-match bonuses remain open. Spiked-bomb explosion danger-radius feedback is separate; a decorative flame radius is not damage. No new red missiles are scheduled.

Prioritize the new Easy playtest and reproducible frame/input failures before adding graphic cost. Fuller crowns, bark, shoreline and irregular flame/smoke remain polish opportunities. There is no new soundtrack, fluid solver, hand-only combat or unfinished-battle save across page closure.

A-03 export/recovery, accessible charts, calibration, onboarding, remapping and platform/accessibility coverage remain in the earlier board. F-02 exact source, F-03 direct fresh-master commit plus separate deployment/public hashes, and F-04 live recovery and scoped rollback recur every release. Do not reset master, clear localStorage, publish the full private/multi-game brief or overwrite sibling games.
