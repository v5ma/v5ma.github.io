# Currentworks / Pass 4 complete, host 0.11.3

The current live game is host0.11.3 with Water0.1.0, Fire0.1.3 and Trees0.1.3. This pass repairs redundant canvas resets and integrates a coherent visible riverbed, wet banks, stones, reeds and sky palette. It does not rebuild the three reusable modules or change combat, controls, soundtrack or scores.

Durable direct-master checkpoints are e79ac9bdcf4d2e9c67b4d1be497e1b67309f662e for the renderer-reset guard and 52b054d1a29411d5f1d302cbefb791aacb9eb89f for shoreline integration, diagnostics and native tests. The final closeout changes documentation/evidence only after that verified runtime. Concurrent Theology work was reconciled and preserved. No PR, staging branch, new workflow, private hub, portal or sibling-game edit was created.

## Exact source and public results

Run35675405642 passed both source and public jobs. Downloaded source artifact10672878864 has SHA-2568f8711f96de761265165c00f9e0c120844dfef69158dce3b9f781166a0b40757. Public artifact10673266083 has SHA-256652914de17f94a8a3d4397826e8474b2dba94aa9d923d25a2567af2d8588e73e. Both were extracted and inspected. All117 expected public files match52b054d1, and eleven selected runtime hashes independently match the locally tested files.

Each job passed162 native checks: renderer policy11, trees22, fire24, water13, interruption19 and Rotunda73, with no captured shader/script errors. Both full Arcade chapters completed through ordinary inputs in each broader journey. Source models322 and coherence19/tree83/fire64/water37 object checks passed. Object preparation collaborators are not actual GPU measurements. Real1440x1000 source/public entry captures were inspected separately from reduced software-rendered gameplay.

The negative test replaces only the old sync setter in an isolated context. Four actual preference changes trigger four same-size resize calls there, versus zero in the fixed game. Both buffers remain320x250. Starting, six blade swaps, driver actions and pause add no redundant resize calls; genuine Light/Balanced changes still set.7 and1. This confirms elimination of redundant resets, not a guaranteed FPS improvement or the sole cause of every historical pause.

The first repair-only checkpoint's source run still captured a438.5ms renderer call and pause at21.0897s. Its public counterpart passed. Those artifacts and all earlier Pass3 failures remain recorded in PUBLIC-PASS4.json and earlier receipts. The final accepted source/public runs did not repeat those failures; physical-device reliability is still separately unverified. No stall threshold, scoring rule, input requirement or test resolution was weakened.

## Visual and ownership changes

Visible ground and water optical depth now share RiverArt.bankHeight. Wet darkening and roughness follow the actual tide. Twenty-four irregular rocks and eighty narrow geometric reed leaves replace the former block/sphere/cone bank assembly. Existing tree roots move only vertically onto the matching.96-height plateau; seeds, shapes, count, horizontal placement and central clearance remain. The brightened sky and shore borrow the existing water data texture, without new textures or reflection passes.

Bank triangles fell from10944 to7536, while bank draws increased from one to three and shading gained detail. Do not present that tradeoff as a measured hardware speedup. AR keeps the solid shore/forest hidden and preserves saved water opacity. Mothership keeps its space scene. All48 original runtime/entry files were compared; only index.html, app.js, art.js and bank-trees.js differ. Core, audio, XR/Rotunda, all three module implementations and retained games remain byte-identical.

## Resume for Pass5

Read PASS4.md, PASS4-COHERENCE.md, PUBLIC-PASS4.json and current AGENTS.md, then fetch fresh master. Do not reapply an old archive or rewrite the modules. The test-only frame tracer is saved in tests/frame-trace.js and can observe bounded tick/art/menu/render/input/pause/resize/long-task history without owning the game clock or creating inputs. CPU submission time is not GPU completion.

Prioritize owner Quest feedback and ordinary-resolution frame-time evidence before increasing cost. Continue fuller organic crowns, bark, more irregular flame turbulence and smoke, and gentle shoreline transitions. The accepted screenshot remains stylized; it does not match the reference demos' photorealism. Check analytical sky/light orientation after rotated recentering when refining reflection coherence. Also add a zero-time paused-animation fixture before changing app.js's existing time fallback; that code-review edge case is not covered by a nonzero-time pause result.

The fifth pass is still useful, and physical/device findings may require more. Blade-color switching, either-blade base rewards, color-match bonuses and gameplay explosion-danger feedback remain separate unfinished mechanics. No new soundtrack, fluid solver, collision trees, hand-only combat or persistent unfinished-battle save is implied by this graphics pass.
