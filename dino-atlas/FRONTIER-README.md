# Wild Frontier II: reserve operations

This is the second pass on the existing Dino Atlas. The main index now includes the
original five-stage expedition and the much larger reserve-operations sandbox.
The original walking.html, field-guide.html, core.js and saved journal data remain intact.

## Added content

The island radius is 310 world meters instead of 86, about 13 times the area of the
first reserve. Seven new managed enclosures join the original northern habitat.
There are 34 individual dinosaurs representing 12 species, six rest/checkpoint
outposts, ten trail checkpoints, six usable vehicles across four vehicle types,
six explosive physics crates, a navigable western lagoon and 13 optional assignments.

New species are Ankylosaurus, Parasaurolophus, Brachiosaurus, Allosaurus, Spinosaurus,
and Velociraptor. Models are original procedural art. They are stylized rather than
museum-quality reconstructions; this intentionally mixed-period reserve and its
management behavior are fiction. Additional species observations are stored in the
reserve register accessible through Orders, while the original six also sync to
the unchanged field guide. The new species names and identifying features can be
checked against the Natural History Museum's dinosaur directory:
https://www.nhm.ac.uk/discover/dino-directory.html

## Controls and actual mechanics

WASD or arrows drive or walk. V exits the current vehicle or boards one nearby.
The helicopter uses Q to rise and Z to descend, with WASD for forward/reverse and
yaw. Land before disembarking. The boat uses WASD and must approach a clear shore
before disembarking. The rover is a cargo-bodied four-wheel physics vehicle.

Select tools with 1 (pressure water), 2 (short-range zapper), 3 (feed lure), or
4 (field scanner). Aim with the mouse and hold F. On touch devices the tool uses
your facing direction and the Use tool button. Water consumes a finite tank;
the pulse zapper consumes charge and recharges gradually. Outposts refill both.
Water and pulse tools cause temporary directed movement, not injuries or damage.
Their rays respect physical obstacles. Lures last 24 seconds on dry land.

E observes a nearby animal or operates a nearby gate console, feeder or outpost.
Each managed gate has a left-hand control terminal and a right-hand feeder.
Open a gate, activate its feeder and steer any strays toward the opening. The
assignment is secured only when all assigned residents are inside and the gate
is closed. Wildlife cannot cross closed enclosure boundaries. Animals in the gate
and vehicles in its opening prevent the player from closing it on them.

The helicopter and boat use simplified rigid-body arcade controllers, not a full
flight or naval simulator. The jeep and rover use the original four-wheel raycast
suspension. Parked vehicles retain their position in the current session.
The ranger on foot uses a colliding capsule. R rights a vehicle in place; a vehicle
that stays inverted for 2.4 seconds automatically rights itself without returning
to base. Large dinosaurs can impart tipping impulses. Orange hazard crates apply
explosive impulses and become spent. No vehicle has health, damage, repair cost,
forced death reset or lost mission progress. A manual Return to checkpoint action
remains available in Menu. Ordinary shoreline/world-boundary corrections are not
a mission reset. Persistent parking positions are not implemented; reload restores
the vehicle roster and resumes Ranger 07 at the saved outpost.

B opens Orders and the species register; M opens the island map. Cyan marks the
tracked reserve assignment, amber the original expedition. Blue gates mark trail
checkpoints. E at any outpost rests, refills, and stores the resume checkpoint.
Your last outpost, discoveries, assignment counters, gates, feeding records and
secured enclosures persist. Active animal positions, tool charges, lure effects
and spent crates reset on a new session. Stored secured records represent completed
assignments, not a persistent ecosystem simulation.

Space brakes, Shift boosts or sprints, H sounds the horn, J hops a jeep, C switches
camera, and Escape pauses. Drag orbits the camera; scroll zooms. Gamepad mappings
are listed in Menu. Real gamepads and physical phones still need compatibility
validation. Touch controls include boarding, tool selection/use and helicopter
altitude buttons. Low graphics and reduced motion remain available.

## Architecture, provenance and saves

The renderer is the already self-hosted Three.js distribution. Rapier 0.17.3 and
its existing Apache-2.0 license are retained. The new mechanics use ordinary rigid
body impulses and kinematic dinosaur colliders. Official API reference:
https://rapier.rs/javascript3d/classes/RigidBody.html

Bruno Simon's world-as-interface approach remains the design inspiration. This is
independent code and procedural art, not a copy of his source or assets. No movie
logos, music, dialogue, characters or downloaded franchise models are used.

frontier-data.js contains layout, species, assignments and validated save rules.
frontier-actors.js supplies vehicle and walking controllers, safe exits, shoreline
constraints and in-place recovery. frontier-art.js constructs the new models.
frontier-world.js creates managed pens, outposts, forest, routes, lagoon and effects.
ranger.js integrates these systems with the preserved first expedition.

New state uses dino-atlas.frontier.v2. The dino-atlas.progress.v1,
dino-atlas.ranger.v1 and original clue keys retain their existing meanings.
Nothing is sent to a server during normal play. All runtime assets are same-origin.
There are no accounts, paid dependencies, API keys, tracking or cloud services.

## Tests and limits

Run node --test tests/unit.test.mjs tests/ranger.test.mjs tests/frontier.test.mjs
from dino-atlas. Run python tests/frontier-browser.py with Playwright and Chromium
for actual HTTP/WebGL verification. Browser tests use real keys and touch input for
vehicle movement, boarding, tools and interactions. Explicit ?test=1 repositioning
accelerates travel between stations; this is not evidence of a complete human
playthrough. No mutable test hooks are exposed without that query flag. Reports
and rendered screenshots are the authority for each tested commit.

This is an expanded playable sandbox, not a finished commercial game. The island
remains mostly flat, terrain lacks a general navigation mesh, wildlife behavior is
simple, and park ecology, crew NPCs, interior vehicle views, full simulation of
water/rotorcraft and multiplayer are not implemented. Further model/animation polish,
performance work, audio and broader device testing remain useful next passes.
