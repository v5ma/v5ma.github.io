# Currentworks Fire 0.1.3 / reusable API and completed Pass 2

Fire 0.1.3 is implemented, integrated into the normal Prism game and verified on the public site. Water remains 0.1.0 and the host application is 0.11.2. The accepted runtime is 783236d7bb4e229d8f9c3461f93070f519f90450. Both jobs in run 35655444660 passed; PUBLIC-PASS2.json preserves the exact receipts. This document replaces the obsolete standalone-only status, retained separately in FIRE-v010-CHECKPOINT.md. Trees remain the next module.

## Host-owned integration

Use the caller's existing THREE namespace, renderer, scene, camera and simulation clock. This module does not start a game loop, import another Three.js copy, attach input handlers, access storage or create a renderer. It targets the bundled Three.js r184 WebGL2 path, not WebGPU/TSL.

Classic-script users load fire.js and use SVGNFire.create(THREE, options). ES-module users import the default from fire.mjs. Both expose the same implementation; load one compatible version per page. Construction options are quality: light/balanced/cinematic, integer seed, and lights:false to disable the optional effect lights.

```js
import Fire from './fire.mjs';
const fire = Fire.create(THREE, {quality: 'balanced'});
scene.add(fire.group);

// Run inside the HOST'S cancellable loading operation, before playing audio.
// Recheck host cancellation, visibility and current XR session after awaiting.
await fire.prepare(renderer, camera, scene);

// In the existing host update, before dispatching this frame's visual events:
fire.update({time: simulationTime, quality, xr: isImmersive, quiet, visible: true});

// Dispatch only an actual event. This never damages a target or grants points.
fire.emit({id: eventId, position: [x, y, z], radius: 0.7, life: 1.65, power: 1});

// On an abandoned/restarted scene:
fire.reset(0);
// When permanently removing this module:
fire.dispose();
```

Coordinates and directions are FIRE-GROUP-LOCAL before group or parent transforms. Convert external world positions after updating world matrices, using fire.group.worldToLocal on a copy. Do not supply world-space positions directly to a transformed group. An impact's direction is a local normal; nonuniform scale requires the appropriate inverse normal transformation rather than treating it as a position.

The supplied renderer and its WebGL context belong to the host. A prepared module instance is for that renderer/context; do not share its GPU resources with another renderer. Recreate and prepare the module when rebuilding a lost context. These are host responsibilities, not automatically handled by a global rendering service.

## Emission modes

emit({id, position, radius, life, power}) creates a transient burst. Optional mode:'impact' flattens it around the supplied direction, defaulting to local up. Radius defaults to 0.6 and is bounded to 0.08..2 local units; duration defaults to 1.65 seconds and is bounded to 0.2..3; power is bounded to 0..1. Invalid positions are rejected. Radius is a visual parameter, NEVER a gameplay blast radius.

A supplied integer or nonempty string event ID suppresses duplicate observations within a bounded 64-ID history. Integrators processing longer histories must also maintain their own monotonic event cursor. Prism does so. Omitting the ID allows repeated independent bursts. A fixed six-slot pool reuses transient slots and does not overwrite active sustained emitters.

emitter(id, {position, direction, length, radius, power}) creates or refreshes a sustained jet. The supplied position is the nozzle, and the volume extends along the normalized direction. Length defaults to 2 and is bounded to 0.2..6. Refresh from the host update: an unrefreshed jet starts fading after 0.3 seconds and retires after 0.85. stop(id) begins that retirement. At most two jets exist simultaneously. Quiet mode rejects jets. The caller supplies any surface-hit event; the module does not raycast, move projectiles or create a weapon.

Prism integrates bursts for actual catapult, boat, plane, fighter, bomb and boss destruction events. It does not replace the saber lasers with a flamethrower. The separately rendered jet and impact fixtures validate reusable modes, not new playable weapons.

## Time, reset and cleanup

update takes absolute pausable host seconds, not elapsed wall time or a delta. Repeated time preserves effect age. Rewinds clear effects and event history; large gaps and visibility/quiet transitions discard obsolete effects. reset(time) clears the pool and deduplication state for a new host run. dispose() is idempotent, detaches the group and frees only owned geometry, materials, data texture and lights.

Quiet mode removes sparks and flashing lights, rejects sustained jets, and retains subdued, still-shaped transient feedback. Near-camera alpha fading reduces enclosing flashes; it is not medical or physical-device comfort certification. Every effect remains cosmetic.

## Preparation and the first-use repair

prepare(renderer, camera, scene) shares concurrent calls, uploads the generated density, compiles programs, then exercises volume and instanced-ember drawing in a disposable 24x24 loading target. It restores render target, cube face, mip level, viewport, scissor, auto-clear, XR routing, uniforms, particle data and visibility, then disposes that target. No additional renderer, target or render pass persists during gameplay. The one-time GPU completion barrier can delay loading; its duration requires device measurement.

Three r184 selects different color/tone-mapping programs for ordinary offscreen targets and display/XR output. The warmup matches the current host destination's policy so its first visible burst uses the same prepared program. The temporary isXRRenderTarget tag is a pinned renderer-policy workaround, not a session request or claim of public cross-version API stability. Revalidate the program-key test when upgrading Three.js. Supply the real host scene so lighting/fog/environment shader selection can match. Do not change rendering policy during preparation.

Failure rejects readiness; an explicit retry is supported. Disposal during a pending compile cannot revive the module. Prism awaits preparation inside its existing serial, visibility and matching-session guards before audio starts. The 0.35-second gameplay stall safeguard was not removed or relaxed to obtain a passing test.

## Appearance and budgets

The original volumetric shader samples a generated 32x32x32 single-channel density texture. A warm orange turbulent exterior surrounds a hotter center, then cools toward smoke. Instanced ember quads share a draw. Up to two optional warm lights illuminate nearby geometry without shadows.

Light allows two active volumes, 12 ray samples and 32 embers. Balanced allows three, 20 and 64. Cinematic allows six, 32 and 128. XR uses the Light budget and at most one effect light. These bounds are not a Quest frame-rate guarantee. Construction owns fixed graphics resources; there is no new geometry allocation per hit.

Per-draw camera transforms support stereo and transformed parents. Depth testing uses the nearest contributing volume sample rather than the proxy's back face. It is not exact integration of opaque geometry through the entire volume: intersecting surfaces and transparent layers can still show compositing limitations. There is no scene-color heat haze, bloom postprocessor, fire simulation, long-lived fluid smoke, screen grab or room-camera access. The implementation is a first reusable visual foundation, not equivalence to the supplied high-end reference videos.

## Evidence and next work

The accepted source passed 289 Node tests, 64 fire object/lifecycle observations and 37 water object checks. Each source/public rendered job passed fire24, water13, interruption19 and Rotunda73: 129 checks per job. The public manifest matched all 104 expected Prism files. Both complete Arcade battles finished through ordinary input handlers without assigned health, score, actor positions or completion.

The fire test checks actual destruction, first-use preparation and program-key equality, no first-destruction stall in the observed run, pause/resume, quiet, cleanup and bounded effects. Five explicitly separate 960x640 fixtures cover burst, cooling smoke, jet, impact and quiet. The actual-game screenshot uses a smaller gameplay drawing buffer and must not be described as a full-resolution gameplay benchmark. Images were inspected at closeout. Physical Quest/Xbox/touch testing, sustained performance and owner approval remain open.

Earlier failures stay in FIRE-REFINEMENT.md and FIRE-PASS2-RECOVERY.md. PUBLIC-PASS2.json identifies the successful run rather than erasing previous failed attempts. Subsequent rendering changes must rerun the appropriate checks. The next module is seeded trees/foliage with bounded detail and host-driven wind; preserve clear combat sightlines and transparent AR.

Historical research references and the original standalone checkpoint remain in FIRE-v010-CHECKPOINT.md. The pinned shader-policy finding is documented with its official renderer-source reference in FIRE-PASS2-RECOVERY.md.
