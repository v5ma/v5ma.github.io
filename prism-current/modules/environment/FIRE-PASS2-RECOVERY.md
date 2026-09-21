# Fire 0.1.2 / interrupted-pass recovery

Recovered master 2cef12599edee6ec22455064e495e282e0e6c2ac rather than rebuilding or overwriting Pass 2. Independent Fire was already saved at 35fd5037, integrated at 0f516f42, and palette/preparation-refined at 2cef1259. This recovery preserves Water 0.1.0, app 0.11.2, all combat/input/audio/save code and the current three-dimensional flame palette.

## Observed prior results

Run 35649104228's source artifact 10661941498 has SHA-256 97865703512e9332731ab5901b80b2925e2c337baeb7c4f3ed4dd260e4af5b95. Its source manifest was checked after extraction. Models, fire 21, water 13 and interruption 19 passed. Both normal Arcade battles completed. The broader menu journey reached its narrow-screen checks and then observed control 8 outside the updated projection. No captured JavaScript or shader errors were reported.

The public artifact 10661886724 has SHA-256 932211e539a536f279ac83663a67d9481442b314a015ecb87f0d86eb233552d3. The public files matched. Its water 13, interruption 19 and full Rotunda 73 suites passed, but its dedicated fire test observed a real rendering-stall pause immediately after the first destruction despite prepared=true. A texture upload plus compileAsync therefore did not consistently eliminate first-use stalls. This trace is retained; it is not relabeled a green fire run or a physical Quest measurement.

## Narrow repair

Fire 0.1.2 keeps the same flame GLSL, densities, quality budgets and event adapter. Preparation now exercises actual vertex/instance uploads and a small draw in a disposable 24x24 target before returning ready. It uses the host's existing renderer, temporarily disables XR routing for the scratch draw, completes the one-time loading work, restores target/face/mip/viewport/scissor/auto-clear/XR state, and immediately disposes the scratch target. Visible host light counts, fog and environment references are retained for shader selection without reparenting the host objects. No target or extra render pass survives into gameplay. Pool visibility, effects, coordinates, pausable clock and particle data are restored. An error rejects readiness and allows an explicit retry; it does not silently start the music.

The actual GPU first-use contribution is a diagnosis to test, not a proven cause of every possible frame stall. The game's 0.35-second safeguard, effect budgets, test resolution, actual first-destruction assertion, and gameplay rules are unchanged. A later driver, scheduling or rendering failure must still be recorded.

The narrow-screen test now awaits the original all-controls-visible projection condition rather than sleeping 400ms between asynchronous camera-aspect and panel-fit updates. It retains each original control assertion and an 8-second timeout; it does not change placement, resize the camera manually or assign any UI/game state.

## Recovery checks

All 289 local Node tests pass. All 49 actual bundled-Three object/lifecycle checks pass, including 20 warmup state/ownership observations using controlled renderer collaborators. Those collaborators are explicitly not a GPU draw or headset test. This container's WebGL2 probe returned null, so actual-renderer and public acceptance remain the existing read-only GitHub workflow's responsibility.

Next inspect the resulting exact source/public artifacts, the five standalone fire fixtures and an actual-game screenshot. Record failures as well as passes. Update CHECKPOINT.md and the reusable API notes before ending this pass. Trees remain the next separately requested module; this work does not add a flamethrower weapon, blast-damage radius, private hub code, portals or changes to other games.

Reference consulted during this recovery: the official Three.js WebGLRenderer documentation distinguishes program compilation, texture initialization and rendering, and documents state getters/setters used for restoration. https://threejs.org/docs/pages/WebGLRenderer.html

## Output-variant correction / Fire 0.1.3

The 0.1.2 draw checkpoint is 39584e4aa3f83d3c73ce3d356928a8ea27c2c13e. Run 35653862867 reproduced the first-visible-burst stall in both source and public fire suites despite one completed scratch draw. Source artifact 10663776504 has SHA-256 950f3ef4eae6e12bdf014153c8bf586fcc02a674b6e539b942df0351c93d6540; public artifact 10663229798 has SHA-256 80933dd01a617c51a50278cd7fc6d397a16c17ca9e445bff5065d5b82b8abc73. Both were inspected. Water and the full 73-check Rotunda journey passed in both jobs. Source interruption passed 19; public interruption completed its nine AR checks, then encountered a VR startup rendering pause before its VR fault-injection checks. No script/shader errors were captured. None of these failures is labeled a pass.

The bundled Three.js r184 and its official WebGLPrograms source explicitly select different output color spaces and tone mapping for ordinary render targets versus canvas/XR output. Simply setting a scratch texture's colorSpace did not choose the display shader variant. Fire 0.1.3 now gives the disposable scratch target the matching output-policy tag and transfer setting for the current host destination. That internal r184 tag is rendering metadata only: XR routing remains disabled for this draw, no session is started, and the host framebuffer/state is restored unchanged. Standard linear offscreen hosts retain their linear policy.

The native fire test records the actual compiled program key after preparation and requires the first visible burst to use that same key. The first-destruction no-stall assertion remains mandatory. This tests the proposed cause rather than pretending a compile flag guarantees a smooth frame. Controlled object checks also cover canvas, XR-target and ordinary offscreen state restoration. All 289 Node tests and 64 object/lifecycle observations pass locally; the latter include controlled renderer collaborators, not real GPU execution.

Official source for the pinned behavior: https://raw.githubusercontent.com/mrdoob/three.js/r184/src/renderers/webgl/WebGLPrograms.js . See getParameters outputColorSpace and toneMapping selection. The resulting native/public run must still be checked before closing this issue. No budgets, first-use assertion, stall threshold, test drawing resolution, scoring or combat rules are changed by 0.1.3.
