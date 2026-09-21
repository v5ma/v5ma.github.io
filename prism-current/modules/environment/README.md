# Currentworks environment modules

Versioned, independently reusable Three.js modules live here so later game sessions do not need to copy River's combat, controls or renderer. The first implemented module is Water 0.1.0. Fire and trees are separate planned modules, not empty implementations advertised as complete. See ROADMAP.md and CHECKPOINT.md before resuming work.

## Using the water module

Use your application's EXISTING Three.js namespace. Do not install a second renderer or import A-Frame into the module. It was exercised with Prism's vendored A-Frame 1.8.0 / Three.js r184. The implementation targets WebGL2 ShaderMaterial, not WebGPU/TSL.

```js
import Water from './water.mjs';
const water = Water.create(THREE, {
  preset: 'river', quality: 'balanced',
  width: 10.5, length: 42, centerZ: -22,
  level: -0.18, depth: 2.6, shoreDepth: 0.12
});
scene.add(water.mesh);
// Called from the host's existing loop. Time must stop when the game pauses.
water.update({
  time: simulationTime, level: tideHeight,
  opacity: immersiveAR ? savedWaterOpacity : 1,
  quiet: reducedDecorativeMotion, quality: graphicsSetting,
  xr: immersiveAR || immersiveVR, visible: levelHasWater,
  bodies: observedBoatPositions // [{id, x, z, radius}], mesh-local coordinates.
});
// On an actual host event, never as an implicit damage or score action:
water.splash(localX, localZ, 0.65, 0.24);
water.reset(0); // Abandon/restart the host scene.
water.dispose(); // Remove permanently; safe to call twice.
```

Classic script users load water.js before their art script and use SVGNWater.create. Node users can require water.js. The ES-module facade exports the same implementation. No module-owned input, storage, camera, renderer, animation loop or network request is introduced.

## API and coordinate contract

create(THREE, options) returns mesh, material, uniforms, update(frame), splash(x,z,strength,radius), reset(time), sample(x,z), setQuality(quality,xr), dispose(), and stats. Inputs are not mutated. Exposed uniforms allow inspection; manually overriding wave uniforms bypasses the CPU surface-query agreement and is unsupported.

Construction presets are river, lagoon and storm. They set flow, amplitude, choppiness, absorption, roughness, deep color and foam. Prism currently selects river; other presets are reusable options, not new game chapters. Dimensions, preset, seed and an optional bedHeight(x,z) callback are construction parameters. Width is bounded to 1..256 metres and length to 2..512. Large surfaces filter sub-grid waves rather than pretending a fixed mesh resolves a whole ocean. An invalid authored bed sample fails construction and frees partial resources.

All positions, bed heights, body observations, splashes and sample queries are water-MESH-LOCAL before any mesh or parent transform. Transform world positions with water.mesh.worldToLocal after updating its world matrix. Transform sampled normals with the proper normal matrix for world-space use. Prism keeps the water under the existing recentered stage and compensates its AR width scale in observations. No target or collider is moved to match the decorative waves.

update accepts absolute pausable host seconds, not a delta. Repeating a paused time freezes water and effects. A rewind or gap greater than one second clears stale trails. Quiet/visibility/XR transitions clear obsolete observations. Quiet flattens geometric displacement, fixes decorative time at zero and suppresses wakes/splashes while retaining static surface detail. Opacity is independent; every contribution including foam is capped by it. Zero opacity discards fragments.

At most eight stable body IDs are tracked. Initial observations and large jumps are not travelled trails. Actual movement relative to the current creates wakes at bounded intervals, with at most three births per update. The fixed twelve-slot disturbance pool lasts 3.2 seconds per effect and reuses slots. splash is a visual event, not a blast-damage radius.

sample(x,z) returns local height, unit normal and reconstructed x/z. It inverts the same horizontal Gerstner displacement and uses the selected mesh's wavelength filtering. It excludes fragment-only detail and does not supply buoyancy or collision automatically. Normal Three.js mesh raycasting still sees the undeformed base grid; arbitrary ray-to-wave intersection is not implemented.

## Rendering and limits

Four filtered, analytically differentiated Gerstner waves provide geometry. Generated periodic mip-filtered data gives fine surface normals and irregular foam. Fresnel and filtered sun highlights vary with view angle. Authored-bed color, absorption and caustic-like illumination distinguish shallow and deep areas. Crest, side, shallow-bed, wake and splash foam share the same alpha limit.

Reflection is an analytic sky approximation, not a rendered mirror of the scene or the real room. Refraction is authored-bed shading, not a sampled scene buffer. There is no FFT ocean, fluid solver, terrain scan, camera feed, postprocessing renderer or additional scene pass. Do not present this first module as equivalent to the commercial demonstrations in the references.

Light uses 2425 vertices / 4608 triangles and four recent disturbances. Balanced uses 9457 / 18432 and eight. Cinematic uses 18761 / 36864 and twelve; XR caps Cinematic to Balanced. One 128x128 RGBA data texture is generated once. Quality switches cache at most three geometries. Disposal frees owned resources once, without touching other scene objects. These are budgets, not measured headset frame-rate guarantees.

View-dependent calculations use the current draw's modelViewMatrix and viewMatrix, not a stored mono camera. Physical stereo comfort and sustained frame rate still need Quest testing. See RESEARCH.md for sources and the distinction between inspiration and imported code.

## Tests and continuation

Run node --test prism-current/tests/*.test.cjs. environment-water-objects.py constructs the actual bundled Three.js objects in Chromium without needing WebGL. environment-water-browser.py separately exercises the served game, actual shader compilation, a full battle, pause and the AR opacity controls. Model/object/GLES fixtures do not replace native gameplay or physical-device checks. The existing read-only Rotunda workflow runs the native tests and separately checks public hashes.

Source is checkpointed directly to master, with no PR or staging branch. CHECKPOINT.md records the current state and exact pending checks. Preserve failed reports. Do not overwrite current game files with a whole old archive, touch sibling games, expose private hub code or clear localStorage.
