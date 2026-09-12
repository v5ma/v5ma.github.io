# Dino Atlas: production roadmap and acceptance checklist

This is the maintained checklist beside the game source. The goal is an original dinosaur-reserve adventure with premium production quality: enjoyable driving, believable animals, purposeful land/air/water travel, authored spaces, understandable missions, readable effects and complete controller navigation. "AAA" is the target quality bar, not a claim about the project's budget, certification, staffing or present polish.

Do not turn feature counts into a percentage of AAA readiness. There is no validated readiness percentage. Automated checks, human playtest findings, release status and hardware verification are separate facts.

## Start here

Play `index.html`. Use Menu > Story mission: Storm Response for the connected ground/interior/helicopter/coastal mission. Menu > Dispatch and guided lessons opens the original field school, ranching, boat race, salvage and boneyards. Menu > Development roadmap opens an in-game summary that can be dismissed with Xbox B.

Release scope: [STORM-RESPONSE.md](STORM-RESPONSE.md). Supporting release records: [RANCH-COAST.md](RANCH-COAST.md), [SPECTACLE-TRADE.md](SPECTACLE-TRADE.md). Saved test evidence: [verification/](verification/). The full prior journal and walking expedition are retained; no upgrade may silently erase them.

## Current baseline and open quality gaps

The existing game contains 30 species and 64 residents; jeep, buggy, helicopter, boat and on-foot modes; eight managed outer enclosures; six outposts; a regional supply economy; guided lessons; a repeatable roundup; a 24-buoy coastal race; salvage; three rooftop/interior complexes; three boneyards; and procedural audio. Those are systems, not proof of finished production quality.

Storm Response adds an eight-stage authored mission, actual service handoffs, checkpoint continuation/recovery, rain/fog/wind presentation, optional lightning flashes, and a first-completion reward. The game retains stylized procedural models and mostly flat terrain. Most animal anatomy and scale remain uncalibrated. Crews still run scripted services. There are no shipped cinematics, fully remappable controls, streamed terrain sectors or physical-controller certification.

The present milestone is an **integrated mission foundation**. The vertical-slice quality gate below remains open until visual, human-playtest, performance and hardware criteria are met. Do not call an automated fixture-driven journey a human playthrough of the whole island.

## Milestone gates

### G0: preserve and stabilize the existing sandbox

- [x] Retain the original dinosaur journal, recorder campaign, Ranch & Coast progress, market cargo/credits and audio settings as separate save namespaces.
- [x] Exercise old/new state models, real vehicle physics, boarding, rooftop support and mission order in automated tests.
- [x] Provide named activities, clear current objectives, map targets and controller-closeable panels.
- [x] Preserve no-damage vehicle handling and in-place automatic rollover recovery.
- [ ] Complete a human regression playthrough of every legacy activity with physical input hardware.

Exit criterion: no known progression blocker in the supported test paths, all preserved data validated, and any remaining manual coverage explicitly recorded rather than assumed.

### G1: demonstrate a polished vertical slice

- [x] VS-01: connect ground response, an interior panel, two helicopter rooftops and a coastal delivery into one ordered story.
- [x] VS-02: put the first vehicle destination outside the building; never require a jeep to fit through a pedestrian-only doorway.
- [x] VS-03: provide explicit helicopter/boat transfer requests at reachable departure points. Move only the unoccupied vehicle; do not silently teleport the player.
- [x] VS-04: suspend, save, reload, resume and recover a story checkpoint without resetting other progression.
- [x] VS-05: award the story completion payout once, including across reload and replay.
- [x] VS-06: guide the boat around the coastline with offshore markers instead of pointing straight through dry land.
- [x] VS-07: offer rain/fog/gust presentation, indoor rain exclusion, separate lightning-flash consent and existing sound-category controls.
- [ ] VS-08: conduct first-time-player sessions and measure mission comprehension and time-to-first-success. Do not advertise an unmeasured 20-30 minute duration.
- [ ] VS-09: give one important dinosaur encounter production-quality movement, anticipation, reactions, sound and visual identity.
- [ ] VS-10: finish one signature interior with memorable environmental storytelling, alternate paths, lighting composition and a replayable set-piece.
- [ ] VS-11: add short, skippable opening/reveal/completion camera sequences; A/B/Menu must always skip or pause as appropriate.
- [ ] VS-12: meet the declared hardware performance budget and complete a physical Xbox-only playthrough.

Exit criterion: one representative sequence is understandable, visually coherent, mechanically reliable and enjoyable to new players. This gate is not satisfied merely by shipping more features.

### G2: alpha, complete the intended game systems

- [ ] AL-01: agree the launch content scope: story arcs, districts, activities, animal roster and expected play time. Record scope changes here.
- [ ] AL-02: all required systems work across representative content; no placeholder door, vehicle or terminal is the only route forward.
- [ ] AL-03: each vehicle has multiple useful missions and an explicit role in the progression economy.
- [ ] AL-04: content data can be validated and placed without adding another fragile layer of source-replacement scripts.
- [ ] AL-05: produce a complete first-to-last campaign playthrough with state recovery at every stage.

Exit criterion: the planned game is playable end to end. Unfinished art is tracked, not hidden behind an "alpha" label.

### G3: beta, finish content and harden behavior

- [ ] BE-01: lock launch content and replace remaining required placeholder assets.
- [ ] BE-02: finish economy balance, animal tuning, mission pacing and checkpoint placement.
- [ ] BE-03: pass accessibility, controller/keyboard, performance, soak and save-migration matrices.
- [ ] BE-04: keep a reproducible bug register with severity, reproduction, expected behavior and fix evidence.

Exit criterion: content is complete; work is focused on defects, balancing, readability, performance and compatibility rather than unchecked scope growth.

### G4: release candidate

- [ ] RC-01: no unresolved critical save-loss, crash or progression blockers on the declared support matrix.
- [ ] RC-02: have release notes, known issues, credits/licenses, scientific labeling and network/privacy audit.
- [ ] RC-03: verify a clean install, upgrade from each prior supported save, and a tested rollback.
- [ ] RC-04: match public runtime bytes to the reviewed source and exercise the actual deployed build.
- [ ] RC-05: archive persistent test receipts in the repository, not only temporary Actions artifacts.

Exit criterion: release is reproducible and supportable. GitHub Pages deployment success alone does not establish gameplay quality.

### G5: supported public release

- [ ] RL-01: publish only the declared supported platforms and known limitations.
- [ ] RL-02: collect opt-in playtest feedback without adding undisclosed telemetry.
- [ ] RL-03: maintain a save-compatible hotfix procedure and prioritize real player blockers before more content.

## Living Herds: next work package delivered in source

Release entry: [LIVING-HERDS.md](LIVING-HERDS.md). The runtime adds grouped animal behavior and a five-stage field study under Menu > Living Herds: field study. Existing story, vehicle and journal namespaces are retained. The parent DINO and VS quality gates remain open for art review, human playtests and physical-controller evidence.

- [x] DINO-01a: implement travel-driven gait phase and two-segment legs with stance anchors for the existing procedural residents. Automated checks cover finite poses, stopped feet and retained neutral reference lengths.
- [x] DINO-01b: articulate the head/neck and tail, with watching, feeding, resting, warning, interrupted-charge and retreat poses. Reduced Motion suppresses decorative sway while retaining locomotion.
- [x] DINO-02a: require a visible warning before a predator charge, bound the charge burst, and add recovery. Losing line of sight cancels the pending warning.
- [x] DINO-02b: add local herd spacing and static-obstacle steering, keeping existing pen and water boundaries authoritative. This is local avoidance, not whole-island navigation.
- [x] DINO-03a: define six explicit gameplay response families; retain useful first hits and limit repeated stun refreshes. Fictional responses are not paleobiological claims.
- [x] DINO-04a: one wildlife-call director with distance falloff, priority warnings, bounded overlap and Balanced/Quiet/Off options. There is no additional music scheduler.
- [x] INPUT-01a: add a controller-navigable field study with five readable objectives, a persistent report and a one-time 450-credit reward. Existing X reload and B close remain unchanged.
- [ ] DINO-01c: animation/art review at normal viewing distances, including sharp turns, all body sizes, foot penetration and collision silhouettes.
- [ ] DINO-02c: no-fixture, first-time-player route through the grazer and predator encounter using a physical Xbox controller.
- [ ] AUDIO-02b: listen to the wildlife mix and existing effects together on real headphones, speakers and television; global non-wildlife voice budgeting remains open.

Acceptance evidence belongs in verification/ and the release workflow receipts. A passing fixture-driven browser journey does not mark the unperformed human/hardware items above complete.

## Crew and Canopy: implementation update / 2026-09-12

Release notes: [CREW-CANOPY.md](CREW-CANOPY.md). This continues the unfinished signature-facility work, not a new game. Manual acceptance stays separate.

- [x] WORLD-01a: integrate Northstar's research canopy, service ascent, roof airlock, interior route and five-stage repeatable Canopy Circuit. Arrival/report share a console; first payout is idempotent.
- [x] WORLD-04a: add reversible Fieldlight water, research glass and holographic-map materials; Reduced Motion freezes decorative shader time.
- [x] LIFE-01a: locally host licensed rigged male/female human skins, seven named staff contacts and purpose-specific briefings. These are scripted service roles, not autonomous rivalry.
- [x] INPUT-01b: staff roster, contact panels, avatar/shader selectors and Northstar terminals use shared controller navigation without a mouse.
- [x] TECH-01a: recover the valid unfinished Northstar module while integrating against the current maintained runtime. Direct shipped source, deterministic licensed-asset conversion and explicit source hashes replace broken one-use restoration attempts.
- [x] RC-02a: retain original CC0 license, model/texture hashes and version-matched Three.js MIT license beside locally hosted assets.
- [ ] WORLD-01b: human art review of Northstar, roof approach, alternate route and television readability.
- [ ] LIFE-01b: meaningful collision-aware crew schedules across districts, unobstructed handoffs and live convoy integration.
- [ ] TECH-02b: physical Xbox and measured consumer-GPU performance profile for the new models and shaders.

A software checkbox is not hardware certification. Tests and publication receipts are tracked in verification/; remaining parent quality gates are open.

## Ordered work packages after Storm Response

### Next pass: animal readability and motion

Owner: implementation plus art/animation review. Depends on G0 save/interaction stability. Effort class: large; no calendar commitment yet.

- [ ] DINO-01: gait state machine with idle, walk, turn, alert, retreat, interrupted charge and feed states. Feet must not slide noticeably at normal viewing distance.
- [ ] DINO-02: head-look targets, anticipation before a charge, herd spacing and blocked-path recovery. Player must be able to understand what an animal is about to do without reading a debug label.
- [ ] DINO-03: per-species or clearly grouped tool-response rules, including spam limits and recovery. Closed walls remain authoritative.
- [ ] DINO-04: species-specific calls with distance falloff and bounded concurrent voices. Important cues must be readable at a quiet mix.
- [ ] DINO-05: record published adult size ranges and measurement conventions for the remaining models. Keep nursery/juvenile variants separate. Current length calibration covers only three reference adults.

Acceptance: one representative herbivore and one predator pass an authored encounter and a physical-controller playtest before propagating the approach across all 30 species.

### Following pass: a signature district and interior

Owner: world design/art. Depends on DINO-01 and a performance profile. Effort class: large.

- [ ] WORLD-01: finish one detailed, original facility with approach landmarks, exterior silhouette, roof landing route, believable rooms, service corridors and at least two on-foot paths.
- [ ] WORLD-02: add terrain relief, an overlook, a service crossing and a boneyard with multi-step visible excavation.
- [ ] WORLD-03: make discovery pacing measurable through new-player sessions. The provisional design goal is a meaningful point of interest during each 30-60 seconds of purposeful travel, not uniformly scattered props.
- [ ] WORLD-04: share a material, signage and lighting language across roads, tools, vehicles, foliage and architecture.
- [ ] WORLD-05: create streaming/sector activation before another large island expansion.

Acceptance: the district works on foot and from the air, never strands vehicles behind an interface-only door, and remains within the recorded frame and memory budgets.

### Mission and reserve life

Owner: game design/implementation. Depends on G1 checkpoint rules. Effort class: medium to large.

- [ ] LIFE-01: named crew members physically present at stations with repeatable schedules and recognizable radio identities.
- [ ] LIFE-02: convoys react to roadblocks, unload at actual destinations, and reroute rather than clipping through events.
- [ ] LIFE-03: escaped-animal, missing-team, stranded-boat and fence-fault incidents with clear opt-in dispatch tasks and recovery.
- [ ] LIFE-04: more ranching games: mixed-herd sorting, juvenile transfer, predator exclusion, night roundup and careful cargo escort.
- [ ] LIFE-05: reputation consequences reward cooperation without permanently locking essential vehicles or story access.

Acceptance: each visible crew activity has a readable purpose and an observable world or market consequence. Scripted movement must not be described as autonomous combat AI.

### Vehicle purpose and credit sinks

Owner: systems/balance. Depends on stable transfers and single-award rewards. Effort class: medium.

- [ ] VEH-01: meaningful upgrades for cargo, illumination, navigation, tool reserves and handling. Do not introduce vehicle damage contrary to the game's current design.
- [ ] VEH-02: improve boat wake/spray/rough-water feedback and helicopter rotor wash, landing dust and altitude cues.
- [ ] VEH-03: give the buggy a distinct useful mission and economic role.
- [ ] ECON-01: test contracts, alternate trade routes, buy/sell spreads, maximum cargo and reward ledgers against exploit scenarios.
- [ ] ECON-02: reward exploration with knowledge, utility and routes in addition to currency.

Acceptance: spending decisions have observable benefits, several viable routes exist, and no mandatory activity depends on acquiring an unbounded amount of currency.

### Controller, UI and accessibility

Owner: interface/accessibility review. Depends on G0. Effort class: medium.

- [x] INPUT-01: the current story, service terminals, lifts, roadmap and completion panels use the shared A-select/B-back/D-pad-focus loop; X remains reload.
- [ ] INPUT-02: remapping, alternate presets and hold/toggle aim options with conflict checks.
- [ ] INPUT-03: text/interface scale for television viewing, subtitle-size controls and high-contrast/color-independent objective cues.
- [ ] INPUT-04: camera shake, FOV and motion-effect controls independent of audio volume.
- [ ] INPUT-05: unplug/reconnect a physical controller in every modal, during reload and on each vehicle; no mouse rescue should be necessary.
- [ ] INPUT-06: audit all nested scroll areas, focus return and keyboard behavior, not only the story flow.

Acceptance: a first-time player can start, play, save, change settings and close every panel with only the declared controller, including recovery from disconnection.

### Sound and music

Owner: sound design and listening review. Depends on scene/mission event definitions. Effort class: medium.

- [x] AUDIO-01: retain separate master, music, effects and ambience controls.
- [ ] AUDIO-02: bounded voice budget and cue-density presets; repetitive notifications may not overwhelm the scene.
- [ ] AUDIO-03: purposeful score transitions with a single musical director, not competing independent playlists.
- [ ] AUDIO-04: interior, forest and coast acoustic treatments; meaningful distance/spatial cues.
- [ ] AUDIO-05: listen on speakers, headphones and television, including muted and quiet mixes. A generated audio graph is not proof of pleasant sound.

Acceptance: understandable threats and feedback, no clipping in the accepted scenarios, and a mix that remains comfortable during long play sessions.

### Engineering, performance and release discipline

Owner: implementation/QA. Depends on representative content. Effort class: ongoing.

- [ ] TECH-01: replace historical one-off integration scripts with direct source changes and tests against the exact reviewed commit.
- [ ] TECH-02: record hardware/OS/browser/resolution/quality for each profile. Provisional targets: 60 fps desktop preset and 30 fps fallback; these are targets, not measured achievements.
- [ ] TECH-03: allocate CPU, GPU, draw-call, particle, physics, texture and audio-node budgets from those measurements.
- [ ] TECH-04: distance LOD, sleeping physics and sectorized AI with stress tests.
- [ ] TECH-05: long-session soak, rapid vehicle swapping, pause/resume, hidden-tab behavior and graphics-context recovery.
- [ ] TECH-06: save export/backup and migration tests using snapshots of every supported prior release.
- [ ] TECH-07: complete Chrome/Edge/Firefox/Safari and representative phone/tablet checks where viable; publish actual support, not assumptions.

Acceptance: tested frame-time and memory budgets, no sustained growth during soak, and actionable reports linked to a source revision.

## Verification rules

Each release must record the source identity, model-test result, rendered-browser result, assumptions/fixtures, screenshots, known issues, Pages deployment result and public-byte comparison. These records are complementary, not interchangeable.

Current automatic coverage includes the actual Rapier coast route, reachable exterior arrival, real narrow-doorway walking, safe rooftop support, supply handoffs, stage order, suspend/resume, reward-ledger preservation and the ranch gate-margin repair. The browser journey uses synthetic standard Xbox input. Distant travel is repositioned through explicit test fixtures; it is not a complete human or physical-controller certification run.

An implementation checkbox means that scoped code path exists and has supporting automated evidence. A milestone remains open until all of its acceptance criteria, including manual ones, are satisfied. Each future upgrade should close a small, named group of items, add the matching regressions, preserve saves, update this file and actually publish.
