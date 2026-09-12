# Vesperfall 0.11.0 - Rosefire

This is a graphics upgrade to the maintained game, not a replacement engine or a concept image. First Bell lessons, Bellkeeper Oath, all existing combat and exploration, saved expeditions, adaptive music and Xbox/Quest interfaces remain in place.

## In the game

Rain-polished stone changes the existing paving materials: broad damp patches darken stone slightly and reduce surface roughness so the reusable lighting environment produces highlights. Cinematic mode adds shallow normal ripples without displacing any collision surface. The original color, normal and occlusion maps remain active. It is not a live mirror of nearby enemies or the room.

Stained light projects colored rosette patterns into the existing ground material. The patterns are anchored to the generated room/window locations and fade at distance. Four nearby sources are available on desktop; WebXR uses at most two. These are artistic caustics, not physically traced light rays or shadow-correct projections. The old floor glow is disabled while this new layer is active, and returns when Rosefire is switched off.

The twilight veil adds a restrained teal/violet sky ribbon and layered cloud variation. Cinematic mode adds sparse stars and finer detail; daylight has no aurora. The sky moves with the existing sky dome, not with the player's aim. No fullscreen distortion, depth-buffer reads or postprocessing renderer replaces stereo WebXR.

Woven Wardglass adds fine rings, knots, an iridescent edge and a localized impact ripple to the actual defensive shield. The centre stays transparent. Its appearance changes neither damage, collision, directionality nor guard energy. Landing echoes are a fixed pool of short-lived rings created only after successful Blink or Shard events. They never act as a landing preview or imply an unwalkable floor is safe.

## Controls and fallbacks

Open Pause / settings, then Rosefire / stone, stained light & ward shaders. Choose Off, Balanced, or Cinematic. Wet stone, stained light and the woven shield have independent toggles. Xbox D-pad selects or changes these controls with A to activate. Quest exposes the same controls at the end of the paginated spatial Settings screen; either controller's stick and trigger works.

Classic materials disable the extension. Jewelglass Reduced effects, the user's initial reduced-motion preference, and disabling general effects freeze ambient shader motion and suppress landing echoes. WebXR caps Cinematic to the lighter policy, without a second screen-space render. AR disables the new sky, ground modifications and landing echoes, leaving only the shield option. The passthrough background remains transparent.

Off restores the previous sky, shield, floor lighting and environment assignments. The extension owns no render targets and uses a fixed six-echo pool (at most three active in XR). Sector rebuilds reuse materials and shaders, reset event receipts, and never replay saved teleport events as new effects.

## Verification and remaining production gates

The new tests cover deterministic options, classic/reduced/AR policies, source selection, shader chunk compatibility and the actual browser WebGL paths. Native acceptance renders matching Off/Balanced/Cinematic frames, checks material compilation and pixel changes, exercises controller settings, repeats world rebuilds, tests real teleport feedback, and enters emulated stereo VR and passthrough AR.

Automated tests do not certify headset frame rate, comfort, optical correctness or player enjoyment. Physical Quest 3 thermal/frame-time tests and human art/audio review remain open in the production workbook. This release does not add new content duration, ray-traced reflections or production character animation.

## API references

The original GLSL integrates using Three.js WebGL Material.onBeforeCompile, customProgramCacheKey and ShaderMaterial. The pinned local A-Frame/Three runtime is retained.

https://threejs.org/docs/pages/Material.html
https://threejs.org/docs/pages/ShaderMaterial.html
https://aframe.io/docs/
