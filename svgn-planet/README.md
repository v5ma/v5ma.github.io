# Neighborhood Missions - City Expansion 0.6.0

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
