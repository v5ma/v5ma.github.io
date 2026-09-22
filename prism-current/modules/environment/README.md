# Currentworks reusable environment modules

Water 0.1.0, Fire 0.1.3 and Trees 0.1.3 are implemented and integrated into the normal Prism game. PUBLIC-PASS3.json records the tree-pass public runtime and separate source outcomes. PUBLIC-PASS2.json remains the earlier water/fire receipt. CHECKPOINT.md is the continuation entry point; ROADMAP.md holds the remaining multi-pass plan.

Use the caller's existing Three.js namespace, renderer and pausable simulation clock. None of these modules owns input, storage, camera, networking or the animation loop. The current target is Prism's bundled Three.js r184 WebGL2 path, not WebGPU/TSL or a second A-Frame application. Do not load multiple versions into the same global namespace. module-manifest.json identifies real entry points, versions and adapters; tests guard against stale metadata.

## Water usage

```js
import Water from './water.mjs';
const water = Water.create(THREE, {
  preset: 'river', quality: 'balanced',
  width: 10.5, length: 42, centerZ: -22,
  level: -0.18, depth: 2.6, shoreDepth: 0.12
});
scene.add(water.mesh);
// Called from the host loop. simulationTime must stop while paused.
water.update({
  time: simulationTime, level: tideHeight,
  opacity: immersiveAR ? savedWaterOpacity : 1,
  quiet: reducedDecorativeMotion, quality: graphicsSetting,
  xr: immersiveAR || immersiveVR, visible: levelHasWater,
  bodies: observedBoatPositions // [{id, x, z, radius}], water-mesh-local.
});
// Only when an actual host event occurs:
water.splash(localX, localZ, 0.65, 0.24);
water.reset(0);
water.dispose();
```

Classic scripts load water.js and call SVGNWater.create. Node can require water.js; water.mjs exports the same API. Construction returns mesh, material, uniforms, update, splash, reset, sample, setQuality, dispose and diagnostic stats. Input objects are not mutated. Manually overriding wave uniforms bypasses CPU query agreement and is unsupported.

River, lagoon and storm are construction presets, not new chapters. They set flow, amplitude, choppiness, absorption, roughness, deep color and foam. Prism uses river. Dimensions, preset, seed and optional bedHeight(x,z) are construction parameters. Width is bounded to 1..256 local units and length to 2..512. Large surfaces filter sub-grid wavelengths; a fixed mesh is not an unlimited ocean. Invalid bed samples fail construction and free partial resources.

Positions, bed heights, body observations, splashes and queries are WATER-MESH-LOCAL before mesh/parent transforms. Convert world observations with mesh.worldToLocal after updating its world matrix and use the proper normal matrix for sampled normals. Prism compensates AR width scaling without moving targets or colliders.

update takes absolute pausable seconds, not a delta. Repeated time freezes effects; a rewind or gap greater than one second clears trails. Quiet, visibility and XR transitions clear obsolete observations. Quiet flattens displacement, freezes decorative time and suppresses wakes/splashes while retaining static detail. Foam and every water contribution remain capped by opacity; zero opacity discards fragments.

At most eight stable body IDs are tracked. Initial observations and large jumps do not form travelled trails. Relative movement emits at bounded intervals, with no more than three births per update. The twelve-slot pool reuses effects lasting 3.2 seconds. Splash is visual feedback, not damage.

sample(x,z) returns local height, unit normal and reconstructed horizontal position. It inverts the same filtered Gerstner displacement as the shader, excluding fragment-only detail. It does not supply buoyancy or collision. Standard mesh raycasts see undeformed base geometry; arbitrary ray-to-wave intersection is not included.

## Water rendering and ownership

Four differentiated Gerstner waves supply geometry. Generated periodic mip-filtered data supplies fine normals and irregular foam. Fresnel and sun highlights vary by view. Authored-bed color, absorption and caustic-like illumination distinguish depth. Crest, shore, wake and splash foam share the alpha limit.

Sky reflection is analytic, not a mirror of scene geometry or the real room. Refraction shades an authored bed, not a sampled scene buffer. There is no FFT ocean, fluid solver, terrain scan, camera feed or reflected-scene pass.

Light uses 2425 vertices / 4608 triangles and four recent disturbances; Balanced uses 9457 / 18432 and eight; Cinematic uses 18761 / 36864 and twelve. XR caps Cinematic to Balanced. One 128x128 RGBA texture is generated once. Quality changes cache at most three geometries, freed by idempotent disposal. These are budgets, not device guarantees. Drawing uses per-eye matrices rather than a cached mono camera.

## Fire usage and integration boundary

FIRE.md describes the Fire 0.1.3 API, preparation, coordinates, limits and evidence. fire.js supplies SVGNFire; fire.mjs is the ES facade. It supports transient bursts, directional jets and surface impacts with volume flame, cooling smoke and embers. Prism uses destruction bursts; the other APIs do not introduce a flamethrower weapon.

Await fire.prepare(renderer,camera,scene) in cancellable host loading before audio. It uploads density, compiles and exercises the matching output shader in a disposable target, then restores renderer state. No renderer, target or extra scene pass persists in gameplay. Preparation is pinned to r184 output behavior and requires revalidation on renderer/context changes.

Water and Fire own their resources independently. Disposing either must not remove the other, change the clock or discard progress. Neither cosmetic splash nor fire radius establishes a gameplay danger radius.

## Trees usage and integration boundary

TREES.md describes Trees 0.1.3. trees.js supplies SVGNTrees and trees.mjs exports the same implementation. Seeded palm, alder and willow descriptors have stable IDs, forest-local positions, height and yaw. One skeleton produces all three detail levels before play. Leaves are double-sided opaque geometry, not image cards; two standard materials serve wood and foliage.

Await forest.prepare(renderer,camera,scene) in cancellable loading before audio. In the existing loop call update with absolute pausable time, WORLD-SPACE viewer position, quality, quiet, xr, ar and chapter visibility. One distance choice is shared across both eyes, with threshold hysteresis and Light/XR detail caps. Root-fixed wind is computed once per tree and shared by its vertices. Trees own no renderer, input, camera, storage, collision or scores.

Prism's bank-trees.js adapter adds eight bank trees outside a tested 7m-wide action corridor. AR and Mothership hide them. The module offers describe, reset, prepare and idempotent dispose. See TREES.md for shadow/raycast, coordinate, shader-hook and context-change limits. No external tree code, texture set or private hub material was copied.

## Verification and continuation

Run node --test prism-current/tests/*.test.cjs. The water/fire/trees object scripts exercise actual bundled-Three resources and lifecycle contracts. Controlled renderer collaborators do not perform GPU draws. Separate browser suites test the served game, real shaders, pause, cleanup and labeled reusable fixtures. The existing read-only Rotunda workflow separates source and exact-public verification.

The Pass 3 public runtime matched 113 files and passed 151 rendering/input checks with both complete Arcade battles. Its source counterpart exposed rendering stalls and an initial panel-selection failure; inspect PUBLIC-PASS3.json instead of treating the public pass as a green source job. The recovered runtime passed 306 local model tests, plus tree83/fire64/water37 object checks. Three new module-index consistency tests bring the closeout model count to309 without altering browser code.

Physical Quest/Xbox/touch, sustained normal-resolution performance, stereo appearance and owner approval remain open. Full-resolution captures are not thermal/frame-rate benchmarks. Keep previous failures and receipts intact.

Save milestones directly to fresh master and reconcile concurrent changes. No PR, staging branch, private hub code, portals, sibling-game edit or saved-progress reset is needed. All three module foundations now exist; next comes combined visual coherence, reproducible input/rendering fixes and device-informed polish, not rebuilding modules as though missing. RESEARCH.md and versioned notes retain technical references.
