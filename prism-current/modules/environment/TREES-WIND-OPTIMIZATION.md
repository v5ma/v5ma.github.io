# Trees 0.1.3 / shared wind and preserved native evidence

The preceding Trees 0.1.2 checkpoint is 7fbc58f9a7c6460de4da895a3705e8664c1c0891. Run 35661403916 passed its entire source job: 305 Node tests, tree75/fire64/water37 object observations, and tree22/fire24/water13/interruption19/Rotunda73 native checks. Both normal Arcade chapters completed. Source artifact 10667308406 has SHA-256 7665bdcbf6a19b40d77d3aaa2c6c530c814414dd5ecf9b409b3fa573d3e654ce and was downloaded, extracted and inspected.

The independent public job matched all 112 expected files and passed fire24, water13 and interruption19. It did not pass the tree or full Rotunda suites. Artifact 10667539439 has SHA-256 22ce17b0209e78ba23fb210c56835b1e03d98d9b5247da242bba67c05ece154a. The tree trace records a 623.1ms renderer call around game time21.15s, with 42 draws, 61166 scene triangles and 18 programs, followed by the unchanged rendering-stall pause. The broader test reached17.57s without its first successful slice and timed out, while the game was still playing. Neither trace contains a captured shader or script error. These failed outcomes are retained, not relabeled as a public pass or a physical-device diagnosis.

The loading preparation was useful but did not remove all rendering cost. Version0.1.3 computes the wind phase once per tree per host frame instead of recalculating two trigonometric terms for every wood/leaf vertex in both normal and position paths. A fixed24-value uniform array is shared by the two forest materials and both stereo eyes. Each vertex reads its tree's value; the root-fixed quadratic bending and analytic normal derivative are otherwise unchanged. The same geometry, detail thresholds, tree count, placement, colors, wind amplitude and quality budgets remain. No frame threshold, input requirement, test resolution or game rule is reduced.

Actual-Three checks compare the shared amplitudes against the original pure wind function at multiple times. Local Node306 and tree83/fire64/water37 object checks pass. Those do not establish a speedup on Quest or a passing public run. The current native test also records whether its mouse input was held in any slow-render observation; it still only supplies ordinary input and cannot assign progress, score or actors. Subsequent exact source/public reports must determine the result of this optimization.

Three.js Uniform and Material documentation were consulted for the shared-uniform and shader-hook implementation. It retains the existing bundled r184 engine and imports no new dependency. The original LOD and geometry are preserved, and the remaining artistic/device work is still open.

https://threejs.org/docs/pages/Uniform.html
https://threejs.org/docs/pages/Material.html
