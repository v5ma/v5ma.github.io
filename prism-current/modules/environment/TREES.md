# Currentworks Trees 0.1.1 / reusable module

Pass 3 adds original seeded tree and foliage geometry. Water 0.1.0 and Fire 0.1.3 remain independent modules. This checkpoint has local model/object evidence; actual source/public rendering is still an independent gate. See CHECKPOINT.md for the current result rather than interpreting this API document as hardware approval.

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
// The existing host loop and pausable clock remain in control.
forest.update({time: simulationTime, quality, quiet,
  viewer: cameraWorldPosition.toArray(), xr: immersive,
  ar: immersiveAR, visible: chapterHasTrees});
forest.reset();
forest.dispose();
```

Classic scripts load trees.js and call SVGNTrees.create. The .mjs facade exposes the same implementation. Supply the application's existing Three.js namespace; this code imports no engine, renderer or secondary animation loop. It owns no input, network, storage, simulation state, collision or scores. It creates no lights, textures or render targets.

## Geometry, identity and detail

The presets palm, alder and willow are stylized procedural forms, not botanical reconstructions. Trunks and branches are curved tapered tubes; leaves and palm leaflets are actual double-sided, opaque geometry. Bark ridges, leaf veins and color variation use the existing standard-material shading path. There are no alpha-card billboards or imported images.

Each descriptor has a unique string/integer id, seed, preset, height, position and yaw. Heights are bounded to 0.5..18 local units; a forest accepts at most 24 descriptors. Duplicate IDs and nonfinite positions are rejected. Omitted seeds are stable hashes of the ID and forest seed. Keep generator version and descriptor schema with saved procedural layouts; different generator versions are not promised to produce identical geometry.

A data-only skeleton is built once per tree. All three geometry levels share its branch paths and leaf locations. The middle and far meshes use fewer tube rings/radial segments and fewer larger leaves. Paired palm leaflets are thinned together in 0.1.1, avoiding a one-sided low-detail frond. Every tree's three mesh pairs are constructed before play; later detail changes allocate no geometry. Two materials are shared across the forest.

Default distance thresholds are 16 and 30 forest units with 12 percent hysteresis. The host passes one WORLD-SPACE viewer position per update, selecting one level for both stereo eyes. Distance is adjusted by the forest group's largest world scale. This is conservative for nonuniform scaling, not an exact screen-space pixel error metric. Light and XR prohibit the highest detail. Cinematic allows the highest detail, but still reduces distant trees. No camera-following LOD callback is run separately per eye.

At most two meshes draw per visible tree. Geometry stats describe selected meshes before renderer frustum culling; they are budgets rather than FPS claims. The Prism set contains eight trees, 48 prebuilt geometries and two shared materials. Large instanced forests, texture atlases and smooth cross-fading detail are future work, not delivered features.

## Coordinates, wind and ownership

Descriptor positions, all generated vertices and wind direction are FOREST-GROUP-LOCAL. Geometry is baked in that frame. Move, rotate or scale forest.group to place the whole set; do not independently transform internal tree nodes and assume the baked root attributes follow. Reconstruct a changed descriptor instead. describe() returns copies, not references to live placement data.

Wind is driven by absolute host seconds, not elapsed wall time. Repeating time freezes the shape. The roots remain fixed; higher branches and leaves bend with an analytically differentiated field applied to both positions and normals. Quiet mode removes wind displacement and fixes the shader time at zero. It is decorative bending, not physical branch simulation or independent leaf flutter.

update accepts time, quality, quiet, viewer, xr, ar, visible, windStrength and a two-component windDirection. Invalid frame containers return false; inputs are copied rather than mutated. AR hides background vegetation by default. A separate host may explicitly opt out with hideInAR:false; Prism does not. Mothership hides this riverbank set entirely.

reset clears decorative time, not host progress. dispose detaches the forest and frees its own geometries/materials exactly once. The host's scene, camera, renderer, lights and unrelated objects are not disposed. Construction failures clean owned graphics resources. No GPU allocation is performed in normal update calls.

The module targets the existing Three r184 MeshStandardMaterial/WebGL path. The shader hooks use pinned chunk names and must be revalidated on an engine upgrade. Default meshes do not cast shadows; wind-consistent shadow/depth materials are not implemented. CPU mesh raycasts see the undeformed geometry, so these trees are not collision objects. There is no growth editor, vegetation physics, cutting system or persistent tree state.

## Prism integration and safety boundaries

river/bank-trees.js is a small, explicit adapter loaded after the unchanged RiverArt. It adds eight authored bank trees, forwards the existing clock, quality/quiet and XR mode, and extends reset/disposal/diagnostics without modifying combat. It is installed once. The old art.js, water/fire implementations, app.js, XR/Rotunda, audio and save code remain byte-identical.

Placement tests examine every vertex at every detail level and conservatively include maximum authored wind. The set stays outside the 7-metre-wide action corridor. This is geometric clearance, not a guarantee that every unusual physical viewing position has perfect visibility. Trees are hidden in AR and Mothership; the original pedestal and gameplay UI remain.

## Evidence and references

Local integration passes 305 Node tests and 38 actual bundled-Three tree/object/adapter checks. The existing 64 fire and 37 water object checks also pass with the new adapter loaded. This environment's Chromium WebGL2 probe returned null. Native shader screenshots, real input journeys and exact public hashes must come from the existing read-only verification job. Physical Quest/Xbox/touch, normal-resolution sustained performance and owner visual approval remain open.

EZ-Tree's author documentation was reviewed for shared-skeleton detail levels and stable seeds. Its MIT license was checked, but no EZ-Tree code, assets or dependency is included here. The module's generation, materials, wind and adapter are original. The Three.js LOD and InstancedMesh documentation informed the detail and resource-ownership choices.

https://github.com/dgreenheck/ez-tree
https://github.com/dgreenheck/ez-tree/blob/main/LICENSE
https://threejs.org/docs/pages/LOD.html
https://threejs.org/docs/pages/InstancedMesh.html
