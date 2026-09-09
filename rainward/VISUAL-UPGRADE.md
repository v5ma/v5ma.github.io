# Rainward 0.6 — Living Light

## Shipping scope

This continues the pending scanned-environment branch rather than losing its eight credited CC0 asset sources. It adds an original bounded WebGL post-processing pipeline, dynamic water/waterfall shaders, anchored foliage wind, environmental particles, actor-ground contact shading and an experimental stationary WebXR overlook of the current chapter.

All three authored chapters, physical puzzle gates and hints, monsters, inventory and enemy loot remain. No new chapter or original rigged character is claimed by this rendering release. The game is still a stylized prototype, not commercial-game graphical parity.

## Rendering

A linear HDR scene target feeds half-resolution screen-space ambient occlusion, quarter-resolution two-pass bloom and a final color/vignette composite. Tone mapping and output encoding occur once at the end. Scene resolution is capped at 1600 by 1100 pixels; smaller displays are not upscaled. The DOM interface stays sharp and outside the post effects. Unsupported float targets and Reduced Graphics use direct rendering. Fullscreen post effects are bypassed in XR.

Water now changes its surface normals and roughness over time and responds to the actual player's movement within authored shallow-water areas with a fixed eight-ripple budget. Reflection uses the captured environment, not live screen-space or planar scene reflections. The submerged light pattern is artistic caustics, not physically simulated refraction. Water remains shallow traversal, not swimming. Waterfall streaks scroll downward, grass and fern vertices bend from fixed roots, and environmental motion respects the control setting and reduced-motion preference. Static mesh source data and collision remain separate from visual vertex deformation.

The directional shadow volume follows the current character to improve near-field detail. Actor-ground contact decals supplement the actual lighting. The screen-space AO is bounded and is not global illumination. No claim is made to implement Lumen, Nanite, path tracing, temporal upscaling or another engine's proprietary rendering system.

## Timing repair

Previously, each rendered frame advanced the simulation by at most 0.05 seconds. A slow renderer therefore also slowed game movement, attack timers and the entire expedition. A fixed 60 Hz simulation clock now accumulates elapsed time with a 0.25-second/15-step cap. Regular 4, 10, 30 and 60 FPS updates produce the same accepted simulated time and route. Stalls cannot cause unbounded catch-up; pause and hidden-tab behavior discard residual time. This applies to the real game, not only tests. Native test deadlines and goals are not loosened.

## Experimental XR

Controls exposes an explicitly labeled VR Overlook button only when immersive-vr is supported. Entry requires a click and user permission. The actual chapter is rendered in stereo with head tracking, using local reference space; the player's mission pauses. Trigger switches between authored shelter viewpoints and grip ends the preview. It does not implement VR combat, joystick locomotion, hand interactions, AR passthrough or Quest performance certification. On exit, desktop rendering and controls return to the pause panel; a pending session cannot attach after its scene is replaced. The renderer uses setAnimationLoop and restores culled instances for both XR eyes instead of reusing the desktop frustum.

## Community techniques consulted

Three.js post-processing workflow: https://threejs.org/manual/en/post-processing.html
Three.js render target/output workflow: https://threejs.org/manual/en/how-to-use-post-processing.html
Three.js water example: https://threejs.org/examples/webgl_shaders_ocean.html
Three.js WebXR manager: https://threejs.org/docs/pages/WebXRManager.html
PlayCanvas CameraFrame effects reference: https://developer.playcanvas.com/user-manual/graphics/posteffects/cameraframe/
A-Frame performance and camera comfort guidance: https://aframe.io/docs/1.8.0/introduction/best-practices.html
Babylon.js engine feature reference: https://www.babylonjs.com/specifications/

These inform the rendering architecture. The game keeps one Three.js renderer; it does not load PlayCanvas, Babylon.js and A-Frame engines into the same canvas or present their engine-specific code as interchangeable. New shader implementations are local. Existing Three.js MIT notices and Poly Haven CC0 artist credits remain.

## Acceptance

Test the actual browser render path, full and reduced shaders, quality switching, texture loading/fallback, a physical water crossing, pause, all three chapter completions and checkpoint restoration. XR lifecycle mock tests are separate from native browser tests and physical headset acceptance. Shader tests and screenshot inspections do not certify player enjoyment, frame rate on a real GPU, or visual parity with the reference games. Public file hashes are verified after merge before claiming the upgrade is live.
