# Currentworks Trees 0.1.3 / reusable module

Pass 3 adds original seeded tree and foliage geometry. Water 0.1.0 and Fire 0.1.3 remain independent modules. Runtime 18d83fa4 is integrated into Prism and passed its 151-check public rendering/input journey with 113 served-file hashes matched. PUBLIC-PASS3.json records the exact evidence and separate source outcomes. Read CHECKPOINT.md before continuing; publication is not physical-device approval.

## Use in another Three.js application

```js
import Trees from './trees.mjs';
const forest = Trees.create(THREE, {
  trees: [
    {id: 'bank-palm', seed: 137, preset: 'palm', height: 4,
     position: [-6, 0, -8], yaw: 0.2},
    {id: 'bank-willow', seed: 881, preset: 'willow', height: 4.2,
     position: [6, 0, -22], yaw: -0.4}
  ],
  windStrength: 0.35, near: 16, far: 30, hideInAR: true
});
scene.add(forest.group);
// During cancellable host loading, before starting the soundtrack:
await forest.prepare(renderer, camera, scene);
// The existing host loop and pausable clock remain in control.
forest.update({time: simulationTime, quality, quiet,
  viewer: cameraWorldPosition.toArray(), xr: immersive,
  ar: immersiveAR, visible: chapterHasTrees});
forest.reset();
forest.dispose();
```

Classic scripts load trees.js and call SVGNTrees.create. The .mjs facade exposes the same implementation. Supply the application's existing Three.js namespace; the module imports no engine, renderer or secondary animation loop. It owns no input, network, storage, simulation state, collision or scores. It creates no lights, textures or persistent render targets. Explicit loading preparation uses and immediately disposes a small scratch target on the caller's existing renderer.

## Geometry, identity and detail

The presets palm, alder and willow are stylized procedural forms, not botanical reconstructions. Trunks and branches are curved tapered tubes; leaves and palm leaflets are actual double-sided, opaque geometry. Bark ridges, leaf veins and color variation use the existing standard-material shading path. There are no alpha-card billboards or imported images.

Each descriptor has a unique string/integer id, seed, preset, height, position and yaw. Heights are bounded to 0.5..18 local units; a forest accepts at most 24 descriptors. Duplicate IDs and nonfinite positions are rejected. Omitted seeds are stable hashes of the ID and forest seed. Keep generator version and descriptor schema with saved procedural layouts; different generator versions are not promised to produce identical geometry.

A data-only skeleton is built once per tree. All three geometry levels share its branch paths and leaf locations. The middle and far meshes use fewer tube rings/radial segments and fewer larger leaves. Paired palm leaflets are thinned together, avoiding a one-sided low-detail frond. Every tree's three mesh pairs are constructed before play; later detail changes allocate no geometry. Two materials are shared across the forest.

Default distance thresholds are 16 and 30 forest units with 12 percent hysteresis. The host passes one WORLD-SPACE viewer position per update, selecting one level for both stereo eyes. Distance is adjusted by the forest group's largest world scale. This is conservative for nonuniform scaling, not an exact screen-space error metric. Light and XR prohibit the highest detail. Cinematic allows the highest detail but still reduces distant trees. No camera-following LOD callback is run separately per eye.

At most two meshes draw per visible tree. Geometry stats describe selected meshes before renderer frustum culling; they are budgets rather than FPS claims. The Prism set contains eight trees, 48 prebuilt geometries and two shared materials. Large instanced forests, texture atlases and smooth cross-fading detail are future work, not delivered features.

## Coordinates, wind and ownership

Descriptor positions, generated vertices and wind direction are FOREST-GROUP-LOCAL. Geometry is baked in that frame. Move, rotate or scale forest.group to place the set; do not independently transform internal nodes and assume the baked root attributes follow. Reconstruct a changed descriptor instead. describe() returns copies, not references to live placement data.

Wind is driven by absolute host seconds, not elapsed wall time. Version 0.1.3 evaluates its two phase terms once per tree per update into a shared 24-value array, not once per vertex or eye. The geometric bending and differentiated normal response retain the original wave function. Repeating time freezes the shape. Roots remain fixed; higher branches and leaves bend with an analytically differentiated field applied to positions and normals. Quiet mode removes wind displacement and fixes shader time at zero. This is decorative bending, not physical branch simulation or independent leaf flutter.

update accepts time, quality, quiet, viewer, xr, ar, visible, windStrength and a two-component windDirection. Invalid frame containers return false; input arrays are copied rather than mutated. AR hides vegetation by default. Another host can explicitly opt out with hideInAR:false; Prism does not. Mothership hides this riverbank set entirely.

reset clears decorative time, not host progress. dispose detaches the forest and frees its own geometries/materials once. The host scene, camera, renderer, lights and unrelated objects are not disposed. Construction failures clean owned graphics resources. Normal update calls perform no GPU allocation.

The module targets the existing Three r184 MeshStandardMaterial/WebGL path. Shader hooks use pinned chunk names and must be revalidated on an engine upgrade. Default meshes do not cast shadows; wind-consistent shadow/depth materials are not implemented. CPU mesh raycasts see undeformed geometry, so these trees are not collision objects. There is no growth editor, vegetation physics, cutting system or persistent tree state.

## Loading and readiness

Await prepare(renderer,camera,scene) in the host's cancellable loading path before audio/gameplay. Use the same renderer, camera and scene the host will use. Concurrent calls share one pending promise. Preparation compiles the shared standard materials and draws all prebuilt wood/leaf detail meshes into a disposable 24x24 target, then waits for that submitted work. Independent temporary meshes reference the resources without moving, revealing or reparenting the actual forest.

The helper restores target, face, mip, viewport, scissor, auto-clear and XR routing, and disposes the scratch target even on failure. It does not start a session. Failure rejects readiness and permits a deliberate retry; late work cannot mark a disposed forest ready. The host still owns cancellation before music begins.

Preparation mitigates first-use work; it cannot guarantee that every future frame fits a timing budget. Output policy and shader hooks are pinned to bundled Three r184. Changing renderer, context, tone-mapping policy or lights after preparation requires revalidation; automatic recovery of an externally replaced WebGL context is not implemented. prepared=true is not hardware approval.

## Prism integration

river/bank-trees.js is a small adapter loaded after the unchanged RiverArt. It adds eight authored bank trees, forwards the existing clock, quality/quiet and XR mode, and extends preparation, reset, disposal and diagnostics without modifying combat. It installs once. art.js, water/fire implementations, app.js, XR/Rotunda, audio and save code remain byte-identical to Pass 2.

Placement tests inspect every vertex at every detail level and conservatively include maximum authored wind. The set stays outside the 7-metre-wide action corridor. This is geometric clearance, not a guarantee that every unusual physical viewpoint has perfect sightlines. Trees are hidden in AR and Mothership; the pedestal and gameplay UI remain.

## Evidence and references

The recovered runtime passed 306 local Node tests, 83 bundled-Three tree/object/preparation checks, 64 fire and 37 water object checks. Controlled renderer collaborators in the preparation tests do not execute a GPU draw. The public job matched 113 files and passed trees22, fire24, water13, interruption19 and Rotunda73, including both full Arcade battles. Its actual entry and separate three-preset fixtures were visually inspected.

The independent source attempt passed models, object suites, fire and interruption, but recorded a 470ms tree-battle rendering call, a water-battle stall and an initial panel-transform assertion failure. A successful public run does not erase those outcomes. PUBLIC-PASS3.json records the unchanged retry separately. Physical Quest/Xbox/touch, normal-resolution sustained performance, stereo appearance and owner visual approval remain open. Local Chromium WebGL2 was unavailable.

EZ-Tree's author documentation was reviewed for shared-skeleton detail levels and stable seeds. Its MIT license was checked, but no EZ-Tree code, assets or dependency is included. Generation, materials, wind and adapter are original. The Three.js LOD and InstancedMesh documentation informed detail and ownership choices.

https://github.com/dgreenheck/ez-tree
https://github.com/dgreenheck/ez-tree/blob/main/LICENSE
https://threejs.org/docs/pages/LOD.html
https://threejs.org/docs/pages/InstancedMesh.html
