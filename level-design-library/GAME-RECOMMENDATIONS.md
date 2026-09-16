# SVGN Interactive Game-Specific Level Design Recommendations

These are directional recommendations, not claims that the current builds lack every item described. Before implementing one, inspect the latest source, release notes, roadmap, save contract, and verification evidence. If newer work already covers a recommendation, test and refine it instead of rebuilding it.

## Aether Reach

Primary design identity: a connected, repairable floating city whose infrastructure, combat, traversal, and field engineering reinforce one another.

The strongest next step is to deepen Bellwether and use it as the reference-quality chapter before multiplying districts. Arrival should clearly establish the blackout, the important landmark, and a plausible relationship between the street, arcade, theatre, and receiver. Electrical teaching should happen in a protected context before combat asks the player to use it under pressure.

Street approaches should differ in practical purpose: direct cover and supplies, protected service access, or elevated reconnaissance. The arcade should communicate circuit causality through visible gauges, machinery, and the affected space. The maintenance ascent should repeatedly look back toward previously visited areas so the player understands the district's vertical relationships.

Rooftop combat should support repositioning, line-of-sight breaks, escape, and different firing angles rather than functioning as a flat arena. Rails and Foldwing routes should connect believable destinations and provide enough approach visibility at their real movement speeds. The return journey should visibly demonstrate restoration and make at least one useful connection persist.

Recommended benchmark influences: BioShock for district identity and environmental systems, Half-Life for teaching and physical cause and effect, Dishonored for approach variety, and Dark Souls for useful reconnection. Borrow design principles, not franchise-specific fiction or layouts.

## Rainward

Primary design identity: survival, stealth, traversal, and environmental causality across dangerous reclaimed places.

Finish the Floodgate replacement as a complete experience rather than only a geometry improvement. Test the clinic-market seam with living enemies, finite ammunition, crafting resources, cover, concealment, searches, and actual extraction. The player should be able to observe, choose an approach, recover after detection, and understand how the opened return connection changes later movement.

Every major encounter should include an observation position, sightline breaks, a flanking or escape route, and a resource-aware recovery path. High positions should provide information and angles without becoming invulnerable perches. Human and creature threat types should interact differently with the same terrain.

Each chapter should have a distinct spatial identity. The Conservatory should emphasize horticultural verticality and water-state relationships. Bellweather Terminus should emphasize concourse, service, workshop, and signal circulation. Meridian Ward should emphasize occupied interiors and streets. Breakwater should make height, weather exposure, and shelter meaningful. Whiteout should use memorable thresholds under reduced visibility. Northlight should contrast dry observation, submerged recovery, and service circulation.

Recommended benchmark influences: The Last of Us Part II for authored density and recovery spaces, Dishonored for stealth-route choice, Half-Life for understandable environmental state changes, and immersive sims for dependable interaction rules.

Source-reconciled Rainward iteration: Freight Cut 0.15.0 gives the already-existing optional ward-radio repair a real west loading passage, shared by body collision, shots, sight and NPC navigation. It reuses the clinic terrace and return loop rather than rebuilding them. Read ../rainward/FREIGHT-CUT.md and its publication receipt before assigning evidence status. No new checkpoint field, reward, task or mandatory objective is added; unpowered extraction remains valid. Human first/replay understanding and physical-device approval remain open.

## Dino Atlas

Primary design identity: fieldcraft, wildlife observation, ranger logistics, vehicles, and non-injurious intervention.

Design assignments around observe, predict, prepare, intervene, and return. Wildlife should not merely populate terrain; body size, movement tendencies, feeding areas, shelter, warning behavior, and ranger infrastructure should create useful decisions.

Build a flagship reserve area where the player first sees an inaccessible or inefficient connection, learns how the herd uses the landscape, prepares a safe intervention, restores a crossing or service route, and later returns through that now-useful connection. Ranger paths, animal corridors, vehicle roads, waterways, and helicopter access should not all solve the same problem in the same way.

Outposts should act as recognizable operational anchors rather than generic refill points. Observation platforms should provide real information. Shelter geometry should account for animal scale. Water, mud, vegetation, fences, gates, and elevation should affect the operation in readable ways without pretending to be a full biological simulation.

Educational content should clearly distinguish evidence-based paleontology from fictional gameplay behavior. The level should reward careful observation even when the player already knows the mission objective.

Recommended benchmark influences: systemic open-area missions, tracking and observation games, Dark Souls-style useful reconnection, and Hitman-style readable routines adapted to wildlife rather than social stealth.

## Leonardo's Guild

Primary design identity: a peaceful working Renaissance city with crafts, households, social relationships, rooftops, cellars, vehicles, and optional dangerous expeditions outside safe Vinci.

The largest opportunity is converting existing architectural quantity into neighborhood identity. Fewer households should feel interchangeable. Give blocks functional relationships: a workshop receives material from one household, relies on another specialist, uses a shared courtyard or hoist, and connects to roof or cellar circulation for a reason.

Create a showcase case that crosses several households and lets the player investigate through conversation, records, rooftops, service spaces, or a reversible mechanism. Alternate routes should reveal different evidence or practical advantages rather than merely shorten travel. A persistent repair or opened connection should make the neighborhood easier to understand afterward.

Use small purposeful routines. A resident may move between workshop and market, a porter may respond to a delivery bell, or an artisan may make a useful space available after help. These routines should create cooperation and timing opportunities without turning Vinci into a hostile stealth game.

Preserve Vinci's safety and calm audio identity. Cinder Hollow and future farmlands can carry greater danger and expedition risk. Town traversal, rooftop networks, and cellars should create social and spatial mastery, while expeditions provide a different rhythm.

Recommended benchmark influences: Hitman for purposeful social spaces without assassination mechanics, Dishonored for vertical route logic, Dark Souls for memorable reconnection, and adventure games for evidence-driven cases.

## Neighborhood Missions

Applied iteration: [Working Quay](applied/NEIGHBORHOOD-MISSIONS-WORKING-QUAY.md) develops the existing Lantern Ward loading routine under LEVEL-01. Check its exact-source evidence before treating it as accepted; this does not replace the recommendations below.

Primary design identity: courier movement and community work through neighborhoods whose circulation the player learns to operate.

Lantern Ward is the correct direction: street, roof, and canal routes should differ in travel style, stopping cost, information, and access. Expand that philosophy into additional authored neighborhoods rather than relying primarily on more contracts across anonymous space.

Give every authored district a recognizable ordinary function, landmark, circulation problem, and persistent improvement. Repairs should change how the player moves or understands the area. Deliveries should explain why routes exist: loading lofts, service alleys, market streets, piers, courtyards, and public stairs.

Residents should create a few meaningful opportunities rather than functioning only as scenery. Bells, loading schedules, temporary blockages, community events, or repair states can alter route value while remaining understandable and recoverable.

The bicycle or vehicle should remain central. A route that is technically walkable is not automatically good courier design. Measure approach speed, braking room, mounting and dismounting friction, turning radius, sight distance, and how easily a rider can recover from a missed turn.

Recommended benchmark influences: Hitman for clockwork social spaces, open-world courier games for route learning, Dark Souls for practical shortcuts, and Half-Life for readable infrastructure changes.

## Prism Current

Primary design identity: stationary embodied rhythm in which musical phrases are the equivalent of levels.

Do not apply map-connectivity metrics to Prism Current. Judge choreography through musical readability, physical preparation, movement flow, timing, hand assignment, note visibility, recovery, and comfort.

Design each phrase with an approach state, preparation, primary action, exit hand state, and relationship to the next phrase. Avoid transitions that leave the player physically crossed, extended, or facing away from the next required action unless that is a deliberate and tested challenge.

Use musical structure to teach. Introduce a movement relationship, repeat it with variation, combine it with an already learned relationship, then provide a release phrase. Lower-density Flow charts should remain musically intentional rather than simply deleting difficult notes from Pulse.

Review occlusion from the actual headset viewpoint, not a desktop editor camera. Test reach settings, handedness, recentering, pause/resume, and tracking loss. Optional rehearsal or phrase practice can help players learn difficult transitions without contaminating full-run records.

Recommended benchmark influences: high-quality rhythm mapping practice, Beat Saber-style readable choreography as a general genre reference, music-game phrase construction, and Celeste-like forgiveness principles applied to understandable player intent rather than score inflation.

## Vesperfall

Primary design identity: physical archery and Blink traversal through a layered living cathedral whose geometry becomes increasingly usable with knowledge.

The Returning Bell should be tuned as a complete reference chapter before expanding the authored campaign. The ground and gallery routes need distinct tactical purposes. The screen winch should create an immediately readable tradeoff between cover and firing lanes. The service latch should produce a strong recognition moment when it reconnects to the refuge.

Blink geometry must be trustworthy. If a surface looks like a valid landing, the real trajectory and support rules should agree or clearly explain why not. Optional expert Blink routes should coexist with dependable ordinary paths.

Enemy attack shapes should interact with architecture. Projectile volleys, charging threats, shield use, cover, and vertical positions should ask different questions. Do not assume enemies can climb or navigate routes their actual AI cannot use; those limitations can become deliberate level rules when communicated honestly.

Procedural generation should preserve authored relationships rather than merely shuffle rooms. Build reusable spatial motifs such as a court with an overlook, a return gate reached from inside, a tower with multiple approaches, or a lower route that creates recovery. Validate connectivity, sightlines, Blink clearances, and recovery for sampled seeds while acknowledging that sampling does not prove every possible layout is enjoyable.

Recommended benchmark influences: Dark Souls for place mastery, Dishonored for vertical options, Castlevania for enemies as spatial constraints, and systemic action games for readable state changes.

Source-reconciled Vesperfall iteration: Open Line 0.15.0 refines the existing Returning Bell rather than replacing it again. The short central stair and an existing watcher's firing line share the reversible screen; a shootable brass release gives archery a direct role in opening it. Gallery control, flanking stairs, missed-shot recovery and a legitimate signal shot without visiting the tower remain distinct choices. Read ../vesperfall/OPEN-LINE.md and its exact publication receipt before assigning evidence status. Keep returning-bell-1 and hollow-dominions-1 for old saves; new expeditions use returning-bell-2. Human first/replay understanding and physical-device approval remain open.

## Sky Cycle

Sky Cycle has a separate detailed manual in `SKY-CYCLE-LEVEL-DESIGN.md`. Its primary rule is that the ground route must be a satisfying game by itself, while the optional aerial network provides expressive momentum mastery, exploration, and longer connected lines. Do not turn it into a generic exploration game or require frequent stopping for doors, menus, or combat.

## Portfolio-wide recommendation

Use one reference-quality authored slice per game to prove the methodology before expanding map size. A flagship slice should demonstrate orientation, meaningful choices, one or more dependable system relationships, designed recovery, a memorable spatial or systemic reveal, a satisfying conclusion, save/retry integrity, controller continuity, and the appropriate XR/device path.

Then reuse what was actually learned from playtests. Do not scale a weak layout merely because the engine can generate more of it.
