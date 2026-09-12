# Neighborhood Missions: Coastal Atmosphere (v0.9.0)

Open Menu, scroll to Coastal Atmosphere, and choose daylight, golden hour, after-rain sunset, coastal rain or blue hour. D-pad moves focus; left/right selects a preset or adjusts strength; A toggles; B resumes. Each preference is saved separately from gameplay progress. Restore sunny defaults and Disable atmosphere are available without resetting your game.

[Shader implementation and limits](ATMOSPHERE.md). The pack adds wet-road shading and ripple normals, foliage backlighting and subtle wind with matching depth shadows, warm facade glazing, atmospheric sky/fog/light presets, and one bounded rain batch. Rain ambience uses the existing ambience slider and mute/pause handling. No automatic weather cycle, traction penalty, time limit or new acceleration gate was added.

[Production checklist](AAA_ROADMAP.md). Human art approval, foreground asset quality and physical GPU/controller testing remain open. Existing Homecoming progression, 102 contracts, old save slots and sibling games are preserved.

## Earlier Homecoming release notes

# Neighborhood Missions: Homecoming (v0.8.0)

Production roadmap: [AAA_ROADMAP.md](AAA_ROADMAP.md). The canonical editable records are in [production/roadmap.json](production/roadmap.json); the [browser checklist](roadmap.html) and the in-game Menu / AAA production checklist read the same source. Real hardware sign-off belongs in [production/hardware-matrix.md](production/hardware-matrix.md). No checklist percentage or feature counter is treated as AAA certification.

This round adds an optional connected Homecoming chapter. Meet Maya across from the original depot, or open Menu / Homecoming story journal. Five existing local contracts become a community story with named speakers and debriefs. Previously completed local projects count. Accepting a chapter never silently replaces an unrelated active contract. A garden/workshop choice changes the authored Common Ground plaza. Cleanup removes litter, repairs restore visible bulbs, and the photography stage displays decorative postcard panels. The final return to Maya awards 500 credits and a mint finish unlock exactly once. The plaza cafe and workshop furniture are scenery, not a fully simulated enterable business; the art and interior-production gates remain open.

Menu / Ride performance report displays the last 600 rendered frames with average fps, p95/p99 frame intervals, CPU submission time, hitch counts and simulation/wall ratio. It excludes pauses and sends nothing automatically. It is not GPU timer data or certification. Speed camera FOV and distance now follow actual velocity instead of throttle state; coasting should no longer visually contract the camera as though braking. Reduce motion disables the speed effects. The existing unlimited-cruise, explicit-brake controls, all 102 contracts, controller mixer, saves and game URL remain intact.

The Common Ground art is authored from existing original primitives and materials. Courier face and backpack details are an incremental polish pass, not a finished skinned hero model. Homecoming is a first vertical-slice step, not a claim that the game now looks like a commercial AAA production.

## Previous Coastal Pulse release notes

# Neighborhood Missions: Coastal Pulse (v0.7.0)

Coastal Pulse adds 102 replayable contracts across the original neighborhood and 24 city districts. The six activity types are cafe courier runs, cleanup rounds, signal-cabinet timing repairs, viewpoint postcards, checkpoint circuits, and hop-through stunt rings. Contracts earn credits for five cosmetic vehicle finishes. These are variations on six activity systems, not 102 separate story campaigns.

The original delivery route, city deliveries, postmarks, transit, save slot and game URL are retained. Contract state, credits, best times and owned finishes extend the existing version-1 save rather than replacing it. Returning to the depot keeps progress; clearing progress requires an explicit confirmation.

RT or Shift accelerates to the existing 30 meters/second top speed (108 km/h). Boost no longer drains or cycles. Releasing acceleration coasts at the attained speed; LT, B or Ctrl brakes. A real collision, walking/dismounting, or explicitly taking transit can still stop the rider. Fixed-step collision simulation now has interpolated visual poses, and traffic follows continuous arc-length paths instead of jumping between road vertices.

The right stick uses standard look direction, with independently saved horizontal/vertical inversion and sensitivity in Menu. Left-stick click rings the bell. D-pad down or J opens City jobs. View or M opens the map, Menu pauses, and B returns from every new dialog. D-pad up/down selects controls, left/right adjusts sliders and choices, and A activates them. Repair dialogs offer a slower timing assist. All new interfaces retain keyboard and touch alternatives.

The original Coastal Pulse score uses one adaptive 92-BPM transport with electric-key, plucked, bass and percussion parts. The sound system adds delivery chimes, paper swishes, tires, electric drive, bicycle chain and bell, footsteps, jump/landing, braking, pass-bys, birds, wordless neighbor chatter, camera shutter, signal feedback and contract rewards. Music, effects and ambience have independent levels under a master control. Voice counts and cue rates are bounded; pause, backgrounding, mute and the quiet preset reduce sound. No microphone or remote audio service is used.

Browser autoplay policy can require a real click or Enter once before audio will play; a polled gamepad press is not guaranteed to unlock audio. The Enable sound button and audio status explain this without stopping gameplay. After audio is unlocked, its mixer is controller-operable.

The city now has a pooled population of walking neighbors, joggers, cyclists and cars, with bell reactions and contextual conversation. Population density is adjustable. These residents and cars are scenic and do not secretly brake or damage the rider. Original houses are widened by 60 percent with more two-story variants. City homes are larger two-story forms, with textured surfaces, porches, balconies, storefront signs, warmer lighting and bounded, spatially culled detail streaming. Existing licensed art remains available. This is a stylized browser-game upgrade, not a claim of commercial AAA production fidelity.

Release acceptance includes model/regression tests, sustained-speed and traffic-continuity checks, every contract target's collision clearance, save migration, currency, and simulated standard-mapping Xbox UI tests in Chromium. Physical Xbox hardware and the user's own GPU still require real-device testing.

## Original city edition notes

### Neighborhood Missions - City Expansion 0.6.0

The existing third-person bicycle/electric-unicycle game now connects its original neighborhood to a much larger, fully spherical city. This is a fictional Long Beach-inspired setting, not a geographically accurate model of Long Beach.

The planet radius is 880 meters, up from 110: 8 times the radius and 64 times the surface area. Six stitched cube-sphere grids avoid converging streets at the poles. The expansion adds 24 districts, 146 road strips including two original-neighborhood connections, 6,761 buildings and 3,454 palms. All original eight main deliveries and ten bonus deliveries remain. The new districts add 24 deliveries, 48 postmarks and 24 sprint gates.

Street-scale third-person riding remains the default. Instanced shells cover the globe; windows, doors, awnings and street furniture stream in nearby. The map supports compass waypoints and safe district transit. Returning to the depot never resets progress.

## Xbox controller

The left stick moves, the right stick turns and tilts the camera, and right-stick click recenters. RT or left-stick click boosts. LT or B brakes. A hops, X interacts, Y mounts/dismounts, LB throws and RB cycles cameras. View or D-pad up opens the map, D-pad down opens controls, and D-pad left/right changes the waypoint. Menu pauses/resumes.

In every panel, D-pad or left stick navigates, left/right changes selected settings, A activates, B backs out and the right stick scrolls. Reset requires an explicit confirmation, defaulting to keeping progress. The controller module runs independently of WebGL so recovery remains navigable. Disconnect pauses active play. Physical Xbox hardware and browser-specific behavior still need real-device playtesting; automated checks use injected standard-mapping input.

Keyboard and touch controls remain available. The in-game Controls panel explains them. Browser focus is needed for controller input; press a controller button after opening the game.

## Save compatibility

The original `svgn.paper-delivery-3d.v1` save key and all historical mission IDs remain intact. Legacy `svgn.little-planet.v1` saves are still read. Version 1 saves without position continue at the original depot. New saves also retain vehicle, normalized position and camera north. Invalid or blocked positions fall back safely. There are no accounts, purchases or external services.

## Verification and deployment

Run `node --test svgn-planet/tests/*.test.mjs tests/neighborhood-missions/model.test.mjs` from the repository root. Vendored artwork and Three.js remain local. Original art licensing and credits are preserved in the existing asset documentation.

The public URL remains `/svgn-planet/` so old bookmarks keep working. The Curved-world Prototype is removed only from the homepage catalog, not from its archived directory. The separate side-scroller is named Sky Cycle.
