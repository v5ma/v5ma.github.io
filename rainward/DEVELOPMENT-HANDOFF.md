# Current release / Wayfinder v0.14.1

Read WAYFINDER.md for clinic route chevrons, the gate/map/journal state, spatial pointer feedback and source-owned crafting holds. Open Diorama v0.14.0 is already merged in PR 154; do not revive its preparation branches. The next work remains graybox evaluation and the remaining Floodgate sequence, then chapter replacements, body/contact animation and physical Quest/Xbox review. All seven chapter identities, saves and Xbox presets are retained. The release PR and hash receipt establish publication.

The previous release records follow as historical context.

# Current release / Open Diorama v0.14.0

Read DIORAMA.md for first-person VR, third-person VR Diorama and third-person AR Diorama, controller/hand entry and the three valid shell states. Read LEVEL-DESIGN.md for the new experience-spine/graybox-first replacement contract. The first implemented replacement is the Floodgate clinic-market seam, with a 2.4-metre terrace, new north opening and saved inside-unlocked yard shutter. The other six chapter redesigns remain planned, not completed. All original chapter slots, objectives, shelters and checkpoint formats remain.

The earlier Quest Fieldwork text below describes the first-person component. Its statement excluding AR is superseded by DIORAMA.md. Physical Quest 3/Xbox, hand reliability, comfort, final art/audio and unfamiliar-player pacing gates remain unapproved. The release PR and evidence summary, not this document alone, establish publication.

# Current release / Quest Fieldwork v0.14.0

The owner selected playable Quest 3 XR as the next upgrade. Read [QUEST-FIELDWORK.md](QUEST-FIELDWORK.md) for entry, every tracked-controller button, hand pinch locomotion, immersive menus, and exact evidence boundaries. This replaces the paused overlook; it does not claim that unfinished character-motion work shipped. Existing desktop/Xbox play and all seven chapter saves are retained. Physical Quest 3 comfort, tracking and performance review remain open.

The following earlier notes are retained historical context; their stationary-XR scope does not describe this release.

# Current continuation / Clear Water v0.13.1

Read CLEAR-WATER.md first, then this retained handoff and CONTROLLER.md. The active runtime is now the Clear Water patch candidate/release, not a request to rebuild Undertow. Its release PR and evidence directory are authoritative for final candidate, merge and publication verification. The historical verifiedGameplay record in production-plan.json deliberately retains the immutable Undertow receipt.

H-01 now has a normal-start living-enemy Survival extraction at source 9c651ffd47b2cfa1ade59945a7bf56d40c87a5ad (run 34789910532). Both-preset journeys additionally exercise finite-ammo sentinel combat and reload. H-05 is implemented by aquatic-prompts.mjs and aquatic-ui.mjs; the expanded native aquatic suite gates keyboard/preset/reconnect and oxygen recovery. Keep the Classic death from the first attempt as failed evidence, and require current-source green checks before publication. The current 64-item canonical board and regenerated checklist retain unapproved human gates.

Do not re-open completed prompt work merely because the historical section below calls it open. Continue H-02 motion and contact authoring next; water audio, optional-station/pool-edge browser coverage and physical Xbox/hardware review remain unfinished. Saves, patrols, geometry, water physics, weapons and content are not changed by this patch.

The following handoff is preserved as historical context. Its v0.13.0 build, counts, priorities and test-gap statements describe that baseline, not the latest patch.

# Rainward development handoff

Updated 2026-09-13 from the Rainward development conversation and the repository. This is a continuation record, not a new gameplay release. Gameplay remains v0.13.0, Undertow. Read this before choosing another upgrade.

## Resume here

The project is **v5ma/v5ma.github.io**, directory **rainward/**, published at https://v5ma.github.io/rainward/ . Do not confuse it with the owner's other games. Inspect the current master ref and rainward/release.json first; master advances when sibling games are updated. The documentation audit started at a43d01ddd75ac7c07280e660f7dcba2282214c8f. That is not the Undertow release commit.

The last gameplay release completed in this conversation is Undertow, merged in PR 137 at **531a4a8e8c1a2be32437a44b81208572ad36ad04**. Accepted feature head: **d673fa6acb4262fc8f6a9b25cff7f4acb0aceb8b**. This work is already merged and its public files were verified. Do not rebuild Undertow from the old interrupted branch or report that it still needs publication. The historical branches feat/rainward-undertow-20260912 and feat/rainward-undertow-recovery-20260913 are recovery history, not the next working baseline.

Read production-plan.json for canonical task status, AAA_CHECKLIST.md for the generated readable checklist, CONTROLLER.md for the current controls, and UNDERTOW.md for the last release. The interactive board is roadmap.html. Browser review checkmarks are local notes, not GitHub writes or acceptance approval. DEVELOPMENT-HANDOFF.md, AGENTS.md, and the continuation metadata in production-plan.json identify the next-session requirements. Release-history details and durable evidence are in evidence/undertow-v0.13.0/.

## Owner requirements captured from this chat

Continue the existing game rather than replacing it with an unrelated prototype, rendering demo, concept image, or new project. Preserve prior chapters, saves, movement/combat systems, authored story and credits. The owner repeatedly asks for more believable people, richer environments, more levels, more enemies and meaningful tasks. Improvements need to be playable, not only proposed.

Finish committing, merging and publishing every completed upgrade, and verify the live game before saying it is live. Repeated replies that work was prepared but not published were explicitly rejected. GitHub access has sometimes been intermittent: retry a transient failure after a short wait, while respecting genuine access denials. Never force-push master or discard another session's work. Conflicts must be inspected and reconciled. The owner has several concurrent game projects; keep changes scoped to Rainward and its necessary workflows.

Xbox controller operation is an end-to-end requirement: title/chapter selection, settings, sliders, checkboxes, journal, crafting, equipment, confirmations, death/retry, saving and gameplay must not require grabbing a mouse. Preserve a usable reload action. The initial X-reload layout remains Classic; the later requested X-melee layout is Survival with LT+X reload. Do not silently conflate their bumper or D-pad bindings. Retain keyboard/touch alternatives and neutral-input arming after transitions and disconnection.

Sound and music are a major priority, not an afterthought. Maintain and improve meaningful spatial threats, movement/material Foley, action feedback, chapter music, listening-mode mix and user volume controls. Imported free human assets and attractive shaders are welcome when licensed, self-hosted, integrated and backed by a fallback. Do not require a player account, asset-provider API key or paid asset package to play.

The original image references point toward overgrown streets, believable human silhouettes, tight over-shoulder combat, concealment, rainy/snowy districts and readable interiors. The later pool images point toward an abandoned indoor aquatic center: green-blue water, ceramic tiles, ladders, underwater light and empty service space. They are visual direction, not permission or a requirement to copy commercial characters/assets/music. The VHS framing in the pool reference is not an implemented VHS feature. No image-generation job is pending; the request was for a playable water mission.

## What is actually in the released game

Seven selectable expeditions remain: The Floodgate (district), The Drowned Conservatory (conservatory), Bellweather Terminus (terminus), Meridian Ward (meridian), Breakwater Signal (breakwater), Whiteout Market (whiteout), and Northlight Natatorium (natatorium). Do not hard-code the older count of six in new saves, UI or tests.

Reclaimed City established expanded chapters, an articulated procedural survivor and distinct enemy roles, puzzles, required/optional field tasks and finite supplies. Controller Complete added native menu navigation, safe in-game confirmations, reload feedback, local settings and disconnection handling. Survival Sound added original adaptive arrangements, stereo/occlusion-aware effects, separate rifle/sidearm magazines, wear-limited melee tools, dodge/counter windows, hold crafting and hold-RT bandaging. Those timed actions are vulnerable and interruptible, not a pause screen.

Field Ready repaired the live Web Audio reverb sample-rate mismatch and added independent chapter shelter saves with backup recovery. First Light added six optional Floodgate records, Garden/Freight approach selection, brief optional guidance and real rain-garden cover. The guidance does not reveal hidden enemies, operate objectives or guarantee safety. Its field records are stored at shelters.

Rainworn integrated CC0 Quaternius Standard face, hand and hair detail into the original seventeen-bone rig and tailored Rainward outfits. It did not replace all animation with imported clips. Preserve collars/cuffs, original backpack and equipment attachments, independent actor skeletons, distance detail, cancellation of stale model loads and retry/fallback behavior. Preserve the detailed-human and wet-surface toggles. The paid Source package was not used. The free Universal Animation Library was inspected but no imported library animation is claimed as shipped. See RAINWORN.md and assets/humans/manifest.json for exact provenance and conversion tools.

Undertow adds four authored pool volumes: shallow warm-up wading, the competition pool, the diving well and the flooded filter channel. Deep water enables horizontal swimming and a toggled dive/surface depth, not free vertical 3D swimming. Air starts at 100, depletes over roughly 28 seconds submerged, and replenishes at the surface. Dry-ground combat, reload, healing and crafting stay disabled while swimming, including at the surface. Entering deep water cancels unfinished dry actions without duplicating resources.

The Natatorium has a submerged filtration fuse, dry pressure spindle, circulation-valve puzzle, two required field tasks and four optional tasks, dry shelters and north service-lift extraction. Its original score is Tiles Below the Surface. Pool waves, view-dependent highlights, tiled basins, lane markings, ladders, moving floor caustics and underwater fog/exposure are implemented. They are procedural art, not a claim of physically traced refraction or a commercial-quality water simulation. The pool additions create no new full-screen render target; existing cinematic effects still have their own targets.

## Outstanding work and recommended next order

This ordering is a continuation recommendation from the existing plan, not a new owner-approved release date or an assertion that these tasks are finished.

- [ ] **RW-032 / RW-031 / RW-028: close the water-playthrough evidence gap.** Record a normal start-to-extraction Natatorium browser run with living authored enemies, the submerged fuse, dry spindle, physical puzzle and both required tasks. Exercise optional stations separately, death/retry, oxygen exhaustion/recovery and surfacing near every pool edge. Keep the safe-fixture tests too. Do not make enemies invulnerable, grant supplies or bypass gates merely to get green evidence.
- [ ] **RW-035 / RW-036 / RW-014: improve visible character motion and contacts.** The human detail still uses the procedural rig, and swimming reuses the horizontal crawl pose. Develop authored swim/tread/dive/surface transitions and land-action blends, then reliable hand/foot contacts, without changing collision authority or breaking held actions. Compare fixed-camera before/after captures for the hero and enemy roles. Imported animation is a future option, not already integrated work.
- [ ] **RW-044 / RW-045 / RW-046 / RW-048: finish an authored audio review.** Review variation, repetition, peaks, spatial readability, room transitions, water entry/strokes/submerge/surface, reload, impacts, bandaging, crafting and tension exit. Measure output and also listen on real headphones/speakers. A nonzero analyser reading is not subjective mix approval.
- [ ] **RW-006 / RW-049 / RW-050 / RW-052 / RW-054: physical controls and device evidence.** Run a wired and Bluetooth Xbox journey, including water entry, both presets, long panels, focus loss, reconnect and every dialog. Name actual CPU/GPU/browser/audio hardware before claiming frame rates. Test controller-only audio activation and record any required browser gesture honestly.
- [ ] **RW-009 through RW-016 / RW-033 / RW-038: complete the representative Floodgate slice.** Continue the proposed 15-20 minute stealth-to-combat-to-recovery benchmark, original environment/prop variety, credible interiors and first-time-player readability. The duration, playtest completion target, final art and fun remain unmeasured/unapproved. Preserve all seven chapters while polishing the representative slice.

The user also requested features not yet shipped: a grab/human-shield system (RW-022), a separate deployable trap (RW-023), and authored arbitrary-window/ledge/gap traversal beyond current collision-checked low-cover movement (RW-030). No unconditional prone invisibility, underwater firearms/enemies, current physics, drowning cinematics or full vertical swimming is implemented. Full VR gameplay, native packaging and multiplayer remain separately scoped decisions, not automatic next tasks.

## Regression traps worth keeping across chats

The earlier audio graph used a 24 kHz reverb impulse that passed 24 kHz offline tests but failed in ordinary 44.1/48 kHz live contexts. Keep context-rate-compatible impulses, measured live output, mono caption direction, category-mute reverb behavior and failed-context cleanup.

The first underwater camera used the dry land floor and collapsed the view. Basin floors, pool-edge boom clipping, smoothing and surface transitions now have targeted tests. The slab once hid lane paint and caustics; retain the ordering in pool-layout.mjs and metric-scaled deck/basin geometry. Decks need actual holes, not a solid plane sealing the water. Do not activate nearby dry shelters, valves, takedowns or task stations from the water. Optional dive-marker and chemical stations were moved onto clear dry ground. The lane-light task must continue changing actual light intensity.

Original human-fit review found shoulder fringes and detached neck/wrist regions. Retain original garment geometry and seam tests. Listening overlays must refresh when a detailed body is swapped. Rain-film changes must compose with existing material patches; turning off an effect must not reset gameplay or break Reduced Graphics.

Controller highlight padding once moved checkboxes during mixed mouse/controller input. Keep focus styling layout-neutral. Held A must not click through a newly opened confirmation. A raw multi-poll simulated D-pad hold can auto-repeat at low frame rates: distinguish a harness timing issue from a real input bug, record the failed attempt, and fix the correct layer. Older no-kill mission attempts sometimes died on the exposed quay; unchanged retries were retained, not evidence that the mission was deterministic or optimally balanced.

## Save and source contract

Checkpoint format is version 4 with v1-v4 compatibility. Bank schema is version 1. The keys are svgn.rainward.v1.checkpoint (legacy mirror), svgn.rainward.v2.chapter-checkpoints (bank), svgn.rainward.v2.chapter-checkpoints.backup (backup), and svgn.rainward.v1.settings (settings). Six-chapter banks remain valid; the Natatorium slot is not invented during migration. Continue restores the active saved expedition; Continue Selected restores the chosen slot. Restarting one chapter affects only that slot after confirmation. Saving is explicit at shelters, apart from the starting checkpoint for a new chapter. Underwater oxygen and swim state are not checkpointed because the shelters are dry. Do not tell the player to clear site storage to see an update.

The project is a static browser game with vendored Three.js, not a build-tool rewrite. Core state/save validation is in state.mjs and checkpoint-store.mjs; inputs and controller UI are in input.mjs, controls.mjs and controller-ui.mjs; app.mjs routes actions. Water gameplay is in aquatic.mjs, supplies.mjs and simulation.mjs; world/camera treatment is in natatorium.mjs, natatorium-art.mjs, pool-layout.mjs, camera-core.mjs and scene.mjs. Verify actual filenames before editing. Character/material adapters, sound and release documents provide their own entry points. Do not rerun an old one-off integration script on a newer release just because it exists.

## Validation and publication evidence

The recovered Undertow build passed 271 model/source tests, 18 distinct native browser suites across six PR workflows, and 21 focused water checks. Historical run IDs and exact scopes are recorded in evidence/undertow-v0.13.0/summary.json. Original publication/source manifests are retained there so continuation does not depend only on expiring Actions artifacts or sandbox paths.

Important limitation: the aquatic browser fixture begins at an authored dry shelter with enemies defeated to isolate movement and visuals. Complete task/puzzle/extraction logic is separately exercised through model interactions. This is not a recorded living-enemy Natatorium end-to-end browser mission. No physical Xbox/Bluetooth, subjective artistic/music approval, target-hardware frame rate, measured flagship-slice duration or AAA certification follows from those tests.

Publication workflow 34738570590 fetched 128 historical public files at the Undertow release and all returned matching SHA256 values. The corresponding Pages run 34738570128 had a cancelled deploy job; do not relabel it successful. The public-file verifier, not that cancelled job, established delivery. The old conversation container's direct HTTP probe failed DNS resolution and was not publication evidence. Preserve this distinction when diagnosing future concurrent Pages deployments.

## Completion checklist for the next implementation

- [ ] Inspect current master, release.json, this handoff, canonical plan and relevant source/tests. Reuse the latest compatible state; do not overwrite sibling work or resurrect merged branches.
- [ ] Choose a bounded increment and record linked RW task IDs plus acceptance scope. Implement real gameplay/art/audio with original/appropriately licensed sources and controller-accessible settings.
- [ ] Run node --test rainward/tests/*.test.mjs and relevant real HTTP/WebGL journeys. Use a static server at the repository root. Record exact candidate/merge SHAs, failed evidence, fixture boundaries, screenshots and whether any physical-device review happened.
- [ ] Update production-plan.json, regenerate AAA_CHECKLIST.md with python rainward/tools/build-production-plan.py, and update the handoff, controls and release notes where behavior changed. Do not mark human approval without a reviewer.
- [ ] Commit, merge safely, publish and run rainward/tests/release.py --published or the existing publication workflow. Verify the actual live files; a branch, screenshot, scheduled build or merged PR alone is not delivery. Archive a receipt and report only observed results.

The present handoff update does not authorize changing the gameplay version to v0.14 or inventing a completed next upgrade. Resume implementation from the verified v0.13 foundation and the then-current master.
