# Vesperfall: a quality-gated path toward a finished premium game

Plan version 0.10.0. Updated 2026-09-12. The maintained playable project is this `vesperfall/` directory. This plan updates the existing 38-task board rather than creating a competing game or discarding historical IDs.

The long-term aspiration is AAA-level finish. This document does not claim that the prototype has achieved that quality, that it has a particular production budget or staffing level, or that checking a certain number of boxes will certify it. The immediate target is one polished, reliable, distinctive vertical slice. The quality of the experience matters more than the number of systems or rooms.

## The source of truth

`roadmap.json` is the canonical committed backlog. `roadmap.html` is its readable board, with search, milestone, priority and discipline filters and Xbox navigation. `AAA-PRODUCTION.xlsx` is a six-sheet versioned workbook snapshot. The workbook contains Start Here, Backlog, Milestones, Device QA, Release Gates and Risk Register. It records 76 tasks, preserving V01-V38 and adding V39-V76.

Each task identifies a reason, acceptance gate, dependency, priority, owner role, implementation status, evidence and release where relevant. Owner roles are responsibilities to assign, not a claim that a staffed production team already exists. Dates, budgets, staffing and delivery estimates must be planned with actual resources; no invented schedule is included.

The board's status edits are local to that browser. They do not commit to GitHub, synchronize the workbook or change saved gameplay. Export produces a clearly labeled local planning JSON file. The default view always shows committed status. The workbook is regenerated when the canonical plan changes; a matching SHA-256 digest in the workbook ties it to its JSON source.

## Milestone sequence

M0 preserves the shipped foundations: physical archery, collision-tested Blink, shields, crossbow, optional movement, seeded worlds, progression, expanded enemy orders, graphics, audio and browser/VR/AR input paths.

M1 closes interruption and first-session gaps. Pilgrim's Rest supplies local saved expeditions and recovery; First Bell now teaches those controls through real gameplay outcomes. First-user confusion, fatigue and hardware ergonomics remain unmeasured.

M2 concentrates on combat mastery. Add a coordinated encounter director with telegraphed threat budgets and recovery opportunities, then one original multi-phase boss. An authored route should link learning, exploration, tactical approaches and a meaningful payoff. The proposed 20-30 minute slice is a design target to measure later, not a current content-duration claim.

M3 establishes production art and identity: original or properly licensed rigged creatures and hands, animation blending and reactions, deliberate environment kits, distinct biome navigation, public-only environmental narrative and a human-reviewed sound mix. The current synthesized music and procedural character models are not a substitute for those remaining production gates.

M4 measures the real devices and makes the experience accessible. Test Quest 3 frame times and thermal stability, actual Xbox connection behavior, seated/standing reach, controller remapping, captions, contrast and reduced effects. Work here can overlap M2 and M3. Proposed Quest targets are 72 Hz with p95 CPU and GPU frame times each below 13.89 ms; a 90 Hz option targets 11.11 ms. These are planning budgets, not measurements of the existing release.

M5 is content-complete alpha and measured beta: finish the agreed scope, preserve save migration, run broad seed/lifecycle regressions, complete provenance audits and record external player feedback. Proposed initial research/soak batch sizes are tracked as targets, not completed studies. Automated success does not establish that players discover routes, enjoy the combat or remain comfortable.

M6 is release-candidate stability and supported launch: no known save-loss/crash/softlock/input-blocking defects in supported modes, build-specific physical-device evidence, public-byte verification, clear known issues, support guidance and save-safe rollback. Online accounts, telemetry, multiplayer, payments and remote services remain deferred pending explicit design and authorization.

## This release: First Bell

V15, V47 and V48 retain the saved expedition and planning foundation. First Bell adds ten guided lessons and a scored three-court Oath ending in an original three-phase Bellkeeper. V49-V52 and V76 now record the integrated software as Partial, not as completed human or hardware approval. The next work is real-player onboarding and counterplay review, stronger route variation, viable builds and production character animation. The proposed 20-30 minute duration has not been measured or certified.

Implementation, automated/browser verification, public deployment, physical hardware acceptance and human review remain separate facts. A task labeled Implemented is not automatically hardware-certified or production-finished. Older umbrella tasks V13, V14, V23, V30 and V35 are explicitly Partial rather than falsely credited as complete. Existing physical-device tasks remain open.

## Release discipline

Every upgrade should preserve the existing game and profile, run syntax/model and relevant native browser/controller suites, commit the actual source, merge the reviewed changes, and verify both deployment and the real public launch path. Publication checks include the board, canonical data, workbook and runtime assets. Temporary source-transfer artifacts are removed before the final release.

For long CPU-only regression runs, the existing functional-render fixture reduces desktop draw cadence but not simulation, input, geometry or damage; dedicated graphics, audio and XR checks run separately without it. Neither that fixture nor synthetic input is a hardware-performance or comfort certificate.

Known major risks remain actual Quest performance, long-session sound fatigue, unfinished character/animation production, lifecycle coupling between modules, browser storage eviction and untested future generator migration. The workbook records owners, triggers and mitigations for these risks instead of hiding them inside a completion percentage.
