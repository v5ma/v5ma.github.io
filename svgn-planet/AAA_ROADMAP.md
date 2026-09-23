# Neighborhood Missions: AAA-quality production checklist

This is the canonical production checklist, not a declaration of AAA quality. Build one exceptional authored neighborhood with measured performance before expanding scope again.

Current release: Unified Neighborhoods / Open Channel v0.19.0. Focus: M0 foundations and M1 vertical slice. Updated 2026-09-23.

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
  Evidence: ../tests/coastal.test.mjs ; https://github.com/v5ma/v5ma.github.io/actions/runs/34667786481 ; evidence/v0.8.0.json

- [x] MOVE-02 / P0 / verified / Speed-consistent camera and reduced motion
  Acceptance: Camera FOV and chase distance follow actual speed rather than whether RT is held. Reduced motion removes speed effects.
  Next: Run Homecoming acceptance, then request real-device feel approval.
  Owner role: Engineering / QA. Dependencies: MOVE-01.
  Evidence: ../frame-health.mjs ; evidence/v0.8.0.json

- [x] INPUT-01 / P0 / verified / Correct camera axes and persistent options
  Acceptance: Right looks right and up looks up. Axis inversion, sensitivity, audio sliders and B-to-return exist. Evidence uses standard-mapping emulation, not physical Xbox hardware.
  Next: Held directions now require neutral before navigating new menus. Complete Windows/browser plus physical Xbox USB and Bluetooth sessions.
  Owner role: Engineering / QA. Dependencies: None.
  Evidence: ../controller.mjs ; https://github.com/v5ma/v5ma.github.io/actions/runs/34667786481 ; evidence/v0.8.0.json ; evidence/v0.9.0.json

- [x] PERF-01 / P0 / verified / Local frame-time report
  Acceptance: A bounded 600-frame window records p95/p99 interval, CPU submission p95, intervals over 50 ms and simulation/wall ratio. Pauses excluded; no automatic upload.
  Next: Capture results on actual target hardware.
  Owner role: Engineering / QA. Dependencies: None.
  Evidence: ../frame-health.mjs ; evidence/v0.8.0.json

- [ ] PERF-02 / P0 / needs-playtest / Named desktop 60 fps gate
  Acceptance: Proposed target: 1920x1080 on RTX 2060-class hardware, warmed 10-minute route, mean >=59 fps, p95 <=18 ms, p99 <=25 ms, fewer than 1 percent of intervals over 50 ms. Record CPU, GPU, browser, quality and power mode. These are project targets, not external certification requirements.
  Next: Run a real-machine benchmark and explicitly review the targets; software-rendered results cannot pass this gate.
  Owner role: Real-device QA / user. Dependencies: PERF-01.
  Evidence: Not recorded.

- [ ] PERF-03 / P0 / partial / Streaming and stable frame pacing
  Acceptance: No uncapped per-frame world construction. A 30-minute multi-district session must reach stable memory and geometry counts. Rendering must not silently run simulation in slow motion.
  Next: Currentworks uses bounded pools, shared-eye LOD, pausable time and cancellable first-entry preparation. Profile sustained memory, shaders and frame pacing on physical hardware; source budgets are not device acceptance.
  Owner role: Engineering / QA. Dependencies: PERF-01.
  Evidence: ../ENVIRONMENT-INTEGRATION.md ; ../tests/environment-evidence/status.json

- [x] SAVE-01 / P0 / verified / Preserve the existing game and save identities
  Acceptance: Original v1 slot and mission IDs remain. Old saves load; contracts, times and finishes round-trip; sibling game storage is not touched.
  Next: Open Channel adds validated circuit switches and an exactly-once 140-credit case while retaining old saves and IDs. Both complete input-only route journeys and old regressions pass; retain actual-device and interruption/recovery checks.
  Owner role: Engineering / QA. Dependencies: None.
  Evidence: ../tests/coastal.test.mjs ; https://github.com/v5ma/v5ma.github.io/actions/runs/34667786481 ; evidence/v0.8.0.json ; ../OPEN-CHANNEL.md ; ../tests/open-channel-evidence/public-receipt.json

- [x] SAVE-02 / P0 / verified / Recoverable save transactions
  Acceptance: Recoverable original-city transactions and separate validated district/campaign ledgers retain historical save identities. Destructive replacement requires explicit confirmation.
  Next: Keep corruption, quota and interrupted-write tests. A missing backup is not a restore option. Multi-tab conflicts and rollback to older parsers need further review.
  Owner role: Engineering / QA. Dependencies: SAVE-01.
  Evidence: ../GROUNDED-NEIGHBORHOOD.md ; ../tests/grounded.test.mjs ; evidence/v0.11.0.json ; https://github.com/v5ma/v5ma.github.io/actions/runs/35000416468 ; evidence/v0.11.0-published.json ; ../lantern/LIVING-PORTAL.md ; evidence/living-portal-0.13.0/candidate.json ; ../lantern/NIGHT-WATCH.md ; evidence/night-watch-0.14.0/local-acceptance.json ; ../UNIFIED-NEIGHBORHOODS.md ; ../../../release-receipts/neighborhood-missions-unified-0.16.0.json

## M1 / One exceptional neighborhood

An authored Lantern Ward chapter with meaningful routes, state changes and a recognizable return shortcut before further map expansion.

Human exit gate: Approve one street, hero character, vehicle, interior and a compelling 15-minute play experience.

- [x] SLICE-01 / P0 / verified / Homecoming story journal and named neighbors
  Acceptance: Five local contracts gain authored introductions and debriefs. Old completed contracts count; an unrelated active contract is not replaced without explicit consent.
  Next: Measure actual duration with fresh players and improve the authored flow; 15 minutes remains a target, not a measured result.
  Owner role: Design / engineering. Dependencies: SAVE-01.
  Evidence: ../homecoming.mjs ; evidence/v0.8.0.json

- [ ] SLICE-02 / P0 / partial / Common Ground changes with your work
  Acceptance: An authored plaza includes Maya, cafe furniture and a pergola. Cleanup removes litter; repairs restore bulbs; photos fill decorative postcard panels; garden/workshop choice changes props. Changes survive reload.
  Next: Automated state transitions passed and actual plaza captures are retained. Human art approval, useful interiors and richer authored assets remain open.
  Owner role: Design / engineering. Dependencies: SLICE-01.
  Evidence: ../homecoming-view.mjs ; evidence/v0.8.0.json

- [x] SLICE-03 / P0 / verified / A physical homecoming finale
  Acceptance: Return to Maya after all five projects. The 500-credit reward and finish unlock are awarded once; remote or repeated claims cannot duplicate rewards.
  Next: Retain exactly-once reward and reload checks in every future release.
  Owner role: Design / engineering. Dependencies: SLICE-01, SLICE-02.
  Evidence: ../homecoming.mjs ; evidence/v0.8.0.json

- [ ] ART-01 / P0 / partial / Foreground courier quality
  Acceptance: Approve consistent human scale, face, eyes, hands, clothing, backpack straps and grounded shoes. No visible intersections in standing, running, riding and jumping.
  Next: Measured procedural hero, two-link limbs and world-contact gait passed narrow automated checks. Review standing/running/riding captures and airborne transitions on hardware; skinned production art and authored animation remain open.
  Owner role: Art / animation. Dependencies: None.
  Evidence: ../GROUNDED-NEIGHBORHOOD.md ; ../tests/grounded.test.mjs ; evidence/v0.11.0.json ; https://github.com/v5ma/v5ma.github.io/actions/runs/35000416468 ; evidence/v0.11.0-published.json

- [ ] ART-02 / P0 / partial / Bicycle and unicycle hero assets
  Acceptance: Correct axles, pedals, grips and foot contacts; believable steering, suspension and braking. Approve turntables and riding captures at normal camera distance.
  Next: Pedal/grip target IK and finite riding poses passed automated checks. Human review of vehicle proportions, steering, contact accuracy and transitions remains open, as do suspension and authored hero meshes.
  Owner role: Art / animation. Dependencies: ART-01.
  Evidence: ../GROUNDED-NEIGHBORHOOD.md ; ../tests/grounded.test.mjs ; evidence/v0.11.0.json ; https://github.com/v5ma/v5ma.github.io/actions/runs/35000416468 ; evidence/v0.11.0-published.json

- [ ] ART-03 / P0 / partial / Human-scale architecture and materials
  Acceptance: Approve one two-story house, cafe and apartment with believable doors, windows and floor heights. Materials, trim and shadows retain quality across presets.
  Next: Highline towers and the 10.8 m upper archive are now real shared geometry. Review human-scale furnishings, facades and camera cutaways with the integrated vegetation/materials before claiming final art approval.
  Owner role: Art / animation. Dependencies: None.
  Evidence: ../lantern/LIVING-PORTAL.md ; evidence/living-portal-0.13.0/candidate.json ; ../ENVIRONMENT-INTEGRATION.md ; ../tests/environment-evidence/status.json

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

- [ ] LEVEL-01 / P0 / needs-playtest / Authored Lantern Ward replacement chapter
  Acceptance: Lantern Ward is integrated into the original city as a same-renderer district. Its street, roof and canal connections support resident work, investigation, cape traversal, stealth and two-level combat.
  Next: Playtest the reserve-cell detour versus the shorter archive feeder diversion, with visible street-light response, reversible switches and physical acknowledgement. Do not expand map size before unfamiliar-player and physical XR feedback.
  Owner role: Level design / Engineering / QA. Dependencies: None.
  Evidence: ../lantern/README.md ; ../lantern/acceptance.json ; evidence/lantern-0.12.0/candidate.json ; evidence/lantern-0.12.0/published.json ; ../lantern/WORKING-QUAY.md ; evidence/working-quay-0.12.1/candidate.json ; ../lantern/LIVING-PORTAL.md ; evidence/living-portal-0.13.0/candidate.json ; ../lantern/NIGHT-WATCH.md ; evidence/night-watch-0.14.0/local-acceptance.json ; ../lantern/CAMPAIGN.md ; ../lantern/campaign.test.mjs ; ../lantern/xr-embodiment.test.mjs ; ../UNIFIED-NEIGHBORHOODS.md ; ../../../release-receipts/neighborhood-missions-unified-0.16.0.json ; ../SPATIAL-CONSOLE.md ; ../console-browser.py ; ../ENVIRONMENT-INTEGRATION.md ; ../tests/environment-evidence/status.json ; ../OPEN-CHANNEL.md ; ../tests/open-channel-evidence/public-receipt.json

- [ ] XR-02 / P0 / needs-playtest / Player-centered perspective portal and native first-person VR/AR
  Acceptance: Both districts expose eight actual-geometry first/third-person and first/third-person diorama AR/VR views. The room-fixed portal follows the player; no flat theater substitutes for a spatial mode.
  Next: Physically test stable floor placement, free-hand mounting, hand pinch, portal sightlines and seated reach in all eight modes. No framework migration or external hub integration.
  Owner role: Level design / Engineering / QA. Dependencies: None.
  Evidence: ../lantern/README.md ; ../lantern/acceptance.json ; evidence/lantern-0.12.0/candidate.json ; evidence/lantern-0.12.0/published.json ; ../lantern/LIVING-PORTAL.md ; evidence/living-portal-0.13.0/candidate.json ; ../lantern/NIGHT-WATCH.md ; evidence/night-watch-0.14.0/local-acceptance.json ; ../lantern/CAMPAIGN.md ; ../lantern/campaign.test.mjs ; ../lantern/xr-embodiment.test.mjs ; ../UNIFIED-NEIGHBORHOODS.md ; ../../../release-receipts/neighborhood-missions-unified-0.16.0.json ; ../SPATIAL-CONSOLE.md ; ../console-browser.py

- [x] LEGACY-01 / P0 / verified / Versioned original-world preservation
  Acceptance: Freeze the prior entry and runtime/asset hashes; keep old save keys and geometry separate.
  Next: Keep the 102 frozen legacy file hashes and all five retained browser suites passing in future upgrades.
  Owner role: Level design / Engineering / QA. Dependencies: None.
  Evidence: ../lantern/README.md ; ../lantern/acceptance.json ; evidence/lantern-0.12.0/candidate.json

- [ ] ACTION-01 / P1 / needs-playtest / Optional embodied Night Watch investigation and action case
  Acceptance: Signal Hijack and five sequential original Night Watch cases use the existing district. Cape traversal, patrol awareness, takedowns, counters, shield/pulse rules and lunges have separate state and reward contracts.
  Next: Finish exact rendered/public campaign verification and physical playtests. Review stealth readability, combat consequence and replay agency; do not equate automated traversal with fun.
  Owner role: Level design / XR engineering / QA. Dependencies: LEVEL-01, XR-02, ACCESS-01.
  Evidence: ../lantern/NIGHT-WATCH.md ; ../lantern/watch.test.mjs ; ../lantern/xr-adapter.test.mjs ; evidence/night-watch-0.14.0/local-acceptance.json ; ../lantern/CAMPAIGN.md ; ../lantern/campaign.test.mjs ; ../lantern/xr-embodiment.test.mjs ; ../UNIFIED-NEIGHBORHOODS.md ; ../../../release-receipts/neighborhood-missions-unified-0.16.0.json

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

- [ ] WATER-01 / P1 / implemented / Three playable waterfront excursions
  Acceptance: Pool service requires proximity, braking, three skims and a valve-routing puzzle. Canal courier uses a controllable skiff, ordered buoys, collection, docking and shore handoff. Boardwalk relay has ten swept checkpoints. Rewards and times persist without replacing the old city job.
  Next: Run full model and controller acceptance; retain exact results.
  Owner role: Design / engineering / QA. Dependencies: SAVE-01, INPUT-01.
  Evidence: ../tests/tidewater.test.mjs

- [ ] WATER-02 / P1 / implemented / Refractive Seaglass Pool and Lantern Canal
  Acceptance: Two bounded PBR water surfaces show analytical tiled-basin refraction, depth tint, animated caustic-style light and boat/skim ripple impulses. Existing environment reflections are not live-scene mirrors. No swimming is implemented.
  Next: Lantern Ward now uses pinned Currentworks Water/Optics driven by the real canal level and local boat observations. Check shader appearance and XR transparency; swimming, physical buoyancy and live-scene reflection remain unimplemented.
  Owner role: Design / engineering / QA. Dependencies: SAVE-01, INPUT-01.
  Evidence: ../tests/tidewater.test.mjs ; ../ENVIRONMENT-INTEGRATION.md ; ../tests/environment-evidence/status.json

- [ ] WATER-03 / P1 / implemented / Controller-first dock, recovery and water menus
  Acceptance: X works and Y explicitly boards/docks at low speed. Every water dialog supports B. Saves made in the skiff resume safely at the pier. Original riding speed and controls remain.
  Next: Test entry, all activities, safe exit, reload, context recovery and physical Xbox input.
  Owner role: Design / engineering / QA. Dependencies: SAVE-01, INPUT-01.
  Evidence: ../tests/tidewater.test.mjs

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
  Next: Open Channel now answers the recovered operator using two physical power-routing solutions in the existing ward. Review the new choice, circuit feedback and stored route consequence; South Cable Exchange still needs to be built.
  Owner role: Design / engineering. Dependencies: SLICE-04.
  Evidence: ../ENVIRONMENT-INTEGRATION.md ; ../tests/environment-evidence/status.json ; ../OPEN-CHANNEL.md ; ../tests/open-channel-evidence/public-receipt.json

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
  Evidence: ../coastal-audio.mjs ; https://github.com/v5ma/v5ma.github.io/actions/runs/34667786481 ; evidence/v0.9.0.json

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
  Next: Currentworks Water/Optics, Trees, Cloudlets and selective Toon now use the host r177 renderer and composed portal hooks. Inspect real eight-mode shader captures and physical stability. Analytic water reflection is not a scene or room mirror.
  Owner role: Art / animation. Dependencies: PERF-02.
  Evidence: ../ATMOSPHERE.md ; evidence/v0.9.0.json ; ../ENVIRONMENT-INTEGRATION.md ; ../tests/environment-evidence/status.json

- [ ] ART-06 / P2 / partial / Time of day and weather with purpose
  Acceptance: User-selected daylight, golden-hour, after-rain, rainy and blue-hour visual presets are implemented. A simulated clock, automatically changing weather and weather-driven gameplay remain future work. Preserve readability and real-device frame targets.
  Next: Coastal Atmosphere adds user-selected daylight, golden hour, rain, after-rain and blue-hour presets with wet-road ripples, leaf light/wind and facade glow. Validate actual shaders and real hardware; live scene reflections, dynamic day/night, interiors and art approval remain open.
  Owner role: Art / animation. Dependencies: ART-05, PERF-02.
  Evidence: ../ATMOSPHERE.md ; evidence/v0.9.0.json

- [ ] ACCESS-01 / P0 / partial / Controller-complete gameplay and menus
  Acceptance: Native XR menus include original-city and district maps, mission selection, field tools, settings and explicit cancel-first recovery. Menu remains available while held gameplay controls block rearm.
  Next: Validate owner reach, text size, controller/hand selection and all menu paths with the new console. Desktop HTML fallback remains accessible; a screen-canvas rewrite is not claimed.
  Owner role: Engineering / QA. Dependencies: INPUT-01.
  Evidence: evidence/v0.8.0.json ; ../GROUNDED-NEIGHBORHOOD.md ; ../tests/grounded.test.mjs ; evidence/v0.11.0.json ; https://github.com/v5ma/v5ma.github.io/actions/runs/35000416468 ; evidence/v0.11.0-published.json ; ../lantern/LIVING-PORTAL.md ; evidence/living-portal-0.13.0/candidate.json ; ../lantern/NIGHT-WATCH.md ; evidence/night-watch-0.14.0/local-acceptance.json ; ../UNIFIED-NEIGHBORHOODS.md ; ../../../release-receipts/neighborhood-missions-unified-0.16.0.json ; ../SPATIAL-CONSOLE.md ; ../console-browser.py

- [ ] ACCESS-02 / P1 / partial / Remapping and input alternatives
  Acceptance: Support per-action keyboard/gamepad remapping, adjustable dead zones, hold/toggle alternatives and conflict-safe defaults. Essential actions need touch equivalents.
  Next: Validated XR Action/Courier profiles, dominant hand, stick swap, 30/45 snap and motion-off alternative exist locally. Full per-action remapping, custom dead zones, all touch and hands combat parity are still open.
  Owner role: Engineering / QA. Dependencies: ACCESS-01.
  Evidence: ../lantern/NIGHT-WATCH.md ; evidence/night-watch-0.14.0/local-acceptance.json

- [ ] ACCESS-03 / P1 / partial / Readable and comfortable presentation
  Acceptance: Text scales without clipping; objectives are not color-only; speed effects can be reduced; long panels scroll by controller. Screen narration is not implemented.
  Next: The Open Channel circuit diagram and shared HUD report numerical supply, public-light state and alternative routes without color-only rules or timers. Test readability in real headsets and on narrow screens.
  Owner role: Engineering / QA. Dependencies: None.
  Evidence: ../lantern/LIVING-PORTAL.md ; evidence/living-portal-0.13.0/candidate.json ; ../OPEN-CHANNEL.md ; ../tests/open-channel-evidence/public-receipt.json

- [x] SHADER-01 / P1 / verified / Coastal Atmosphere shader pack
  Acceptance: All five visual presets compile on pinned r177; controller settings persist; off/reduced-motion/low modes work; wet shaders are stable around the planet; no physics changes or unbounded rain allocation. Record actual browser and shader results, not a concept mockup.
  Next: Automated shader/UI/recovery criteria passed. Obtain real-device timing and human visual approval; do not treat this shader check as AAA certification.
  Owner role: Rendering / QA. Dependencies: MOVE-01, PERF-01, AUDIO-01.
  Evidence: ../ATMOSPHERE.md ; evidence/v0.9.0.json

- [ ] XR-01 / P1 / needs-playtest / Quest comfort theater with tracked controllers and hand UI
  Acceptance: Native WebXR session presents a world-anchored flat game screen, tracked controller/grip rays and joint-pinch menu input. Paginated DOM-derived 3D menus, hands-only hold controls, tracking loss and session recovery work without relying on DOM overlays. This is not room-scale stereo gameplay.
  Next: The historical v0.11 flat theater remains in legacy.html. Native chapter views are tracked by XR-02. Physical device approval remains open for both.
  Owner role: Engineering / real-device QA. Dependencies: INPUT-01, ACCESS-01, SAVE-01.
  Evidence: ../GROUNDED-NEIGHBORHOOD.md ; ../tests/grounded-browser.py ; evidence/v0.11.0.json ; https://github.com/v5ma/v5ma.github.io/actions/runs/35000416468 ; evidence/v0.11.0-published.json ; evidence/lantern-0.12.0/published.json

## M5 / Release readiness

Reliable builds, recovery, licensing and sustained hardware testing.

Human exit gate: Pass the named device matrix, license audit, soak test and rollback drill.

- [ ] QA-01 / P0 / needs-playtest / Automated model and controller evidence
  Acceptance: Grounded Neighborhood has 162 passing model/save/motion/input tests and 81 passing checks across five browser suites. The public runtime also passed exact-byte verification and 15 live desktop/synthetic Xbox/XR checks. Raw reports and hashes are retained. Physical hardware is not certified.
  Next: Retain every inherited regression and add the campaign browser journey. Do not infer enjoyment, physical comfort or hardware timing from model/synthetic success; run full source and public acceptance before release.
  Owner role: Engineering / QA. Dependencies: None.
  Evidence: https://github.com/v5ma/v5ma.github.io/actions/runs/34667786481 ; evidence/v0.8.0.json ; evidence/v0.9.0.json ; evidence/v0.11.0.json ; https://github.com/v5ma/v5ma.github.io/actions/runs/35000416468 ; evidence/v0.11.0-published.json ; ../lantern/CAMPAIGN.md ; ../lantern/campaign.test.mjs ; ../lantern/xr-embodiment.test.mjs

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

- [ ] BUILD-01 / P0 / implemented / Publish real source, not an unmerged candidate
  Acceptance: The release must merge normally, preserve concurrent sibling work, match public main-game bytes and pass live main-entry, district, campaign and XR journeys.
  Next: Use the separate release receipt for actual publication status. Never call an unmerged branch or successful local test a published game.
  Owner role: Engineering / QA. Dependencies: None.
  Evidence: https://github.com/v5ma/v5ma.github.io/actions/runs/34668030978 ; evidence/v0.11.0.json ; https://github.com/v5ma/v5ma.github.io/actions/runs/35000416468 ; evidence/v0.11.0-published.json ; evidence/lantern-0.12.0/published.json ; ../lantern/CAMPAIGN.md ; ../lantern/campaign.test.mjs ; ../lantern/xr-embodiment.test.mjs ; ../UNIFIED-NEIGHBORHOODS.md ; ../../../release-receipts/neighborhood-missions-unified-0.16.0.json

- [ ] BUILD-02 / P0 / partial / A repeatable release gate
  Acceptance: Exact-source checks archive code before testing. Public verification checks the game-file closure even when a newer sibling-inclusive Pages snapshot deploys.
  Next: Retain all nineteen source journeys and all required public journeys. Complete a scoped rollback drill; never reset shared master.
  Owner role: Engineering / QA. Dependencies: QA-01, QA-03.
  Evidence: evidence/v0.11.0.json ; https://github.com/v5ma/v5ma.github.io/actions/runs/35000416468 ; evidence/v0.11.0-published.json ; evidence/lantern-0.12.0/published.json ; ../UNIFIED-NEIGHBORHOODS.md ; ../../../release-receipts/neighborhood-missions-unified-0.16.0.json

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

