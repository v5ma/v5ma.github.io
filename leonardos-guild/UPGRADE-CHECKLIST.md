# Leonardo's Guild - persistent upgrade checklist

Owner: Micah Blumberg / SVGN. Read this file at the beginning of every continuation.

## Handoff and preservation

Baseline: published v0.3.0, read from master 221844c60d56202bddadeba2bbec1cd204535e7f on 2026-09-07. Active next-pass branch: feat/guild-market-life-20260907. Work only in leonardos-guild/ and its scoped workflows. Preserve the same city, Stolen Folio, nine side commissions, joystick, six interiors, paired basement stairs, gate prerequisites, local saves and sibling projects. Never reset the user's progress to make a test pass. Distinguish pure model fixtures, seeded-save browser journeys, fresh ordinary-input journeys, and public-byte verification.

The uploaded art note discussed Aether Reach. Its transferable direction is finished licensed artwork and reproducible optimization, not replacing Leonardo's map with that game's Arrival Quay or modern Boston buildings. First art target here: the workshop-to-market journey and existing indoor workspaces. Public GitHub needs permission to redistribute raw asset files. Preserve provenance, license, upstream hashes and modifications.

Status legend: PLANNED, IMPLEMENTING, MODEL-CHECKED, BROWSER-CHECKED, PUBLISHED. A checkbox means the stated acceptance has been met, not that a model calculated a plausible result. Dates, commits and evidence must be added before promotion. Never count a speculative suggestion as shipped.

## Current pass: market life and a genuine art intake

- [ ] ART-01 Import a curated free CC0 subset of Quaternius Fantasy Props/Medieval Village, not paid Source files. Record license, source, file hashes and exact redistribution scope. IMPLEMENTING.
- [ ] ART-02 Optimize meshes and shared textures; vendor required glTF loader matching the existing pinned Three.js. No live third-party runtime dependency. PLANNED.
- [ ] ART-03 Replace visible placeholder workspaces, street props and selected facade details with the imported assets. Preserve walkable thresholds and model/collision alignment. PLANNED.
- [ ] ART-04 Capture matching before/after views in the actual 3D game and inspect them. Count bytes, draw calls and missing assets; test fallback. PLANNED.
- [ ] PLAY-01 Add overlapping short street encounters on existing blocks: repair, retrieval, crafting, observation and courier work, not only another chain of talk markers. PLANNED.
- [ ] PLAY-02 Add interactable workstations to existing interiors and visible persistent outcomes. PLANNED.
- [ ] PLAY-03 Add character-specific follow-up conversations and optional relationship scenes without removing old dialogue or rewards. PLANNED.
- [ ] PLAY-04 Add a discoverable local activity board and map hints; explain requirements and let the player leave any minigame safely. PLANNED.
- [ ] SAFE-01 Load v0.2/v0.3 saves without erasing original or side-quest progress; version new transient fields separately. PLANNED.
- [ ] SAFE-02 Prevent duplicate payouts, remote interactions, world/floor mismatch, stuck touch input and infinite repeat farming. PLANNED.
- [ ] QA-01 Run original mechanics and touch suites plus new models, ordinary-input activity journeys and asset/render tests. PLANNED.
- [ ] QA-02 Commit actual source, review scoped diff, merge only a verified candidate and compare public files to merged bytes. PLANNED.

## Density roadmap (long-term target: 30-50 distinct playable pieces, not a promise for one patch)

- [ ] D01 Recurring civic work from the mayor and watch; choices with visible outcomes.
- [ ] D02 Residents initiating short requests when approached; optional, dismissible, bounded.
- [ ] D03 Missing pets, lost possessions, broken wagons and merchant disputes with more than one solution.
- [ ] D04 Artisan orders, recipe discovery and actual item crafting at indoor benches.
- [ ] D05 Courier circuit variants and voluntary races; no forced clock on ordinary errands.
- [ ] D06 Observation clues and connected mysteries using Lantern rather than generic fireball combat.
- [ ] D07 Richer inn, apothecary, cycle shop and workshop furniture/inspection/interactions.
- [ ] D08 Visit-able upstairs rooms, attics, courtyards and rooftops with collision/camera tests.
- [ ] D09 A continuous underground route linking selected existing cellars; no misleading painted entrances.
- [ ] D10 Day/night activity, readable schedules and safe waiting; do not permanently miss quests.
- [ ] D11 Character routines and reactions to completed commissions.
- [ ] D12 Distinct Isabella and Sofia stories, invitations and shared outings; adult, optional and not bought.
- [ ] D13 Companion navigation with obstacle-aware routes and recovery, without teleporting through walls.
- [ ] D14 Cats, dogs, horses, chickens and street musicians with controlled simulation budgets.
- [ ] D15 Crime observation, evidence, peaceful resolution and proportional watch response.
- [ ] D16 Named rival artisans and layered investigation outcomes rather than mandatory combat gates.
- [ ] D17 Equipment components, paint and handling choices that preserve the bicycle's physical identity.
- [ ] D18 Cargo tricycle, tandem, spring bicycle and new experimental vehicles with real controls.
- [ ] D19 Flight research milestones followed by actual takeoff, steering, collision, landing and recovery. Blueprint is not flight.
- [ ] D20 Skills that open alternative repairs, conversations, navigation and observation solutions.
- [ ] D21 Seasonal/weather atmosphere and indoor refuge; avoid expensive unbounded effects.
- [ ] D22 More authored nearby districts only after existing blocks have useful activity density.

## Art and future systems

- [ ] A01 Cohesive textured architecture, foliage and interior props; no random asset-pack collage.
- [ ] A02 Finished character models and retargeted walk/ride/work/combat animations, with required clothing.
- [ ] A03 Physically scaled plaster, stone, wood and metal material families; measured mobile variants.
- [ ] A04 Warm interiors, readable shaded doorways and deliberate lighting, not exposure tricks hiding unfinished art.
- [ ] A05 Independent glTF validation and source-to-game asset optimization recipe.
- [ ] A06 Physical-phone/Safari/controller testing and accessibility/remappable input.
- [ ] NET01 Small authoritative cooperative session, reconnect and validated inventories before MMO claims.
- [ ] NET02 Secure identities, moderation, anti-abuse and trades before persistent shared economy.
- [ ] NET03 Paid/coupon entitlements only in a separately authorized service project, never client flags.

## Next-session procedure

Read release.json, this checklist, README.md and the active PR; check current master before writes because other games develop concurrently. Inspect actual sources and pending branches. Record a checkpoint, implement the smallest coherent slice, retain failed evidence, run regressions, and update this checklist plus CHANGELOG.md and asset register. Published status requires a release commit and successful public-byte receipt. The local environment may lack networking; use scoped reproducible Actions rather than opaque transfer fragments. Do not remove the author's prior game mechanics in an art pass.
