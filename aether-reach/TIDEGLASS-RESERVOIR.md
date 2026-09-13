# Aether Reach 0.11.0 - Tideglass Reservoir

A water-exploration annex east of Glasshouse Gardens, connected by two real walkways. Existing districts, rails, characters, combat, version-1 expedition saves and controller remapping remain. This is not a separate game.

## Start and objectives

Choose **Tideglass Reservoir / water missions** from Pause. This only tracks the journal; it does not move the player or award anything. Walk from the east side of Glasshouse Gardens across the garden walkway, or use the second path from the Pump Court. The reservoir dispatch desk is at (116, 6, 12).

The Water Below the Sky asks you to isolate two perimeter valves, recover the regulator from the deep basin, install it inside the enterable pumphouse and report after circulation resumes. It pays 240 credits once. You can dive for the regulator or lower the water with the pumphouse control and walk down the railed steps. Draining and refilling move the actual simulated and rendered water level gradually. Four small return jets show when the repaired system is circulating.

Poolside Signals pays 100 credits once for three separate calibration-plate inspections. Two plates are on the main basin floor; one is in the shallow filter pool. This task can be completed independently of the repair mission.

## Water movement and Xbox controls

The deep basin supports continuous swimming and diving. Left stick swims, L3 boosts movement, A rises to the surface, and B toggles diving. X interacts with valves, plates, the regulator and the physical pool ladder. These actions follow existing gameplay bindings; menus retain fixed A/select and B/back. Keyboard Space rises and G toggles diving; E interacts. Touch jump/Foldwing buttons use those same model actions.

The basin has a broad stair route and an actual climbable ladder with continuous movement, including boarding the ladder while swimming. The shallow filter pool is step-out depth. A small capsule depenetration correction prevents falling across a pool lip from trapping the player in its wall. There is no breath countdown: the field suit supplies air. Firearms and power casting are disabled while the head is submerged, preserving ammunition/energy. Surface shooting remains available.

Only mission phase, isolation valves, drain request and collected plates are saved. Swimming pose, breath, ripple buffers, temporary velocity and intermediate pump levels are not serialized. Continue uses the legitimate reservoir checkpoint, with the requested stable water level restored. Existing purchased equipment and earlier adventures are untouched. All rewards are protected by saved completion flags.

## Water presentation and audio

Original transparent water surfaces use analytic wave normals, Fresnel-style grazing reflections, sun glints, a depth tint and an eight-ripple pool for player strokes and shot impacts. Tiled basin walls/floors retain ordinary material lighting with a moving procedural caustic pattern. The open glass pavilion and copper fittings adapt the pool reference into Aether Reach's bright floating-city architecture rather than copying a VHS overlay.

The reflections are a procedural sky approximation. Caustics are an artistic pattern, not a photon simulation. The water does not implement full-scene screen-space refraction, planar object reflections or fluid simulation. There is no added render-target/fullscreen pass. Light and immersive modes reduce shader detail and disable moving caustics. Reduced motion freezes decorative clocks and suppresses ripple motion. The Settings checkbox **Animated pool ripples and caustic light** is controller accessible and stored separately from expedition progress. Water physics remains active with effects disabled.

Underwater distance fog, softened audio, water ambience, splash/stroke sounds, pump machinery and mission chimes share the existing audio engine and its independent volume buses. Browser audio activation still follows browser permission rules. Software audio output is not a listening-quality review.

## Production evidence

`tests/tideglass.test.mjs` covers old saves, supported geometry, mission prerequisites, gradual water levels, swimming/diving, submerged weapon safety, physical ladder travel, stairs and both approach routes, single rewards, shader budgets and bounded rendering pools. Unit fixtures isolate the new area; they are not evidence of a full player journey.

`tests/tideglass-browser.py` operates the real HTTP/WebGL application using an emulated standard Gamepad API, without assigning player position, health, ammo, currency or objective progress. It must reach the reservoir from the existing city, swim/dive, collect objectives, use the pump and return for the reward. Browser reports and screenshots are retained by the Tideglass review workflow. Publication must separately match the live-file hashes.

The final candidate is reconciled with the current master before browser validation. Legacy browser checks now wait for real dialog/rail conditions instead of relying on fixed software-renderer timing; those changes preserve the same gameplay assertions and do not write game state. The reconciled source passes all 226 deterministic model/save/controller regressions and the 98-file public-runtime manifest before the final browser matrix.

Physical Xbox USB/Bluetooth, physical Quest comfort, real GPU frame times, long-session performance and player approval remain open roadmap gates.

## Technical references

The new shaders and mission code are original. The existing pinned Three.js renderer and MIT license remain unchanged.
https://threejs.org/docs/pages/ShaderMaterial.html
https://threejs.org/docs/pages/Water.html
https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Using_Web_Audio_API
