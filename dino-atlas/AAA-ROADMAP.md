# Dino Atlas — AAA-Quality Roadmap

This is the living production checklist for moving Dino Atlas from a large browser prototype toward a polished premium-game vertical slice and, eventually, AAA-quality presentation. “AAA-quality” here describes the quality bar we are targeting; it does not imply a AAA studio budget, team size, certification, or content volume.

**Rule:** every major Dino Atlas upgrade should close items in this file, add regression coverage, preserve existing saves, and update the Current Build scorecard below.

## Current position — Ranch & Coast / September 2026

The game is past prototype and entering **Vertical Slice development**. It already has a large drivable reserve, 30 species / 64 residents, jeep / buggy / helicopter / boat / on-foot traversal, managed enclosures, ranger tools, trading, outposts, ranching, boat racing, boneyards, explorable buildings, procedural sound/music, controller-first UI, and persistent saves.

Estimated readiness against the target quality bar: **~42%**. The largest remaining gap is not feature count; it is production depth: animation fidelity, art consistency, mission direction, cinematics, world reactivity, authored interiors, AI sophistication, performance, polish, accessibility, and systematic QA.

## Milestone gates

- [x] **Prototype** — core movement, interaction, journal, save data, initial dinosaur encounters.
- [x] **Systems Sandbox** — vehicles, tools, pens, outposts, economy, multiple activity types.
- [ ] **Vertical Slice** — one 20–30 minute sequence that looks, sounds, teaches, directs, and resolves like a premium shipped game.
- [ ] **Alpha** — complete intended systems and representative content breadth; ugly/incomplete assets still allowed.
- [ ] **Beta** — content complete; focus moves to bugs, balance, performance, accessibility, and platform behavior.
- [ ] **Release Candidate** — no known progression blockers; settings/save/recovery hardened; performance targets met.
- [ ] **Gold-quality browser release** — polished public build with release notes, compatibility matrix, and rollback evidence.

## Pillar scorecard

| Pillar | Current | Vertical Slice target | Gold target |
| --- | ---: | ---: | ---: |
| Core driving / movement feel | 6/10 | 8/10 | 9/10 |
| Dinosaur behavior / animation | 4/10 | 7/10 | 9/10 |
| Mission design / onboarding | 6/10 | 9/10 | 9/10 |
| World art / lighting / atmosphere | 5/10 | 8/10 | 9/10 |
| Buildings / interiors | 5/10 | 8/10 | 9/10 |
| Vehicle breadth / purpose | 7/10 | 8/10 | 9/10 |
| Audio / music / mix | 7/10 | 8/10 | 9/10 |
| UI / controller usability | 8/10 | 9/10 | 9/10 |
| Economy / progression | 5/10 | 7/10 | 8/10 |
| NPC / rival-crew life | 4/10 | 7/10 | 8/10 |
| Performance / streaming | 5/10 | 7/10 | 9/10 |
| Accessibility / settings | 6/10 | 8/10 | 9/10 |
| QA / recovery / saves | 8/10 | 9/10 | 10/10 |
| Content authoring pipeline | 3/10 | 6/10 | 8/10 |

## P0 — Vertical Slice blockers

### Direction, pacing and cinematic presentation
- [x] Guided first ranger shift with explicit controller prompts.
- [x] Persistent assignment panel and map waypoint.
- [ ] Premium **mission director** with authored multi-stage sequences, radio beats, fail-safe recovery, and clear completion screens.
- [ ] Short in-engine opening and mission-complete cinematics; always skippable from Xbox.
- [ ] Contextual camera framing for discoveries, major dinosaur reveals, building arrivals, and helicopter landings.
- [ ] Objective-area visual language: authored lights, silhouettes, smoke/flares, signage, and landmark composition.
- [ ] Mission replay / restart-from-checkpoint without touching journal or world progression.

### Atmosphere and rendering
- [x] Dusk mode, headlights, beacon lighting, shockwave spectacles.
- [ ] Dynamic weather director: clear, rain, storm, fog banks, wetland mist.
- [ ] Wet-surface response, rain splashes, wind-reactive vegetation approximation, lightning and thunder timing.
- [ ] Stronger day/night lighting grades and exposure transitions.
- [ ] Pooled particles and distance LOD rules for all spectacle effects.
- [ ] Art-direction pass so roads, props, architecture, foliage and vehicles share one material/detail language.

### Dinosaur quality
- [x] 30-species playable library and 64 live residents.
- [x] Three explicitly calibrated reference lengths; other models labeled stylized.
- [ ] Calibrate the entire species library against documented adult ranges; keep juvenile/nursery variants separate.
- [ ] Replace simple leg oscillation with gait state machines: idle, walk, trot, charge, startled, drink/feed, sleep.
- [ ] Head-look / interest targets, herd spacing, predator stalking, warning displays and social reactions.
- [ ] Foot placement / terrain compensation approximation.
- [ ] Species-specific vocal identity and distance attenuation.
- [ ] Physical interaction rules by body mass without vehicle health damage unless design later changes.

### World and authored spaces
- [x] 840 m land diameter plus navigable coast.
- [x] Three rooftop-landable building complexes and three boneyards.
- [ ] At least one **hero interior** with a memorable authored route, environmental storytelling, alternate paths and a gameplay set-piece.
- [ ] Streaming / sector activation so the island can grow substantially without paying full simulation/render cost.
- [ ] More terrain height variation: ridges, ravines, river crossings, cliffs, overlooks and service tunnels.
- [ ] Building exterior silhouettes readable from helicopter altitude.
- [ ] More true dismount-only spaces: doors, narrow stairs, crawl routes, labs, storage cages and observation galleries.

### Vehicle purpose
- [x] Jeep, buggy, helicopter and boat with distinct movement models.
- [x] Full coastal boat race and salvage loop.
- [x] Rooftop helicopter landing and exit/reboarding.
- [ ] Dedicated mission arcs for every vehicle rather than one-off novelty use.
- [ ] Vehicle upgrade/progression choices that affect handling, cargo, lighting, tools or navigation—not damage health.
- [ ] Better cockpit/hood visual feedback and speed/terrain camera response.
- [ ] Boat wake, spray and rough-water handling pass.
- [ ] Helicopter rotor wash, landing dust/mist and stronger altitude cues.

## P1 — Alpha blockers

### NPCs and reserve life
- [x] Rival/service crews have vehicles, routes, cargo, deliveries and market effects.
- [ ] Named crew members with simple schedules, radio identities and recurring relationships.
- [ ] Rangers physically appear at outposts/buildings and react to emergencies.
- [ ] Convoys stop, unload, refuel and reroute around events instead of following a pure loop.
- [ ] Dynamic incidents: blocked road, escaped animal, downed fence, missing survey team, stranded boat, supply shortage.
- [ ] Reputation / contract consequences across Meridian, FossilWorks and Greenline without locking core progression.

### Economy and progression
- [x] Credits, cargo, regional prices and delivery contracts.
- [ ] Clearly useful sinks for credits: vehicle equipment, cosmetic liveries, outpost services, field-tool improvements, map intel.
- [ ] Contract difficulty tiers and visible risk/reward.
- [ ] Prevent dominant infinite-profit routes; maintain multiple viable trade loops.
- [ ] Reward exploration with information, access and utility—not only currency.

### Combat-adjacent / ranger-tool gameplay
- [x] Water, zapper and horn are visible, nonlethal herding tools.
- [x] Reload/ammo/resupply loops and Xbox-native controls.
- [ ] Species-specific tool response curves and habituation so repeated spam is less effective.
- [ ] Environmental interactions: water activates switches / clears mud; zapper powers emergency contacts; horn triggers gates or crew attention where appropriate.
- [ ] More ranch games: sorting mixed herds, moving juveniles, predator exclusion, timed transfer, night roundup.

### Exploration
- [x] Boneyards, archives, outposts, pens and field journal.
- [ ] Discoverable micro-locations every 30–60 seconds of purposeful travel.
- [ ] Environmental stories told through spaces rather than text windows.
- [ ] Multi-step paleontology sites with visible specimen progression.
- [ ] Secret routes and physics toys in the spirit of playful vehicle-world exploration, without copying another game's map/assets.

## P2 — Beta blockers

### UI, accessibility and controller
- [x] Gamepad can play, navigate dialogs, reload, map, settings, vehicles and tools without a mouse.
- [x] Custom dialogs instead of native alert/confirm traps.
- [ ] Full remapping / alternate controller layouts.
- [ ] Hold/toggle options for aim, acceleration and tool fire.
- [ ] Subtitle size, high-contrast objective mode, color-independent indicators and reduced-flash setting.
- [ ] Camera shake slider, separate motion effects slider and field-of-view option.
- [ ] UI scale option for television-distance play.

### Performance and technical quality
- [x] Automatic low-graphics fallback and pooled effects in several systems.
- [ ] Formal frame budgets for simulation, draw calls, triangles, particles and audio nodes.
- [ ] Distance LOD for dinosaurs / buildings / vegetation.
- [ ] Sectorized AI updates and sleeping physics bodies outside relevance range.
- [ ] Asset/content manifest with cache-busting build identifier.
- [ ] Save schema migration tests for every released version.
- [ ] Long-session soak test, repeated vehicle swapping, tab suspend/resume and context-loss recovery.

### Audio
- [x] Separate master/music/effects/ambience mix controls.
- [x] Vehicle layers, procedural score, tools, wildlife and UI cues.
- [ ] Environmental acoustic zones for interiors, forest, coast and open plains.
- [ ] Mission score states and authored transitions.
- [ ] Species-specific calls and threat language.
- [ ] Loudness/dynamic-range pass for laptop, headphones and television.

## P3 — Release-candidate work

- [ ] Compatibility matrix: Chrome, Edge, Firefox, Safari where technically viable; desktop and representative mobile/tablet classes.
- [ ] Physical Xbox-controller test matrix across Windows/macOS and at least one TV/console-browser-like environment if available.
- [ ] Real-device audio QA and loudness review.
- [ ] Performance profiles on integrated graphics and midrange discrete GPU.
- [ ] Accessibility review and keyboard-only audit.
- [ ] Save backup/export option.
- [ ] Credits / third-party licenses / inspiration / scientific-source audit.
- [ ] Privacy/network-request audit: no accidental analytics or unexpected external runtime dependencies.
- [ ] Release rollback instructions and known-issues document.

## Next upgrade — Vertical Slice 01: Storm Response

**Goal:** prove that existing systems can be directed into a premium-feeling authored sequence instead of remaining a collection of sandbox features.

Planned deliverables:
- [x] Add a controller-native Mission Director entry in Menu / Dispatch layer.
- [x] Add dynamic storm weather with rain, fog, wind, lightning flashes and thunder cues.
- [x] Build one multi-stage assignment that deliberately uses jeep, on-foot interior exploration, helicopter rooftop landing and boat travel.
- [x] Add mission checkpoints and resumable progress under a new namespaced save key.
- [x] Add clear completion/failure-safe messaging without native browser dialogs.
- [x] Add objective markers to the existing map/HUD.
- [x] Add regression coverage for save isolation, stage order and controller-only mission interaction.

## Definition of “done” for every future upgrade

An item is not checked merely because code exists. It is checked when:
1. it is reachable in the live game,
2. the player is told that it exists and how to use it,
3. it has controller-native interaction,
4. it has a persistence/recovery story where relevant,
5. it has automated coverage for its state model,
6. rendered-browser verification covers the critical path where practical,
7. it is published to GitHub Pages,
8. this roadmap and the relevant release note are updated.
