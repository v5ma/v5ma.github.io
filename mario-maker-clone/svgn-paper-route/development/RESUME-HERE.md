# Resume Sky Cycle: Spatial Workspace v0.26

Continue the existing game in `mario-maker-clone/svgn-paper-route/`. The authoritative current release state is `verification/spatial-workspace-0.26.json`. Read it before making source, native acceptance, merge or live-publication claims. Follow `GITHUB-RELEASE-PROCESS.md`; do not reset master, clear saves, substitute model success for native play or stop at an unverified branch while release access remains available.

## Active work and exact recovery boundary

The user requested AR/VR and strong XR UI through game and menu modes, with A-Frame suggested as a possible wrapper. The implementation extends the existing native WebXR renderer instead. One Three scene/renderer preserves original node materials, loop ownership, game truth, controller remaps and Workshop documents. No A-Frame dependency, new camera-pixel access or second progression owner is introduced.

Initial master was `dd4a9d2a35ea667fd33f3ed2b597aeda15cb27e5`; its game runtime matched accepted v0.24 source `94dbd1176474017a68aa7ae55fee8ae9d8a3d656`. Current feature branch is `sky-cycle/spatial-workspace-0.26`. Source `3d857644b9526340e631718ccdd18bdad820b2c4` passed complete AR and VR editor/menu journeys in run `35283088291`: 39 AR and 38 VR assertions, with no page/shader errors. Its 268 game and 12 score tests passed. Subsequent label-only source `1725b9990ed9b60b69e056f89a773db7b9ac35a0` is tested by run `35283665810`. It uses rendered labels and concise route names instead of leaking embedded styling text. Its final acceptance and publication status belongs in the receipt, not this checkpoint paragraph.

The publication workflow separately compares 32 owned public runtime files with the merged source, then repeats both immersive software journeys against the public origin. Never infer live success from the CI source suite or a version label. Preserve a newer combined-master deployment containing unchanged Sky Cycle bytes rather than forcing an older publisher. Refresh master and inspect other Sky Cycle branches before modifying or merging.

## What the spatial implementation changes

Actual immersive-ar and immersive-vr requests have independent capability checks and entry buttons. AR alpha-clears the exterior of a clipped, rider-following exhibit; VR uses an opaque scene. The clipping is presentation, not a new limit on the authored world. Manual seated recenter, size, height, distance and yaw do not move collision or the rider. Recovery menus remain at the recentered heading while the exhibit rotates.

3D riding reuses the actual scene. Supported 2D play and the two editor presentations use live existing canvases in the headset. No scene-copy gameplay or static screenshot stands in for the original game. Modern Workshop rays dispatch ordinary pointer down/move/up/cancel events. Direct Select, Pan, Undo, Redo, Fit, Zoom and Playtest controls reduce repeated tool-menu trips. Resume editing dismisses only the tools menu; Back to game remains a different action.

The DOM still owns every menu action. Paged XR controls include checkboxes with actual state, slider/select/number adjustment, summaries, text fields and cancel/approval dialogs. A bounded text keyboard applies the real input/change events and validates the field. Cancel does not commit the buffer. Password values are not shown on the panel. Focused controls reveal their current page; split-page plus/minus controls retain the visible occurrence rather than jumping to the first occurrence.

All menus is root navigation and cancels pending uncommitted dialogs rather than approving them. Virtual game menus hold the simulation paused across delayed legacy dialog-close callbacks. Existing synchronous destructive guards first cancel; deliberate approval replays only the same still-connected control and exact question. Approval tokens are scoped to that call, never persisted or logged. Changed questions require a new decision.

File selection, native permissions, external links, clipboard/fullscreen/reload and raw hardware binding are browser-owned. The user explicitly chooses to leave XR, then presses a fresh Continue in the browser. Cancel preserves the game/draft and current session. External network/account success is not certified by a mirrored menu.

## Controls and invariants

Xbox defaults and saved remaps remain: A jumps, RT/X boosts, RB/B throws, LB/Y whips, Start pauses, View opens Flight Deck, and D-pad Down interacts nearby. A on a real text field now shares the headset keyboard route with tracked rays. Flight Deck exposes the wider game/editor menus during XR, and Spatial setup has a native controller-focusable Exit XR button. Do not remove established direct gameplay bindings.

Tracked controllers retain left-stick ride/brake/reel, right A jump, right trigger paper, right grip whip, left trigger boost, left X nearby use, right B pause/back and left Y Flight Deck. Controller rays and native hand-select events operate the same UI. The compact hand action bar supports ordinary riding; a brief pinch pauses immediately rather than waiting for a sample that may miss it. Held actions and editor capture release on source loss, visibility loss, cancellation and exit.

All eight campaign IDs/indices remain stable. Sunrise is index 4 / `first-neighborhood`; Tideglass is index 7 / `tideglass-baths`. Portal travel starts a new run, protects dirty work and does not bank unfinished progress. Preserve medals, credits, ledger, ghosts, pack progress, career, journal stamps, Market Pilot, Keeper, audio/graphics preferences, remaps and every Workshop namespace. No storage migration or consolidation is introduced. Waterwheel remains a non-awarding editable preview, not a ninth campaign route; temporary preview credits restore on return and `canal-choices-r2` campaign awards remain inactive.

Rider IK still locks visual pedal/grip contacts without changing physics. Water is scenic, not swimming. XR is seated side-on presentation, not first-person cycling. The guarded WebGL reload must reject active/dirty/testing Workshop state rather than lose it. AR/VR switching is a deliberate new session preserving the same tab's document, not an unsupported in-place browser-session conversion.

## Integration traps and retained failures

The pinned r177 XR manager captures the application animation callback when setSession runs. Installing setAnimationLoop(frame) afterward bypassed its camera/framebuffer wrapper and produced blank stereo output despite two reported views. Install the application callback first. On session end, let Three's synchronous cleanup complete before clearing the callback and restoring ordinary renderer ownership. Keep strict real framebuffer completeness, nonempty-image, opacity and color-diversity checks; frame counters alone are not rendering acceptance.

Detach the original game-owned scene before disposing XR presentation resources. Never dispose its materials with the temporary scene. Preserve the opaque-framebuffer adapter. Node materials must import from the compatible vendored Three module, not assume the legacy facade exports everything. The UI transparent overlay order and pointer order remain independent of scenery. No second music, audio-context or animation-loop owner is added.

The first pan-test failure selected Back to game through an ambiguous label, so it had left Workshop before dragging. A distinct Resume editing action and explicit active-editor/tool/drag assertions now establish the real pan path. Another test waited for XR frames after deliberately ending the session; the helper now observes session termination while retaining explicit ownership/draft/re-entry assertions. A delivery test read Flight Deck before its module loaded; it now waits for the actual dependency. Split-page focus and raw style-text labels were real presentation defects found during regression/capture review. Retain all corresponding artifacts and source IDs in the receipt.

## Next content work: preserve the unmerged Canal Choice branch

`sky-cycle/canal-choice-0.25` at `c946e556d1a4d970e4e406d09b7a1f547ae0e8a7` contains the prior movement-first level-design work. This XR branch does not merge its fork geometry. Only its short-pinch pause correction is incorporated. Recover its handoff, source and artifacts and reconcile them against the newly accepted XR files; do not recreate the fork from the old model or overwrite either implementation wholesale.

Continue the public `level-design-library/SKY-CYCLE-LEVEL-DESIGN.md`, `LEVEL-DESIGN-METHODOLOGY.md`, `chapters/WATERWHEEL-BOULEVARD-R2.md` and braking/recovery workbook. The road remains a complete delivery experience and the sky offers expressive optional mastery. High/low choices need useful onward states and likely-mistake recovery, not more disconnected track. Chapter promotion still needs revision-aware records/rollback and human review.

## Open qualification

Software tracking and Gamepad samples are not physical Quest 3 or Xbox tests. Actual passthrough composition, lighting/tracking loss, hand ergonomics, headset text readability, long sessions, native layers/multiview, reference-device frame times and comfort remain open. The exercised modern Workshop pan/text/playtest journey does not certify every advanced Bezier gesture or every imported document. Browser-owned file/permission actions retain explicit handoff boundaries. Every network/account state and a complete XR campaign playthrough are not exhaustively qualified.

Preserve failed captures, exact source IDs and actual evidence classes. Do not claim the entire repository CI is green because the scoped spatial suite passes. Historical old optional-canal and broader homepage/legacy assertions remain separate. The prior complete handoff is archived unchanged as `archive/RESUME-HERE-before-spatial-0.26.md`; use the latest receipt and this file for active priorities.
