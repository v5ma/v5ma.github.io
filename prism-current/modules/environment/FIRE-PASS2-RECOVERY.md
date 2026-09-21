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
