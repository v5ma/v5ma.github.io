# Surestep addendum / 2026-09-14

This is a historical September 13 audit. In v0.13.0, SURESTEP.md supersedes the missing-water-controls finding: tidelight-quality, tidelight-ripples and tidelight-caustics are now in the shared Quest settings list. Xbox quick Blink/damage arrows, optional tracked-hand menu UI and procedural humanoid foot planting are new. The earlier failed/skipped run remains recorded honestly; it is not evidence for this release. All other unclosed water, audio, production-art and hardware findings remain open.

# Vesperfall continuation audit / September 13, 2026

Read DEVELOPMENT-HANDOFF.md first, then this audit, release.json, roadmap.json and the six-sheet AAA-PRODUCTION.xlsx. This is supporting evidence and an ordered checklist mapped to existing V01-V76, not a second canonical backlog.

## What this session changes

This session updates planning, documentation and planning tests, plus the stale diagnostic VERSION label in core.js. It does not introduce a new gameplay release or change combat, collision, procedural generation, controller mappings or save keys. Runtime remains 0.12.0 Tidelight. The canonical plan and workbook are synchronized to that version; all 76 task IDs and all seven milestones are retained. Future physical/human gates remain open.

The repository was initially inspected at master f02dffa47a79ff83efab6396cb6aea3040960b29. During the audit, newer handoff/roadmap prose appeared on master; preserve that concurrent work and append this audit rather than restoring an old tree. Always re-read the current branch before writing.

## Published scope versus the interrupted water draft

Current source creates water planes over rooms selected by planFamily court/archive and room id 1, with a depth-dependent exclusion for room 1. It does not hard-code seven surfaces or guarantee the four named destinations from the earlier draft. Water is at a decorative height of 0.028 above the existing floor. It leaves simulation floors, routes and progression unchanged.

The actual water shader provides translucent existing-stone visibility, procedural surface highlights, a view-angle tint and ripple rings. Balanced is the default. Cinematic increases desktop wave detail. There is no reflection camera, reflected-architecture render target, or refracted modeled tile basin in this implementation. Its depthHint is an artistic UV-based color variation, not measured optical depth.

The earlier larger draft proposed seven surfaces in Rain Court, Sable Cloister, Drowned Choir and Tide Chapel, two recessed fonts, tiled basin optics, rate-limited desktop architecture reflections, positional water splashes/footsteps/drips and a water route guide. Preserve those as ideas to recover or implement, NOT as delivered features. Current tidelight.js has no water-audio wiring or route guide. Do not replay old opaque transfer chunks over master. Compare any recovered draft to the current files and adopt small tested changes.

Water Off/Balanced/Cinematic, ripple and caustic controls exist in browser DOM. Their IDs are absent from the current dominion-controls.js settings array, so Quest spatial menu parity is unfinished. Xbox uses generic DOM focus navigation, but the new water-control path still needs its own end-to-end check.

VR policy declares at most 3 visible nearby pools, disables desktop detail, and declares maxRipples 4. The actual tick path still uploads all 10 ripple slots. AR disables the water root. Reduced effects freeze ambient animation, but impact/footstep rings can still animate when their toggle is enabled. Do not claim a full reduced-motion or enforced ripple-budget pass from the policy object alone.

## First work on resumption

- [ ] V68 and V66: rerun the synchronized production/model/workbook tests, then establish dated native Tidelight rendering, controller, save/continue and public-launch evidence. A Pages deployment is not browser acceptance.
- [ ] V41 and V61: expose water settings in the Quest spatial menu, preserve handedness-based roles, and prove every game-owned screen can be opened, adjusted, activated and closed with Xbox and Quest alone.
- [ ] V74 and V66: reproduce and fix water lifecycle/contact gaps. Clear ripple timestamps and last-step state on sector changes; enforce the actual XR ripple budget; match inside() to each visible surface inset; test vertical water contact so overhead high-walk movement and wall/enemy impacts do not produce false floor splashes.
- [ ] V58 and V44: deliver the requested major sound/music pass. Add actual water acoustics; strengthen bow/crossbow/shield/material sounds and enemy identity; preserve independent buses, mute, quiet mix, captions and controller access. Keep warnings intelligible during simultaneous combat and boss phases.
- [ ] V35, V52 and V54: add purposeful gothic/water-adjacent destinations, multi-level alternatives, secrets and humanoid animation without replacing the existing game. The twelve added enemy orders already exist; do not start the numerical request again as though none had shipped.
- [ ] V49-V53 and V76: refine the existing ten First Bell lessons and three-court, three-phase Bellkeeper Oath with real-player feedback. The 20-30 minute slice duration is a design target, not a measured playtime claim.
- [ ] V38, V59, V62 and V75: collect real Quest/Xbox lifecycle, comfort and performance evidence, including water, both handedness settings, sleep/visibility, lost tracking and resumed floor alignment.

These source-review findings are not proof that every listed defect has been experienced by a player. Reproduce them and write tests before closing the relevant task.

## Exact control and interaction contracts to preserve

Xbox: left stick moves and its click sprints; right stick aims and its click swaps weapons. RT draws/releases or fires. LT raises Wardglass. A interacts. B toggles Blink. X reloads. Hold Y for the tactical quiver and release to equip; tapping Y cycles. RB shard-steps; LB cancels draw. D-pad left/right selects arrows, up opens the journal, down selects Standard. View toggles the atlas; Menu pauses. In menus use directional navigation, left/right adjustment, A activation and B back/dismiss. Preserve focus, scrolling, confirmation, recovery and seed-entry paths.

Quest roles, rather than fixed left/right labels, are authoritative. The bow hand holds the weapon. The free/draw trigger nocks, physically draws and releases the bowstring. Draw distance affects the shot. With crossbow equipped, weapon-hand trigger fires; the free hand grabs/pulls/releases the winding handle, with draw-stick click as an accessible reload fallback. Bow-stick click swaps weapons.

Draw-hand grip raises the shield and prevents drawing/firing; bow-hand grip currently shard-steps. Draw-hand lower face button opens the tactical quiver, upper toggles Blink; bow-hand lower interacts and upper opens the menu. Either controller ray/trigger or stick can navigate spatial menus. Lower face selects, upper returns. Reversing handedness must reverse these roles.

Rotate the free palm upward for the familiar/status view. Point the free-hand ray at a pickup and hold trigger to pull it. Preserve finite special ammunition, tactical time slowing, loss-of-tracking cancellation and neutral-input restoration. Physical duck/lean/sidestep remain part of room-scale play; do not fake tracking by moving the camera.

The original user description asked for a physically tossed short teleport shard. Current shard-step is not a thrown projectile; V24 and V30 retain that gap. The user also requested discrete hit points and diegetic status. The game retains a numerical health model and desktop HUD; any health-system change needs explicit balance decisions and save migration under V63/V65. Do not silently convert health during a shader release.

AR is the separate stationary, unscored Sanctuary, not the campaign painted over the real room. Preserve real head/controller motion, transparent passthrough, no artificial locomotion/Blink/shard-step, and restoration of the suspended expedition on exit. Operating-system/browser permissions remain platform-owned.

## Audio, art and gameplay priorities from this chat

The user explicitly emphasized sound effects and music before later shader/water requests. Improve the mix in tandem with visible upgrades instead of treating sound as decoration. Existing Resonant Hunt already supplies adaptive synthesized music, spatial effects, independent volume controls, quiet mode and captions. New water acoustics still need implementation and testing.

Use the supplied gothic archery references for layered cathedral/castle space, long sightlines, knights/humanoids, arches, stained glass, towers, bridges and vertical tactical choices. Use the pool references for submerged material visibility and convincing water highlights/distortion, not their VHS distortion. These are reference images, not permission to copy commercial game assets. This is a game-development task, not an image-generation request.

Rosefire's earlier visual fixes are invariants worth preserving: expose photographed paving above its support geometry, keep stained-light strength modulated by stone albedo, retire teleport-echo timestamps when sector clocks reset, and refresh reduced XR source selection even while paused. Compare actual same-view frames, not only shader compilation or a pixel-difference count.

## Evidence that must not be lost

The recorded Tidelight publication source commit is 0eea87ac948f5d13e85804c7f91d581ea558f498. The old working branch is vesperfall-tidelight-20260912; its final recorded head 931a0dbb4e683257311130c721b6f5335d33e06b is already an ancestor of later master. A previous attempt to open a new PR returned no commits between the branches. Recheck ancestry before trying another merge.

Archived workflow 34737842771, artifact 10311179713, reports 148 model passes and 1 failure: the production plan was still 0.11.0 while release.json declared 0.12.0. Fresh local checking also found core.js diagnostic VERSION still at 0.11.0; this update aligns that label to 0.12.0 without modifying mechanics, save keys or generator schema. The artifact's source-revision.txt is d833ae7fe48c6410dde6961ea721d886f8cdf0c7, distinct from the branch head; retain both. That job skipped its browser/render step after the model failure. Ten workflows were listed as failed in the interrupted chat; this audit inspected the Rosefire job and does not infer that every other job had the same cause.

The earlier claim of 165 passing water tests referred to a larger working draft and is not established for the published minimal Tidelight. Historical Rosefire/Pilgrim/Resonant receipts are not automatic 0.12 acceptance. The previous conversation recorded successful Pages deployment 34739489799 at master 3f83c77c308838984780c97c23b4100403604d85; this is historical deployment evidence, not new gameplay QA.

Fresh planning checks for this update are recorded in PLANNING-VERIFICATION.json. They repair the stale plan/workbook boundary; they do not retroactively change a failed run or certify headset hardware. Artifacts expire, so preserve important failure summaries and hashes in Git rather than relying only on temporary ZIP links.

## Resume commands and release discipline

From the repository root run `node --test vesperfall/tests/*.test.cjs` and `python vesperfall/tests/production-workbook.py`. Serve the repository root with `python -m http.server 4173 --bind 127.0.0.1` and run `python vesperfall/tests/production-browser.py` for the board. Run the relevant native gameplay/XR/audio suites for actual runtime changes. Do not change assertions merely to hide failures, and do not use reduced rendering fixtures as performance evidence.

Inspect failed run jobs/logs once the conclusion is failure; repeated calls to fetch_commit_workflow_runs cannot make a failed run succeed. That helper lists PR-triggered runs only. Use the workflow/run collection for push and Pages events. Retry transient authorization/network failures with reasonable backoff; do not bypass denied permissions.

Re-read master, preserve concurrent sibling-game changes, and use a new scoped branch/non-forced update. Commit actual code and synchronized planning files, merge when the applicable checks pass, verify Pages deployment and served files, then launch the public game. Never call an unfinished local candidate or a branch-only change published. For this documentation-only update, do not change the gameplay version or save schemas.

Suggested resumption request: Continue Vesperfall in v5ma/v5ma.github.io under vesperfall/. Read DEVELOPMENT-HANDOFF.md, CONTINUATION-AUDIT.md and roadmap.json first. Start with the current Tidelight acceptance and controller/lifecycle gaps, then the requested audio/music pass. Preserve saves and all existing modes; publish completed upgrades and update the handoff with actual evidence.

## Source pointers

Current source audit: https://github.com/v5ma/v5ma.github.io/tree/f02dffa47a79ff83efab6396cb6aea3040960b29/vesperfall
Historical failed job: https://github.com/v5ma/v5ma.github.io/actions/runs/34737842771
Historical source publication: https://github.com/v5ma/v5ma.github.io/commit/0eea87ac948f5d13e85804c7f91d581ea558f498
Historical Pages receipt: https://github.com/v5ma/v5ma.github.io/actions/runs/34739489799
User requirements and reference interpretation are from this development conversation, not independently measured gameplay evidence.
