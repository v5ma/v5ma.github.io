# Aether Reach: current AAA-quality production checklist

Current plan: 0.10.0 Skyglass Cast. Updated 2026-09-12.

AAA-quality is a production target, not a certification or a percentage inferred from task counts. Software implementation, browser validation, publication, player approval and physical hardware acceptance are separate. Local board edits never publish the game.

Canonical machine-readable plan: ../roadmap.json. Searchable board: ../roadmap.html. The eight-sheet v0.3 Excel workbook remains an archived snapshot; it is not the current plan.

## Release gates

### G0 - Reliable playable foundation
No launch or arena crashes; working saves and controller interfaces.
Tasks: A01, I04, F02, Q03.

### G1 - Approved polished vertical slice
A player-approved complete district loop, not just individually passing features.
Tasks: P01, B06, F01, P04, V01.

### G2 - Production-quality assets
Original/cleared assets and coherent characters, architecture, animation and lighting.
Tasks: P02, P03.

### G3 - Campaign content complete
Distinct districts, interiors, objectives and endings accepted as a complete campaign.
Tasks: P05.

### G4 - Performance and accessibility
Recorded physical-device budgets and full controller/accessibility acceptance.
Tasks: Q01, Q02, I03.

### G5 - Release candidate and deployment
No known blocking defects; tested restore and matching live-file hashes.
Tasks: Q04, R04.

### GX - Separate optional platform gates
Quest and multiplayer require their own measured hardware/server work. Desktop release does not imply either.
Tasks: X04, X05, X07, N01, N02, N03.

## Acceptance register

### A01 - Playable floating-city expedition
State: Released. Priority: P0. Dependencies: None.
Acceptance: Complete three relays and return via connected foot or rail routes.
Evidence: PR35: 23 model/boundary tests and 39 native browser checks; v0.1.0 published.
Next: Preserve the playable loop while adding devices.

### A02 - Private narrative / public engine boundary
State: Released. Priority: P0. Dependencies: None.
Acceptance: No private repository, manuscript, privileged key or hidden narrative loader in the public build.
Evidence: PUBLIC_BUILD.md and local-import tests.
Next: Review the allowlisted release files at every publication.

### I01 - Action-based gamepad input
State: Browser checked. Priority: P0. Dependencies: A01.
Acceptance: Analog sticks, radial deadzone, rising-edge actions, neutral reconnect and safe disconnected pause.
Evidence: PR37, Actions 34061735693: real HTTP/WebGL application with explicitly emulated device APIs; no physical device certification.
Next: Physical Xbox QA in I03, then remapping and accessibility.

### I02 - Xbox menus and gameplay bindings
State: Browser checked. Priority: P0. Dependencies: I01.
Acceptance: Start without mouse; navigate dialogs, move/look, hook/reverse/release, fire/reload/pulse; settings persist.
Evidence: PR37, Actions 34061735693: real HTTP/WebGL application with explicitly emulated device APIs; no physical device certification.
Next: Physical Xbox QA in I03, then remapping and accessibility.

### I03 - Physical Xbox USB and Bluetooth QA
State: Hardware QA. Priority: P0. Dependencies: I02.
Acceptance: Real Xbox pad on Windows Chrome/Edge: deadzone, reconnect, held buttons, save/resume and full mission.
Evidence: No physical-controller evidence yet.
Next: Record device, connection type, browser and findings.

### I04 - Remapping and accessibility profiles
State: Implemented. Priority: P1. Dependencies: I02.
Acceptance: Remappable actions, conflict detection, defaults reset and persisted profiles; keyboard remains usable.
Evidence: v0.6 introduced safe binding swaps and stored comfort settings. v0.8 labels match the revised combat layout.
Next: Run the physical Xbox USB and Bluetooth matrix; retain fixed A/B/Menu navigation.

### X01 - Immersive session and tracked rig
State: Browser checked. Priority: P0. Dependencies: I01.
Acceptance: Feature detect immersive-vr; enter on click; local-floor; stereo animation loop; safe denial and exit.
Evidence: PR37, Actions 34061735693: real HTTP/WebGL application with explicitly emulated device APIs; no physical device certification.
Next: Physical Quest 3 verification and performance profiling in X04/X05.

### X02 - Quest controller movement and aiming
State: Browser checked. Priority: P0. Dependencies: X01.
Acceptance: Handed input, independent right-hand aim, left-stick motion, 30-degree snap turn, rail camera never forces head yaw.
Evidence: PR37, Actions 34061735693: real HTTP/WebGL application with explicitly emulated device APIs; no physical device certification.
Next: Physical Quest 3 verification and performance profiling in X04/X05.

### X03 - In-headset HUD and menus
State: Browser checked. Priority: P0. Dependencies: X02.
Acceptance: Health/ammo/objective panel, pause/atlas/archive panels, controller selection and Exit VR without removing headset.
Evidence: PR37, Actions 34061735693: real HTTP/WebGL application with explicitly emulated device APIs; no physical device certification.
Next: Physical Quest 3 verification and performance profiling in X04/X05.

### X04 - Physical Quest 3 acceptance
State: Hardware QA. Priority: P0. Dependencies: X01, X02, X03.
Acceptance: Meta Quest Browser: two eyes, controller alignment, floor height, snap turn, menus, rails, suspension/re-entry; no sickness/comfort promise.
Evidence: No physical Quest 3 run yet.
Next: Collect headset browser version and full-session feedback.

### X05 - Frame-time and rendering budget
State: Hardware QA. Priority: P0. Dependencies: X04.
Acceptance: Measure sustained CPU/GPU frame times and memory on Quest 3, choose target refresh budget from measurements.
Evidence: XR disables shadows and uses reduced framebuffer scale; no measured target yet.
Next: Profile before adding more scene detail.

### X06 - Comfort and room-scale calibration
State: Planned. Priority: P1. Dependencies: X04.
Acceptance: Seated height, handed locomotion, snap/smooth choice, comfort vignette and robust recenter/reference-reset handling.
Evidence: Initial local-floor, snap turn and collision-limited room displacement implemented; full calibration is not.
Next: Tune with physical testing, not desktop assumptions.

### M01 - Two-hand climb and ledge acquisition
State: Planned. Priority: P1. Dependencies: X04, X05.
Acceptance: Grip actual hand contacts, pull body with collision, transfer hands, release momentum and recover missed grabs.
Evidence: Not implemented.
Next: Build one climb wall in a mechanics yard.

### M02 - Gliding from a rail or ledge
State: Implemented. Priority: P1. Dependencies: A01.
Acceptance: Explicit deploy/cancel, carried release momentum, controllable descent, safe landing and comfort controls.
Evidence: Foldwing steering and charge remain; v0.8 restores B as fold/drop while airborne or climbing.
Next: Physical headset comfort and player route quality remain unverified.

### M03 - Climb / rail / glide state transitions
State: Planned. Priority: P1. Dependencies: M01, M02.
Acceptance: Continuous velocity between modes; no teleports or phantom grabs; recovery reachable after an intentional miss.
Evidence: Design goal, not a finished traversal system.
Next: Author and replay complete linked routes.

### M04 - Readable branching rails and reward flow
State: In review. Priority: P1. Dependencies: A01, M02.
Acceptance: Fast/high/rich alternatives, deliberate backward exploration, visible receiver, repeatable compatible arrival states.
Evidence: 15 actual rail routes are present. v0.7 tuning has 48 m/s cruise and 96 m/s boost with arrival slowdown.
Next: Test sightline readability and transfers at real speed on target hardware.

### C01 - Embodied reload and two-hand stabilization
State: Planned. Priority: P1. Dependencies: X04.
Acceptance: Tracked weapon alignment, magazine interaction, recoil, occlusion and left-handed options.
Evidence: Ray aiming/button reload prototype only.
Next: Keep current button reload as accessible fallback.

### C02 - Distinct enemies and rail combat
State: In review. Priority: P1. Dependencies: B01, B04.
Acceptance: Readable threats, varied movement/attack patterns, fair cover and shooting while traversing.
Evidence: v0.7 has humanoid arena encounters. v0.8 fixes missing arena home/patrol initialization and adds all-three-arena simulation checks.
Next: Review combat fairness, readable silhouettes, cover and ammunition balance with a player.

### C03 - Temporary tactical cover
State: In review. Priority: P2. Dependencies: C02.
Acceptance: Constrained placement, costs, collision and no trapped player or unreachable route.
Evidence: Authored cover rifts have timed collision and occupied-placement rejection; v0.8 visibly distinguishes dormant and active state.
Next: Test every rift beside doors, rail arrivals and player/enemy collision.

### W01 - Interiors, puzzles and exploration rewards
State: Implemented. Priority: P1. Dependencies: A01.
Acceptance: Playable interior routes, puzzle state saves and rewards worth detouring for.
Evidence: v0.5/v0.6 source contains 12 districts, five enterable rooms, rooftop ladders, puzzles and 13 side adventures. This is not a completed campaign.
Next: Finish and playtest one authored interior-to-rooftop exploration loop.

### W02 - Original visual and audio production
State: In review. Priority: P1. Dependencies: A01.
Acceptance: Coherent architecture, readable surfaces, original audio and performance-budgeted assets.
Evidence: Licensed Quay assets and original procedural audio are in the source. v0.8 adds textured combat cover, visible Tavi and tactical art. Full asset production remains unfinished.
Next: Use P01-P05 acceptance gates instead of treating a material pass as finished AAA art.

### E01 - Shared 3D world and rail editor
State: Planned. Priority: P2. Dependencies: M03.
Acceptance: Editable curves, anchors and geometry; validate reachability/clearance; save/export and exact playtest return.
Evidence: Paper Delivery has a separate editor; not silently inherited by Aether Reach.
Next: Define a world format before UI expansion.

### E02 - Cloud levels and accounts
State: Deferred. Priority: P2. Dependencies: E01.
Acceptance: Authenticated ownership, reviewed database policies, moderation and no client-only paid entitlements.
Evidence: Local checkpoints only; no new cloud integration.
Next: Separate security design and explicit service authorization.

### N01 - Multiplayer authority and replication
State: Planned. Priority: P1. Dependencies: I02, B01, B03.
Acceptance: Server-owned simulation, anti-cheat boundaries, interpolation, latency tests and stable room ownership.
Evidence: Single-player currently.
Next: Design authoritative rooms and two-client traversal before competitive game modes. No local bot will be labeled a remote player.

### R01 - Public Kanban / workbook planning
State: In review. Priority: P0. Dependencies: None.
Acceptance: Searchable tasks, explicit dependencies and gates, local editable statuses, portable export, matching workbook.
Evidence: roadmap.json and planning/AAA-ROADMAP.md are the current committed plan. The eight-sheet v0.3 XLSX remains an explicitly archived snapshot.
Next: Update evidence at each release and keep publication distinct from player acceptance.

### R02 - Controller/XR preview publication
State: Browser checked. Priority: P0. Dependencies: I01, I02, X01, X02, X03, R01.
Acceptance: Pass model, keyboard/touch regression, browser pad and XR-lifecycle tests; byte-verify deployed public files.
Evidence: PR37 acceptance: 38 Node tests and 70 native/device-emulated browser checks, runs 34061735693 and 34061735714.
Next: Read the published-file hash receipt in PR37 for deployment status. Physical hardware gates remain separate.

### B01 - Four-weapon arsenal and sniper optic
State: In review. Priority: P0. Dependencies: A01, I02.
Acceptance: Mechanical differences in cadence, spread, magazine, range and recoil; actual 4x desktop field-of-view optic, not a crosshair picture.
Evidence: v0.8 uses one desktop optic mask and correct tangent-based projection for 4x/8x; no tracked XR magnification claim.
Next: Verify scope framing, recoil and hit feedback with real Xbox and mouse input.

### B02 - Earned-credit buy and upgrade economy
State: Implemented. Priority: P0. Dependencies: B01.
Acceptance: Three world kiosks, meaningful starter loadout choice, per-weapon damage/reload tiers, shield upgrade; insufficient funds rejected. No real-money purchases.
Evidence: Model purchases, caps, ammunition and save round trips pass. Native buy-upgrade-continue acceptance is tracked in PR39.
Next: Verify keyboard/controller shop navigation and prevent double rewards or free refill exploits.

### B03 - Exploration caches and enemy salvage
State: Implemented. Priority: P0. Dependencies: B02.
Acceptance: Physical once-only crates and defeated-enemy drops; pickups supply credits/ammunition and selected unlocks; saves cannot repay an already collected crate.
Evidence: Sanitized legacy-compatible kit extension and once-only reward tests pass. Native collection acceptance is tracked in PR39.
Next: Tune rewards so exploring a longer route competes with rushing the objectives.

### B04 - Free-look aimed jump-and-catch transfers
State: Implemented. Priority: P0. Dependencies: A01, I02.
Acceptance: Default independent sight while riding; two new adjacent detours, visible eligible rail target, physical release and a second catch action in range.
Evidence: Four directions at five carried-state timings, plus 21 recorded-direction Gale release/delay fixtures and a bounded deliberate-input buffer. Native acceptance is tracked in PR39.
Next: Review the receiving line and tolerance while moving; never substitute an instant scene teleport.

### B05 - Distinct district and enemy silhouettes
State: Implemented. Priority: P0. Dependencies: A01, B01.
Acceptance: Original bazaar stalls, glass roof, industrial gantry/chimneys, solar arrays/beacon; scout rotors, armored heavy and sentry wind-up are visibly different.
Evidence: Native render review identified and corrected blank sign lettering, the stretched rail HUD and phone-control overlap. Final visual acceptance is recorded in PR39.
Next: Check visual readability, weapon framing, clutter and mobile HUD overlap.

### B06 - Encounter balance and player feedback
State: Planned. Priority: P1. Dependencies: B01, B02, B03, B04, B05.
Acceptance: Replay the whole objective loop with varied loadouts; compare risk, ammunition demand, reward rate and alternate paths; retain the accessible foot route.
Evidence: Not player-reviewed. Automated passage does not certify enjoyable combat.
Next: Record user feedback and one small repeatable encounter per iteration.

### N02 - Actual two-client rooms and replicated movement
State: Planned. Priority: P1. Dependencies: N01.
Acceptance: Two separate browser clients see distinct players, room join/leave, server-owned clock/state and tested latency recovery; no simulated lobby claims.
Evidence: Not implemented. Current public demo is single-player.
Next: Choose and authorize a backend explicitly; implement a minimal two-client movement slice.

### N03 - Shared loot, buy authority and combat rules
State: Planned. Priority: P1. Dependencies: N02, B02, B03.
Acceptance: Server validates pickup ownership, currency, shot cadence, ammo and damage; duplicate claims and reconnect replay are rejected.
Evidence: Not implemented. Local single-player saves are not secure multiplayer accounts.
Next: Add authority tests before drops or shops are shared between players.

### X07 - Magnified tracked weapon optic
State: Planned. Priority: P1. Dependencies: X04, X05, B01.
Acceptance: Render a real weapon-mounted magnified view within headset frame budget; do not zoom the whole tracked head/eye projection.
Evidence: Desktop scope exists; the XR precision ray does not have a magnified optic.
Next: Measure a render-target optic on real Quest 3 with independent head motion and readable lens.

### R03 - Durable source snapshots and restore verification
State: Implemented. Priority: P0. Dependencies: A02.
Acceptance: Every versioned release has a tagged public source archive, SHA-256 file manifest and a clean extraction test. Preserve prior releases; never include private source or browser player saves.
Evidence: tools/backup.py and release-backups workflow; publication still subject to runtime checks.
Next: Verify the release assets after deployment. An independent off-site mirror remains outside this GitHub-only backup.

### T01 - Dual-hand elemental powers and surface tactics
State: Implemented. Priority: P1. Dependencies: B01, B06.
Acceptance: Current electrifies authored water; Cinder ignites oil; gun ammunition and power energy stay separate. Shared sight and collision rules prevent hits through buildings.
Evidence: PR69: model synergies plus ordinary-input Current/gun and Cinder/oil browser scenarios. See final workflow receipts, not this status alone.
Next: Inspect readable feedback and collect player balance feedback.

### T02 - Local security routing and a friendly turret
State: Implemented. Priority: P1. Dependencies: A01.
Acceptance: A real 3x3 connected-port puzzle changes the Atrium defender. Fourteen shots help but cannot win unattended. All interactions remain entirely inside the game.
Evidence: PR69: connectivity, proximity and finite turret budget tests; native puzzle playthrough.
Next: Make later security choices affect routes and encounter preparation.

### T03 - Optional Atrium recovery defense
State: Implemented. Priority: P1. Dependencies: T01, T02.
Acceptance: Defend 180 collector hull through three waves and a 48-second minimum. Failure, retreat and safe reload are real; first success grants 180 credits once.
Evidence: PR69: positive and negative model outcomes; native recovery and one-time-reward acceptance required before publication.
Next: Compare active builds and record player difficulty feedback; avoid a passive turret victory.

### T04 - Enemy surveys and passive build choices
State: Implemented. Priority: P1. Dependencies: T01.
Acceptance: One recorded survey per living visible class grants a 10% gun bonus; unlock one equipped Insulator, Capacitor, Catalyst or Engineer. No repeated-scan farming.
Evidence: PR69: model numeric modifiers, persistence and ordinary-input survey/loadout checks.
Next: Keep passive choices legible and validate all new menus on physical controllers/headsets.

### T05 - Telekinetic debris and projectile redirection
State: Planned. Priority: P1. Dependencies: T01.
Acceptance: Acquire visible debris or an eligible projectile, hold and redirect with bounded velocity and collision; independent hands and safe cancellation.
Evidence: Not implemented.
Next: Prototype one throwable prop and one redirectable projectile with deterministic collision tests.

### T06 - Player-placed traps and constrained defenses
State: In review. Priority: P1. Dependencies: T03, C03.
Acceptance: Place a limited trap or defender on valid surfaces with clear costs, ownership, collision, expiry and a readable trigger range.
Evidence: v0.7 charged traps use energy and bounded placement; v0.8 renders active trap and dropped-weapon pools.
Next: Test legibility, costs, trigger range and accessibility in longer encounters.

### T07 - A prepared boss-style confrontation
State: Planned. Priority: P1. Dependencies: T03, T04.
Acceptance: A new large enemy has telegraphed phases, discoverable weaknesses and resource choices. Win through learned tactics rather than only greater health.
Evidence: Not implemented; the current recovery ends with one heavier patrol.
Next: Build a single encounter with multiple viable weapon/power builds and recovery paths.

### T08 - Deeper research and multiple build slots
State: Planned. Priority: P1. Dependencies: T04.
Acceptance: Distinct research objectives and mutually meaningful slots; explicit respec and progression costs; retain accessible defaults and versioned saves.
Evidence: Current survey records classes and one passive. No research photographs or expanded slot system yet.
Next: Review the first passive balance before expanding combinations.

### F01 - Foundry Finish tactical art
State: Browser checked. Priority: P0. Dependencies: W02.
Acceptance: Cover meshes match collision bounds; Tavi, traps, drops, arena consoles and active rifts are visible without per-frame allocation.
Evidence: v0.8 source ffa9665 passed the Foundry HTTP/WebGL review with visible Tavi, traps, cover and real sniper optics. PR #116 publication matched 78 files.
Next: Continue visual and performance review across the entire district, including new Blackout props.

### F02 - Arena runtime integrity
State: Implemented. Priority: P0. Dependencies: C02.
Acceptance: Each of the three arenas runs patrol, target acquisition and shooting without undefined home or patrol state.
Evidence: tests/foundry.test.mjs replays all three for 12 simulated seconds.
Next: Extend to two-wave completion, interruptions and varied real loadouts.

### P01 - One finished district vertical slice
State: In review. Priority: P0. Dependencies: F01, W01, B06.
Acceptance: One coherent 20-30 minute route combines street combat, interior exploration, rooftop travel, rewards and a clear ending.
Evidence: v0.9 implements a connected Bellwether street-interior-rooftop-return adventure with saved stages. Mission duration, pacing and player approval are not certified.
Next: Play the complete Blackout adventure and record timing, difficulty, wayfinding and repetitive sections. Gate G1 remains open until player review.

### P02 - Authored character and weapon animation
State: In review. Priority: P1. Dependencies: P01.
Acceptance: Original humanoid mesh, articulated hands, reload/aim/melee animation and locomotion transitions hold up at gameplay distance.
Evidence: v0.10 adds creator-published CC0 female adventurer, armored guard and suited officer with real skeletons and clip blending. Complete authored first-person hands, custom character art and weapon reload animation remain open.
Next: Inspect moving characters, hand/weapon alignment and role readability at game distances; continue original character production.

### P03 - Architectural materials and lighting
State: In review. Priority: P1. Dependencies: P01.
Acceptance: Consistent scale, trim/material library, wear, foliage, interior lighting and readable cover silhouettes across the slice.
Evidence: v0.10 adds original spectral rift and cloud-light shaders without extra render passes. City-wide architectural polish remains incomplete.
Next: Review scene consistency and measure the Balanced, Light and immersive performance budgets on real hardware.

### P04 - Music, effects and mix acceptance
State: In review. Priority: P0. Dependencies: W02.
Acceptance: One music transport, independent effects/music/ambience levels, bounded simultaneous cues and clear critical warnings at low volume.
Evidence: Procedural score and independent buses exist; subjective listening and long-session mix are not certified.
Next: Listen on speakers and headphones; log masking, fatigue and critical-cue audibility.

### P05 - Content expansion after slice approval
State: Planned. Priority: P1. Dependencies: P01, P02, P03, P04.
Acceptance: Expand approved encounter/interior/route templates into a coherent campaign without repeated filler or unfinished placeholder districts.
Evidence: No campaign-completion claim. Private narrative stays outside this public repository.
Next: Define district-by-district content acceptance and asset ownership.

### Q01 - Desktop frame-time and memory budget
State: Hardware QA. Priority: P0. Dependencies: F01.
Acceptance: Proposed desktop target: sustained 60 fps at 1080p on an explicitly recorded baseline device; record p95/p99 frame time, memory and 30-minute soak results.
Evidence: No physical desktop GPU measurements yet. Software Chromium timing is not GPU certification.
Next: Select the baseline hardware and settings, then record measured budgets.

### Q02 - Accessibility and long-session controller acceptance
State: Planned. Priority: P0. Dependencies: I04, I03.
Acceptance: All gameplay dialogs close with B; remapping, text legibility, reduced motion, flash intensity and audio cues pass a real full-session review.
Evidence: Software tests are narrower than long-session physical-controller acceptance.
Next: Run a controller-only expedition with USB and Bluetooth; record every mouse dependency.

### Q03 - Save migration and release recovery
State: In review. Priority: P0. Dependencies: R03.
Acceptance: Old checkpoints, purchased equipment and rewards survive updates; corrupt data recovers safely; rollback points are retained.
Evidence: Existing version-1 save validation remains; new visual code does not write saves.
Next: Keep explicit old-version save fixtures and a release restore drill.

### Q04 - Campaign alpha, beta and release candidate gates
State: Planned. Priority: P1. Dependencies: P05, Q01, Q02, Q03.
Acceptance: Alpha completes content; beta fixes blocking/major defects; a release candidate passes regression, soak, accessibility and public-file hash verification.
Evidence: No alpha, beta or AAA-quality acceptance yet.
Next: Maintain a defect severity register and require evidence before advancing.

### R04 - Verified publication of each upgrade
State: In review. Priority: P0. Dependencies: R01, Q03.
Acceptance: Commit intended game files, run regression/browser checks, merge without touching unrelated games, then verify live bytes against that commit.
Evidence: v0.9 committed at cf1dc621dbc392be99380c7fbe51776b90ead068 after 201 tests and 28 full district browser checks. v0.10 must match the post-merge live runtime contract.
Next: Record the v0.10 merge, Pages status and matching live-file hashes.

### V01 - Bellwether street-interior-rooftop adventure
State: In review. Priority: P0. Dependencies: W01, F02, I04.
Acceptance: Complete both combat sites, operate independent Arcade dials, use a continuous roof route, hold the receiver, return for a once-only reward, and save/resume without lost progress or extra enemies.
Evidence: BELLWETHER-BLACKOUT.md; bellwether model/scene modules; tests/bellwether.test.mjs and the full controller browser journey. Test execution and player acceptance remain separately recorded.
Next: Inspect the release browser evidence, then obtain player feedback on this first connected district mission.

### F03 - Skyglass animated cast and bounded shaders
State: In review. Priority: P0. Dependencies: F01, P02.
Acceptance: License-pinned local character assets, independent animated skeletons, visible fallbacks on failed loads, reduced-motion and Light/XR budgets, controller-accessible graphics options and real WebGL compile validation.
Evidence: art/characters/manifest.json; cast-rig.mjs; cast-scene.mjs; skyglass-shaders.mjs; tests/cast.test.mjs; tests/skyglass-browser.py.
Next: Record browser and publication evidence; keep physical hardware and player art approval separate.

## Release evidence
v0.8.0 Foundry Finish: PR #116; deployed source 878fc4923226c0fce2b5e7d90042bc2f1cbafc06; publication run 34702682332 matched 78 files.
v0.9.0 Bellwether Blackout: see BELLWETHER-BLACKOUT.md, the Bellwether browser review, and the post-merge public-file verification workflow. Implementation and publication are not substitutes for player or physical-hardware acceptance.
