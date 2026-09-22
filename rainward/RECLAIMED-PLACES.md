# Rainward / Reclaimed Places

Build: rainward-reclaimed-places-20260922, version 0.16.4. This is a level-content pass on the verified 5bb879e6533903a63e8d70ffc6f94eba77318b87 runtime, not the nonexistent follow-up SHA previously named in chat. Existing Glance Map / Tall Diorama, nonblocking clues, character assets, recovered motion, direct controls and all seven expeditions remain.

## Experience hypothesis

A functional room with a preview, more than one usable exit and a visible connection to the wider district lets a survivor plan and recover rather than obey a waypoint. A shortcut should alter pursuit and sightlines as well as travel distance. The practical test is whether the player chooses the sheltered longer route or a faster exposed crossing for an understandable reason, then changes that decision after detection.

This bounded pass maps to RW-009, RW-011, RW-012, RW-013 and RW-028. No task is newly Approved. It upgrades two existing chapters, not all seven and not the game's entire art/audio or weapons system. The studio manual and its Rainward brief are authoritative. The Last of Us is a design reference for functional detail, constrained resources and contrasting approaches, not a source of copied maps, fiction or assets.

## Floodgate: pump rooms and quay crossing

The formerly solid west ruin contains two connected service rooms. Its pump cabinet, disconnected pipe, flood-height stain, packed evacuation bundles and coat hooks explain a working place interrupted by flooding. South and north doors connect the quiet western approach to the quay. A third eastern exit reconnects to the exposed verge. The partition creates a turn where a pursuer can lose sight without being unable to enter the building.

The low eastern observation sill distinguishes concealment from information: standing gives a view but exposure; crouching takes cover behind the same physical silhouette. Outside, the existing direct Freight Hall approach remains faster and more exposed. Low sorting stands provide a crouched sightline break, not an invulnerable corridor. The final crossing still asks the player to use timing, their existing smoke or finite stamina. No new checkpoint or free supply cache erases the survival decision.

The main sequence is clinic/market observation, original receiver and spindle work, optional return through the powered Freight Cut, recovery through the service rooms, a view of the transmitter, and commitment across the northern quay. Existing unpowered Freight Hall entrances remain legal. The space is denser rather than larger.

## Bellweather Terminus: dispatch and goods circulation

The dispatch gallery gains a raised dry-record rack and an outer aisle with connected ends. The original rootback encounter remains alive and can navigate that aisle. Recording the existing last-dispatch task now also releases an emergency shutter at the gallery's north-west end. Its desk release and visible cable explain the connection. Once the prism is recovered, the survivor can leave laterally rather than repeat the entire entrance commute.

In the workshop, restoring the existing station-radio after the original safe-power puzzle opens the northern goods exit. That route reconnects the key room to the signal-bridge approach. Both shutters change body collision, enemy navigation, projectiles and sight through the existing shared obstacle rules. Their raised art and status lamps follow the same completed-task state. Enemies can use the openings too; they are not player-only teleports.

Both optional tasks keep their original IDs, positions, prerequisites and one-time rewards. Their original descriptions are expanded to explain the actual release. Neither task becomes a mandatory extraction objective. The power puzzle and both mission components remain necessary, while the original entrances remain valid when either optional shutter is closed.

## Save and control boundaries

New full-height architecture is carved from formerly solid ruin/wall footprints. Racks added to previously open ground start 0.6 metres above it, retaining the old 0.4-metre prone/loot ray clearance. Old dropped supplies retain their saved coordinates and quantities. Shelter locations, chapter IDs, objective positions, resources, patrol definitions and checkpoint schemas are unchanged.

There is no new input mapping. Existing interaction, crouch, movement, map, crafting and extraction commands operate the spaces in screen play and the same underlying VR/AR game. Render cutaways remain presentation only. Character geometry, XR logic, weapon alignment, audio ownership, motion and licensed assets are unchanged.

## Evidence and limitations

The contract hashes in evidence/reclaimed-places-20260922/gameplay-contract.json were recorded from the downloaded 5bb879e source before editing. They protect all seven chapters' mission, item, patrol, shelter, puzzle and task contracts. The historical motion receipt is retained unedited; render-revision.json explicitly repins only the intentionally changed district renderer, not the character or movement code.

The new route/geometry tests include actual swept movement, enemy navigation, standing-versus-crouched sightlines, closed/open shutter states, task dependency checks, reward idempotence, old checkpoint versions, old dropped-loot recovery and matching rendered boxes. These pose fixtures are not end-to-end playthroughs.

Continuous model missions separately steer from normal start, collect and craft only earned supplies, use the new connections and reach extraction with living enemies. Those are model results with read-only steering and synthetic reactions, not human timing evidence. The native places-browser.py journeys use actual HTTP/WebGL and virtual Xbox inputs from normal title Start with no actor, inventory, clock or progression writes and no planted saves. The existing five XR menu/input journeys and motion benchmark remain intact. Completed native/public results belong to their exact source commit and are recorded separately; a queued job is not a pass.

The local environment could not obtain a WebGL2 context, so local rendering is not credited. Physical Quest/Xbox, real passthrough appearance, player comprehension, visual quality, sound quality and sustained target-device performance remain unapproved. This is not a claim of completed AAA-quality level design.

## Continuation and rollback

Observe whether unfamiliar players notice the quay observation choice, the second dispatch exit, and the risk that enemies can follow. Keep failed routes and compare first/repeat visits. Do not fix confusion by immediately adding more markers or resource grants.

The next unimplemented chapter applications are Conservatory water/height relationships, Meridian household/service interiors, Breakwater height versus weather exposure, Whiteout recognizable thresholds, and Northlight dry observation versus submerged recovery. These are directions, not shipped changes in this pass.

A scoped revert of this commit restores the former geometry without erasing saves. No new save field exists. Existing completed optional task IDs remain valid before or after rollback. Preserve concurrent sibling commits and never force-push or clear player storage.
