# Rainward: AAA-quality production checklist

Release baseline: v0.11.0 / First Light.

A proposed production path toward AAA-quality finish, not a claim of current AAA status, a funded schedule or platform certification.

Canonical delivery statuses change only in a reviewed source commit. Browser checkmarks are local review notes, not proof of implementation. Proposed targets require owner approval. Preserve all six chapters, saves, sibling applications and asset credits.

## Status legend

Planned: Not implemented to the stated criterion.
Implemented: A working foundation exists; the full criterion still needs review.
Automated: The specifically scoped automated criterion has evidence; physical devices and player enjoyment are not certified.
Blocked: The approval gate depends on unfinished work.
Approved: The criterion has a named reviewer and recorded sign-off.

Canonical data: [production-plan.json](production-plan.json). Interactive board: [roadmap.html](roadmap.html).
Each checkbox remains open until human acceptance is recorded. Automated status is narrower than final approval.

## G0 / Release foundation

Close regressions before adding more content.

Gate: All supported input paths start, save, reload and produce audio without uncaught errors.

- [ ] RW-001 / P0 / Audio context rate compatibility / Automated
  Owner role: Audio engineering. Assigned reviewer: Unassigned. Effort: Unestimated.
  Acceptance: Audio graph renders at 24, 44.1, 48 and 96 kHz; live playback starts after a permitted user action.
  Dependencies: None.
  Evidence: tests/soundscape.py.

- [ ] RW-002 / P0 / Independent chapter shelter saves / Automated
  Owner role: Gameplay engineering. Assigned reviewer: Unassigned. Effort: Unestimated.
  Acceptance: Six chapter checkpoints coexist; restarting one changes no other slot; current legacy saves migrate without loss.
  Dependencies: None.
  Evidence: tests/field-ready.test.mjs.

- [ ] RW-003 / P0 / Controller-reachable equipment / Implemented
  Owner role: UI engineering. Assigned reviewer: Unassigned. Effort: Unestimated.
  Acceptance: Select each gun and tool in the satchel, then return using B; keyboard and touch have the same equipment access.
  Dependencies: None.
  Evidence: field-ready-ui.mjs.

- [ ] RW-004 / P0 / Finite inventory and save validation / Automated
  Owner role: Gameplay engineering. Assigned reviewer: Unassigned. Effort: Unestimated.
  Acceptance: Reloading, switching, pickup, restore and cancellation cannot duplicate ammunition, supplies or completed tasks.
  Dependencies: None.
  Evidence: tests/survival-sound.test.mjs.

- [ ] RW-005 / P0 / Current native acceptance suite / Implemented
  Owner role: QA engineering. Assigned reviewer: Unassigned. Effort: Unestimated.
  Acceptance: All native journeys run on the exact release source; failures remain visible and no required assertions are skipped.
  Dependencies: None.
  Evidence: tests/.

- [ ] RW-006 / P0 / Controller and audio device acceptance / Planned
  Owner role: Hardware QA. Assigned reviewer: Unassigned. Effort: Unestimated.
  Acceptance: Record wired and Bluetooth Xbox playthroughs with menus, disconnect, audio activation, crafting and healing on real hardware.
  Dependencies: RW-003, RW-005.
  Evidence: Not recorded yet.

- [ ] RW-007 / P1 / Save recovery and write-failure handling / Automated
  Owner role: Gameplay engineering. Assigned reviewer: Unassigned. Effort: Unestimated.
  Acceptance: Corrupt primary data recovers a valid backup; storage failure never overwrites the last valid primary or legacy mirror.
  Dependencies: RW-002.
  Evidence: tests/field-ready.test.mjs.

- [ ] RW-008 / P1 / Versioned production checklist / Implemented
  Owner role: Production. Assigned reviewer: Unassigned. Effort: Unestimated.
  Acceptance: Each task has an owner role, priority, acceptance criterion, status, dependencies and evidence; every release updates the board.
  Dependencies: None.
  Evidence: production-plan.json.

## G1 / Flagship vertical slice

Make one complete segment worth playing repeatedly.

Gate: A 15-20 minute Floodgate slice passes an art review and a recorded, independent player test.

- [ ] RW-009 / P0 / Vertical-slice design lock / Implemented
  Owner role: Game direction. Assigned reviewer: Unassigned. Effort: Unestimated.
  Acceptance: Approve one 15-20 minute Floodgate slice: approach, stealth, discovery, escalation, recovery and extraction, with no filler.
  Dependencies: RW-005.
  Evidence: FIRST-LIGHT.md.

- [ ] RW-010 / P0 / Readable first encounter / Implemented
  Owner role: Encounter design. Assigned reviewer: Unassigned. Effort: Unestimated.
  Acceptance: First-time players identify cover, patrol direction and their objective without needing an outside explanation.
  Dependencies: RW-009.
  Evidence: FIRST-LIGHT.md.

- [ ] RW-011 / P1 / Playable alternate approach / Implemented
  Owner role: Level design. Assigned reviewer: Unassigned. Effort: Unestimated.
  Acceptance: The slice supports at least two meaningfully different routes; both are collision-tested and have different risk/reward.
  Dependencies: RW-009.
  Evidence: FIRST-LIGHT.md.

- [ ] RW-012 / P1 / Stealth-to-combat-to-recovery pacing / Planned
  Owner role: Systems design. Assigned reviewer: Unassigned. Effort: Unestimated.
  Acceptance: A recorded playthrough moves through all three states without unavoidable damage, empty downtime or an inventory dead end.
  Dependencies: RW-010.
  Evidence: Not recorded yet.

- [ ] RW-013 / P1 / Environmental story beat / Implemented
  Owner role: Narrative design. Assigned reviewer: Unassigned. Effort: Unestimated.
  Acceptance: An original scene communicates who lived here and why the player should care, using space and interaction rather than a text dump.
  Dependencies: RW-009.
  Evidence: FIRST-LIGHT.md.

- [ ] RW-014 / P0 / Hero scene art benchmark / Planned
  Owner role: Art direction. Assigned reviewer: Unassigned. Effort: Unestimated.
  Acceptance: Approve fixed-camera images and motion captures of the slice in daylight, rain and interior lighting.
  Dependencies: RW-033.
  Evidence: Not recorded yet.

- [ ] RW-015 / P0 / Independent player study / Planned
  Owner role: User research. Assigned reviewer: Unassigned. Effort: Unestimated.
  Acceptance: Record five unfamiliar players; proposed gate: at least four complete the slice and explain core controls without intervention.
  Dependencies: RW-010, RW-011, RW-012.
  Evidence: Not recorded yet.

- [ ] RW-016 / P0 / Slice approval gate / Blocked
  Owner role: Game direction. Assigned reviewer: Unassigned. Effort: Unestimated.
  Acceptance: Game owner approves the complete slice after playtest, art review and hardware/performance review; record rejected points too.
  Dependencies: RW-006, RW-014, RW-015, RW-054.
  Evidence: Not recorded yet.

## G2 / Combat and stealth

Make each encounter readable, fair and expressive.

Gate: Melee, ranged, evasion, detection and resource economies hold up across repeat encounters.

- [ ] RW-017 / P1 / Survival controller action mapping / Automated
  Owner role: Gameplay engineering. Assigned reviewer: Unassigned. Effort: Unestimated.
  Acceptance: Tap/hold B, X melee, LB dodge, RB listen, LT+X reload and menu controls remain distinct and neutral-arm after mode changes.
  Dependencies: None.
  Evidence: tests/survival-sound.test.mjs.

- [ ] RW-018 / P1 / Telegraphed enemy attack windows / Implemented
  Owner role: Combat design. Assigned reviewer: Unassigned. Effort: Unestimated.
  Acceptance: Windup, impact, recovery and counter windows are visually and audibly legible for every enemy role.
  Dependencies: RW-017.
  Evidence: monsters.mjs.

- [ ] RW-019 / P1 / Melee hit reaction and tools / Implemented
  Owner role: Combat engineering. Assigned reviewer: Unassigned. Effort: Unestimated.
  Acceptance: Contacts respect range, facing, walls, stamina and durability; animation and feedback must be reviewed at game speed.
  Dependencies: None.
  Evidence: survival.mjs.

- [ ] RW-020 / P1 / Ranged weapon handling polish / Planned
  Owner role: Combat design. Assigned reviewer: Unassigned. Effort: Unestimated.
  Acceptance: Tune aim speed, recoil, spread, reticle and reload poses on controller; validate sidearm and rifle as distinct choices.
  Dependencies: RW-006, RW-019.
  Evidence: Not recorded yet.

- [ ] RW-021 / P1 / Patrol communication and search variety / Planned
  Owner role: AI design. Assigned reviewer: Unassigned. Effort: Unestimated.
  Acceptance: Enemies share only plausible information, search a remembered location, flank through navigable routes and eventually stand down.
  Dependencies: RW-018.
  Evidence: Not recorded yet.

- [ ] RW-022 / P1 / Human-shield grab prototype / Planned
  Owner role: Combat engineering. Assigned reviewer: Unassigned. Effort: Unestimated.
  Acceptance: Prototype the requested grab with animation, escape/release, enemy response, controller prompts and non-blocking state transitions.
  Dependencies: RW-019, RW-035.
  Evidence: Not recorded yet.

- [ ] RW-023 / P1 / Deployable distraction/trap tool / Planned
  Owner role: Systems design. Assigned reviewer: Unassigned. Effort: Unestimated.
  Acceptance: Add a finite, craftable deployable with clear placement preview, enemy interaction, counters, cleanup and checkpoint rules.
  Dependencies: RW-004, RW-020.
  Evidence: Not recorded yet.

- [ ] RW-024 / P1 / Resource economy playtest / Planned
  Owner role: Systems design. Assigned reviewer: Unassigned. Effort: Unestimated.
  Acceptance: Record stealth, mixed and combat-heavy runs; demonstrate recovery paths without infinite resource farming or mandatory grinding.
  Dependencies: RW-020, RW-023.
  Evidence: Not recorded yet.

## G3 / Campaign and world

Expand authored variety rather than duplicating rooms.

Gate: Every chapter has a distinct route, pacing plan, task arc and verified beginning-to-end playthrough.

- [ ] RW-025 / P1 / Six authored expedition foundations / Implemented
  Owner role: Level design. Assigned reviewer: Unassigned. Effort: Unestimated.
  Acceptance: Floodgate, Conservatory, Terminus, Meridian, Breakwater and Whiteout retain distinct footprints, objectives and physical puzzle gates.
  Dependencies: None.
  Evidence: world.mjs.

- [ ] RW-026 / P1 / Chapter task and dependency graph / Implemented
  Owner role: Mission design. Assigned reviewer: Unassigned. Effort: Unestimated.
  Acceptance: Required work blocks extraction correctly; optional work remains optional; rewards and journal state survive checkpoints.
  Dependencies: None.
  Evidence: field-tasks.mjs.

- [ ] RW-027 / P1 / Campaign progression and chapter saves / Implemented
  Owner role: Gameplay engineering. Assigned reviewer: Unassigned. Effort: Unestimated.
  Acceptance: Continue the chosen chapter or latest shelter without erasing other expeditions; distinguish unsaved progress clearly.
  Dependencies: RW-002.
  Evidence: checkpoint-store.mjs.

- [ ] RW-028 / P1 / Chapter route and pacing audit / Planned
  Owner role: Level design. Assigned reviewer: Unassigned. Effort: Unestimated.
  Acceptance: Review all six chapters for landmarks, shortcuts, sightlines, supply spacing, backtracking and encounter rhythm.
  Dependencies: RW-016, RW-025.
  Evidence: Not recorded yet.

- [ ] RW-029 / P1 / New puzzle interaction families / Planned
  Owner role: Puzzle design. Assigned reviewer: Unassigned. Effort: Unestimated.
  Acceptance: Build a prototype unlike the existing wheels or linked breakers, with in-world clues, reset safety and optional layered hints.
  Dependencies: RW-028.
  Evidence: Not recorded yet.

- [ ] RW-030 / P1 / Collision-authored window and ledge traversal / Planned
  Owner role: Traversal engineering. Assigned reviewer: Unassigned. Effort: Unestimated.
  Acceptance: Build supported windows, ledges and gaps with valid starts/landings, camera clearance and enemy navigation; do not promise arbitrary traversal.
  Dependencies: RW-035.
  Evidence: Not recorded yet.

- [ ] RW-031 / P2 / Swimming and water encounter design / Planned
  Owner role: Traversal design. Assigned reviewer: Unassigned. Effort: Unestimated.
  Acceptance: Prototype buoyancy, boundaries, exit points, camera, input and enemy interactions together before introducing swim-required routes.
  Dependencies: RW-030.
  Evidence: Not recorded yet.

- [ ] RW-032 / P1 / Complete campaign playthrough evidence / Planned
  Owner role: QA. Assigned reviewer: Unassigned. Effort: Unestimated.
  Acceptance: Record each chapter from start through all required work to extraction with ordinary inputs, preserving exact build and save evidence.
  Dependencies: RW-024, RW-028, RW-029.
  Evidence: Not recorded yet.

## G4 / Art and animation

Bring characters and places to a consistent production standard.

Gate: Camera-matched art reviews approve the hero, enemies, animation, architecture, effects and lighting.

- [ ] RW-033 / P0 / Original visual direction bible / Planned
  Owner role: Art direction. Assigned reviewer: Unassigned. Effort: Unestimated.
  Acceptance: Approve proportions, silhouettes, architecture, materials, palette and visual hierarchy; use references for direction, not copied assets.
  Dependencies: None.
  Evidence: Not recorded yet.

- [ ] RW-034 / P1 / Production hero character / Planned
  Owner role: Character art. Assigned reviewer: Unassigned. Effort: Unestimated.
  Acceptance: Build an original coherent hero mesh with clothing layers, facial detail, UVs and LODs; compare against the current procedural rig.
  Dependencies: RW-033.
  Evidence: actors.mjs.

- [ ] RW-035 / P1 / Authored locomotion and action clips / Planned
  Owner role: Animation. Assigned reviewer: Unassigned. Effort: Unestimated.
  Acceptance: Approve walk, run, crouch, crawl, turn, aim, reload, strike, stagger, vault, heal and craft transitions without visible snapping.
  Dependencies: RW-034.
  Evidence: Not recorded yet.

- [ ] RW-036 / P1 / Foot placement and hand contacts / Planned
  Owner role: Technical animation. Assigned reviewer: Unassigned. Effort: Unestimated.
  Acceptance: Feet follow slopes and stairs; hands align to weapons and traversal contacts; solve IK failures without destabilizing gameplay.
  Dependencies: RW-035.
  Evidence: Not recorded yet.

- [ ] RW-037 / P1 / Enemy silhouettes and reactions / Planned
  Owner role: Character art. Assigned reviewer: Unassigned. Effort: Unestimated.
  Acceptance: Every enemy role is recognizable in silhouette and motion, with distinct clothing/body treatment and readable damage states.
  Dependencies: RW-033, RW-035.
  Evidence: Not recorded yet.

- [ ] RW-038 / P1 / Architecture and prop production kit / Planned
  Owner role: Environment art. Assigned reviewer: Unassigned. Effort: Unestimated.
  Acceptance: Replace conspicuous repeated blocks with an original modular kit, trim details, usable interiors and authored wear at consistent scale.
  Dependencies: RW-033.
  Evidence: ASSET-PIPELINE.md.

- [ ] RW-039 / P1 / Lighting and VFX scene continuity / Planned
  Owner role: Lighting art. Assigned reviewer: Unassigned. Effort: Unestimated.
  Acceptance: Review interior/exterior transitions, shadows, rain, puddles, smoke, muzzle flashes and restrained effects on both graphics tiers.
  Dependencies: RW-038.
  Evidence: VISUAL-UPGRADE.md.

- [ ] RW-040 / P1 / Asset optimization and provenance / Implemented
  Owner role: Technical art. Assigned reviewer: Unassigned. Effort: Unestimated.
  Acceptance: Every imported asset retains source/license/hash records; final hero and environment assets also need LOD, memory and streaming review.
  Dependencies: RW-034, RW-038.
  Evidence: assets/.

## G5 / Sound and music

Make sound useful, emotional and dependable.

Gate: Every audible action has an appropriate cue; music transitions and mixes pass measured and listening reviews.

- [ ] RW-041 / P1 / Original six-chapter adaptive score / Implemented
  Owner role: Music. Assigned reviewer: Unassigned. Effort: Unestimated.
  Acceptance: Six distinct arrangements respond to danger and listening; composition quality and emotional pacing still require listening review.
  Dependencies: RW-001.
  Evidence: audio-design.mjs.

- [ ] RW-042 / P1 / Stereo direction and obstacle muffling / Automated
  Owner role: Audio engineering. Assigned reviewer: Unassigned. Effort: Unestimated.
  Acceptance: Source distance and camera orientation affect output; walls muffle sounds; mono does not remove caption direction.
  Dependencies: RW-001.
  Evidence: tests/field-ready.test.mjs.

- [ ] RW-043 / P1 / Layered Foley and action cues / Implemented
  Owner role: Sound design. Assigned reviewer: Unassigned. Effort: Unestimated.
  Acceptance: Movement surfaces, shots, reload stages, impacts, cloth, crafting, healing, creatures, mechanisms and supplies have distinct cues.
  Dependencies: None.
  Evidence: audio.mjs.

- [ ] RW-044 / P1 / Authored Foley listening pass / Planned
  Owner role: Sound design. Assigned reviewer: Unassigned. Effort: Unestimated.
  Acceptance: Review loudness, texture, timing, repetition and material realism for every cue on headphones and speakers; replace weak placeholders.
  Dependencies: RW-043.
  Evidence: Not recorded yet.

- [ ] RW-045 / P1 / Room-aware reverb and sound portals / Planned
  Owner role: Audio engineering. Assigned reviewer: Unassigned. Effort: Unestimated.
  Acceptance: Interiors, streets, tunnels and courtyards use coherent acoustic transitions without leaking high-cost node allocation.
  Dependencies: RW-042.
  Evidence: Not recorded yet.

- [ ] RW-046 / P1 / Musical transitions and dramatic silence / Planned
  Owner role: Music. Assigned reviewer: Unassigned. Effort: Unestimated.
  Acceptance: Author bar-aligned transitions, exploration variation, combat exit and silence so the score does not loop mechanically or mask cues.
  Dependencies: RW-041.
  Evidence: Not recorded yet.

- [ ] RW-047 / P1 / Mixer accessibility and output budgets / Implemented
  Owner role: Audio engineering. Assigned reviewer: Unassigned. Effort: Unestimated.
  Acceptance: Independent sliders, mono, night mix and captions remain controller reachable; voice and sample-cache budgets stay bounded.
  Dependencies: RW-001.
  Evidence: audio-mixer.mjs.

- [ ] RW-048 / P1 / Final mix and device listening approval / Planned
  Owner role: Audio QA. Assigned reviewer: Unassigned. Effort: Unestimated.
  Acceptance: Measure peaks and dynamic range, then record subjective approval on headphones, laptop speakers and a TV with real controller play.
  Dependencies: RW-044, RW-045, RW-046, RW-047.
  Evidence: Not recorded yet.

## G6 / Accessibility and performance

Measure the actual target devices and input methods.

Gate: The agreed hardware matrix meets its frame-time, memory, readability and accessibility targets.

- [ ] RW-049 / P1 / Full remapping and hold alternatives / Planned
  Owner role: Accessibility engineering. Assigned reviewer: Unassigned. Effort: Unestimated.
  Acceptance: Offer remapping, conflict resolution, hold/toggle alternatives and readable per-device prompts; test every resulting action path.
  Dependencies: RW-017.
  Evidence: Not recorded yet.

- [ ] RW-050 / P1 / Caption and interface readability / Planned
  Owner role: UI accessibility. Assigned reviewer: Unassigned. Effort: Unestimated.
  Acceptance: Review text size, contrast, safe areas, caption direction, speaker identification and color-independent signals across target displays.
  Dependencies: RW-047.
  Evidence: Not recorded yet.

- [ ] RW-051 / P1 / Reduced motion and adjustable HUD / Implemented
  Owner role: UI engineering. Assigned reviewer: Unassigned. Effort: Unestimated.
  Acceptance: Players can reduce environmental motion and disable quiet-HUD fading without removing necessary gameplay information.
  Dependencies: None.
  Evidence: survival-ui.mjs.

- [ ] RW-052 / P0 / Target hardware matrix / Planned
  Owner role: Technical direction. Assigned reviewer: Unassigned. Effort: Unestimated.
  Acceptance: Name the actual CPU/GPU/RAM, browser, display resolution, controller and audio device for each supported tier before claiming performance.
  Dependencies: None.
  Evidence: Not recorded yet.

- [ ] RW-053 / P1 / Repeatable performance capture / Planned
  Owner role: Performance engineering. Assigned reviewer: Unassigned. Effort: Unestimated.
  Acceptance: Record p50/p95/p99 frame time, long frames, draw calls, memory and load time on a fixed route and exact build.
  Dependencies: RW-052.
  Evidence: Not recorded yet.

- [ ] RW-054 / P0 / Frame-time acceptance / Blocked
  Owner role: Performance QA. Assigned reviewer: Unassigned. Effort: Unestimated.
  Acceptance: Proposed targets, not current claims: desktop 1080p/60 fps and reduced tier 30 fps; agree hardware and pass sustained representative scenes.
  Dependencies: RW-039, RW-053.
  Evidence: Not recorded yet.

- [ ] RW-055 / P1 / Memory, streaming and graphics recovery / Planned
  Owner role: Engine engineering. Assigned reviewer: Unassigned. Effort: Unestimated.
  Acceptance: Bound assets and caches, test repeated chapter swaps, slow downloads and WebGL context loss; preserve checkpoint data on recovery.
  Dependencies: RW-040, RW-053.
  Evidence: Not recorded yet.

- [ ] RW-056 / P1 / Browser and device regression matrix / Planned
  Owner role: Compatibility QA. Assigned reviewer: Unassigned. Effort: Unestimated.
  Acceptance: Run agreed browser/OS/controller combinations, phones and focus-loss scenarios; scope VR separately from desktop certification.
  Dependencies: RW-006, RW-052.
  Evidence: Not recorded yet.

## G7 / Release and production

Ship a supported game with repeatable evidence.

Gate: Release blockers are closed, rights are documented, saves migrate, and a rollback has been rehearsed.

- [ ] RW-057 / P0 / Staffing, budget and ownership plan / Planned
  Owner role: Production. Assigned reviewer: Unassigned. Effort: Unestimated.
  Acceptance: Assign real owners and review capacity; estimate content and asset costs before setting a release date. Roles here are not staffing claims.
  Dependencies: RW-016.
  Evidence: Not recorded yet.

- [ ] RW-058 / P1 / Deterministic builds and evidence / Implemented
  Owner role: Build engineering. Assigned reviewer: Unassigned. Effort: Unestimated.
  Acceptance: Link every release to exact source, test reports, asset manifest and published file hashes; keep failed evidence.
  Dependencies: None.
  Evidence: tests/release.py.

- [ ] RW-059 / P1 / Asset rights and public-source boundary / Automated
  Owner role: Release engineering. Assigned reviewer: Unassigned. Effort: Unestimated.
  Acceptance: Check licensed assets, vendored notices, local runtime imports and absence of confidential material or service credentials.
  Dependencies: None.
  Evidence: tests/public.test.mjs.

- [ ] RW-060 / P1 / Long-session and save migration QA / Planned
  Owner role: QA. Assigned reviewer: Unassigned. Effort: Unestimated.
  Acceptance: Run proposed two-hour sessions with repeated deaths, restarts, chapter changes and old saves; log every regression and reproduction.
  Dependencies: RW-032, RW-055.
  Evidence: Not recorded yet.

- [ ] RW-061 / P1 / Player-facing known issues and support / Planned
  Owner role: Production. Assigned reviewer: Unassigned. Effort: Unestimated.
  Acceptance: Publish supported devices, known limitations, save recovery instructions and a clear issue-reporting path before release.
  Dependencies: RW-056, RW-060.
  Evidence: Not recorded yet.

- [ ] RW-062 / P1 / Rollback rehearsal / Planned
  Owner role: Release engineering. Assigned reviewer: Unassigned. Effort: Unestimated.
  Acceptance: Rehearse reverting a release without deleting saves or changing sibling games, then verify public hashes again.
  Dependencies: RW-058.
  Evidence: Not recorded yet.

- [ ] RW-063 / P2 / Optional platform expansion decision / Planned
  Owner role: Game direction. Assigned reviewer: Unassigned. Effort: Unestimated.
  Acceptance: Decide separately whether full VR, native packaging or multiplayer serves the game; each needs its own cost, input and QA plan.
  Dependencies: RW-057.
  Evidence: Not recorded yet.

- [ ] RW-064 / P0 / Release candidate approval / Blocked
  Owner role: Game direction. Assigned reviewer: Unassigned. Effort: Unestimated.
  Acceptance: Close critical defects and obtain player, art, audio, accessibility and hardware sign-off. A green checklist alone is not AAA quality.
  Dependencies: RW-016, RW-032, RW-048, RW-054, RW-056, RW-060, RW-061, RW-062.
  Evidence: Not recorded yet.

