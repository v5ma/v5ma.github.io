# Spatial materials, surfaces and UI / source review

This register records the owner's latest references, inspected primary material and explicit gaps. It informs Prism's AR-first shared library; it is not a claim to have run every demonstration or to have imported its source. No new third-party package is installed. FlexSurface is an original, framework-independent geometry implementation, not a reconstruction of inaccessible proprietary or unlicensed code.

## Performance: r3f-webgpu-perf

The supplied GitHub short link resolves to ektogamat/r3f-webgpu-perf. Its README supports React Three Fiber, React and Three.js, with WebGL/WebGPU paths and optional headless collection. Crucially, it labels frame time/FPS measured but GPU/CPU time an estimated20/80 split of frame delta. VRAM is also an estimate and WebGPU timestamp queries are not yet implemented in the reviewed version. The README labels the package MIT. The NPM short link was not independently retrieved.

Decision: useful interface and reporting inspiration, not a source of true separate GPU timings for diagnosing Prism. Do not import React only to get a meter. Preserve tests/frame-trace.js, which already labels callback/submission measurements honestly. A future production profiler must distinguish measured CPU spans, asynchronous GPU-query results, estimates and unavailable values. Label memory estimates separately from actual device-resident allocation. Do not convert render-submission duration into GPU completion time.

https://github.com/ektogamat/r3f-webgpu-perf

## Folding mesh and Liquid Fabric

Both the supplied Saurow demo and folding-article URLs failed retrieval. The user's description specifies Three.js TSL, GSAP, vertex bending, cursor distortion and flipped backface UVs. These are supplied descriptions, not independently inspected code or a verified license. The Liquid Fabric CodePen short link did not reveal an accessible exact source; its truncated display path is not enough to choose a different pen and call it the same example.

Decision: use the general design idea of deformable scene surfaces, but write original geometry with testable displayed-versus-picked coordinates. The new FlexSurface updates real triangles, normals and bounds; this avoids a shader-only bend leaving an unchanged flat hit target. It also gives the readable back its own UV orientation. It is a bounded cylinder bend plus a localized pull, not a fluid simulation, cloth physics, the Saurow implementation or the Liquid Fabric shader. A full source link/archive and license are still needed before evaluating reuse of those exact projects.

https://saurow.vercel.app/
https://blog-saurow.vercel.app/article/fold
https://t.co/5M6XjkB9Bq

## Screen-space global illumination

The SSGI demonstration's landing shell is accessible, but it does not independently establish the quoted under9MB payload, the absence of every baked contribution, or the phrase 'no limits'. The official Three.js SSGINode is a TSL postprocess taking scene color, depth, normal data and a camera. Its documentation explicitly describes sample-count/performance tradeoffs and temporal filtering artifacts; recommended temporal mode requires TRAANode, with manual denoising otherwise.

Decision: optional future renderer experiment, not a drop-in material for Prism's existing A-Frame WebGL2 scene. Screen-space input is the rendered virtual scene; passthrough is not automatically available as a relightable scene with geometry/normals. Any future AR GI pass needs explicit per-eye camera/buffer/history handling, transparent-background preservation, disocclusion tests and measured target-device cost. Download size is not a GPU frame budget. Keep controllable virtual lighting now rather than switching the game's renderer for one effect.

https://ssgi-webgpu-demo.vercel.app/
https://threejs.org/docs/pages/SSGINode.html

## Gestures

The exact supplied CodeSandbox short link could not be inspected. The official use-gesture documentation has React and vanilla packages and drag, move, hover, scroll, wheel and pinch handling. Its pinch description concerns touch pointers and trackpad gestures. This does not itself translate WebXR joint poses into hand pinches or guarantee controller selection behavior.

Decision: reuse the concept of one coherent gesture state, not an untested replacement of Prism's XR handlers. A future adapter must arbitrate hover, press, drag, release and cancellation per input source. Dragging a panel must not also shoot; tracking loss, XR exit and cancellation must release ownership. Preserve keyboard/gamepad alternatives and browser accessibility; do not globally suppress browser gestures merely to imitate a demo. FlexSurface supplies geometry/picking only, not this gesture adapter.

https://use-gesture.netlify.app/docs/gestures/
https://t.co/6YRsu2lX7T

## WebGPU glass

The unlinked upcoming-glass quotation has a plausible matching current project, ektogamat/webgpu-mesh-transmission-material. The match is not proof that this is the exact announcement. Its own README describes TSL/node-material volume refraction and a rendered-scene backdrop pipeline, including optional backside rendering. The README's license section asks users to check the license; the reviewed root listing and LICENSE fetch did not establish a redistribution grant. No source is copied or licensed by inference.

Decision: reference only pending exact identification/license and separate backend testing. The virtual backdrop in a refractive material is not automatically the Quest passthrough image. Additional scene passes, transparent sorting, per-eye sampling and text contrast must be tested. A glass-like frame around an opaque readable label is a safer art direction than refracting the health text itself. Never claim transparent alpha is physical room refraction. Changing sample count can introduce compiled variants in the referenced implementation; loading and first-use cost remain relevant.

https://github.com/ektogamat/webgpu-mesh-transmission-material

## HTML-in-Canvas and three-html-render

The repository and its LICENSE were inspected: MIT, copyright2025 repalash. Its README advertises native acceleration when available and an SVG foreignObject rasterization fallback. It also lists concrete limits: textarea internal scrolling is not reflected, contenteditable caret/selection is absent, stylesheets added later need invalidation, and some form/CSS rendering differs. Thus the headline about all browsers is an author support claim, not our exhaustive validation result. Conference attendance and the exact tweet timeline were not verified.

The source includes AR/VR examples. The inspected VR example uses InteractiveGroup.listenToXRControllerEvents and an explicit mesh-UV-to-DOM mouse-event bridge; we should not claim the project is desktop-only. The separately inspected RaycastInteractionManager listens to canvas pointer events and repositions a DOM overlay. These are distinct paths; installing the library alone does not prove Quest controller/hand input, trusted browser actions, scrolling and keyboard behavior all work in our game.

The WICG HTML-in-Canvas document remains a developing proposal. Its current explainer and the library's older API surface are not identical; pin and feature-detect the actual contract rather than assume a universal browser API. A polyfill painting text does not replace accessibility, input ownership or performance tests.

Decision: high-value isolated candidate for rich spatial settings, help and text forms. Prototype a volume slider, scrolling help and a noncritical text field with mouse, gamepad, controller and hand-menu input before considering any Rotunda replacement. Require strict changed-content-only texture updates, working focus/cancel/exit, preserved paused state and no native-selection/gunshot leakage. Keep the numeric health/status path simple. Do not load global DOM/prototype patches into the production game as an unreviewed side effect.

https://github.com/repalash/three-html-render
https://github.com/repalash/three-html-render/blob/master/LICENSE
https://github.com/repalash/three-html-render/blob/master/src/raycastInteractionManager.ts
https://github.com/repalash/three-html-render/blob/master/examples/webxr-vr.html
https://repalash.com/three-html-render/
https://wicg.github.io/html-in-canvas/

## Selected work and next boundary

FlexSurface0.1.0 is saved first, library-only. It can support curved cards, folding decorative banners and flexible panels while keeping actual raycast geometry aligned. The test fixture uses an authored canvas texture; it is not HTML rendering. All current AR Tide/Friendly Current game code remains unchanged. Current islands, clouds and grass must not be re-created as if absent.

Before game integration, validate rendered front/back texels and pointer hits, then choose a small optional decoration or a noncritical panel. Never animate an actionable menu under a held pointer without an explicit interaction policy. A later HTML adapter and gesture-owner state are separate modules; full SSGI and transmission belong behind compatibility and measured-performance gates. Save exact source/public failures as well as successes in FUTURE-DIRECTION.md.
