# Tidewater Commons / Neighborhood Missions v0.10.0

This is an implemented expansion of the existing `svgn-planet` game, not a new title, image preview or design-only document. Start from **Play the water missions now** on the title screen, or open **Menu / Water missions / pool & marina**. The waterfront is also connected to Sunrise Boulevard near the original depot. Optional fast travel is deliberate; normal riding does not teleport.

## Playable excursions

Seaglass Pool / Opening time has six stages: collect a kit, skim three visible leaf rafts from safe deck positions, connect the filter valves, and return the kit. Restoring the filter changes the saved pool-clarity state. The first completion awards 360 credits.

Lantern Canal / The floating post has seven stages. Collect the shore parcel, board the pedal skiff, pass the first buoy, retrieve the floating dispatch, pass the return buoy, dock, and hand off both parcels on shore. The first completion awards 520 credits.

Tidewater Circuit / Ride the waterline is a ten-checkpoint ride around the pool and marina. It has a personal best, not a failure deadline. The first completion awards 430 credits. Replays of all three excursions pay 55 percent, rounded, and cannot duplicate a completion event within one run.

Your active city contract is retained and its timer pauses while a water excursion is active. Putting the water excursion aside resumes the city job. Starting a different water excursion replaces only the unfinished water run, not completed work, saved credits or Homecoming.

## Controls and safety

Existing controls stay: left stick moves/steers, right stick looks, RT accelerates, LT/B brakes, A hops on land, X interacts, Y switches ride or explicitly boards/docks a skiff, LB throws papers, RB changes view, Menu pauses and View opens the city map. Keyboard E works, F boards/docks, Shift accelerates and Ctrl brakes. Touch still uses the existing interact and ride buttons. Dialogs use D-pad navigation, left/right selects, A activates and B returns.

The water lip stops pedestrians and bikes; this release does not implement swimming. The dock is open and clearly marked on the local map. The skiff has a 9 m/s maximum, unlimited propulsion and free coasting. Its physical bank/dock collisions are distinct from arbitrary acceleration penalties. Land riding keeps the previous 30 m/s top speed and does not gain weather drag.

You can board or dock only near the pier and after slowing down. **Water missions / Return safely to the boat dock** provides recovery. A save made while boating resumes at the pier with the current excursion stage and rewards retained, not stranded in water. No account or external service is used.

## Water rendering

The original shader analytically refracts a virtual submerged tiled basin, with path-length tint, caustic-style interference, antialiased grout, surface normals and a small shoreline pattern. Standard PBR lighting and shadows remain. Reflections reuse the existing prefiltered environment rather than capturing the live scene. There are two bounded surfaces and eight ripple impulse slots per surface. Skimming and the moving skiff generate surface disturbances. Weather rain can add small ripples. Reduced motion freezes water animation, and Low graphics simplifies detail.

This is not a fluid-volume simulation, ray tracing, live car/building reflections, underwater traversal, an open ocean, or every planned coastal district. It is one connected, authored waterfront with real pool and boating gameplay. The new skiff and facilities are original procedural geometry. Existing art licenses and assets are not changed. No image-generation output is passed off as a gameplay screenshot.

## Sound and verification

Water lapping shares the existing ambience bus. Splash, skim, valve, pump, docking and completion effects use the existing bounded voice system; no second soundtrack is created. Pause, mute and teardown stop the new bed along with existing loops.

Model tests are in `tests/tidewater.test.mjs`; native Chromium/WebGL with synthetic standard Xbox input is exercised by `tests/tidewater-browser.py`. Physical Xbox hardware, real gaming-GPU frame rates and overall AAA art approval remain separate open gates in `production/roadmap.json`. Failed or unfinished test runs are not release evidence.
