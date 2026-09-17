# Canal Choice v0.25: know why you take the lower route

This is the next bounded Waterwheel chapter-design slice, not a replacement game or another destination. Release and exact-source evidence are controlled by `verification/canal-choice-0.25.json`. A candidate, unit test or merge does not establish publication.

## Intended experience and source reconciliation

Approach Express Junction with a partial understanding of its tracks. Learn that keeping speed carries the courier through the mill crescent and postal gallery toward the wheelhouse, while braking and releasing can select the canal collector and return to useful Millworkers deliveries. The road remains a complete third choice. Knowing the junction should enable an intentional route, not just reduce deaths.

The shared library was read at master `a0ce5803b0f3bab305314187fba6075e3d0e90ce`: AGENTS, STUDIO-LEVEL-DESIGN-MANUAL, GAME-RECOMMENDATIONS, QUALITY-REVIEW-FRAMEWORK, INDUSTRY-REFERENCE-NOTES and SKY-CYCLE-LEVEL-DESIGN. The last remains authoritative for movement direction. Its connected approach/launch/receiver/onward/recovery method matches this game's `LEVEL-DESIGN-METHODOLOGY.md` and the existing Waterwheel workbook. This is an implementation of that workbook's open speed/brake fork, tracked as WW-R2-BRAKE, not a duplicate roadmap.

The library's earlier snapshot predates v0.24 delivery qualification. The new portal catalog, rider pedal/grip IK, Quiet Water comfort controls, Waterwheel preview, twelve delivery intentions, edited-document protection and tracked XR already exist and are retained rather than recreated. The public v0.24 recovery now passes all 28 owned-file comparisons and the published twelve-delivery replay; its own receipt records that separate result. Some lowercase derivative filenames mentioned by the library README are absent in the public source edition; the actual uppercase manuals and ARTIFACTS-INDEX were used, without inventing missing structured recommendations.

## One hypothesis and one geometry change

Hypothesis: an earlier, broader receiving surface plus advance route-purpose information makes the lower line a deliberate delivery route and accommodates a wider set of braking approaches without changing movement physics.

Only the existing `ww-collector` curve changes. Its first point moves from world (4300,1990) to (4060,1970), with controls (4320,2030) and (4740,2050). Its endpoint stays (4980,2076). The seven rail IDs, remaining six curves, world dimensions, ground terrain, twelve mailbox positions, five checkpoints, authored encounters and original eight campaign builders remain intact. No new enemy, reward, track count, input action, steering assistance or collision exception is added.

The high line keeps its purpose: continuous expressive travel toward the wheelhouse. The lower line rejoins before the Millworkers terrace mailbox, making delivery opportunity a concrete reason to brake. Native acceptance must demonstrate that actual packet delivery after the lower-line return, not merely assert that the geometry is connected. Ground-only and ordinary-road regressions stay required.

Advance signs describe the choice before the runway jump. Markings on the late runway section identify where to try the brake, and a lower-line sign names the return's purpose. Existing NPC text and the preview introduction reinforce the same rule. Information is static and available with music/effects muted and optional pop-ups suppressed. The markings are derived from the loaded document's runway, not a hidden trigger or canonical path painted over an edited Workshop curve. They never move the rider.

## Graybox and native evidence classes

The initial isolated comparison used one seeded approach, two grip modes, seven braking thresholds and five finite hold durations: 70 cases per geometry. At remaining-arc threshold 200, the old receiver caught four of ten cases and six returned directly to the road; the extended receiver caught ten of ten. All ten no-brake samples preserved the four-section upper chain. A direct road return is not counted as a death or an unusable level. These are bounded model observations, not human success rates or universal reachability.

The deterministic suite adds metadata/codec, support clearance and geometry-derived cue checks, including an explicitly isolated rendering fixture that shifts an edited runway and requires its markings to follow without rewriting the document. Native cases start at the actual preview UI, ride the original terrain, use the ordinary Gamepad poll and keep the original collision, enemy, packet, win and persistence owners. No actor coordinates, velocities, scores, deliveries, records or wins are assigned. Three-dimensional composition is inspected through the real Pause / Inspect scene controls; full CPU-runner rides use the supported 2D renderer.

The native matrix distinguishes speed-retaining high travel, a finite lower brake with a real terrace delivery, an earlier finite brake/release, and temporary neutral coasting, in Forgiving and Precision grip. Existing porch, road, ground-only, express, twelve-delivery, Tideglass, Sunrise and tracked-controller/hand-XR suites remain required. The source receipt records which actually pass and at what SHA.

## Revealing and retained attempts

Candidate `4f38d07cca4746a92c9cdd3b4cf003eb30528bf6`, run `35148340790`, exposed two test defects and one useful native behavior. The twelve-delivery test read SkyCycleFlightDeck before its asynchronous owner loaded. Its report had no page/console errors and no completed checks. Artifact `10467882158`, SHA-256 `c753c6ba6700c873bc33a710ed1553bdf9e5cd4076f0eda73bf543c18682e7ce`, is retained. The correction waits for that real owner; delivery and save assertions are unchanged.

The first lower input recipe counted rendered frames, while the existing accumulator can execute up to six fixed simulation steps per frame. The courier genuinely caught the collector, held left long enough to reverse on it, revisited the runway and regained the road before the intended downstream return. Artifact `10467807734`, SHA-256 `f9eeb7ae6bb655cb04662c66a6bdcc282dc499e37e3f9078adad0959d352aa2d`, retains the failed lower-return assertion and trace. This is not evidence that every long brake selects the intended line. The corrected test samples the native fixed-step Gamepad poll and records real contact changes; its declared lower hold is 18 simulation samples, its earlier hold 24 and its neutral-coast interval 70. The application physics is unchanged.

The earlier high run did finish normally, but its composition captures showed the opaque pause menu rather than the signs. Artifact `10468401439`, SHA-256 `07b55650fd23f1991416c65d77baa5e6ef17becc91f7b8e8c7a0ef0e219813aa`, retains that distinction. Camera projection alone was not accepted as visual review. Later captures use the existing Inspect scene command and include a controller-paused native collector contact. Superseded branch runs are not counted as acceptance.

## Preservation, publication and next opportunity

Keep the Waterwheel preview non-awarding. It is not a ninth route or the promoted replacement of `canal-choices`; the reserved `canal-choices-r2` record remains inactive. Preserve independent saves, temporary-credit restoration, dirty-draft blocking, previous-blueprint backup, controller remaps, music ownership, rider IK and the seated side-on XR input/render lifecycle. Advanced Bezier manipulation remains pointer-required.

After exact-source acceptance and capture review, merge normally with expected-head protection, compare all 29 owned public runtime files, and replay the lower-line delivery journey on the public origin. Do not force an old Pages deployment when sibling changes supersede it.

The optional high-to-high whip connection is next, with a non-whip continuation required. Broader early/late/reverse/underside recoveries, checkpoint-delivery retries, multiple approach speeds, full 3D/XR chapter completion, physical Xbox/Quest/mobile, external readability/pacing and revision-aware campaign promotion remain distinct open gates. These tests must not be advertised as unfamiliar-player enjoyment or physical-device approval.
