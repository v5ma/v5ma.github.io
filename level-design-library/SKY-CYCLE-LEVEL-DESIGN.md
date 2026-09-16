# Sky Cycle Level Design Manual

Sky Cycle is intentionally handled separately from the other SVGN games. Its identity is movement-first: a momentum-driven bicycle/unicycle delivery adventure with a complete ground route, an optional interconnected aerial network, whip-grappling, discoveries, and a route editor.

The design promise is: ride a complete adventure on the ground, discover an interconnected adventure above it, and gradually learn to connect the two into your own route.

## Design hierarchy

Sonic and momentum-based riding should remain the foundation of movement. Mario-style design should guide teaching and escalation. Metroid-style thinking should guide how knowledge and environmental changes make old places more useful. Castlevania-style thinking should guide how enemies and terrain combine into readable movement decisions. Celeste-style forgiveness should guide recovery from understandable near misses. None of these references should overwrite Sky Cycle's own controls, fiction, delivery identity, or route editor.

## Ground first

The ground route must be enjoyable without aerial mastery. It needs its own beginning, development, surprises, deliveries, landmarks, encounters, choices, and satisfying finish.

Ground completion must not require expert whip releases, high-to-high transfers, optional seals, or difficult loop chains. A player who prefers ordinary riding should still experience a complete chapter rather than an emergency lane underneath the real game.

Ground does not mean flat. Use rolling terrain, bridges, modest jumps, readable hazards, braking choices, service streets, canals, and occasional shortcuts.

Only after the ground adventure works should the large aerial network be layered above and around it.

## The aerial network is an adventure, not stunt clutter

Every major curve should enable a meaningful next state. A rising runway builds speed. An open curl converts speed into height. A receiving cradle gives the rider continuation or recovery. A braking choice selects a branch. A whip target creates an optional connection between already meaningful places.

Complexity should create decisions rather than fill the screen. The overall network may be intricate, but each local view must make the next decision understandable.

Short teaching branches should return safely to the road. Do not accidentally feed a beginner demonstration into a long expert network.

## Route roles

Think in terms of player intentions rather than mandatory lane types.

A reliable delivery route favors continuity, ordinary completion, readable encounters, and useful stops.

An expressive aerial route favors momentum, height, transfers, and maintaining a line.

A discovery detour favors something worth noticing: a postal balcony, mechanism, hidden service path, landmark view, changed environment, or shortcut.

These routes should repeatedly see and reconnect with one another. From the road, the player should sometimes see the route they may later ride. From above, they should recognize streets, markets, canals, or landmarks they crossed earlier.

The lower route should not always be punishment. Braking or dropping down can be an intelligent choice that offers a delivery, safer line, discovery, or better setup for a later launch.

## Teach movement relationships

Each chapter should have a central movement question rather than an inventory of mechanics.

A chapter might teach how approach speed changes landing position. First provide a broad receiver and safe road continuation. Then present two possible receivers. Later let braking before launch choose another route. Only after the player understands that relationship should an optional mastery sequence combine it with a whip release.

This lets beginners and experts engage with the same idea at different depths.

Avoid sequences that introduce an unfamiliar ramp, grapple, moving hazard, precision landing, and delivery target simultaneously. Separate relationships before combining them.

## Knowledge before new abilities

Sky Cycle already has a rich vocabulary: acceleration, braking, jumping, boosting, two-sided rail riding, whip-grappling, and route selection. Exploration can become deeper by changing the player's understanding of those systems rather than continually adding new buttons.

A curve may initially appear to be scenery. Later the player notices its entry. Later still they understand that its underside is a recovery path. The controls have not changed, but the geography has become more useful.

Environmental changes can produce the same effect. A sluice, bridge, gate, lift, or service mechanism can expose a route while preserving an ordinary completion path.

When a place is revisited, the return should ideally be faster, more expressive, newly understandable, or meaningfully changed.

## Delivery should shape geography

Delivery is not decoration on top of traversal. It should help explain why the neighborhood and routes exist.

Roads serve ordinary doorsteps. A rooftop branch may reach a postal balcony. A canal route can connect maintenance structures. An express aerial line can link distant districts efficiently.

Place ordinary deliveries where they reinforce the basic ride. Use optional targets to reward control, route knowledge, or expressive timing. Difficult combinations such as jump plus grapple plus precise delivery should be mastery content, not early mandatory progression.

## Enemies and hazards

An enemy should change a riding decision. It may encourage an earlier jump, make one approach less attractive, protect a receiving area, or create a reason to choose road versus upper route.

Do not hide a dangerous threat on the far side of a blind high-speed commitment. Give the player enough approach time to read the encounter and decide whether to slow, jump, attack, or choose another route.

Do not interrupt every satisfying acceleration with combat. Movement rhythm needs sustained flow.

Whip targets must be visually and spatially unambiguous. Nearby targets should not make the player's intended attachment unpredictable.

## Designed near misses

For every important aerial transfer, design the likely mistakes as well as the ideal landing.

An early release may return the player to the road. A short jump may find a lower rolling receiver. A late release may land on a broad recovery shelf. Intermediate mistakes should often change the route rather than end participation.

Expert branches may carry clearer risk, but introductory and intermediate routes should not rely on one narrow trajectory surrounded by undefined failure space.

Forgiveness should primarily come from understandable geometry and reasonable timing windows, not invisible steering, unexplained velocity changes, or snapping the rider onto the intended path.

## Continuous-state testing

Do not validate Sky Cycle by proving isolated jumps from reset states. The rider carries position, speed, direction, support, and previous mistakes into the next movement.

A receiver is successful only if it creates a usable next state. After landing, can the player continue, brake, recover, choose another line, or perform the next expected action?

Test long connected sequences from realistic approach conditions. Preserve failed runs because they expose unreadable choices, awkward arrivals, and mistaken expectations.

## Camera and readability

Camera design is part of level design. A physically possible route can be unreadable at its intended speed.

Frame the decision the rider is making. The player should see enough of the approach, intended receiver, major alternative, and recovery where appropriate. Do not simply zoom out until the whole district fits if that makes the rider, threats, or contacts unreadable.

Background architecture must not look like playable track when it is not. Decorative structures must not hide real riding surfaces.

The same authored route should remain understandable in normal side-on play, supported 2D fallback, and the seated XR diorama. XR qualification remains a physical-device task.

## District structure

Expand through distinctive connected districts, not endless repeated track.

Each district should have a recognizable landmark, delivery purpose, central movement question, satisfying ground adventure, and optional connections above or around it.

Reuse landmarks from several perspectives. A waterwheel might be seen from the opening road, passed underneath, approached near its upper machinery, and viewed again from the finish. This turns visual identity into spatial understanding.

Portal destinations should remain honest separate route journeys under the current architecture. Do not imply seamless world continuity when travel actually starts a new run.

## Waterwheel Boulevard reference direction

A strong next reference chapter would center on a working waterside neighborhood and the relationship among speed, height, controlled descent, and route choice.

The opening establishes the waterwheel as the landmark while delivering a complete road-level sequence. An optional curve is visible above but not required.

The first aerial branch is forgiving and clearly returns to the street. It teaches that leaving the ground is an opportunity rather than an irreversible commitment.

Later, maintaining speed reaches an upper route, braking selects a lower canal-side line, and remaining on the road still produces a complete journey. The upper route develops into a longer connected sequence with optional whip continuation and designed recovery surfaces.

A quieter area gives room for an optional delivery, environmental interaction, or route discovery. The climax reunites the routes near the landmark. Ground riders finish through a satisfying rolling approach; aerial riders may arrive through the chapter's most expressive transfer sequence.

## Tideglass and water destinations

A water destination should create a different riding and exploration experience, not merely different shaders. Tideglass's useful model is an environmental state change that exposes an optional route while retaining a continuous dry completion path.

Future water destinations should vary movement relationships, architecture, sound, sightlines, route logic, and delivery purpose. Do not introduce swimming or underwater locomotion unless separately justified as a game-wide feature decision.

## Route editor

The editor should help designers author ride relationships without becoming rigid.

Useful annotations can associate a launch with an intended receiver, likely recovery area, approach condition, and next connection. These are authoring aids, not guarantees that arbitrary geometry is playable.

Provide examples of forgiving road-to-sky entrances, braking-selected forks, high-to-high whip links, and controlled descents while preserving independent Bezier editing.

The authoring question should be: what ride does this arrangement support?

## Production gate

The next major geometry effort should produce one reference-quality chapter rather than another batch of surfaces or a new destination for its own sake.

Test the ordinary road route with unfamiliar players. Test an intermediate detour. Test the ambitious aerial line. Measure where players hesitate, what route they think is available, how often they lose momentum, whether failures are understandable, and whether recovery produces a useful next state.

Resolve known uncertainty in complete optional sequences before using them as templates for more content.

Preserve route IDs, saves, medals, controller remaps, Workshop drafts, and existing progression. Redesigned campaign geometry must not silently overwrite user-authored copies.

The target experience is that Sky Cycle stops feeling like a prototype with more track attached and instead feels like a place whose possibilities open as the player becomes a better rider.
