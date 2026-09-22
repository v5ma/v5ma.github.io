# Pass 4 / renderer-reset repair checkpoint

Start from d5aba52605cedbe97702c1867fa29008cab1876a. Water 0.1.0, Fire 0.1.3 and Trees 0.1.3 remain integrated. This first checkpoint changes only application synchronization, its cache/version and regression tests. Coherent visual refinements follow after the focused repair is saved.

The actual sync method called renderer.setPixelRatio on every blade switch, menu synchronization and end-of-loading update, even when the ratio was unchanged. Bundled Three r184 setPixelRatio unconditionally calls setSize; setSize assigns canvas width and height. The guard now queries the live renderer and calls the setter only for a real ratio change, and never while XR is presenting. Device-scale, renderer replacement and explicit quality changes retain their original values. This removes definite unnecessary canvas resets; it does not establish the cause of every previously observed frame gap.

Seven tests exercise the actual production sync method against observable renderer collaborators: repeated blade/menu updates, genuine quality changes, device scale, loading/pause/audio updates, XR presentation and renderer replacement. The 0.35-second safeguard, physical-input cut rules and immutable record identity are preserved. With the three existing module-index checks, 316 local tests pass. Local WebGL2 is unavailable, so this is not a native GPU or Quest result.

Next checkpoint adds bounded frame diagnostics and actual native negative/fixed input tests to the existing read-only verifier, then terrain/lighting refinements. Keep the earlier public and failed source receipts. No PR, branch, new workflow, private hub material or sibling-game edits. Save directly to fresh master.

Pinned implementation reference: https://raw.githubusercontent.com/mrdoob/three.js/r184/src/renderers/WebGLRenderer.js (setPixelRatio and setSize). Browser canvas dimension semantics: https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/width . These establish the API behavior, not a measured hardware improvement.
