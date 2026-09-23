# Currentworks FlexSurface 0.1.0

Original bounded, deformable scene geometry for curved cards, banners and future spatial panels. It is a shared-library addition, not yet loaded by Prism's main index. It does not replace the Rotunda, implement HTML rendering, capture gestures, simulate cloth or adopt the inaccessible Saurow/CodePen source. REFERENCE-REVIEW-SPATIAL-UI.md records the source review behind this choice.

## Basic host use

```js
import FlexSurface from './flex-surface.mjs';
const card = FlexSurface.create(THREE, {
  width: 1.2, height: 0.8, columns: 32, rows: 8,
  readableBack: true,
  material: hostOwnedFrontSideMaterial
});
scene.add(card.group);
card.group.position.set(0, 1.3, -2);
card.update({bend: 0.7, pull: null});
// Caller can ease shape values with its existing pausable animation system.
// Repeating exactly the same shape causes no buffer update.
const hit = card.pick(hostRaycaster);
if (hit) {
  const contentUV = hit.uv; // Attribute used by this same visible side.
  // Host decides hover/press/drag actions and texture/DOM mapping.
}
card.reset();
card.dispose();
```

Classic/UMD source is flex-surface.js with global SVGNFlexSurface. flex-surface.mjs exports the exact same API. Pass the caller's existing Three.js namespace; the tested version is bundled r184. The module imports no engine, framework, GSAP, renderer, DOM polyfill or texture. It creates no clock, event listener, pointer capture, animation loop, light, render target or saved state.

## Shape and coordinate contract

Geometry is GROUP-LOCAL, centered on the original plane. The left edge at x=-width/2 stays attached while a cylindrical bend changes the surface. bend is the total angle across its width, in radians, bounded to[-2.4,2.4]. Zero is flat. Rotation/scaling/translation of the whole group places the result without moving the camera. Do not independently move front/back internal meshes while claiming they remain one surface.

An optional pull is {u,v,strength,radius}. Its normalized content location is measured on the original FRONT plane, with u increasing to the right and v upward. Strength displaces local z with a smooth Gaussian multiplied by a left-edge attachment envelope. It is bounded to10 percent of the smaller dimension; radius has a15-percent minimum. It is a controlled deformation, not a collision spring or liquid/cloth solver. A host can drive values from its own pointer or pausable clock. Quiet mode should supply a deliberate static shape; no hidden wall-clock animation must continue.

update takes a complete shape, not a partial merge. Omitted bend becomes0 and omitted pull becomes null. It validates before changing any buffers; invalid values throw while preserving the previous shape. It returns true only when geometry was changed. reset requests the flat shape. describe returns copies of options and the current shape.

The pure options, shape and evaluate helpers support authoring/testing. evaluate(u,v,validatedShape,validatedOptions) returns an analytic local position, normal and length-based x/y derivatives. The rendered mesh is its tessellated approximation, not an exact continuous surface. The production picker intersects the actual triangles rather than using the analytic query as an invisible hit surface.

## Rendering and reliable picking

One front mesh uses ordinary positive winding. With readableBack enabled, a second mesh shares its position attribute but uses reversed winding/normals and horizontally mirrored UVs. Content viewed from the back therefore reads with the intended orientation. The returned hit.uv is from the same displayed side; do not flip it a second time. Only one front-facing sheet is visible from each direction, avoiding double-sided coplanar blending.

Borrowed material must be FrontSide; it is never modified or disposed by this module. A default owned MeshStandardMaterial is created otherwise. A caller-provided material can use a canvas or another supported texture. For a conventional full untransformed canvas texture, image coordinates are x=uv.x*width and y=(1-uv.y)*height. Repeated, offset, rotated or atlas textures require the host to apply its matching mapping. HTML element layout, event dispatch, focus, typing, scroll, caret and accessibility are not supplied.

Use pick(raycaster) for this surface's query. It updates group world matrices and respects the visibility of the group and its ancestors. The host raycaster's near/far and layer policy still apply. The host must combine other obstacles/interactables for scene occlusion; this helper does not let a ray automatically pass through walls, UI or an opaque body. Never let decorative surfaces intercept every game ray by indiscriminately raycasting the whole scene.

Because CPU geometry is updated, rendered position, bounds and standard Three.js ray intersections remain aligned under bend, localized pull and nonsingular parent transforms. Mirroring a whole parent through a negative scale is not included in the named tests. Shadows/custom depth materials and a depth-aware HTML compositor are not validated. A fully folded self-contacting sheet or arbitrary crease topology is not supported.

## Cost and ownership

Default32x8 grid has297 shared positions and1024 total triangles across two sides. A one-sided16x4 decoration uses85 vertices and128 triangles. Width/height are0.05..6 local units, columns2..64 and rows1..32. These bounds are not automatic physical-world or interaction safety boundaries. Use smaller grids for frequently animated decorations and do not grow large animated surfaces across the real room.

Shape changes reuse the same GPU buffers and a fixed evaluation scratch object; no geometry is rebuilt. Bounds/normals are refreshed. Repeating unchanged state performs no buffer-upload request. The implementation uses CPU work intentionally for trustworthy ordinary raycasts; it does not claim to beat a shader-only approach at high vertex counts. Budget both update frequency and projected pixel coverage.

Dispose detaches the group, frees owned front/back geometry once and frees the default material only when owned. Borrowed materials, textures, renderer and siblings remain the caller's responsibility. After disposal, update/reset return false and pick returns null. Prepared material/shader/texture upload belongs in the host's cancellable loading flow. The module does not include a renderer-specific warmup helper or automatic graphics-context recovery.

## Evidence and next use

Twelve new pure/math tests verify derivative agreement, finite normals, bounded pull, zero-bend stability, pinned edge, invalid data and explicit-module identity. Together with the recovered game suite they pass399 tests. A separate25-check bundled-Three suite exercises actual resources, both sides' triangle/UV hits under nonuniform parent transforms, paused state, bounds and disposal. These are not GPU draws or headset tests.

The native standalone fixture renders numbered colored quadrants at960x640 and clicks those surfaces through normal pointer events, comparing picked UVs with framebuffer pixels. Its output is separate from actual game screenshots and must be inspected before a rendered success claim. It does not exercise HTML-in-Canvas or WebXR input. Native/public results remain in UI-EFFECTS-CHECKPOINT.md.

Next candidates are a small AR island banner or a deliberately stationary-while-selected settings panel. Input ownership, transformed texture/DOM mapping, actual XR controller/hand selection, readability and no shot leakage require their own integration tests. Do not replace the current Start/Resume panel as a side effect of adding this geometry library.
