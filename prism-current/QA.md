# Prism Current / Friendly Current 0.12.2 verification

The gameplay request, not more scenic complexity, is the current priority. Friendly Current introduces four encounter profiles, Easy by default, slower fruit/block enemies, one-time health supplies, explicit health displays and finale-only bosses. The exact current runtime is c5c426dd9082336768c7a08bfc6f88fd3915a03f. Read PLAYABILITY-CHECKPOINT.md and qa/friendly-current-public.json for the saved recovery point and exact reports.

## Evidence that is established

Run 35750825858's public manifest check matched all 124 listed Prism files to c5c426dd, including release 0.12.2, the actual app, XR, difficulty, core and health display. Source and public expected manifests are identical. Twelve protected runtime/entry hashes were independently checked against the local recovered worktree. Publication does not mean every playback test passed.

The dedicated checked-out-source AR/VR playability suite passed all 35 checks. It completed Duck Armada in AR and Mothership Channel in VR using the existing strict headset emulator. Both runs used actual tracked-pose, trigger and spatial-menu handlers to receive block damage, restore health with a laser-hit supply case, cut a block, shoot a block, keep paused difficulty unchanged, resume immediately after Back, observe a late boss and defeat it before song completion. The source report shows 12 real damage and 12 healed in each completed Easy run; these were not assigned by the test. Old score data remained untouched and new clears were stored under the actual input mode/difficulty.

Source primary artifact 10706645321 was downloaded and verified against SHA-256 ff88673b1f253c38b0ab6413af283c6ff23a3474e19649d69a9afdb791ac468f. The actual health canvas from its AR journey was inspected: the HEALTH label, current/maximum number, thick fill bar and supply/block rules are visible. A flat texture inspection is not physical headset readability testing.

All 359 local model, lifecycle and integration tests pass. These include the production health painter/preparation code and the actual XR action dispatcher under controlled collaborators. They do not replace a rendered journey or a physical controller test.

## Failures that remain open

The public tracked-input replay is not a complete pass. Artifact 10706945435, SHA-256 1ff4c00d95064549e97dadf3fae24e0fb078f016688dfc3296d9b1b8428131f9, contains the successful exact-file receipt and a failed playability report. Its first seven AR checks passed: entry, difficulty selection, HEALTH 100, no initial boss, actual damage, laser healing and the corresponding real heal event. It then paused at time 19.89095238095238 with the rendering-stall message before the remaining block/boss sequence. Health was 100 after three damage and three restored; there was no uncaught script or shader error. VR was not reached by that particular public suite.

The separate desktop quarter-resolution playability/performance checks remain independent and have recorded frame-stall failures. Other companion suites report their own results in the same run. Never reinterpret an omitted or failed sequence as a pass because a different suite completed the same chapter. The final receipt records each completed companion result when available, and otherwise explicitly identifies it as pending.

The 0.35-second pause safeguard, test drawing resolutions, genuine input requirements and gameplay outcomes were not relaxed. No test assigns actor position, clock, health, score, completion or menu state. Emulated device poses and buttons are inputs, not game-state overrides. Do not repeatedly retry until a green badge hides earlier failures.

## Repairs and continuation

PLAYABILITY-RECOVERY.md records the status-canvas caching and pre-audio upload. PLAYABILITY-XR-VERIFICATION.md explains why the primary XR path is tested separately from desktop startup. PLAYABILITY-DIRECT-RESUME.md records the actual discarded B/Y edge: only a fresh direct start/resume command bypasses the prior pointer-action debounce. Native selection latches, held-button checks, session visibility, calibration and controller availability remain intact.

The next owner playtest should judge the new Easy density, slower throws, health visibility and late boss before more visual cost or harder patterns are added. Persistent physical-device pauses need timing evidence from the actual presentation; this source/public disagreement does not prove either that the tree shader is responsible or that every stall is only an emulator artifact.

Physical Quest/Xbox/touch, sustained ordinary-resolution frame times, thermal behavior, comfortable health placement and enjoyable difficulty remain unverified. Earlier Pass4 graphics results remain in modules/environment/PUBLIC-PASS4.json and related notes, not as approval of this later gameplay change. Legacy modes, soundtracks, records, private boundaries and sibling games remain protected by the direct-master maintenance contract.
