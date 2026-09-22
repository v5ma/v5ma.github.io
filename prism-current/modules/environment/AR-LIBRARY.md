# Currentworks AR library additions / 0.1.0

Toon and Cloudlets are new reusable source modules. They are NOT yet loaded by Prism's index.html, applied to existing game objects, or a completed AR scenery update. Water0.1.0, Fire0.1.3 and Trees0.1.3 remain the current integrated modules. ../../AR-FIRST.md sets the new AR-primary design direction. AR-REFERENCE-REVIEW.md distinguishes inspected primary sources, licenses, inaccessible references and design inference.

## Currentworks Toon

```js
import Toon from './toon.mjs';
const style = Toon.create(THREE, {bands: [0.26, 0.52, 0.78, 1]});
const material = style.material({color: 0xf6d34e});
// Assign only to intentionally chosen new geometry; do not swap every game material.
const toy = new THREE.Mesh(existingOwnedGeometry, material);
scene.add(toy);
// After removing all meshes that use the factory's materials:
scene.remove(toy);
style.dispose();
```

Classic scripts expose SVGNToon; Node can require toon.js. Supply the host's existing Three.js namespace. The factory creates one nearest-filtered, non-color light ramp and up to64 MeshToonMaterial instances. Bands are strictly increasing values in[0,1], with2..8 entries. Reuse a material instead of creating one each frame. release(material) disposes only a material owned by this factory; dispose() frees all remaining owned materials and the ramp once. A borrowed texture passed as an ordinary map parameter remains its caller's responsibility. gradientMap is factory-owned and cannot be replaced through material parameters.

This is discrete lighting, not an anime asset generator, outline renderer, color-contrast guarantee or screen effect. It needs appropriate host lights. There are no new shader hooks, postprocess targets, scene-camera changes or independent update loop. Own the mesh/geometry in the host and remove material users before disposal. Do not mix several versions of the global facade in one application.

## Currentworks Cloudlets

```js
import Cloudlets from './cloudlets.mjs';
const clouds = Cloudlets.create(THREE, {
  clouds: [
    {id: 'orchard-left', seed: 42, position: [-3, 2.6, -5], radius: 0.55},
    {id: 'orchard-right', seed: 81, position: [3, 2.8, -6], radius: 0.65}
  ],
  near: 10, far: 20
});
scene.add(clouds.group);
// Supply one world-space center-viewer observation for BOTH eyes.
clouds.update({time: simulationTime, viewer: eyeWorldPosition.toArray(),
  xr: immersive, quality: graphicsQuality, quiet: quietMotion, visible: hasClouds});
clouds.reset(0);
clouds.dispose();
```

Cloudlets creates original opaque mesh-cloud clusters, NOT VDB clouds, raymarched volumes or Gaussian splats. Seven overlapping spheroidal lobes per cloud share one merged mesh. Smooth normals and underside vertex color provide a soft basic appearance; no boolean-union smoothing or light scattering is implemented. The default material is one owned MeshLambertMaterial without full-scene fog. A caller can supply another material, including a material from the Toon factory; that material is borrowed, not mutated or disposed by Cloudlets. It should support vertex colors to retain the authored gradient.

At most8 uniquely identified clouds are accepted. Descriptor positions are GROUP-LOCAL and copied. A missing seed is a stable hash of the ID, independent of descriptor order. A radius in0.15..2.5 scales the lobes; optional yaw, drift and bob are bounded. Group transforms place the whole formation without changing the camera. Rebuild descriptors deliberately when changing layout. describe() returns copies rather than live references.

Three geometries per cloud are built once. Near/middle/far have2016/1176/448 triangles per cloud. At eight clouds the conservative XR level has3584 triangles and at most8 material draws per eye before ordinary culling. This is a source budget, not a frame-rate measurement. Buffer/renderer overhead and projected pixel cost still matter. No instanced forest, Gaussian point renderer, screen copy, texture or persistent render target is owned by this module.

Distance selection has12 percent hysteresis and uses the host's single WORLD-SPACE viewer position, adjusted conservatively by the group's largest world scale. XR and Light force the coarsest level; Balanced never uses the finest. The same geometry is used for both eyes. This avoids per-eye LOD switching but does not establish stereo artistic approval. Detail transitions switch meshes; cross-fades are not implemented.

Time is absolute pausable host seconds. Default drift is8cm, bounded to15cm; vertical bob defaults to3.5cm and is capped at8cm. These figures assume the host's local unit is one metre. Motion is small and bounded around the authored location, not camera-following. Repeated time freezes positions; quiet restores the authored static location. Cloudlets creates no animation loop.

When the supplied viewer approaches a conservatively bounded cloud, that cloud is suppressed, with15cm hysteresis. This is a last visual-occlusion precaution, not furniture detection, a safety boundary, route planning or a substitute for careful placement. A host may explicitly disable it using hideNearViewer:false. The module does not remove scene objects merely because AR is active. visible:false deliberately hides only this group.

update rejects malformed frames/viewer coordinates without mutating prior state. reset changes decoration only, never score/progress. dispose detaches the group and frees its owned geometry/material once, not the parent scene, borrowed material, lights or renderer. Internal cloud meshes remain normal geometry; a host should raycast its explicit interactable sets rather than make scenery accidentally intercept buttons.

## Integration that is still required

Neither module is loaded in the current main game. There is no new AR scenery menu, island terrain, grass, optional depth sensor, VDB conversion or relighting of the real room in this source checkpoint. The separate ../.. game adapter is intentionally absent until the first small island composition is tested. No library-only commit should be described as new clouds visible in the live game.

Use these modules in a bounded loading path, prewarm/upload with the host as needed, and test first visible use before starting rhythm audio. Automatic GPU context-loss recovery and a general prewarm helper are not provided. Do not mask stalls by weakening the existing pause safeguard. Follow the friendly playability checkpoint and preserve Easy, health, item readability, late bosses and scores.

## Actual tests and resumption

The local model/data suite passes369 tests:359 existing tests plus10 new. Run node --test prism-current/tests/*.test.cjs from the repository. The object/lifecycle suite constructs the real vendored Three r184 types in Chromium and passes27 observations. Run python prism-current/tests/environment-ar-library-objects.py with Playwright available; CHROMIUM_PATH optionally selects the installed browser. Its report goes only to local test-output/ar-library. No new workflow is created.

The local WebGL2 probe returned false. These checks do not render the clouds, measure GPU/Quest performance, inspect a live game integration, or close existing gameplay failures. GPU rendering, passthrough contrast, actual AR controls, allocations during play, near-viewer behavior and physical-device approval remain open. Test reports preserve this boundary rather than substituting object construction for visual acceptance.

Source is saved directly to master, first as4e08a176d375775c668bae64131da82c3326e051. The next support checkpoint saves this API, reference review, object tests, registry and AR-first design checklist. No Disney, commercial grass or premium UI assets are included. Next build and evaluate a small two-island/two-cloud Duck Armada AR adapter; do not enable every expensive reference effect at once or alter another game's implementation.
