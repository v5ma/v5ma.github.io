# SVGN Interactive Studio Level Design Manual

## Core promise

A strong SVGN level should become more useful and expressive as the player understands it. Progress is not only stronger equipment or more completed objectives. The player should develop a better mental model of the place, its routes, systems, inhabitants, dangers, opportunities, and recovery options.

The studio standard is intentional density rather than raw map size. Every substantial space should contribute to navigation, choice, pacing, story, mechanics, atmosphere, or future understanding. A large area with little consequence is usually weaker than a smaller area with several meaningful relationships.

## Experience before geometry

Write the experience spine before building the final layout. Define what the player should feel, learn, decide, change, and remember. A typical sequence might move through orientation, observation, route choice, experiment, pressure, discovery, transformation, recognition, recovery, and return. The exact sequence varies by genre.

For every major beat, record what the player knows on arrival, what can be learned before commitment, what decision is available, what action changes the situation, what feedback proves that change, how failure can recover, and what state the player carries into the next beat.

If a stretch adds distance but no decision, discovery, contrast, necessary recovery, or atmosphere, consider cutting or compressing it.

## Five linked descriptions

Describe each level in five compatible ways.

Physical: rooms, terrain, roads, roofs, stairs, ladders, waterways, rails, cover, sightlines, vertical layers, and connections.

Conditional: doors, gates, environmental states, permissions, resources, mission stages, mechanisms, water levels, power states, and persistent shortcuts.

Behavioral: enemies, wildlife, residents, traffic, routines, patrols, reactions, social opportunities, and how those actors return to normal after disturbance.

Information: landmarks, previews, clues, signage, sound, lighting, environmental causality, observation positions, and feedback that helps the player form a plan.

Embodiment: camera, body size, movement speed, reach, aim, controller mapping, head independence, XR scale, comfort, and what information each presentation mode exposes.

A level is strongest when these descriptions reinforce each other instead of contradicting one another.

## Meaningful routes

Do not add alternate paths merely to increase path count. Write the intention of each route first. One route might provide observation, another protection, another speed, another a social opportunity, another efficient resource use, and another optional mastery.

A route is meaningfully different when it changes information, risk, time, traversal demand, resource consumption, social interaction, tactical position, or narrative understanding.

Routes should often reconnect. Reconnection lets a player revise a plan and creates recognition. A shortcut is especially valuable when both ends already mean something to the player.

Do not make one route simultaneously faster, safer, easier, richer, and more informative than every alternative unless discovering that superior connection is itself an intentional reward.

## Place mastery and returns

Use landmarks repeatedly from different perspectives. Let the player see a destination before reaching it, lose it while moving through an interior or lower route, glimpse it again, and eventually stand there looking back.

Design important shortcuts as revelations rather than simple time savers. Establish a recognizable first side, an understandable barrier, a meaningful journey, and a return connection whose usefulness is obvious in the world.

When players revisit a place, something about the experience should ideally change. They may possess new knowledge, a new route, a different world state, a more efficient technique, a different objective, or a stronger understanding of the area's inhabitants.

Mandatory backtracking through unchanged space should be used sparingly.

## Teaching and escalation

Use a teach, vary, combine, release structure when introducing a relationship.

Teach: demonstrate the rule safely and clearly.

Vary: change one important condition while preserving the learned rule.

Combine: connect it with an already understood system.

Release: give the player room to use the relationship freely or recover before the next major demand.

Depth should often come from recombining dependable systems rather than continually introducing new mechanics.

## Systems and simulation

Favor a small number of readable, dependable systems over a large unreliable simulation. Players should be able to make predictions and test them.

If water conducts, a visually equivalent authored conductive surface should not randomly fail without an understandable reason. If a porter reacts to a bell, that response should be readable and useful. If a cover screen changes a firing lane, collision, sight, projectiles, and presentation should agree.

For routines, define normal activity, stimulus, response, duration, and return. Important opportunities should recur or have alternatives so that exploration does not accidentally create long waits or invisible mission failure.

## Encounter design

Enemies and hazards are spatial constraints, not decorations. Their position, attack shape, timing, perception, and mobility should change how the player evaluates the level.

Every serious encounter should identify the player's initial information, useful observation points, cover and concealment, line-of-sight breaks, flanking or repositioning routes, retreat options, enemy roles, telegraphs, reinforcement entrances, and valid completion conditions.

High ground should usually trade exposure for information or angle rather than grant automatic safety. Enemy navigation must honestly support any route the design assumes they can use.

Combat spaces should often allow the player's mental map to evolve during the fight. A retreat can reveal stairs, a balcony can reconnect to an earlier room, or a lower route can become an escape rather than merely scenery.

## Recovery and designed near misses

Design likely mistakes at the same time as ideal success.

A missed aerial transfer might land on a slower but viable route. A failed stealth approach might become a recoverable search rather than an immediate reset. A scattered herd might remain gatherable. A missed musical phrase should leave the player's hands in a readable state for the next phrase.

Recovery must provide a viable next action, not just delay failure.

Retry cost should match the lesson being practiced. Repeating a long unrelated commute to retry a precise movement problem is usually poor training.

## Pacing and contrast

Do not keep every system at maximum intensity. Contrast makes individual moments readable and memorable.

Useful contrasts include open and enclosed, high and low, quiet and loud, safe and dangerous, natural and industrial, bright and dark, wet and dry, slow and fast, observation and action, and ordinary function versus disrupted function.

Quiet spaces can support planning, recognition, environmental storytelling, resource decisions, and anticipation. They are not automatically dead space.

## Functional environments and environmental story

Design the ordinary purpose of a place before its disruption. A workshop receives, stores, processes, and dispatches materials. A reserve has feeding, maintenance, animal movement, observation, and emergency access. A neighborhood has deliveries, services, homes, social routes, and infrastructure.

Functional logic lets the player make useful guesses. If a workshop receives large goods, there may be a service entrance. If a public building serves multiple floors, there may be maintenance circulation. Rewarding those inferences creates stronger exploration than arbitrary hidden doors.

Environmental story should explain relationships that matter to the level. A barricade, abandoned repair, rerouted cable, household schedule, evacuation route, or broken service connection can communicate both what happened and how the space works.

## Movement and camera

Measure the real movement system before committing to elaborate geometry. Use the actual collision body, acceleration, braking, jump or Blink behavior, traversal rules, camera, and input mappings.

A route can be physically possible yet unreadable at its intended speed. Evaluate the approach along the actual trajectory and ask how long the player has to recognize the decision, understand the receiving surface, and act.

Frequently used gameplay actions should remain on direct, comfortable controls. A level should not create menu friction around the actions it expects the player to use constantly.

## XR and diorama views

First-person VR, third-person VR, and AR diorama views should operate on the same gameplay truth unless a mode is explicitly a separate unscored inspection experience.

Do not force head orientation for dramatic staging. Use composition, sound, motion, landmarks, and world events to attract attention while preserving head independence.

Diorama cutaways may change information availability, but rendering changes must not secretly alter collision, AI detection, mission state, or physical rules.

XR geometry needs human-scale clearances, reachable controls, readable panels, and places where the player can safely pause. Physical-device approval is separate from synthetic WebXR testing.

## Genre applications

Systemic first-person adventure: emphasize functional districts, readable environmental states, tactical loops, infrastructure, and multiple approaches that change information or position.

Survival-stealth: emphasize observation, finite-resource planning, concealment versus hard cover, escape routes, changing threat information, and recovery after detection.

Wildlife fieldcraft: emphasize observe, predict, prepare, intervene, and return. Terrain, body size, animal behavior, vehicles, shelters, and ranger infrastructure should create the puzzle.

Peaceful social and craft adventure: emphasize useful neighborhoods, household identity, cooperative routines, rooftop and cellar connections, evidence routes, and persistent visible outcomes without turning safe social spaces into combat zones.

Archery action and spatial roguelite: emphasize readable shot geometry, Blink destinations, vertical reconnection, enemy attack shapes, cover-state changes, and replay knowledge. Do not assume enemies can navigate routes they cannot actually traverse.

Courier and neighborhood vehicle game: emphasize circulation, landmarks, route purpose, speed versus stopping cost, delivery logic, service routes, and neighborhood changes. The city should become easier to operate as the player learns it.

Rhythm and stationary embodied play: treat a musical phrase as a level. Design approach, preparation, action, hand exit state, recovery, and the next phrase. Avoid note occlusion, awkward crossovers, and transitions that leave the player physically unprepared.

Momentum side-scroller and route authoring: preserve a satisfying ordinary route, then layer optional expressive movement, exploration, and recovery. A receiving surface succeeds only when it creates a usable next state.

## Graybox first

Do not spend final-art effort on a weak route. Build the experience with simple geometry and representative feedback first. Move walls, change elevations, remove rooms, reconnect paths, adjust sightlines, reposition actors, and test the complete arc before committing expensive decoration.

Representative sound, lighting, and motion cues should appear early when they communicate gameplay. Final art should reinforce an already understandable structure.

## Playtesting

Test with unfamiliar players without continuously explaining the intended solution. Observe hesitation, wrong turns, route choices, missed cues, resource shortages, repeated failures, recovery behavior, optional discoveries, and whether players can explain how the place works afterward.

Completion alone is not proof of comprehension or enjoyment. A player can finish while remaining confused.

Returning-player tests should ask whether knowledge creates more agency. The second visit should support better planning, different approaches, faster movement, or more expressive play rather than merely faster obedience.

## Internal quality review

Review at least these dimensions separately: first-session clarity, navigation and spatial readability, meaningful choice, mechanical depth, pacing, encounter quality, environmental storytelling, movement/camera integration, accessibility and control continuity, performance and stability, replay value, and audiovisual communication.

Do not collapse blockers into an average score. Save corruption, inaccessible required controls, unwinnable states, severe performance problems, or broken publication must remain release blockers even when other dimensions are strong.

Scores require evidence: reviewer, build, mode, rationale, and observed behavior. Internal scores are development tools, not predictions of critic ratings.

## Evidence discipline

Model tests prove model properties. Browser automation proves exercised software paths. Synthetic gamepad or XR input does not certify physical hardware. Screenshots do not prove pacing. A merge does not prove public bytes. A developer's successful run does not prove fresh-player clarity.

Retain failures and traces. Do not rewrite acceptance criteria merely to make a test pass. Do not assign actor position, inventory, health, mission progress, score, or rewards to manufacture an end-to-end acceptance result.

## The studio test

The final question for every major level is simple: does the player leave knowing how to use this place better than when they entered?

The best answer is visible in play. The player recognizes connections, predicts systems, chooses routes for reasons, recovers from mistakes, notices what changed, and uses that knowledge to act more intentionally.
