# Leo's Guild - AAA-quality production roadmap

Owner: Micah Blumberg / SVGN. Updated September 12, 2026.

This is the continuing production checklist for the EXISTING game in leonardos-guild/. It is not a new prototype, a claim that the current game is AAA, or a percentage-complete estimate. The goal is polished, coherent, ambitious play rather than a larger feature count. UPGRADE-CHECKLIST.md preserves the original density tasks D01-D22 and art/service tasks A01-A06/NET01-NET03. This document orders those goals by dependencies and acceptance evidence.

Read this file, AGENTS.md, release.json, the latest merged release PR and the latest player feedback before each continuation. Never overwrite another game's concurrent updates. Preserve this city, all previous missions, 49 multilevel houses, rooftop/undercity paths, old saves, vehicles and both controller profiles.

## Release register and current slice

The verified baseline is Resonance v0.8.0, PR100, followed by the quieter-audio correction in PR104 (merge 04f97c95). The correction retained separate music/effects/environment controls and introduced Quiet/Balanced/Full cue density and strictly single-stream music. Quiet audio is a product requirement, not a temporary test setting.

Living Stories v0.9.0 advances D03, D06 and D16: two authored six-step cases, alternate roof/cellar evidence routes, a reversible shutter puzzle, evidence-based reasoning, peaceful settlement choices and persistent visible household outcomes. It does not close those entire roadmap items. No new automatic story audio or forced time limit is introduced. The release PR must contain the final test-source identities and post-merge public-file receipt; code or this register alone is not deployment proof.

States: [x] means the narrowly worded implemented baseline exists, not that a whole AAA milestone is certified. [ ] means its full acceptance criterion remains open. A phase closes only when its evidence is retained and the user has playtested it. Model fixtures, browser journeys, physical hardware tests, subjective listening and publication verification are different evidence types.

Steady Steps v0.10.0 advances parts of C01-C03: a shared original articulated character sample, displacement-driven poses, and continuous proxy-bound camera collision with floor-specific handling. These tasks remain open below because finished animation, foot planting and broad human camera review are not completed by this slice. See STEADY-STEPS.md and its release PR for exact acceptance. Quiet audio and every earlier adventure remain.

## Phase 0 - Stable, calm, controller-complete foundation

Dependencies: none. This phase remains a gate for every later phase.

- [x] F01 Preserve the original save namespace and additive validated progression; existing recovery and reset cancellation remain.
- [x] F02 Provide independent music, effects and environment levels, Quiet cue density, a quiet preset and at most one score stream.
- [x] F03 Provide standard Xbox navigation on title, pause, shops, notes, settings, search entry and nested dialogs; retain Classic and Console profiles.
- [x] F04 Retain automatic model/browser regressions and post-merge verification of actual public bytes and the homepage card.
- [ ] F05 Validate real Xbox USB and Bluetooth controllers on the owner's target browsers; record device, OS, browser, reconnect and every dialog path.
- [ ] F06 Complete binding remapping, stick sensitivity/inversion/deadzones and hold/toggle alternatives without losing UI back/confirm.
- [ ] F07 Audit worst-case sound density, simultaneous events, muted captions and repeated resume; perform actual speaker/headphone listening, not only amplitude tests.
- [ ] F08 Add recoverable save export/import and corruption recovery with confirmations, size limits and old-version round trips.

Exit: no unresolved progression-loss, input-lock, deafening-audio or crash defects in the chosen supported configurations. Every published upgrade has a traceable source and a working recovery path.

## Phase 1 - One polished playable slice, not more empty map

Dependencies: Phase 0 software gates. Focus on the workshop and western households first.

- [x] V01 Retain four physical floors per house and continuous roof/underground routes; preserve original gate prerequisites.
- [x] V02 Add Living Stories: two individually written cases with six physical steps each, alternative evidence routes and permanent visible results.
- [ ] V03 Complete a coherent 20-30 minute opening with an optional tutorial, one memorable character arc, one meaningful route choice, one combat/peaceful choice and a satisfying return.
- [ ] V04 Give at least three sample houses distinct architecture, floor dressing, workspaces, inhabitants, clues and consequences, then review them at gameplay distance.
- [ ] V05 Run a first-time player study: log where players get lost, controller errors, missed doors, rereading and perceived repetition; fix issues before scaling the template.
- [ ] V06 Demonstrate that all essential information is available without audio or color alone and with readable text scaling.

Exit: the owner approves the opening slice as enjoyable, readable and coherent. Two cases and 49 house records do not by themselves satisfy this gate.

## Phase 2 - Character, camera and combat quality

Dependencies: Phase 1 direction approved; source/redistribution rights established before importing art.

- [ ] C01 Replace placeholder humanoid presentation with a coherent clothed character set and documented reusable rigs.
- [ ] C02 Retarget walk, run, idle, work, ride, mount/dismount, aim, stagger, dodge and yield animations; eliminate sliding and abrupt transitions.
- [ ] C03 Add camera collision/occlusion recovery, consistent shoulder aiming and stairs/interior framing; test narrow rooms and rapid modal changes.
- [ ] C04 Improve readable attack telegraphs, weapon reach, hit feedback and non-lethal surrender; eliminate unavoidable doorway attacks.
- [ ] C05 Make rivals use obstacle-aware pursuit, investigation, retreat and return-to-duty without crossing walls or floors.
- [ ] C06 Add difficulty/accessibility options that alter threats predictably, not undocumented physics or reward multipliers.

Exit: frame-by-frame and controller play review confirms consistent motion, readable threats, fair defense and no camera failures through the reference slice.

## Phase 3 - Deliberate traversal and living districts

Dependencies: stable camera/character scale and an approved house-direction sample.

- [ ] W01 Maintain a route graph with streets, doors, stairs, ladders, rooftop connections and tunnels. Audit loops, chokepoints, shortcuts and locked edges.
- [ ] W02 Add a true route-line planner with floor transitions and intermediate waypoints; never draw a route through a locked gate or occupied wall.
- [ ] W03 Replace generic repeated bridges with authored rooftop crossings, courtyards and street alternatives; all advertised paths must be physically traversable.
- [ ] W04 Add readable resident schedules and work/rest routines with safe waiting and no permanently missed essential quest.
- [ ] W05 Grow companion navigation and household reactions to completed work without wall-crossing teleports or uncontrolled entity counts.
- [ ] W06 Extend the map only after existing sample districts meet the house/activity quality bar; new land alone is not progress.

Exit: route connectivity tests plus human playtests establish multiple understandable ways to travel, with no dead-end mission state.


## Region architecture - one world, different ways to play

Borderlands v0.11.0 establishes the region contract for later production. Vinci is a safe social/crafting town. Cinder Hollow is an opt-in dangerous badlands reached through an explicit gate with persistent character/equipment/save state. A future Farmlands region is reserved for growing, animals, gathering, irrigation, deliveries and stewardship; it must not secretly become another mandatory combat zone. Region boundaries own their simulation rules, and enemies/projectiles may not cross the safe-town boundary.

- [x] RGN01 Safe-town rule blocks damaging staff/sling and hostile AI in Vinci while preserving peaceful compatibility routes for older progression.
- [x] RGN02 First badlands slice provides three connected physical routes, retreat, sanctuary camp, persistent monsters, resources and return-to-town contracts.
- [ ] RGN03 Add a floor/region-aware route planner across town gate, badlands paths and later farms without teleporting.
- [ ] RGN04 Build Farmlands as a genuinely noncombat-capable production/stewardship loop with no offline punishment.
- [ ] RGN05 Human-playtest risk/reward, retreat readability and combat pacing before scaling monster count or adding another hostile region.

## Phase 4 - Deeper adventures and systems

Dependencies: Phases 1-3 gameplay foundations; keep earlier D01-D22 goals.

- [ ] S01 Add authored civic work, merchant disputes, missing possessions and investigations with at least two meaningfully different solutions where the story warrants them.
- [ ] S02 Build persistent consequences that affect residents, services, repaired objects or access rather than only a completion counter.
- [ ] S03 Add inventory/crafting recipe discovery and distinct skill solutions with explicit resource costs and no duplicated rewards.
- [ ] S04 Develop evidence-aware, proportional watch behavior with observation, lost sight, de-escalation and peaceful resolution; do not label local commotion a finished police system.
- [ ] S05 Expand bicycle/cargo/tandem prototypes while retaining stock handling; validate stopping, slopes, turning, parking and recovery for each.
- [ ] S06 Introduce flight only after takeoff, steering, collision, landing and recovery are implemented and tested. Existing blueprints are not flight.
- [ ] S07 Explore property/vehicle economics and real armor progression only with useful gameplay and bounded save rules, not decorative shop screens.
- [ ] S08 Add another playable protagonist only with distinct state, animations, abilities, missions and safe switching. Current disciplines are not protagonists.

Exit: systems support authored adventures without currency exploits, repeated padding or mandatory loud feedback. Defer multiplayer until single-player quality is stable.

## Phase 5 - World art, sound and performance production

Dependencies: approved slice and target-device list. The numbers below are TARGETS, not current measurements.

- [ ] P01 Establish an art bible for scale, materials, palette, lighting, architectural families, signage and visual storytelling; keep complete asset provenance.
- [ ] P02 Add streaming/LOD/culling budgets for geometry, draw calls, textures, lights, audio and NPC updates. Document load boundaries and collision consistency.
- [ ] P03 Target 60 FPS on the named desktop reference device and 30 FPS on the named mobile reference device; record frame-time percentiles and long-session memory, not isolated screenshots.
- [ ] P04 Record cold/warm start, asset transfer, shader stutter and recovery on the supported browser/device matrix before claiming performance.
- [ ] P05 Replace or refine weak sound assets based on actual listening; preserve independent sliders, cue limits, one music stream and hearing-accessible alternatives.
- [ ] P06 Establish visual regression captures for the same route, time, quality level, camera and save; approve meaningful improvements rather than changing exposure to hide defects.

Exit: no unbounded memory/audio growth, severe stutter or visual/collision disagreement in the reference routes and soak tests. Rights and optimization records accompany every imported asset.

## Phase 6 - Content-complete alpha, accessibility and beta

Dependencies: approved content scope and performance envelope; do not add new systems while fixing release blockers.

- [ ] Q01 Maintain a mission/dependency matrix with entry conditions, every solution, failure/retry/cancel path, reward and saved outcome.
- [ ] Q02 Validate old saves, fresh saves, recovery and interrupted sessions across all authored content.
- [ ] Q03 Run desktop keyboard/mouse, touch and real-controller accessibility passes, including captions, text size, color-independent cues, reduced motion and readable focus.
- [ ] Q04 Add reproducible crash/error logs and opt-in feedback with privacy boundaries; no secret analytics or account creation.
- [ ] Q05 Complete hours-long stability and repeated-area-return tests; inspect memory, audio-source counts and frame-time trends.
- [ ] Q06 Triage by player impact: progression loss/crashes first, control and readability next, presentation afterward. Retain failed evidence and reproducible steps.
- [ ] Q07 Run an owner-led external playtest, then beta sign-off against the agreed scope, not the aspirational feature list.

Exit: no open release-blocking defects; all supported input methods and core adventures pass; remaining limitations are named.

## Phase 7 - Release and sustainable expansion

Dependencies: beta sign-off and final rights/security review.

- [ ] R01 Prepare versioned release notes, player instructions, accessibility/support information and rollback to a known good release.
- [ ] R02 Verify the exact deployed assets, build identifier, homepage entry, old-save continuation and a live smoke test after deployment.
- [ ] R03 Record owner acceptance and next priorities from real play, not test-count marketing.
- [ ] R04 Authoritative co-op, accounts, moderation, trades and entitlements require separate security design and explicit service authorization. No MMO claims from client-only state.

## Next-upgrade order

After Living Stories: first playtest the two cases and quiet audio, then improve camera collision and a coherent animated character sample (C01-C03), then create the floor-aware route planner (W01-W02). Add more bespoke houses only after that sample is approved. Preserve both peaceful endings and all earlier content.

Each new release must name the task IDs it advances, the exact narrow scope, the tests actually run, the remaining human/hardware checks, the merge commit and the successful public verification. Never mark an entire phase complete because one slice or one automated test passed.
