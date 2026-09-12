# Neighborhood Missions: AAA-quality production checklist

This is the canonical production checklist, not a declaration of AAA quality. Build one exceptional authored neighborhood with measured performance before expanding scope again.

Current release: Homecoming v0.8.0. Focus: M0 foundations and M1 vertical slice. Updated 2026-09-11.

## How to use this workbook

Edit production/roadmap.json, then run python svgn-planet/production/render-roadmap.py. That JSON generates this Markdown and feeds roadmap.html and Menu / AAA production checklist. Each upgrade selects a small set of IDs, implements and tests them, records evidence, publishes, and states what remains.

A checked item means only its stated acceptance has evidence. It does not certify the whole category. There is no global AAA percentage. Hardware, visual quality and fun require independent human approval.

## Status definitions

verified: A narrow acceptance criterion has recorded automated evidence; not human art approval or physical hardware certification.

implemented: Code is integrated; specific acceptance or release evidence remains to be recorded.

partial: A baseline exists, but the full production criterion is not met.

planned: No complete implementation yet.

needs-playtest: Requires real hardware or human evaluation; automated tests cannot substitute.

blocked: Cannot pass until prerequisites and approvals are complete.

## M0 / Stop fighting the game

Measured control, save and performance baseline.

Human exit gate: Approve a 10-minute high-speed route on a named desktop and physical Xbox controller.

- [x] MOVE-01 / P0 / verified / Continuous acceleration and explicit braking
  Acceptance: 90 simulated seconds at full acceleration without energy-induced drops; coasting preserves speed; LT/B/Ctrl stops. This does not certify physical input latency.
  Next: Retest after every physics change.
  Owner role: Engineering / QA. Dependencies: None.
  Evidence: ../tests/coastal.test.mjs ; https://github.com/v5ma/v5ma.github.io/actions/runs/34667786481

- [ ] MOVE-02 / P0 / implemented / Speed-consistent camera and reduced motion
  Acceptance: Camera FOV and chase distance follow actual speed rather than whether RT is held. Reduced motion removes speed effects.
  Next: Run Homecoming acceptance, then request real-device feel approval.
  Owner role: Engineering / QA. Dependencies: MOVE-01.
  Evidence: ../frame-health.mjs

- [x] INPUT-01 / P0 / verified / Correct camera axes and persistent options
  Acceptance: Right looks right and up looks up. Axis inversion, sensitivity, audio sliders and B-to-return exist. Evidence uses standard-mapping emulation, not physical Xbox hardware.
  Next: Complete a Windows/browser plus real Xbox controller session.
  Owner role: Engineering / QA. Dependencies: None.
  Evidence: ../controller.mjs ; https://github.com/v5ma/v5ma.github.io/actions/runs/34667786481

- [ ] PERF-01 / P0 / implemented / Local frame-time report
  Acceptance: A bounded 600-frame window records p95/p99 interval, CPU submission p95, intervals over 50 ms and simulation/wall ratio. Pauses excluded; no automatic upload.
  Next: Capture results on actual target hardware.
  Owner role: Engineering / QA. Dependencies: None.
  Evidence: ../frame-health.mjs

- [ ] PERF-02 / P0 / needs-playtest / Named desktop 60 fps gate
  Acceptance: Proposed target: 1920x1080 on RTX 2060-class hardware, warmed 10-minute route, mean >=59 fps, p95 <=18 ms, p99 <=25 ms, fewer than 1 percent of intervals over 50 ms. Record CPU, GPU, browser, quality and power mode. These are project targets, not external certification requirements.
  Next: Run a real-machine benchmark and explicitly review the targets; software-rendered results cannot pass this gate.
  Owner role: Real-device QA / user. Dependencies: PERF-01.
  Evidence: Not recorded.

- [ ] PERF-03 / P0 / partial / Streaming and stable frame pacing
  Acceptance: No uncapped per-frame world construction. A 30-minute multi-district session must reach stable memory and geometry counts. Rendering must not silently run simulation in slow motion.
  Next: Profile chunk creation, GPU uploads, garbage collection and low-power 30 fps pacing.
  Owner role: Engineering / QA. Dependencies: PERF-01.
  Evidence: Not recorded.

- [x] SAVE-01 / P0 / verified / Preserve the existing game and save identities
  Acceptance: Original v1 slot and mission IDs remain. Old saves load; contracts, times and finishes round-trip; sibling game storage is not touched.
  Next: Test additive Homecoming fields and interrupted-write recovery.
  Owner role: Engineering / QA. Dependencies: None.
  Evidence: ../tests/coastal.test.mjs ; https://github.com/v5ma/v5ma.github.io/actions/runs/34667786481

- [ ] SAVE-02 / P0 / planned / Recoverable save transactions
  Acceptance: Maintain a last-known-good backup with schema migrations and clear recovery. Corrupt storage, quota failures and interrupted writes must not silently erase progress.
  Next: Implement transactional backup and import/export with controller-friendly errors.
  Owner role: Engineering / QA. Dependencies: SAVE-01.
  Evidence: Not recorded.

## M1 / One exceptional neighborhood

A coherent Homecoming vertical slice before more map expansion.

Human exit gate: Approve one street, hero character, vehicle, interior and a compelling 15-minute play experience.

- [ ] SLICE-01 / P0 / implemented / Homecoming story journal and named neighbors
  Acceptance: Five local contracts gain authored introductions and debriefs. Old completed contracts count; an unrelated active contract is not replaced without explicit consent.
  Next: Validate the chapter and measure actual duration. Fifteen minutes is a target, not a measured claim.
  Owner role: Design / engineering. Dependencies: SAVE-01.
  Evidence: ../homecoming.mjs

- [ ] SLICE-02 / P0 / implemented / Common Ground changes with your work
  Acceptance: An authored plaza includes Maya, cafe furniture and a pergola. Cleanup removes litter; repairs restore bulbs; photos fill decorative postcard panels; garden/workshop choice changes props. Changes survive reload.
  Next: Check all visual states in actual game captures and obtain art approval.
  Owner role: Design / engineering. Dependencies: SLICE-01.
  Evidence: ../homecoming-view.mjs

- [ ] SLICE-03 / P0 / implemented / A physical homecoming finale
  Acceptance: Return to Maya after all five projects. The 500-credit reward and finish unlock are awarded once; remote or repeated claims cannot duplicate rewards.
  Next: Test completion, reload and repeated claims.
  Owner role: Design / engineering. Dependencies: SLICE-01, SLICE-02.
  Evidence: ../homecoming.mjs

- [ ] ART-01 / P0 / partial / Foreground courier quality
  Acceptance: Approve consistent human scale, face, eyes, hands, clothing, backpack straps and grounded shoes. No visible intersections in standing, running, riding and jumping.
  Next: Replace primitive rig with an original or licensed skinned hero and authored animations.
  Owner role: Art / animation. Dependencies: None.
  Evidence: Not recorded.

- [ ] ART-02 / P0 / partial / Bicycle and unicycle hero assets
  Acceptance: Correct axles, pedals, grips and foot contacts; believable steering, suspension and braking. Approve turntables and riding captures at normal camera distance.
  Next: Build hero meshes, LODs and contact-aware animation.
  Owner role: Art / animation. Dependencies: ART-01.
  Evidence: Not recorded.

- [ ] ART-03 / P0 / partial / Human-scale architecture and materials
  Acceptance: Approve one two-story house, cafe and apartment with believable doors, windows and floor heights. Materials, trim and shadows retain quality across presets.
  Next: Replace enlarged placeholders with measured authored building kits.
  Owner role: Art / animation. Dependencies: None.
  Evidence: Not recorded.

- [ ] PLAY-01 / P1 / planned / One fully playable interior
  Acceptance: A cafe/workshop needs an accessible entrance, usable counter, collision, a meaningful activity, and a reliable exit with controller, keyboard and touch.
  Next: Validate one interior before repeating it across the city.
  Owner role: Engineering / QA. Dependencies: ART-03, INPUT-01.
  Evidence: Not recorded.

- [ ] SLICE-04 / P0 / needs-playtest / Vertical-slice fun and presentation approval
  Acceptance: At least three fresh-player sessions record confusion, time to first action, exploration and abandonment. The user explicitly approves or rejects the reference-quality street and character.
  Next: Record observations and actual captures rather than self-awarded quality grades.
  Owner role: Real-device QA / user. Dependencies: SLICE-03, ART-01, ART-02, ART-03, PLAY-01.
  Evidence: Not recorded.

## M2 / A city with a reason to exist

Distinct districts, useful buildings and believable activity.

Human exit gate: Explore without relying on repeated delivery templates or empty distance.

- [ ] WORLD-01 / P1 / partial / Road topology and readable navigation
  Acceptance: All six sphere faces connect. Centerlines, sidewalks, signs and collisions agree. Seams, intersections and mission approaches work at speed.
  Next: Drive every seam and add road-following routes instead of compass-only navigation.
  Owner role: Design / engineering. Dependencies: None.
  Evidence: Not recorded.

- [ ] WORLD-02 / P1 / partial / Distinct coastal districts
  Acceptance: Twenty-four names are not twenty-four distinct experiences. Each district needs a landmark, architecture, terrain or lighting identity, and activity mix.
  Next: Author a downtown, marina, neighborhood and industrial district before scaling further.
  Owner role: Design / engineering. Dependencies: SLICE-04.
  Evidence: Not recorded.

- [ ] WORLD-03 / P1 / planned / Useful houses and public buildings
  Acceptance: Every building family needs an appropriate encounter or activity; important buildings need interiors. Empty shells remain labeled scenery rather than advertised as interactive homes.
  Next: Create an activity registry, schedules, entrances and usable world markers.
  Owner role: Design / engineering. Dependencies: PLAY-01, WORLD-02.
  Evidence: Not recorded.

- [ ] WORLD-04 / P1 / partial / Traffic that understands streets
  Acceptance: Cars move continuously, but must eventually follow lanes, stop at signals, avoid one another and yield visibly without secretly braking the player.
  Next: Implement intersections, queueing, right of way and safe player interaction.
  Owner role: Design / engineering. Dependencies: None.
  Evidence: Not recorded.

- [ ] WORLD-05 / P1 / partial / Residents with purpose
  Acceptance: Residents, joggers and cyclists exist; add destinations, idles, conversation and crossing behavior rather than only looping around scenery.
  Next: Author bounded schedules, contextual interactions and crowd reactions.
  Owner role: Design / engineering. Dependencies: PERF-03.
  Evidence: Not recorded.

- [ ] WORLD-06 / P2 / planned / Parks, rooftops and alternate routes
  Acceptance: Provide street-speed, low-risk sidewalk and stunt/rooftop routes through the slice, each with tested entrances, exits and recovery.
  Next: Prototype short interconnected routes, not isolated scenery.
  Owner role: Design / engineering. Dependencies: SLICE-04, WORLD-01.
  Evidence: Not recorded.

## M3 / A campaign worth finishing

Authored missions, progression, consequences and replay depth.

Human exit gate: Fresh players can describe the story and choose a next activity without coaching.

- [ ] DESIGN-01 / P1 / partial / Depth rather than mission-count inflation
  Acceptance: The 102 contracts are variants of six systems, not 102 authored stories. New content must add decisions, encounter variation and consequences.
  Next: Deepen one family, playtest it, then expand.
  Owner role: Design / engineering. Dependencies: None.
  Evidence: Not recorded.

- [ ] DESIGN-02 / P1 / partial / Connected authored campaign
  Acceptance: Homecoming is the first optional arc. Later chapters need distinct characters, purposeful objectives, debriefs and world consequences.
  Next: Use first-arc feedback to outline two genuinely different follow-up arcs.
  Owner role: Design / engineering. Dependencies: SLICE-04.
  Evidence: Not recorded.

- [ ] DESIGN-03 / P1 / partial / Fair progression and replay
  Acceptance: Credits and cosmetics persist. Duplicate events cannot create repeated rewards. Speed and basic access never require a purchase.
  Next: Balance rewards, add milestone goals and test replay results.
  Owner role: Design / engineering. Dependencies: None.
  Evidence: Not recorded.

- [ ] DESIGN-04 / P1 / planned / Navigation that teaches without overwhelming
  Acceptance: A fresh player finds a first task within 60 seconds, follows a road-safe route and distinguishes story, side jobs and free exploration.
  Next: Add local minimap, compact journal and optional route guidance; test with fresh players.
  Owner role: Design / engineering. Dependencies: WORLD-01, SLICE-04.
  Evidence: Not recorded.

- [ ] DESIGN-05 / P2 / planned / Difficulty and assistance
  Acceptance: Timing assistance, race recovery, readable scoring and no mandatory repeated-button strain. Assists preserve story access.
  Next: Add persistent steering, timing, objective and retry assists.
  Owner role: Design / engineering. Dependencies: INPUT-01.
  Evidence: Not recorded.

## M4 / Production-grade presentation

Consistent art, animation, acoustics and accessibility.

Human exit gate: Approve actual gameplay reference shots, controller sessions and listening tests.

- [x] AUDIO-01 / P0 / verified / Independent levels and bounded score
  Acceptance: One music transport; independent master, music, effects and ambience; quiet mix and mute; bounded voices. This verifies behavior, not soundtrack production quality.
  Next: Audit every future cue against mixer levels and density limits.
  Owner role: Audio / engineering. Dependencies: None.
  Evidence: ../coastal-audio.mjs ; https://github.com/v5ma/v5ma.github.io/actions/runs/34667786481

- [ ] AUDIO-02 / P1 / partial / A polished score with quiet space
  Acceptance: Original procedural music exists. It should develop across exploration, work and celebration without intrusive repetition or competing compositions.
  Next: Compose longer arrangements, improve instruments and review 20 minutes of listening.
  Owner role: Audio / engineering. Dependencies: AUDIO-01.
  Evidence: Not recorded.

- [ ] AUDIO-03 / P1 / partial / Spatial Foley and ambience
  Acceptance: Distance and direction should match sources. Tires, motors and crowds must not mask essential cues; repetitive notification bursts must stay bounded.
  Next: Add source-based emitters, useful occlusion and measured mix headroom.
  Owner role: Audio / engineering. Dependencies: AUDIO-01, WORLD-05.
  Evidence: Not recorded.

- [ ] AUDIO-04 / P1 / planned / Dialogue and captions
  Acceptance: Written dialogue is not voice acting. Any recorded speech needs captions, a separate voice level and no audio-only essential information.
  Next: Decide licensed voice production or text-only presentation; add captions and voice bus before speech.
  Owner role: Audio / engineering. Dependencies: DESIGN-02.
  Evidence: Not recorded.

- [ ] ART-04 / P1 / planned / Unified art bible and approved reference shots
  Acceptance: Agree on palette, material response, scale and identity across buildings, hero, vehicles and nature. Compare actual gameplay, never concept images passed off as builds.
  Next: Create measured reference sheets and approved before/after captures.
  Owner role: Art / animation. Dependencies: SLICE-04.
  Evidence: Not recorded.

- [ ] ART-05 / P1 / partial / Stable lighting and reflections
  Acceptance: No camera-driven sun rotation, blown highlights, flickering depth or shimmering shadows. Tone mapping and quality presets retain intended appearance.
  Next: Review contact shadows, distant visibility and temporal stability on target hardware.
  Owner role: Art / animation. Dependencies: PERF-02.
  Evidence: Not recorded.

- [ ] ART-06 / P2 / planned / Time of day and weather with purpose
  Acceptance: Day/night and weather are optional future work, not shipped features. They must help mood or play without breaking readability or frame targets.
  Next: Prototype a constrained sunset variant after daytime quality is stable.
  Owner role: Art / animation. Dependencies: ART-05, PERF-02.
  Evidence: Not recorded.

- [ ] ACCESS-01 / P0 / partial / Controller-complete gameplay and menus
  Acceptance: Every feature including errors, confirmations, story, checklist and settings must be reachable and dismissible without a mouse after browser audio unlock. No gameplay input behind dialogs.
  Next: Run physical Xbox tests including disconnect, reconnect and multiple pads.
  Owner role: Engineering / QA. Dependencies: INPUT-01.
  Evidence: Not recorded.

- [ ] ACCESS-02 / P1 / planned / Remapping and input alternatives
  Acceptance: Support per-action keyboard/gamepad remapping, adjustable dead zones, hold/toggle alternatives and conflict-safe defaults. Essential actions need touch equivalents.
  Next: Build an input-action layer rather than more hard-coded mappings.
  Owner role: Engineering / QA. Dependencies: ACCESS-01.
  Evidence: Not recorded.

- [ ] ACCESS-03 / P1 / partial / Readable and comfortable presentation
  Acceptance: Text scales without clipping; objectives are not color-only; speed effects can be reduced; long panels scroll by controller. Screen narration is not implemented.
  Next: Audit contrast, captions, text scaling, reduced motion and screen-reader access.
  Owner role: Engineering / QA. Dependencies: None.
  Evidence: Not recorded.

## M5 / Release readiness

Reliable builds, recovery, licensing and sustained hardware testing.

Human exit gate: Pass the named device matrix, license audit, soak test and rollback drill.

- [x] QA-01 / P0 / verified / Automated model and controller evidence
  Acceptance: The previous release has 77 passing model tests and an emulated-controller browser journey. Retain actual results; failed or skipped tests are never reported as passed.
  Next: Run new Homecoming acceptance and retain evidence before publishing.
  Owner role: Engineering / QA. Dependencies: None.
  Evidence: https://github.com/v5ma/v5ma.github.io/actions/runs/34667786481

- [ ] QA-02 / P0 / needs-playtest / Physical hardware matrix
  Acceptance: Record Windows Chrome/Edge with Xbox USB and Bluetooth plus low-power and touch devices. Include sustained speed, menus, saves and audio.
  Next: Fill production/hardware-matrix.md with actual measured sessions.
  Owner role: Real-device QA / user. Dependencies: PERF-02, ACCESS-01.
  Evidence: Not recorded.

- [ ] QA-03 / P0 / partial / Context loss and asset-failure recovery
  Acceptance: Graphics loss pauses safely and recovers with saves retained. Missing art falls back explicitly. New plaza and audio must survive the same path.
  Next: Add injected context loss, storage failures and missing-texture tests.
  Owner role: Engineering / QA. Dependencies: None.
  Evidence: Not recorded.

- [ ] QA-04 / P0 / planned / Extended soak and memory gate
  Acceptance: A 30-minute multi-district session has no uncaught exceptions, runaway voices, increasing geometry counts or stuck inputs. Compare a second lap.
  Next: Automate route-driven soak and record a real-device review.
  Owner role: Engineering / QA. Dependencies: PERF-03, AUDIO-01.
  Evidence: Not recorded.

- [x] BUILD-01 / P0 / verified / Publish real source, not an unmerged candidate
  Acceptance: v0.7 is on master with a successful Pages deployment. Every next release preserves concurrent games, records a commit and checks live modules.
  Next: Apply this definition to v0.8 with a fresh release receipt.
  Owner role: Engineering / QA. Dependencies: None.
  Evidence: https://github.com/v5ma/v5ma.github.io/actions/runs/34668030978

- [ ] BUILD-02 / P0 / planned / A repeatable release gate
  Acceptance: Run model, browser, asset, visual and live checks before completion. Archive evidence, support reversible rollback and never force-push over sibling games.
  Next: Consolidate one-off workflows into a scoped release pipeline.
  Owner role: Engineering / QA. Dependencies: QA-01, QA-03.
  Evidence: Not recorded.

- [ ] LEGAL-01 / P0 / partial / Licensed and reproducible assets
  Acceptance: The existing CC0 register retains sources and hashes. Every new model, texture, sound and voice needs provenance and redistribution rights.
  Next: Audit new assets, credits and reproduction for every milestone.
  Owner role: Engineering / QA. Dependencies: None.
  Evidence: ../assets/street-art/asset-register.json

- [ ] SHIP-01 / P0 / blocked / Evidence-based quality approval
  Acceptance: Do not call the game AAA because a checklist exists or a counter is large. All P0 gates, critical defects, approved art/play and actual hardware results must be resolved.
  Next: Close prerequisite gates and obtain explicit user quality approval.
  Owner role: Engineering / QA. Dependencies: SLICE-04, PERF-02, SAVE-02, ACCESS-01, QA-02, QA-04, LEGAL-01, BUILD-02.
  Evidence: Not recorded.

## Evidence and scope

Prior v0.7 acceptance: https://github.com/v5ma/v5ma.github.io/actions/runs/34667786481. Those results do not cover later changes. Current evidence belongs in production/evidence/. Keep permanent text summaries even if CI screenshot artifacts expire.

Real hardware matrix: production/hardware-matrix.md. Empty cells are untested, not zero failures. Numerical targets require explicit agreement and measurement.

## Technical references

WebGL best practices / Mozilla MDN - https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices
Batching, bounded resources, avoiding synchronous stalls and cleanup. Numerical frame targets here are our project targets, not MDN requirements.

Xbox Accessibility Guideline 105 / Microsoft - https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/105
Independent audio controls and essential cue audibility.

Making games accessible / Microsoft - https://learn.microsoft.com/en-us/windows/uwp/gaming/accessibility-for-games
Remapping, input alternatives and perceptual/cognitive accessibility.

