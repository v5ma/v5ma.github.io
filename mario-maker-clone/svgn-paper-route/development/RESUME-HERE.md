# Portal Network v0.21 continuation

The v0.21.0 candidate is described in `PORTAL-NETWORK-0.21.md` and `verification/portal-network-0.21.json`. Its publication status is controlled by that receipt, not inferred from a branch commit. The previous v0.20 state and production history remain below.

The Portal Network implementation now resolves catalog destinations by stable IDs, preserves Tideglass 01, provides destination signatures, protects drafts and explicit new-run travel, and retains nested controller focus. The courier adds analytic pedal/grip contacts without modifying physics. A seated stereo XR layer provides tracked-controller and native hand-select UI. Physical Quest 3/Xbox, comfort, performance and full editor qualification remain open.

After accepted publication, continue the bounded water/audio sensory pass, then chapter quality. Before increasing scene detail, prioritize physical Quest 3 validation of both input modes and XR readability/performance. Do not claim the overall AAA milestones are complete.

---

# Resume here: Sky Cycle continuation handoff

Updated September 13, 2026. This file is the short operational handoff for resuming Sky Cycle from a new chat. Read it before proposing or implementing the next upgrade.

## Current live state

- [x] Live release: v0.20.0, build `sky-cycle-tideglass-2026.09.13`.
- [x] Latest playable destination: Tideglass Baths, stable route ID `tideglass-baths`, appended at route index 7.
- [x] Direct destination URL: `https://v5ma.github.io/mario-maker-clone/svgn-paper-route/?destination=tideglass-baths`.
- [x] Exact accepted runtime commit: `9cb7afe8e82854be5681f29dabd41d59185dc41d`.
- [x] Release PR: 143.
- [x] Tideglass merge commit: `ccbec6ec6cd3dd0eb85d789482da75882e51af1b`.
- [x] Publication receipt: `development/verification/tideglass-0.20.json`.
- [x] Ten Tideglass-owned runtime files were verified against the public site after deployment.
- [x] The post-merge Tideglass destination and Sunrise regression jobs also passed.

Do not infer the current Sky Cycle release only from the repository head because unrelated games are developed concurrently in the same repository. Confirm `mario-maker-clone/svgn-paper-route/release.json`, then read the versioned verification receipt.

## Recent production history

- [x] v0.16.0 Flight Deck: career records, optional badges, controller-safe pause/replay/settings flow, independent save namespace.
- [x] v0.17.0 Route Compass: district guidance, checkpoint distance, optional-route clues, controller Route Journal and exploration stamps.
- [x] v0.18.0 Sunrise Borough vertical slice: Market Pocket Park, Penny's Market Pilot challenge, in-world riding cues, better controller journal reading and three first-attempt chapter completions.
- [x] v0.19.0 Luminous: thin-film rail/courier finish, procedural canal water highlights, sky-silk atmosphere, Subtle/Vivid/Off controls, independent water/sky switches and reduced-motion integration.
- [x] v0.20.0 Tideglass Baths: first portal water destination, three tiled pools, bathhouse shaders, chrome ladders, vaulted architecture, dry promenade, brass sluice, revealed waterline rail, Water Portal selector, direct destination URL and Bathhouse Keeper seal.

## Preserve these invariants

- [ ] Continue the existing Sky Cycle. Never replace it with a fresh unrelated demo because a new rendering idea is easier to prototype elsewhere.
- [ ] Preserve old route IDs and indices. New routes append. Sunrise Borough remains route index 4; Tideglass Baths is route index 7 in v0.20.0.
- [ ] Preserve existing medals, career badges, exploration stamps, Market Pilot records, Workshop documents, audio settings and controller remaps.
- [ ] Preserve the momentum-driven bicycle/unicycle identity: read the route, build speed, jump, catch, deliver, discover an alternate line, finish.
- [ ] Normal gameplay, pause, route selection, results, settings, portal travel and confirmations should work with an Xbox-style controller without requiring a mouse.
- [ ] Keep optional routes optional. The safe/main route must remain finishable when a player ignores a bonus rail, water interaction or seal challenge.
- [ ] Never bank optional progression from editor simulations, rejected wins, late-loaded state or a non-authored copy.
- [ ] Never alter player position, score or win state inside a native acceptance test merely to obtain a pass.
- [ ] Keep failed candidates and artifacts as evidence. State why they failed and what was changed.
- [ ] Keep release claims bounded by the evidence. CI Gamepad samples are not physical Xbox certification. Software rendering is not a hardware frame-rate claim.

## Current save namespaces

These are intentionally independent. Do not consolidate or clear them casually.

- `svgn.skycycle.exploration.v1` — Route Journal exploration stamps.
- `svgn.skycycle.compass.v1` — Route Compass presentation preference.
- `svgn.skycycle.sunrise.v1` — Market Pilot seal and Sunrise challenge record.
- `svgn.skycycle.luminous.v1` — Luminous graphics preferences.
- `svgn.skycycle.bathhouse.v1` — Tideglass visits and Bathhouse Keeper seal.

Existing legacy delivery/career/Workshop/input/audio keys remain owned by their earlier systems. Any migration needs a separate rollback-tested upgrade.

## Known integration traps

- [ ] The renderer's legacy selected `m.THREE` facade does not necessarily expose the complete TSL namespace. Tideglass fixed a real failure by importing TSL/material constructors from the already-vendored pinned r177 module. Reproduce this facade boundary in tests for future node shaders.
- [ ] Outdoor Prismatic/Luminous scenery should not blindly decorate interior destinations. Tideglass owns its own material/art treatment and excludes the generic outdoor presentation layer while inside the bathhouse.
- [ ] The paused-scene cache must allow live graphics previews. Do not freeze the 3D scene underneath Materials & FX while the player is changing shader choices.
- [ ] Overlay/objective placement must measure existing HUD elements rather than assume a fixed bottom offset. Tideglass originally overlapped the legacy flight status and now has desktop/mobile clearance assertions.
- [ ] Direct destination links should wait for campaign/input/journal registration, but should not require successful GPU initialization merely to begin a route. Fallback rendering should still work.
- [ ] `GroundCampaign.order` is held by reference in legacy code. Append route indices instead of replacing the array and do not renumber existing routes.
- [ ] Keep authored course code immutable during runtime mechanics. The Tideglass sluice changes the live rail list and scenic water level; it does not rewrite the canonical level document.
- [ ] Checkpoint retries may preserve run-local state when intentionally designed, while a brand-new run must reset provisional mechanics such as the closed Tideglass sluice.

## Tideglass-specific continuation facts

- Tideglass stable ID: `tideglass-baths`.
- Optional rail ID: `bathhouse-waterline`.
- Brass sluice interaction is E or D-pad Down when near the wheel.
- Mirror Pool drains over 150 active simulation steps and freezes when paused.
- The dry promenade is continuous and remains the guaranteed finish path.
- Tideglass has four checkpoints and five optional deliveries.
- A completed visit is recorded on an accepted authored finish. The Keeper seal additionally requires the sluice to have opened and sustained forward travel on the revealed waterline rail.
- Current presentation intentionally uses scenic water behind the side-scrolling road. There is no swimming or underwater locomotion yet.
- Visual direction from the reference images and discussion: muted aqua/teal water, tiled ceramic walls/floors, chrome ladders, wet reflections, soft haze, restrained caustic-style light, liminal indoor-pool atmosphere. Avoid forcing a VHS/full-screen distortion treatment onto normal play.

## Prioritized next-upgrade queue

### Priority 1: Portal Network v0.21

Goal: turn the current Water Portal selector into a scalable destination system without invalidating Tideglass.

- [ ] Generalize the portal atlas so it is data-driven rather than hard-coded around one destination.
- [ ] Preserve Tideglass as Portal Destination 01 and keep its stable ID/direct URL working.
- [ ] Give each destination an identifiable portal signature before entry: color, reflection pattern, ambient cue and short destination label.
- [ ] Add locked/coming-soon slots only if they do not pretend unfinished scenes are playable.
- [ ] Keep travel explicit: entering another destination starts a new route run; it must not silently bank or carry provisional run state.
- [ ] Keep unsaved Workshop-draft protection.
- [ ] Preserve controller-only navigation, nested-dialog behavior and B/back ownership.
- [ ] Add exact tests for route-index stability, source document preservation, portal focus ownership and return travel.
- [ ] Publish and public-byte verify the accepted upgrade before ending the work session.

Potential later destination concepts discussed in this chat, not yet selected for implementation: rooftop infinity pool, flooded maintenance/station corridor, subterranean cistern/reservoir, and a stronger canal district. Add one finished playable destination at a time.

### Priority 2: Water/audio sensory pass

Goal: make Tideglass and the portal transition sound as distinctive as they look without overwhelming the player.

- [ ] Add bounded bathhouse ambience: distant pumps, water lapping, tile-room reflections/reverb impression and subtle ventilation.
- [ ] Add explicit sluice-wheel, gate-rise, draining-water and revealed-rail cues.
- [ ] Add restrained portal hum/arrival sound that does not create a second uncontrolled music owner.
- [ ] Revisit Milestone D notification-density/transient-intensity options before layering many new effects.
- [ ] Exercise mute, music-only, effects-only, pause/resume, background tab and portal-travel cases.
- [ ] Keep voice counts/cooldowns bounded and preserve the original instrumental soundtrack lifecycle.

### Priority 3: Ground campaign chapter quality

Goal: bring Waterwheel Boulevard and Copperleaf Gardens closer to the readability/replay quality achieved in Sunrise Borough.

- [ ] Select one chapter at a time.
- [ ] Add recognizable landmarks and environmental launch/brake/receiving cues without steering or snapping the rider.
- [ ] Add one meaningful optional line with a safe recovery route.
- [ ] Verify every offered badge is actually attainable; remove or retune impossible badge goals instead of leaving them decorative.
- [ ] Record slower/new-player and faster real-input completions.
- [ ] Verify deliveries remain correct through checkpoints/retries.

### Priority 4: Controller/editor completion

- [ ] Make advanced Bezier editing possible without a pointer, or explicitly define the editor as the remaining pointer-required exception until that work is complete.
- [ ] Add deadzone controls and input-remap conflict reporting.
- [ ] Audit every destructive/save/export warning for controller focus and B/back behavior.
- [ ] Test disconnect/reconnect and mixed keyboard/controller input on physical hardware.

### Priority 5: Performance and device qualification

- [ ] Pick named desktop and mobile reference devices before stating frame-rate targets.
- [ ] Measure 3D frame time, memory growth, draw calls and startup on Tideglass and a worst-case outdoor route.
- [ ] Test physical Xbox controller on Windows and a second desktop platform.
- [ ] Test actual phones/tablets in portrait and landscape.
- [ ] Test native WebGPU separately from WebGL fallback.
- [ ] Exercise lost context, stale service-worker cache, offline revisit and interrupted update recovery.

### Priority 6: Art/animation production

- [ ] Establish an original Sky Cycle art bible covering rider, bike/unicycle, architecture, materials, signage, NPC silhouettes and district lighting.
- [ ] Add coherent rider animation for pedaling/throttle, lean, braking, jumps, catches, impact and recovery.
- [ ] Continue replacing placeholder-looking assets with authored, licensed/owned production assets.
- [ ] Keep collision readability more important than surface detail.

## Release acceptance checklist for every future upgrade

- [ ] Start from current master and identify the exact Sky Cycle baseline; do not overwrite concurrent sibling-game work.
- [ ] Use a scoped feature branch for runtime work.
- [ ] Preserve existing game/save contracts unless the release explicitly includes and tests a migration.
- [ ] Add pure rule/geometry/resource tests for new deterministic logic.
- [ ] Add native browser acceptance using real UI and movement. Keep fixture/model evidence separately labeled.
- [ ] Run relevant prior Sky Cycle regression suites on the exact candidate source.
- [ ] Review actual screenshots/video, not only pass/fail text. Fix visible UI overlap, unreadable guidance and broken scene composition before release.
- [ ] Record exact candidate SHA, workflow run/job IDs, artifacts and known limitations in a versioned verification receipt.
- [ ] Merge the reviewed expected head normally so unrelated repository work is preserved.
- [ ] Publish the upgrade. Do not stop after code preparation or a branch commit when release access is available.
- [ ] Run read-only public-file SHA-256 verification against the merged source.
- [ ] If Pages is superseded by a newer combined master deploy, verify that the newer public deployment still contains the unchanged Sky Cycle runtime rather than forcing an obsolete deploy.
- [ ] Update `release.json`, this handoff, `AAA-ROADMAP.md` when milestone state changes, the version note, and the machine-readable verification receipt.
- [ ] Leave remaining physical-device/human/performance gates open unless they were actually completed.

## What to inspect at the start of a future chat

- [ ] `development/README.md`.
- [ ] This file.
- [ ] `development/AAA-ROADMAP.md`.
- [ ] `release.json` for the actual current Sky Cycle version/build.
- [ ] Latest version note and `development/verification/<version>.json`.
- [ ] Current master SHA and any newer Sky Cycle PRs/branches before coding.
- [ ] Existing save keys and route IDs before introducing new progression or destinations.

If all of those still point to v0.20.0, the next chat can continue directly from the Priority 1 queue without reconstructing the v0.16-v0.20 history from conversation logs.
