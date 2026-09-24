# Currentworks / Curling Fire and Optical Preparation

This pass extends the existing AR-first game, not a separate demo. Fire 0.2.0 replaces regular sine-wave plume distortion with an original seeded periodic curl field and raises/stretchs cooling smoke within the same local proxy. Water Optics 0.2.1 explicitly prepares its base/optical textures and actual water buffers before the existing loading path starts music. The current game remains Color Match 0.13.0; health, four difficulties, late bosses, soundtrack, controller actions, scores and existing scene placement are unchanged.

## Fire reuse and budget

The existing create/update/emit/emitter/stop/reset/prepare/dispose API remains. fire.mjs also exports flowData(size,seed), and the prior scalar noiseData API is preserved. RGB stores a globally scaled, central-difference curl of periodic vector potentials; alpha preserves the original scalar density. Global scaling preserves the discrete divergence cancellation before byte quantization. This is a decorative density warp, not integration of fluid flow or combustion physics.

The runtime still uses two volume texture reads per ray sample, up to 32 samples, six preallocated proxies, two sustained emitters and 128 allocated ember instances. XR remains capped at two visible volumes, 12 steps and 32 embers. Quiet disables ember/light channels and holds the existing low-energy static shape. Burst, jet and impact remain supported; Prism still integrates only real destruction bursts and does not gain a flamethrower or new damage rules.

One 32x32x32 RGBA8 volume replaces the old single-channel volume: 131072 bytes rather than 32768, an additional 96 KiB. Texture count is still one; no generated texture is uploaded each frame, and no runtime scene-copy pass is added. Existing depth and near-viewer fade limits remain; partial intersections with unrelated geometry are not a solved volumetric compositing system.

## Water optical preparation

After attaching optics to the existing Currentworks Water material, call await optics.prepare(renderer,camera,scene,water.mesh) during cancellable host loading, before audio. It uploads the base data and two optical textures, compiles the material, and draws borrowed water geometry once into a disposable 24x24 target. The host's live mesh is never reparented. Pausable time, opacity, AR flag, scene, shader sources and resource ownership survive unchanged. The temporary representative opacity is restored, including saved zero opacity.

Preparation uses the current canvas/XR or linear output policy for the pinned Three r184 renderer. It restores target/face/mip/viewport/scissor/auto-clear/XR routing and disposes the target on both success and render failure. Concurrent calls share pending work, repeated ready calls avoid another draw, rejected calls permit a deliberate retry, and late compilation cannot revive a disposed attachment. Use the same renderer/context/policy; external context replacement requires revalidation, not a promise of automatic recovery.

The existing river/ar-islands.js adapter awaits this after its scenery preparation. Water geometry, optics color/shading, CPU samples, wakes, tide, saved opacity and quiet behavior are unchanged. It closes a missing preparation path; it does NOT prove the cause of all earlier startup frame gaps. No frame-loop finish call or relaxed 0.35-second safeguard is added.

## Checkpoint evidence and next gate

Locally, 436 Node tests pass, including five new data/budget/integration tests. The new object suite passes 36 observations using actual bundled Three objects and controlled renderer collaborators; the existing fire64, water-optics19 and AR island/grass object suites also pass. These collaborators do not execute GPU work and do not establish physical Quest performance. Local WebGL2 remains unavailable.

One old source-regex assertion prohibited any render target even during loading. That assertion is updated to allow only the explicitly tested disposable preparation path; no-input/no-clock/no-storage requirements remain, and the new state/cleanup checks enforce zero persistent targets. Historical Clear Shoals failures are preserved unchanged. No new graphics test should silently erase them.

The existing focused Clear Shoals browser journey now also renders fire burst, smoke, jet, impact and quiet fixtures, checks paused pixel repeatability, and requires actual AR water/fire readiness plus real enemy-destruction events in the unchanged full Easy boss journey. No new workflow or synthetic game-state mutation is introduced. Native source, public file matches, actual gameplay and screenshots remain separate gates to inspect after the direct-master save.

Next: inspect those native/public artifacts and visuals, repair demonstrated causes rather than rerunning until green, and get the owner's Quest feedback. Before adding more expensive effects, attribute remaining startup stalls with bounded full-frame/GPU evidence where available. Read FUTURE-DIRECTION.md and CLEAR-SHOALS-FINAL.md; all earlier failures and private/public boundaries remain in effect.

Technical reference: Three.js WebGLRenderer documentation separates texture initialization, shader compilation and rendering: https://threejs.org/docs/pages/WebGLRenderer.html . The original volume-field construction does not copy a third-party implementation.
