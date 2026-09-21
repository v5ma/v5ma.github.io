# Currentworks / Fire 0.1.3 continuation checkpoint

The standalone fire module and its Prism destruction adapter are saved. Water remains 0.1.0 and the host remains 0.11.2. Previous durable commits: 35fd5037 standalone fire, 0f516f42 integration, 2cef1259 palette/compile preparation, and 39584e4 loading-only draw plus regression checks. The present recovery corrects that draw's output shader policy without changing flame appearance, budgets, combat or controls.

Fire 0.1.3 warms its volume and instanced ember draw into a disposable 24x24 target before soundtrack playback. The target uses the current host's display or working-space shader policy. All renderer settings and effect state are restored; no target persists in gameplay and no game event is created. The native test now requires the first visible burst to use the same program key exercised during loading as well as retaining the no-stall assertion.

Read FIRE-PASS2-RECOVERY.md for the exact failed 0.1.1/0.1.2 artifacts and the pinned Three.js renderer finding. Source/public water and 73-check menu/battle journeys passed on 39584e4, but its fire checks failed. Source interruption passed; public interruption encountered a separate initial VR rendering pause. Do not call these jobs fully green or confuse an emulator with physical Quest testing.

Current local checks: 289 Node tests and 64 actual Three object/lifecycle observations. Warmup renderer collaborators are controlled tests, not real GPU draws. Inspect this direct commit's native/public artifacts for the actual shader-key, first-destruction, pause, quiet, standalone fixture, water, interruption and complete battle outcomes.

Preserve all existing Prism gameplay, score formats, audio, water and XR/Rotunda fixes. The module owns only its graphics resources; it takes the caller's Three.js namespace and pausable clock. Bursts are integrated; jet and impact APIs do not add an unrequested flamethrower or damage radius. Trees are the next separate module after acceptance. No PR, staging branch, new workflow, private hub material, portals or sibling-game changes.
