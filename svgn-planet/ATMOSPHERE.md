# Coastal Atmosphere / v0.9.0

These original shader additions are implemented in the existing Neighborhood Missions renderer, using its pinned Three.js r177. The user's supplied screenshots guide a readable stylized coastal look: sunny streets, warmer late-day light, wet pavement and a moody but playable evening. No screenshot artwork, third-party shader product or reference-game code was copied.

## Play and controls

Menu / Coastal Atmosphere contains Enable, Lighting and weather, Strength, Foliage breeze, Visible rain, and Restore sunny defaults. D-pad selects, left/right adjusts sliders and options, A activates and B resumes. The existing Reduce motion option freezes moving foliage and ripples and hides falling rain. Low graphics uses fewer rain instances and disables moving foliage/ripple detail. Turning off Visible rain hides particles, not wet roads or rainy ambience; choose daylight or disable the pack to remove the rainy atmosphere altogether.

The five presets are coastal daylight, golden hour, after-rain sunset, coastal rain and blue hour. These are player-selected looks, not a simulated clock or changing weather. No preset modifies speed, traction, mission timers, collision geometry, rewards or save progress. Photography uses the actual scene, including the selected look.

## What the GPU does

Road and paving materials retain their existing color, normal and roughness maps. A world-coordinate puddle mask darkens wet patches and lowers their roughness. A bounded procedural ripple height perturbs the view-space normal in rainy presets. Dominant-plane blending keeps the pattern on the spherical planet rather than tying it to the camera or screen. Reflections use the already allocated prefiltered environment; they are NOT live reflections of cars/buildings, screen-space reflection, planar reflection or ray tracing.

Foliage receives a mild view/sun-dependent backlighting term and slow vertex movement. The same displacement is injected into the custom depth material, retaining source alpha cutouts so moving foliage and its shadow do not disagree. It is an inexpensive translucency approximation, not volumetric subsurface scattering. Trunks, walls, people, collectibles and signs are not waved indiscriminately.

Facade glazing is isolated from the vehicle/gem/shelter optics and receives warm evening glow. This is emissive window art, not a new interior or dynamically lit room. Sky colors, cloud photograph, fog and directional/hemisphere lighting are coordinated by the preset. Existing CC0 sky and building assets remain local with their original license register.

Rain uses one instanced quad batch with a fixed 640-instance capacity. Low quality uses at most 160. Positions are computed in the shader and oriented to the player's local planetary up, not rebuilt into geometry each frame. The pack adds no whole-scene reflection passes, no extra full-screen color buffers and no per-frame material creation. Rain audio is one reused noise source on the existing ambience bus; no second soundtrack is scheduled.

## Acceptance and remaining work

Required automated checks include all five GLSL variants, original/custom shader-hook chaining, standard/low quality, pause/settings and Xbox navigation, reduced motion, switch-off, persistent preferences, context restore, bounded program/texture counts, successful original gameplay tests, and matching published bytes. Actual WebGL screenshots must be retained. Software rendering is NOT physical GPU performance approval or an assertion that 60 fps is achieved.

The production record remains partial for overall lighting/weather quality. Authored buildings, foreground character/vehicle modeling, real-device testing and art-direction approval cannot be replaced with shader checkmarks.

## Technical references

Three.js Material customization and program cache keys: https://threejs.org/docs/pages/Material.html

Three.js ShaderMaterial: https://threejs.org/docs/pages/ShaderMaterial.html

Three.js InstancedMesh: https://threejs.org/docs/pages/InstancedMesh.html

Pinned renderer source and license are in vendor/. These API references explain the machinery; the implementation and numerical budgets here are specific to this project.
