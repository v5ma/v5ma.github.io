# Dino Atlas: Coastal Light

Build: coastal-light-20260912.1. This is a shader/material upgrade of the published Living Herds game. It does not replace the original project, increase the dinosaur count or silently migrate any gameplay saves.

## Visible changes

Six existing water surfaces share a world-space wave-normal treatment, shallow/deep coloring, shoreline foam, sun/sky highlights and an artistic caustic-like surface pattern. The patrol boat writes up to 12 fading wake samples. Dusk colors its wake cyan. Water-gun impacts and horn/research events can create six concurrent surface ripple samples. These are surface shaders, not fluid simulation, screen-space reflections, underwater caustics or changes to boat physics. The actual island, lagoon and river geometry and collision remain unchanged.

Five canopy instance batches gain breeze and small color variation. Depth and distance shadow materials use the same vertex movement. Trunks and collision remain fixed. This is canopy sway, not a new rig for individual leaves.

The 39 road ribbons use darker, patchy specular material response during Storm Response. This changes their appearance, not traction or collision. All earlier missions and vehicle recovery rules remain intact.

The existing 46 transient pulse rings acquire soft, brighter bands. Five additional reusable hemispherical shells distinguish cyan sonic pulses, violet gravity pulses and amber training celebrations. They share geometry and do not allocate new lights or cause extra damage or forces. No new musical scheduler or sound subsystem is added.

## Controls, fallback and saves

Open Menu > Coastal Light / shaders. D-pad navigates, A selects/toggles, left/right adjusts a value, right stick scrolls and B closes. X remains the in-world reload button. The panel describes where the effects occur rather than moving the player to a demo scene.

Balanced is the default and adds no full-screen postprocessing passes. Cinematic renders one scene pass plus horizontal bright extraction/blur, vertical blur and composition. It uses three floating-point render targets, half resolution for the blur, a 1920-pixel width cap and bloom strength capped at 0.8. It falls back to Balanced with Low graphics or missing float-target support. Classic restores the previous material bindings and releases Cinematic targets. A shader-compile or rendering failure restores Classic instead of blocking the game.

Reduced Motion freezes shader time, stops canopy sway, clears the new wake/ripple uniforms and suppresses the added expanding shells. It does not remove important original threat indicators. Pause/hidden-tab time does not advance the new effects. Shader settings are stored separately in dino-atlas.optics.v1; previous profile, journal, fleet, race, story, trade and audio namespaces are unchanged.

## Production boundary

This pass uses the existing pinned Three.js WebGL renderer. Geometry-role selectors are covered by tests; unknown geometry is left untouched. It adds no downloaded art, textures, credentials, analytics or external runtime service. The source remains normal ES modules. The unfinished Northstar candidate branch is preserved, not merged as part of this release. Signature world art, real-player readability, physical Xbox and mobile testing, consumer-GPU profiling and long-session comfort are still open roadmap items.

Model tests cover validation, save separation, capability fallback, visual clocks, scene classification, reversible materials, bounded pools, stable material versions and unchanged collider counts. The rendered test exercises actual shader compilation, preset switching, shadow/bloom output, boat wake input, dusk, pause, Reduced Motion, no-damage sonic effects, X reload, existing storm wetness and persistence. Distant test positions are explicit fixtures; they are not a human playthrough. CI evidence is tied to the exact commit, and publication must match served bytes and pass an actual public-site run.

Technical references used for the new WebGL materials:
https://threejs.org/docs/pages/Material.html
https://threejs.org/docs/pages/ShaderMaterial.html

The custom material hooks retain the pinned engine's standard light/shadow, fog, tone-mapping and color-conversion chunks. Native browser compilation, not the documentation alone, is the compatibility check.
