# Jewelglass / v0.6.0

This is a materials, foreground-art and effects upgrade inside the existing A-Frame game. No other engine is embedded and no gameplay/save system is replaced.

## What to look for

The choir's suspended cut crystal, polished metal bands, jewel lamps and faceted reliquaries use a cached prefiltered lighting environment. The living bow has smoothly modeled recurve limbs, paired gilt wires, a ribbed grip and inlaid gems. A charcoal leather material with fine surface grain separates the grip and glove from the reflective fittings. Suspended lamp details are instanced into shared geometry/material batches rather than drawing each ornament independently. The crossbow retains its deliberate reload and gains polished metal and jewel fittings. Leaded rose windows gain reflective clearcoat and a faint, depth-tested pattern on the floor. The actual Wardglass shield has an angle-dependent interference pattern and a ripple at a real blocked impact. The beacon seal's shader changes when the simulation opens it. Cinder, Frost, Blink and Volley leave bounded, color-coded trails; actual hit, pickup, shield and spell-impact events create sparks.

## Profiles and honesty about the effects

**Balanced** is the default: reflective, faceted physical materials without screen-space transmission. **Jewel** enables Three.js physical transmission, thickness/attenuation and dispersion on just the suspended choir crown and the bow's inset stone. Its transmission background is rendered at half viewport resolution to reduce the extra pass cost. **Classic** restores the previous materials and foreground model. The graphics menu is separate from the Chronicle/save data. Reduced effects remove sparkle and shafts and steady the new ornament motion; the existing combat telegraphs remain readable.

On entering WebXR, transmission/dispersion are disabled automatically and the particle pool drops from 256 to 96. Existing A-Frame stereo rendering is retained; this update does not install a mono postprocessing composer. Leaving immersive mode restores the requested desktop profile. Actual Quest 3 controller alignment, visual comfort, thermal behavior and frame times need physical hardware measurement.

The reflection environment is locally generated from a sky shader and bright architectural lighting cards, prefiltered twice (day and twilight), and cached. It is not a live planar mirror, real-time ray tracing or a full optical diamond solver. The crystal topology has a table, crown, girdle and pavilion with separate planar facet normals. Projected rose patterns are an artistic local effect, not physically solved caustics or a hole in a solid wall. Glow comes from depth-tested local transparent materials and bounded spark geometry, not full-screen bloom. These distinctions matter for both correctness and frame cost.

## Community research and implementation references

- Three.js MeshPhysicalMaterial: https://threejs.org/docs/pages/MeshPhysicalMaterial.html — environment lighting, clearcoat, iridescence, IOR, transmission and dispersion.
- Three.js WebGLRenderer: https://threejs.org/docs/pages/WebGLRenderer.html — transmissionResolutionScale for a bounded optical background pass.
- Three.js PMREMGenerator: https://threejs.org/docs/pages/PMREMGenerator.html — prefiltered radiance for roughness-dependent reflections.
- A-Frame material/custom shader documentation: https://aframe.io/docs/1.8.0/components/material.html — native Three.js ShaderMaterial inside an A-Frame component.
- PlayCanvas physical materials: https://developer.playcanvas.com/user-manual/graphics/physical-rendering/physical-materials/ — image-based lighting and metalness workflow.
- PlayCanvas material inspector: https://developer.playcanvas.com/user-manual/editor/assets/inspectors/material/ — clearcoat, optical transmission and iridescence controls.
- Babylon.js rendering specifications: https://www.babylonjs.com/specifications/ — physical materials and image-based lighting across web engines.

The shader strings and modeled crystal/bow detail in this update are original implementation, not copied community demos. Documentation is credited as technical reference, not claimed as imported code. The previously imported Poly Haven assets and their licenses remain in assets/cathedral/ASSET-REGISTER.json. No new external texture, account, key or runtime CDN dependency is added.

## Verification

Pure tests cover closed/outward-facing crystal topology, settings validation, explicit workload bounds and forced XR fallbacks. Native tests capture matching Classic/Jewel views (long camera moves use an ordinary 480×360 browser resize, restored to 1120×800 for capture; not a performance benchmark), compile actual GPU shaders, switch equipment, fire real arrows, test pause/rebuild/resource reuse and enter/leave emulated XR. Existing complete-run, gallery, architecture, combat and save regressions remain release gates. Only a successful post-merge served-file comparison plus live homepage launch establishes public deployment.

The suspended crown is above the upper gallery's head clearance, not in the safe blink landing. A native bound check covers the visible mesh, independently of unchanged collision. The older expedition driver now follows an observed moving target during the draw using ordinary keyboard events, like the existing scored-combat test, instead of firing at stale target positions. Required kills, hits, beacon access, blessing and persistence checks are unchanged.
