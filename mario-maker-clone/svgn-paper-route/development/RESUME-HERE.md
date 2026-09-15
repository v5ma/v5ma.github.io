# Current continuation: Quiet Water v0.22.0

Read `QUIET-WATER-0.22.md` and `verification/quiet-water-0.22.json` first. The receipt, not a version label or branch commit, determines acceptance and publication. This slice adds bounded water ambience, transient-intensity and optional-notice controls on the existing audio owner, Xbox/hand-XR settings coverage, measured HUD readiness and explicit shipped-rail identity checks. Gameplay, saves, rider IK and XR rendering stay intact. Older material below is retained as history.

Next: full optional canal-sequence replay and physical Quest 3/Xbox/listening/comfort qualification. No new destination or completed AAA milestone is claimed.

---

# Resume here: Sky Cycle continuation handoff

Updated September 15, 2026. Read this file before implementing another upgrade. Continue the existing game, not a replacement demo.

## Current state

- Merged release: v0.21.0, build `sky-cycle-portals-2026.09.14`.
- Exact accepted candidate: `89897e4d2379464bd37be9e54ca384925c4da84e`.
- Release PR: 148. Normal merge: `3383257313b74255cb61402d4ca7e21c84fbca20`.
- Exact candidate acceptance: workflow run `34942370330`, all four scoped jobs passed. This includes 146 rule tests, tracked stereo XR, Tideglass and Sunrise acceptance.
- Publication authority: `verification/portal-network-0.21.json`. A merged version is not evidence of live publication; require the receipt's successful public-byte result.
- Latest destination remains Tideglass Baths, stable ID `tideglass-baths`, route index 7, Portal Destination 01. Sunrise Borough remains home index 4, stable ID `first-neighborhood`.
- Eight existing routes retain their indices. v0.21 adds no new destination or coming-soon scene disguised as playable content.
- Play: `https://v5ma.github.io/mario-maker-clone/svgn-paper-route/`.
- Tideglass: `https://v5ma.github.io/mario-maker-clone/svgn-paper-route/?destination=tideglass-baths`.
- XR-ready WebGL entry: `https://v5ma.github.io/mario-maker-clone/svgn-paper-route/?destination=tideglass-baths&xr=1`; explicitly select Quest / XR after loading.

Do not infer Sky Cycle's version from repository head alone. Other games are developed concurrently. Read `release.json`, the current receipt and the latest game-specific commit/PR before editing.

## Recent production history

- v0.16.0 Flight Deck: career records, optional badges, controller-safe pause/replay/settings flow and independent save namespace.
- v0.17.0 Route Compass: district guidance, checkpoint distance, optional-route clues, controller Route Journal and exploration stamps.
- v0.18.0 Sunrise Borough: Market Pocket Park, Penny's Market Pilot, environmental riding cues, controller journal reading and three first-attempt chapter completions.
- v0.19.0 Luminous: thin-film rail/courier finish, canal highlights, sky-silk atmosphere, Subtle/Vivid/Off, independent water/sky switches and reduced-motion integration.
- v0.20.0 Tideglass: tiled indoor pools, bathhouse shaders, ladders, vaulted architecture, dry promenade, brass sluice, revealed rail, portal selector and finish-gated Keeper seal. Exact accepted candidate `9cb7afe8e82854be5681f29dabd41d59185dc41d`, PR 143, merge `ccbec6ec6cd3dd0eb85d789482da75882e51af1b`; ten public runtime files verified in its historical receipt.
- v0.21.0 Portal Network: immutable destination catalog/signatures, stable-ID travel, nested controller focus, articulated rider with analytic pedal/grip contacts and opt-in seated tracked-controller/hand-select XR.

Historical release notes and receipts remain beside this file. Never relabel a later run as evidence for an earlier source SHA.

## Preserve these invariants

- Preserve the momentum-driven bicycle/unicycle game: read the route, build speed, jump, catch, deliver, discover an alternate line, finish.
- Never replace the game with a fresh rendering prototype.
- Preserve route IDs and indices. New routes append; Sunrise stays 4 and Tideglass stays 7.
- Preserve medals, career badges, exploration stamps, Market Pilot, Keeper records, Workshop documents, audio/graphics settings and controller remaps.
- Frequent gameplay actions belong on direct, easily reached buttons. Preserve familiar mappings rather than adding menu friction.
- Normal gameplay, pause, route selection, results, settings, journal, portal travel and confirmations must work with an Xbox-style controller without a mouse. Advanced Bezier authoring remains a disclosed pointer-required exception.
- Keep optional routes optional. Safe main paths must remain finishable without a bonus rail, sluice or seal challenge.
- Travel starts a new route run. Do not silently bank or carry provisional run state. Protect unsaved Workshop drafts before travel, reload or XR entry.
- Do not bank optional progression from editor copies, rejected wins, late-loaded observations or modified authored documents.
- Native acceptance must use real controls and the real win/progression path. Never assign player position, score, wins or progression to obtain a pass.
- Retain failed candidates, assertions, traces and captures; explain fixes rather than erasing evidence.
- CI Gamepad samples and emulated XR are not physical Xbox/Quest qualification. Software rendering does not establish real-device frame-rate or comfort claims.

## Save namespaces

Independent keys remain independent; v0.21 introduces no migration or consolidation.

- `svgn.skycycle.exploration.v1`: Route Journal stamps.
- `svgn.skycycle.compass.v1`: Route Compass presentation.
- `svgn.skycycle.sunrise.v1`: Market Pilot and Sunrise record.
- `svgn.skycycle.luminous.v1`: material/effect preferences.
- `svgn.skycycle.bathhouse.v1`: Tideglass visits and Keeper seal.

Legacy delivery, career, Workshop, input and audio keys remain owned by their earlier systems. Any future migration needs its own rollback-tested upgrade. Session-only success must not be described as durable storage.

## Controls and XR boundaries

Xbox defaults remain A jump, RT/X boost, RB/B paper, LB/Y whip, Start pause, View Flight Deck, and D-pad Down nearby interaction. Keyboard E retains nearby interaction. Existing saved gameplay remaps remain honored.

Tracked XR controllers use left stick ride/reel, right A jump, right trigger paper, right grip whip, left trigger boost, left X interact, right B pause/back, left Y Flight Deck, and rays for menus. Native hand-select/pinch events activate real menus and the in-world hand-only riding/action bar. Recenter and Exit XR remain available.

XR is an opt-in seated side-on diorama of the original 3D game, not first-person cycling or a new locomotion system. The pinned r177 implementation requires WebGL. Enter through `?xr=1` or the explicit guarded reload from a WebGPU session. Reload begins a route, does not preserve provisional run state and must protect dirty drafts.

Input-source loss, visibility loss, menu transitions and session exit release held actions. Source/visibility loss pauses play. Ending XR restores normal scene ownership and leaves play paused. Do not create a second competing animation loop or music owner.

## Integration traps

- The selected legacy `m.THREE` facade does not contain the complete pinned r177/TSL namespace. Import new node-material helpers from the already-vendored compatible module, and reproduce the facade boundary in tests.
- Tideglass owns its interior art treatment. Generic outdoor Prismatic/Luminous scenery must not leak inside.
- Paused-scene caching must allow live graphics previews while keeping simulation frozen.
- Measure existing HUD elements when placing overlays; avoid hard-coded offsets that overlap status or objectives on mobile.
- Direct destination entry waits for campaign/input/journal registration, not successful GPU initialization. Supported 2D fallback must still start a route.
- `GroundCampaign.order` is held by reference. Append indices; do not replace the array or renumber routes.
- Keep authored course documents immutable during live mechanics. Sluice changes affect live rails and scenery, not the canonical document.
- Checkpoint retry and brand-new run are different events. Reset provisional sluice/travel state on new runs while preserving intentional retry behavior.
- v0.21 rider IK is presentation only. Feet track pedals and hands track grips; do not move collision bodies to match the art. Distance-driven pedaling and contact error are tested. Walking/terrain foot locks are not implemented.
- XR has one simulation/render owner. The ordinary animation loop yields while XR is active, and normal ownership is restored on exit.
- The pinned WebGL backend previously produced a blank opaque XR framebuffer. `xr-webgl-compat.mjs` narrowly handles the native opaque-framebuffer path; normal and projection-layer targets retain the original backend. Preserve adapter tests and real stereo pixel checks when changing Three or XR paths.
- XR hand input uses native select events, not a second competing pinch detector. Clear held actions on source loss and require neutral input across transitions.

## Tideglass mechanics

Stable destination ID is `tideglass-baths`. Optional rail ID is `bathhouse-waterline`. Operate the brass sluice with E or D-pad Down nearby. Mirror Pool drains over 150 active simulation steps, frozen during pause. The continuous dry promenade remains the guaranteed finish path. The route has four checkpoints and five optional deliveries.

A completed visit records an accepted authored finish. Keeper additionally requires opening the sluice and sustained forward riding on the revealed rail. Water is scenic behind the cycling road; there is no swimming or underwater locomotion. Preserve the muted aqua/teal, ceramic tiles, chrome, wet reflection, haze and restrained caustic-style lighting direction. Do not force a VHS/full-screen distortion treatment onto normal play.

## Accepted evidence and unresolved checks

Candidate `89897e4d2379464bd37be9e54ca384925c4da84e` passed run `34942370330`: rules `104293793567`, XR `104293793810`, Sunrise `104298676653`, Tideglass `104298676708`. Rule total is 146. XR has 16 passing checks, Tideglass 25, and Sunrise 21. Five native first-attempt authored finishes are recorded: two Tideglass and three Sunrise. Real 3D local traversal and supported 2D full-route completions are distinct evidence classes. The XR hardware is emulated while the game, Three XRManager and stereo rendering are real.

All 23 accepted PNG captures were reviewed. Videos remain in the artifacts, but no end-to-end video review is claimed. Check the receipt for exact artifact IDs/digests, publication hashes and any later post-merge evidence.

Do not claim all repository CI passed. In legacy Cloudpost run `34942370272`, startup, ride, coast and editor fail hard-coded 16-track assertions predating Sunrise's appended practice rail. The canal test completes the normal route on its first attempt but fails the strict full optional-sequence check after m0, m1, m2, m3, m4, b0. Preserve this failed trace and rerun the complete optional route; do not redefine the sequence to obtain a pass. The relevant Sunrise, route-layout, ground, rail and grapple modules match the v0.20 baseline.

The older site-wide interactive workflow fails an assertion that the homepage has exactly three projects, before testing Sky Cycle. Do not remove sibling content to satisfy this stale test. Physical Quest 3 controllers/hands, Xbox, native XR layers/multiview, native WebGPU, real-device performance/comfort, long sessions and advanced Bezier controller authoring remain open.

## Next-upgrade queue

### Immediate verification maintenance

- [ ] Replace stale total-track assertions with explicit preserved authored IDs plus the shipped practice branch, without deleting content or weakening save/editor requirements.
- [ ] Replay the full optional canal sequence using ordinary inputs and retain both failed and successful traces. Separate input-timing problems from actual geometry/physics defects before patching gameplay.
- [ ] Keep legacy and current-suite results distinct in the verification receipt.
- [ ] Qualify actual Quest 3 controllers and hand UI, tracking loss, permissions, readability, comfort and measured frame times before adding more XR scene detail.

### Priority 1: Water/audio sensory pass

- [ ] Audit single-owner soundtrack and effects overlap before adding new ambience.
- [ ] Add notification-density and transient-intensity controls beside independent effects/music settings.
- [ ] Add bounded distant pumps, water lapping, ventilation and tile-room reflection/reverb impression.
- [ ] Add restrained sluice-wheel, gate-rise, draining-water and revealed-rail cues.
- [ ] Extend portal hum/arrival sound without creating another music owner or repeated uncontrolled notifications.
- [ ] Exercise mute, music-only, effects-only, pause/resume, background tabs and portal travel.
- [ ] Keep all voices, cooldowns and cleanup bounded.

### Priority 2: Ground campaign chapter quality

- [ ] Improve Waterwheel Boulevard or Copperleaf Gardens one chapter at a time.
- [ ] Add landmarks and launch/brake/receiving cues without steering or snapping the rider.
- [ ] Add a meaningful optional line with a safe recovery route.
- [ ] Prove every offered badge attainable; retune or remove impossible goals.
- [ ] Record slower/new-player and faster real-input completions and checkpoint-delivery correctness.

### Priority 3: Controller/editor completion

- [ ] Complete advanced Bezier editing without a pointer, or keep the exception explicit.
- [ ] Add deadzone controls and remap-conflict reporting.
- [ ] Audit destructive/save/export warnings, focus and nested B/back ownership.
- [ ] Test physical disconnect/reconnect and mixed keyboard/controller use on Windows and a second desktop platform.

### Priority 4: Performance and resilience

- [ ] Name desktop/mobile reference devices before stating performance targets.
- [ ] Measure frame time, memory, draw calls and startup on Tideglass and a worst-case outdoor route.
- [ ] Test actual phones/tablets in portrait and landscape, physical Xbox and Quest 3 in both tracked input modes.
- [ ] Test native WebGPU separately from WebGL and actual XR layer/multiview paths.
- [ ] Exercise context loss, stale service-worker caches, offline revisits and interrupted updates.
- [ ] Run long-session resource, comfort and save/rollback checks.

### Priority 5: Art/animation production

- [ ] Establish an original art bible for riders, cycles, architecture, materials, signage, NPC silhouettes and district lighting.
- [ ] Extend the accepted pedal/grip contacts to richer jump, catch, whip, impact and recovery animation with reviewed moving captures.
- [ ] Replace placeholder-looking assets with authored owned/licensed production assets and maintain the license ledger.
- [ ] Keep collision and threat readability more important than surface detail.

Potential future destinations remain proposals: rooftop infinity pool, flooded maintenance/station corridor, subterranean cistern/reservoir and canal district. Add one finished playable destination at a time. Do not present these as already implemented.

## Release checklist for every upgrade

- [ ] Start from current master, identify the game-specific baseline and inspect newer Sky Cycle branches/PRs.
- [ ] Use a scoped feature branch and preserve concurrent sibling-game work.
- [ ] Preserve route/save contracts; test any explicit migration and rollback separately.
- [ ] Add deterministic rule/geometry/resource tests and normal-input native acceptance.
- [ ] Run relevant prior suites on the exact candidate; retain failures and distinguish models, fixtures, native browser and physical-device evidence.
- [ ] Review actual captures for composition, readability, HUD overlap and correct stereo rendering.
- [ ] Record exact candidate SHA, jobs, artifacts/digests, failures, corrections and open gates.
- [ ] Merge the expected reviewed head normally. Never reset master to an older snapshot.
- [ ] Publish and compare owned public runtime files to accepted source with SHA-256.
- [ ] If a newer combined Pages deployment supersedes this commit, verify unchanged Sky Cycle bytes in that newer deployment rather than forcing an obsolete one.
- [ ] Update release identity, version note, receipt, this handoff, README and relevant roadmap status.
- [ ] Keep physical-device, human-review, performance and migration gates open until actually performed.

At the next session, read `development/README.md`, this file, `AAA-ROADMAP.md`, `release.json`, the v0.21 note/receipt and current master/new Sky Cycle PRs. Continue the verification-maintenance and audio queue above; do not reconstruct or reimplement Portal Network from the older v0.20 handoff.
