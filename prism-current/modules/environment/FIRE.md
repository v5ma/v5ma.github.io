# Currentworks Fire 0.1.0 / second-pass checkpoint

This first checkpoint saves a standalone, reusable fire module. It is not loaded by Prism yet. The next checkpoint will add the real-event adapter and native browser checks. Water 0.1.0, controls, audio, collision, scoring and saves remain untouched here. Trees remain a following pass.

## Reuse

Load fire.js and call SVGNFire.create(THREE), or import Fire from fire.mjs and call Fire.create(THREE). Supply the application's existing Three.js namespace. Add the returned group to your world. Pass absolute pausable seconds with update({time,quality,xr,quiet,visible}). Coordinates for all events and axes are GROUP-LOCAL, before parent transforms.

emit({id,position:[x,y,z],radius,life,power}) creates a transient burst. An optional id prevents repeated observations from creating duplicates within a bounded 64-ID window; adapters consuming long histories must also retain their event cursor. mode:'impact' flattens the effect along direction, which defaults to local up. radius is cosmetic and NEVER sets damage, collision or blast radius.

emitter(id,{position,direction,length,radius,power}) creates or refreshes a sustained jet. Its nozzle is the supplied position and the volume extends along the normalized direction. Refresh it from the host update; an unrefreshed emitter fades after 0.3 seconds and retires after 0.85 seconds. stop(id) begins that retirement explicitly. At most two sustained emitters exist. The module does not raycast for impacts, apply damage or add a weapon.

reset(time) clears this module's effects and deduplication history. dispose() detaches and frees only owned meshes, materials and texture, idempotently. prepare(renderer,camera) asks the existing renderer to compile hidden effect programs before a soundtrack starts, restoring visibility afterward. It does not create or retain a renderer or loop. The host should await it inside its existing cancellable loading sequence.

## Graphics and budgets

Original raymarched three-dimensional fire uses one generated 32-cubed single-channel density texture, a hot core, turbulent detail and a cooling smoke phase. Instanced camera-facing ember quads share one draw. Two optional shadowless warm lights are fixed at construction; lights:false disables them. Transparent effects retain depth testing and do not write depth.

The volume evaluates the actual draw camera in onBeforeRender, including transformed and nonuniformly scaled parents. The shader writes the nearest contributing sample's depth instead of the proxy box's back-face depth. This is NOT exact scene-depth integration through the whole volume: an opaque surface slicing a volume and intersecting transparent effects can still expose compositing limits. There is no scene-color heat haze, bloom postprocessor, fire physics, smoke fluid solver, screen grab or room-camera access.

Light allows two active volumes, 12 ray samples and 32 embers. Balanced allows three, 20 and 64; Cinematic allows six, 32 and 128. XR caps to the Light budget and one active light. Pool capacity is six, with no new geometry per hit. Near-camera alpha fades to avoid a full-screen bright flash. Quiet clears existing motion, rejects sustained jets and uses subdued still-shaped transient feedback without embers or lights. Host time pauses every effect. Rewinds reset history; large gaps and visibility transitions clear stale effects.

## Validation and research

Before this checkpoint, 284 local Node tests passed (269 existing and 15 new fire tests); 19 actual bundled-Three r184 object/ownership checks passed without a WebGL context. Original volume GLSL separately compiled, linked and rendered under Mesa GLES 3.2 for burst, jet and impact fixtures. These are not native gameplay or physical Quest tests and do not establish equivalence to the supplied commercial reference videos. The newly sharpened density was re-rendered for burst and jet before saving.

The official Three.js Data3DTexture and ShaderMaterial documentation informed texture configuration, custom shaders and per-draw uniform updates. The official volume-cloud example and typeWolffo/THREE.Fire were reviewed as volume-rendering references. No code, textures or models were copied from those projects or commercial demonstrations. Existing vendor notices remain unchanged.

https://threejs.org/docs/pages/Data3DTexture.html
https://threejs.org/docs/pages/ShaderMaterial.html
https://github.com/mrdoob/three.js/blob/dev/examples/webgl_volume_cloud.html
https://github.com/typeWolffo/THREE.Fire

The XR menu test first received a separate direct-master checkpoint 2cff39fd: wait for a settled panel, observed native selection and actual tab result, without changing any gameplay/UI assertion. Inspect its source/public outcomes before asserting the previously intermittent problem is closed. The fire adapter must preserve that complete same-game journey, existing water and all saves.
