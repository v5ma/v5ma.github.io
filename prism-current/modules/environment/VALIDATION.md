# Currentworks Water / first-pass validation log

The standalone source was saved as d5e716cd902a62830c3080d0387166cc09eeddb8, then integrated into the current River art as f0a2a9cccfff14e9372b05108edd53cbce0fb59b. The second commit preserved the concurrent Neighborhood Missions work rather than replacing the repository snapshot. These are direct-master checkpoints, not PRs or staging branches.

## Recovered-source checks

The recovered local checkout passed 266 Node tests: 250 existing model/lifecycle tests plus 16 new water tests. It did not include the three later integration-audit tests, so 266 must not be presented as the full current-master test count. The actual bundled Three.js r184 object suite passed 37 checks for creation, configuration, CPU sampling, deterministic data, body observation, reset, allocation limits, disposal and the real RiverArt adapter's nonmutation of core state.

A separate Mesa llvmpipe OpenGL ES 3.2 fixture compiled and linked the actual exported water vertex/fragment programs, rendered one river view and compared 9457 GPU-displaced vertices with the CPU evaluator. Maximum observed absolute deviation was 6.9926859751490156e-6 metres. It is an isolated shader fixture, not a screenshot of the live game or a physical headset test. The local Chromium WebGL2 probe returned null.

## First CI failure: repository package scope

Run 35638932017 on integration commit f0a2a9cc failed the source invariant step before its browser checks. Its artifact 10656784175, SHA-256 8c9f59e1446c83d5eb9744b522c76581892b8059b47149119b229ae09d2a9708, was downloaded and inspected. The exact source archive and all checked runtime hashes match the intended code. Errors included PrismCore.TRACKS is not iterable and absent CommonJS model exports.

The repository root package.json declares type: module for a separate Cloudflare project. GitHub's checkout includes that file, while the prior standalone archive did not. Reproducing that parent package setting against the downloaded exact source produced the same 22 passing / 161 failing tests. The failure therefore exposed a package-scope collision, not evidence of 161 new gameplay regressions or a reason to delete their tests.

A package.json inside prism-current now explicitly sets type: commonjs, matching the existing classic/UMD scripts and .cjs test suite. No root package or sibling project is modified. Browser classic-script loading is unchanged. The separately provided .mjs water facade remains an ES module, and its identity test still passes. With the root type: module present and this Prism-local boundary, all 269 tests from the exact downloaded source pass. No assertion or scoring/control rule was weakened.

## Remaining gates

Inspect the updated commit's existing read-only Rotunda source and public jobs. The native water suite must compile the actual shaders, play a complete ordinary-input battle, observe boat wakes, pause/resume, switch chapters, and exercise the real AR opacity control. The original Rotunda and interruption journeys remain independently required. Compare the served files with committed hashes before claiming a live update.

Performance at normal resolution, physical Quest/Xbox/touch, stereo appearance, artistic quality and player feedback remain open. Fire and tree modules are subsequent passes; neither is claimed by this water source checkpoint. Later failures and final source/public receipts should be appended rather than rewriting this original trace as a passing run.
