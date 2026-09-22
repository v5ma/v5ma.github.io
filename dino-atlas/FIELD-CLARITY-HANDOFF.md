# Field Clarity handoff / 2026-09-22

## Published and public-gameplay verified

The live runtime is ranger-field-clarity-20260922.1, directly committed to master as d1a2218e7a2244fe3877a0a9061355c6c0b947c8. The normal full Classic Reserve and Tidegate are published. No new PR, branch, source transport, workflow or shared publisher was used for this recovery. Read verification/field-clarity/publication-20260922.json, saved at 525a1974bf02c3c0fa7537aa009f7c6115c00113, for the completed source and public results and the separate archival limitation.

Pages run 35751403964 and deploy job 106828618491 succeeded on cba5c1beee4263c75297ee2753e3277d02497fcd. Comparison confirmed the deployed descendant kept the exact Dino runtime. The scoped public job 106839222425 in run 35750258792 succeeded, independently matching all 74 served files and passing all 118 declared public checks. This supersedes the earlier queued/in-progress handoff, not the preserved original failures.

The separate archival release job 106841791367 failed because GitHub returned HTTP403 Resource not accessible by integration at release creation. The intended dino-field-clarity-20260922.1 release subsequently returned404 and has not been claimed created. This does not undo the successful website deployment or public verification. Do not change permissions, credentials, shared Pages configuration or game code merely to manufacture an archival success. Source, test archives, public captures and receipts are retained independently.

## Player-facing changes and controls

Look down during ordinary XR play for LIVE MAP, the current mission and step, the HERE interaction line, selected tool and current controls. White marks the ranger and gold the selected goal. Classic uses its existing live minimap; Tidegate now keeps a compact route map updating while the full map is closed. The compact Tidegate map omits wildlife as identified in its accessible label; the full map retains it. The map is not a promise of a passable straight line through buildings or water.

Actual notification and radio messages appear on a separate floor surface for 2 wall-clock seconds, fading during the final 0.4 seconds even while paused. The last twelve remain in Help. The current map, mission and HERE do not expire. Looking around does not drag the guide with the head. Summon or Bring floor guide here deliberately repositions it; separate height/scale controls support seated adjustment.

The box defaults to 2 m tall instead of the former approximately0.565 m. Height ranges from0.6 to4 m and width from0.8 to4.8 m. Resizing preserves the displayed character-center height, full game-world depth through sides/rear, automatic cutaway, real collision and the three legal opening states. The scene is not replaced by a miniature map. Existing visual settings and all saved progress remain.

The floor's Map, What to do / controls and Menu / sizes buttons are direct pointing targets. Workspace exposes Menu smaller/larger, Diorama smaller/larger and Box shorter/taller. Menu scale is independent of the game box; floor-guide size/height are separate. Controller focus reveals the spatial page containing the actual focused control instead of silently moving offscreen.

Quest Active uses either grip to interact, LT to aim, RT to use the selected tool, X to reload, Y to board/exit, A to jump or brake/hover, B for menu/back and right-stick click for Map. The left stick moves/steers; helicopter altitude uses the right stick vertically. Existing Xbox Familiar/Active and Quest Legacy profiles remain selectable. ranger-guidance.js now describes the current device/profile: guided lessons no longer tell Active Quest users to accelerate with tool triggers; the first patrol explains boarding when on foot; keyboard and Legacy grip-aim help are distinct. HERE removes obsolete A suffixes when grip is the current interaction. These descriptions do not remap controls or change mission targets.

The regular game remains https://v5ma.github.io/dino-atlas/ and the district remains https://v5ma.github.io/dino-atlas/tidegate.html. Refresh/reopen the tab, never clear saved site data as an update procedure.

## Evidence and revealing failures

The exact-source model suite passed285 tests with0 failures/skips. The source checker passed62 JavaScript syntax files and scanned72 owned runtime/script files. Recovery independently matched all74 source-manifest hashes and reran the285-test suite. Source-browser results: Classic floor22/spatial30/portal15/Express24; Tidegate floor22/spatial29/portal15/Express22; Classic launcher23 and Grounded tracked/hand/tool22. All four source jobs succeeded.

The final public artifact10708441054, SHA256 ab235a1daee799d0269f840a0410f645d1dc78042842229b1107db16e74e23d1, was downloaded and independently hash-checked. Its successful public reports contain Classic floor22, Tidegate floor22, Classic spatial30, Tidegate spatial29 and Classic portal15:118 checks, with no captured errors in those scopes. Its74-file public hash set exactly equals the source manifest. Public floor captures were visually reviewed; they use simulated XR viewpoints, not headset photographs.

The first public attempt passed the same103 new UI checks, then the retained Classic portal script failed during bootstrap before any assertions. The screenshot shows the caught 3D-unavailable fallback. Its old error filter omitted the underlying caught exception; no network or GPU cause is established. One authorized retry used unchanged source, criteria, timeouts and inputs and passed completely. Keep public-first-attempt-20260922.json and archive10707103810; do not rewrite the failure as a pass or claim its root cause universally fixed.

The older Grounded1.4-second walking pulse failure was separately corrected by waiting for the same required physical displacement under normal input, with a30-second failure limit and diagnostics. That final source check passed; no actor teleport, physics change or reduced movement requirement was used. Four genuine pre-repair map/guidance failures remain in clarity-before-20260922.tap.

## Open boundaries and next work

Physical Xbox/Quest, real hands, stereo/passthrough, seated reach, comfort/performance and unfamiliar-player comprehension remain unverified. Local full-game browser navigation is blocked; full source/public browser evidence comes from hosted software-WebGL runs using synthetic input and explicit XR mocks. No actor, objective, inventory or reward assignments manufacture acceptance. Local Canvas2D layout testing is labeled fixture evidence.

Some secondary field-utility text still uses N/RB hints in XR. Primary HERE, Help, guided lessons and floor controls use the correct interface; consolidating remaining secondary copy is a bounded next polish task. Improve the retained portal runner's caught-bootstrap and failed-request diagnostics before diagnosing another startup failure. Do not rebuild the delivered features or generate new release machinery for that.

UI-09b/UI-09c, broader field missions, art and place-mastery acceptance remain open. Screen DOM is the accessible fallback, not a completed canvas-only screen rewrite. All original missions, rewards, cargo identity, saves, mounted tools, Express rules, vendors and sibling work remain. No private hub assets, engine migration or travel portals were added. The next useful user playtest is whether the actual goal, HERE action and selected controls are readable and understandable without coaching.
