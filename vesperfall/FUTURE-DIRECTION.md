# Vesperfall — Future Direction / Continuation Handoff

Last updated: 2026-09-22

This file is the durable continuation note for future ChatGPT/Codex sessions. Read it before changing Vesperfall. Reconcile it against current master and newer evidence; do not recreate features already shipped.

## Current identity

Vesperfall should evolve toward the qualities that make Dungeons of Eternity compelling while remaining distinctly Vesperfall: dependable physical archery, Goldwind golden teleport arrows, vertical traversal, procedural gothic spaces, meaningful alternate routes, AR/VR presentation, environmental mechanisms, and an emerging Last Lantern story.

The target is not “copy Dungeons of Eternity.” The target is a physical dungeon adventure where grabbing, throwing, shielding, teleporting, exploration, loot, mechanisms, enemies, and eventually cooperation combine into memorable situations.

## Highest-priority player experience goals

Teleportation is a core promise. Golden teleport arrows should almost always honor a physically plausible player intention. Supported railings and stair rails are valid destinations. Safe wall impacts should recover to nearby supported footing when possible. Distance alone must not make a teleport fail. Never recover through walls, onto unsupported abyss edges, into living enemies, or onto unrelated distant geometry.

Physical interaction should be trustworthy under pressure. Objects that look usable should communicate and behave consistently. Grabbing, throwing, catching, shield use, supplies, mechanisms, and teleportation should tolerate reasonable human imprecision rather than require perfect demonstrations.

The player wants larger and longer levels, but not empty corridors. Longer chapters should add meaningful route decisions, verticality, landmarks, mechanisms, environmental storytelling, recovery paths, shortcuts, changing states, and reasons to revisit familiar spaces.

## Dungeons-of-Eternity direction

Build toward several complementary expedition types rather than one endless combat template. Candidate Vesperfall modes include combat/loot raids, relic or crystal recovery, survival/soul-harvest encounters, rescue/escort objectives, and story expeditions. These should share systems and authored procedural modules rather than become disconnected minigames.

Procedural generation should remain authored-module/graph based. Rooms and route modules need gameplay purpose and metadata: traversal role, sightline role, elevation, cover, mechanisms, encounter sockets, loot sockets, story sockets, supported Blink destinations, recovery paths, and compatible neighbors. Different seeds should create different tactical relationships, not merely rearranged corridors.

Loot should change options and play style. Favor equipment with understandable physical behavior and meaningful perks over tiny statistical noise. Reliable controls, teleportation, and throwing are baseline quality and must never be progression unlocks.

Future co-op is desirable, but do not rush networking ahead of the solo game. Design interactive objects now with ownership, release, simultaneous use, persistence, and solo fallback in mind. A future two-player milestone should test passing supplies, protecting another player during mechanisms, revives, shared discoveries, and correct reward/save behavior before scaling to four players.

## Physical interaction roadmap

Continue Pilgrim’s Kit and related physical-object work. Finite healing and frost flasks, waist storage, caches, and throwable objects should feel predictable. Improve low-sample and high-speed throws rather than compensating with invisible state changes.

Add a small set of multi-use physical objects before a huge arsenal. Strong candidates are a courier lantern that can illuminate, activate prepared braziers, distract/stagger appropriate enemies when thrown, and participate in story/mechanism puzzles; crystals/relics that can be carried and inserted into alternate mechanisms; and a physical shield that blocks, creates space, and protects mechanism use.

Add melee selectively. A short sword or similar close-range weapon should have readable impact, parry/block reactions, and deliberate shield-bash interactions without making archery obsolete. Do not ship a large weapon catalogue until one melee weapon and one shield feel trustworthy.

## Story and world consequences

The Last Lantern is the starting narrative thread, not the finished story. Move from optional notes toward events the player causes. Keeper Ilyra, courier Orin, refuges, signals, and missing pilgrims can anchor the first campaign arc.

A good chapter should create a visible consequence. Restoring a refuge could relight its lantern, reopen a route, bring NPC activity back, unlock a service, alter later encounters, or reveal a new story interaction. Returning to a known place should sometimes change its meaning.

Keep brief notifications out of the player’s forward view. Floor/world messages should remain visible briefly and fade after about two seconds. Longer material belongs in the journal or an intentionally summoned spatial interface.

## Enemies and difficulty

Expose Easy, Normal, Hard, and Ultra Hard as deliberate expedition choices. Difficulty should affect encounter population, detection distance, patrol complexity, vertical/elevated placement, reinforcement pressure, and possibly resource pressure while preserving line-of-sight rules and readable telegraphs.

More enemies should use valid upstairs/gallery positions and actual routes. Patrols need supported navigation, turns, stairs where supported, and recovery behavior. Never fake difficulty by letting enemies see or attack through walls.

Upgrade enemy appearance coherently. Free/redistributable 3D assets may be evaluated, but verify licenses, rigging, animations, hitbox compatibility, attack readability, performance, and art direction before integration. Keep current procedural/fallback enemies until replacements are genuinely better.

Bosses should combine movement, mechanisms, equipment, rescue/recovery opportunities, and arena knowledge rather than simply having more health.

## AR direction

First-person AR should be the same playable expedition as first-person VR, not a separate simplified arena. Preserve objectives, enemies, mechanisms, archery, teleportation, saves, and progression.

Architecture should remain legible while passthrough stays visually clean. Walls should occlude virtual content behind them while presenting sparse translucent/wireframe architectural cues—e.g. edges, mortar/brick fragments, or roughly 5–10% visual coverage rather than an opaque wall. Doorways/windows remain true openings. Floors should use light grids/edges with stronger cues at stairs, drops, platforms, and unsafe boundaries.

Do not claim room scanning, physical-surface anchoring, or real-world safety support unless actually implemented and tested.

## Environment art

Evaluate the existing Prism Current environment modules for water, fire, and procedural trees as shared technical references/assets, but integrate them into Vesperfall only after renderer compatibility and performance checks. Use them to create memorable landmarks and gameplay situations, not decorative clutter. Do not modify Prism Current while doing Vesperfall work.

Potential uses: water courts with traversal consequences, fire-lit refuge/ritual spaces, trees that distinguish outdoor approaches and sightlines, and environmental state changes after objectives.

## Level design

The Lantern Causeway and Ashen Archive are foundations, not final scale. Expand future chapter families with longer loops, more vertical connections, distinct landmarks, optional chambers, shortcuts that matter on return, mechanisms that change sightlines/routes, and encounter pacing with recovery spaces.

Every alternate route should differ in at least one meaningful dimension: information, risk, speed, resource use, tactical position, traversal demand, discovery, social opportunity, or narrative understanding.

Design likely mistakes and recovery alongside ideal success. A player should leave a chapter with useful mastery of its geography and systems.

## UI / XR

Keep important UI in the game world, not permanently head-locked. Continue the spatial desk/rotunda concept: summonable, world anchored, adjustable, and stowed during play. Controller/wrist surfaces and object-local prompts are appropriate for compact immediate information.

Walking portals are the Vesperfall integration direction for a future private WebXR hub. Do not publish private hub code, credentials, or inferred endpoints. Sphere portals and other-game integration are deferred until explicitly requested.

## Preservation contracts

Preserve existing saves, immutable layout readers/IDs, reward receipts, explicit Classic preferences, Goldwind as the fresh-settings default, Xbox shortcuts, Quest controller roles, hand-menu access, First Bell/Returning Bell/Oath/Endless access, and current procedural chapter continuation.

Do not clear localStorage, manufacture acceptance by assigning player state, silently mutate old geometry under an existing layout ID, or confuse generated XR/gamepad tests with physical Quest/Xbox approval.

Write Vesperfall changes directly to master after reconciling concurrent master changes unless the owner explicitly asks for a branch/PR. Do not create pull requests merely to publish our own Vesperfall work.

## Immediate development sequence

First, finish and harden the playable physical-object pass already underway: reliable flask/lantern throws, useful physical interactions, cache/waist-slot behavior, and save persistence.

Next, make the courier lantern/refuge restoration into a small consequential story-system loop rather than a decorative interaction.

Then expand one existing procedural chapter substantially using the new physical systems: additional vertical route, optional chamber, environmental mechanism, patrols, and a reward/story consequence.

After that, implement the four difficulty tiers with valid encounter scaling and elevated patrols.

Then continue the first-person AR architectural rendering pass and coherent monster-art evaluation.

Only after these systems feel good should the project broaden into a larger weapon catalogue, boss suite, multiple new realms, or networked co-op.

## Session-resume checklist

On a new chat/session: read this file, DEVELOPMENT-HANDOFF.md, SUREFLIGHT.md, FIELDWORK.md, PILGRIMAGE.md, WAYFINDER.md, THRESHOLD.md, release.json, roadmap.json, current tests/evidence, and current master source. Check whether newer commits supersede any item here. Continue the strongest unfinished gameplay item rather than writing another plan.

After every substantial Vesperfall pass, update this file with what actually shipped, what failed or remains unverified, and the next concrete opportunity. Keep claims separated into source implemented, automated/browser verified, public served, and physical-device/human playtested.
