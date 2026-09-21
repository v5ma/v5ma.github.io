# Currentworks reusable environment modules

Water 0.1.0 and Fire 0.1.3 are implemented and integrated into the normal Prism game. Trees are the next module, not a completed feature. PUBLIC-PASS2.json records the exact accepted source and public runtime. CHECKPOINT.md is the continuation entry point; ROADMAP.md holds the remaining multi-pass plan.

Use the caller's existing Three.js namespace, renderer and pausable simulation clock. Neither module owns input, storage, camera, networking or the animation loop. The current target is Prism's bundled Three.js r184 WebGL2 path; these are not WebGPU/TSL materials or a second A-Frame application. Do not load multiple versions of a module into the same global namespace.

## Water usage

```js
import Water from './water.mjs';
const water = Water.create(THREE, {
  preset: 'river', quality: 'balanced',
  width: 10.5, length: 42, centerZ: -22,
  level: -0.18, depth: 2.6, shoreDepth: 0.12
});
scene.add(water.mesh);
// Call from the host loop. simulationTime must stop while paused.
water.update({
  time: simulationTime, level: tideHeight,
  opacity: immersiveAR ? savedWaterOpacity : 1,
  quiet: reducedDecorativeMotion, quality: graphicsSetting,
  xr: immersiveAR || immersiveVR, visible: levelHasWater,
  bodies: observedBoatPositions // [{id, x, z, radius}], water-mesh-local.
});
// Only when a real host event occurs:
water.splash(localX, localZ, 0.65, 0.24);
// Host lifecycle:
water.reset(0);
water.dispose();
```

Classic-script users load water.js and call SVGNWater.create. Node users can require water.js; the .mjs facade exports the same API. Construction returns mesh, material, uniforms, update, splash, reset, sample, setQuality, dispose and diagnostic stats. No input object is mutated. Manually overriding wave uniforms bypasses CPU query agreement and is unsupported.

Construction presets are river, lagoon and storm. They set flow, amplitude, choppiness, absorption, roughness, deep color and foam. Prism uses river; these are not new game chapters. Dimensions, preset, seed and an optional bedHeight(x,z) callback are construction parameters. Width is bounded to 1..256 local units and length to 2..512. Large surfaces filter wavelengths below the mesh resolution; a fixed mesh is not an unlimited detailed ocean. Invalid authored bed samples fail construction and free partial resources.

Positions, bed heights, body observations, splashes and sample queries are WATER-MESH-LOCAL before mesh/parent transforms. Convert world observations with water.mesh.worldToLocal after updating its world matrix. Transform sampled normals with the proper normal matrix. Prism compensates its AR width scale without moving combat targets or colliders.

update takes absolute pausable host seconds, not a delta. Repeated time freezes animation and effects. A rewind or gap greater than one second clears trails; quiet, visibility and XR transitions clear obsolete observations. Quiet flattens displacement, fixes decorative time at zero and suppresses wakes/splashes while retaining static detail. All water contributions, including foam, remain capped by opacity; zero opacity discards fragments.

At most eight stable body IDs are tracked. Initial observations and large jumps do not form travelled trails. Relative movement emits at bounded intervals, with no more than three births per update. The fixed twelve-slot disturbance pool reuses slots and lasts 3.2 seconds per effect. Splash is visual feedback, not damage.

sample(x,z) returns local height, unit normal and reconstructed horizontal position. It inverts horizontal Gerstner displacement using the same filtered wave definitions as the shader. It excludes fragment-only detail and does not supply buoyancy or collision. Standard Three.js raycasting still sees the undeformed base grid; arbitrary ray-to-wave intersection is not included.

## Water rendering and ownership

Four analytically differentiated Gerstner waves supply geometry. Generated periodic, mip-filtered data supplies fine normals and irregular foam. Fresnel and filtered sun highlights vary by view. Authored-bed color, absorption and caustic-like illumination distinguish shallow and deep regions. Crest, shore, wake and splash foam share the same alpha limit.

Sky reflection is analytic, not a mirror of scene geometry or the real room. Refraction shades an authored bed, not a sampled scene buffer. There is no FFT ocean, fluid solver, terrain scan, camera feed or additional reflected-scene pass. These limits are part of the API contract, not features implied by the reference videos.

Light uses 2425 vertices / 4608 triangles and four recent disturbances; Balanced uses 9457 / 18432 and eight; Cinematic uses 18761 / 36864 and twelve. XR caps Cinematic to Balanced. One 128x128 RGBA texture is generated once. Switching quality caches at most three geometries, freed by idempotent disposal. These are implementation budgets, not measured headset guarantees. Per-eye matrices are used during drawing rather than a stored mono camera.

## Fire usage and integration boundary

See FIRE.md for the complete Fire 0.1.3 API, preparation example, coordinate contract, limits and evidence. fire.js provides SVGNFire; fire.mjs provides the ES-module facade. It supplies transient bursts, directional jets and surface impacts with volume flame, cooling smoke and embers. Prism uses destruction bursts only; the other APIs do not introduce a flamethrower weapon.

Await fire.prepare(renderer,camera,scene) during cancellable host loading before playing audio. Fire uploads its density, compiles and exercises the matching output shader in a disposable loading target, then restores state. No renderer, target or additional scene pass persists in gameplay. Preparation is pinned to tested Three r184 output-policy behavior and must be revalidated on renderer upgrades or context replacement.

Fire and Water have independent resource ownership. Disposing either must not remove the other, change the game clock, or discard saved progress. Neither cosmetic water splash nor fire radius establishes a hazard damage radius. Keep gameplay events separate from visual observations.

## Verification and continuation

Run node --test prism-current/tests/*.test.cjs. The environment-water-objects and environment-fire-objects scripts exercise actual bundled-Three resource and lifecycle contracts. Renderer collaborators in those tests do not perform GPU draws. The separate browser suites exercise served-game input, actual shaders, pause/cleanup and reusable rendering fixtures; the existing read-only Rotunda workflow independently checks source and exact public files.

The accepted runtime passed both jobs, with 129 renderer checks in each and both complete Arcade battles. PUBLIC-PASS2.json records exact hashes and scope. Physical Quest/Xbox/touch, sustained normal-resolution performance, stereo appearance and owner approval remain open. Prior failed traces are preserved rather than rewritten as successes.

Save working module milestones directly to fresh master and reconcile concurrent changes. No new PR, staging branch, private hub code, portals, sibling-game edit or saved-progress reset is needed. Trees follow, then combined water/fire/foliage refinement and device-informed polish. RESEARCH.md and the versioned fire notes retain the historical technical references.
