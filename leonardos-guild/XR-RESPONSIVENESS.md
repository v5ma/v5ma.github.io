Leo's Guild XR responsiveness / September 22, 2026

Scope and hypothesis

XR-RESPONSIVENESS-08 advances the existing NEXT01/NEXT02/F03/P02 obligations. The owner's physical VR freeze remains an open report. This bounded change removes reproduced redundant UI and paused-scene work and fixes visible-menu/hit-target disagreement. It does not claim to solve every GPU hang or increase physical Quest frame rate. Full Vinci remains the normal game; Waterwheel Quarter stays an optional archive.

Source and observed failures

The baseline is game commit c1316b45bad303edd9b18dfc99d85ee5fe459878, game tree e2c685cd37ece01f8760f737b712b74ae07b7feb. All 390 archived source hashes were verified before editing; the current repository's path-filtered history still identifies this game baseline. Concurrent sibling commits are retained through a fresh non-forced master update.

In xr-panel.mjs, the toolbar used an empty hover key as both a valid neutral state and an uninitialized sentinel. It re-uploaded an unchanged 1536 by 384 texture on every neutral frame. The original actual-module fixture added 180 texture-version updates in 180 repeated neutral frames. A distinct uninitialized sentinel now gives one initial paint and zero redundant neutral-frame updates.

The panel previously rebuilt its menu, cloned the entire dialog and collected choices for each ray hit and again for drawing. Two controller rays plus one paint call at simulated 72 Hz caused 432 dialog clones in a 2-second fixture; the repaired fixture performs 18. The bounded model cache shares that work across rays and paint, refreshes property-only changes on the next poll after its 100 ms interval, and invalidates immediately for root, focus, page and observed DOM changes. MutationObserver records are drained synchronously so same-task UI actions do not wait for a later observer callback. Hand and controller raycasting still runs every frame, and invocation uses the existing real DOM handler, not a duplicate quest/menu implementation.

More importantly, the old panel could rebuild its hit targets for a newly focused page while its 100 ms paint throttle left the previous page visible. The next valid panel draw now paints the changed model immediately. This applies to focus/page transitions, replacement dialogs and changed enabled controls or descriptions. Periodic refresh remains for properties and map canvases that do not emit DOM mutations. Disposal disconnects the observer.

The existing unchanged-paused-scene gate was explicitly bypassed whenever XR was presenting. It now also avoids repeating game-scene camera, rig and decorative updates while paused. Active simulation, headset input, spatial transforms, controller/hand presentation and the per-eye compositor draw remain at their existing cadence. XR entry is part of the invalidation signature so the retained theatre target cannot inherit an uninitialized image. Real state changes, art loading, resize, graphics settings and snap updates invalidate the cache. Read-only scene-update/skip and panel-rebuild/paint counters support follow-up profiling.

Preservation

No movement, interaction mapping, quests, collision, combat, resource balance, rewards, audio preference, geometry, asset, save namespace or version-2 save format is changed. The field desk remains in the scene, stationary between summon and dismissal, with existing wrist/floor status. No engine migration, private hub, extra travel portal, replacement demo, new PR, branch or workflow is introduced.

Evidence gates

The local suite passes 437 source/model/input/scene-graph tests, including 10 new tests, and 14 design checks. Syntax checks and the changed Python browser driver compile. tests/xr-menu-workload-before.txt retains the first six concrete pre-fix failing traces; the complete original TAP includes eight failures and two passes, with the extra failures covering new instrumentation expectations. This is CPU/DOM-fixture evidence, not a hardware frame-rate benchmark.

The existing xr-startup-browser.py is extended without removing its original graphics-loss, timeout, movement, exit, re-entry or stereo-pixel assertions. It now pauses with actual keyboard input, changes only synthetic headset poses, checks that cached scene work coexists with advancing per-eye rendering, verifies a stationary desk and unchanged player state, and resumes through the tracked right B button before moving again. The existing dedicated compositor workflow already runs this driver on both attachment backends; no workflow edit is needed. Fresh results and public bytes must be read independently before claiming success.

Previous run 35692455515 passed both startup-recovery jobs, but its longer native and public menu journeys timed out. Public artifact 10679921149 (SHA-256 a1802d525ef8267759297a4d6909753f384d471e28d9c7e6704eff143ade5edc) retains 94 partial checks, no captured errors, and a partial fourth presentation. That is not a complete pass or proof of the user's freeze. Current local Chromium navigation is again blocked before game load by ERR_BLOCKED_BY_ADMINISTRATOR; it is not counted as browser verification.

Remaining work

The large geometry/draw-call workload, physical Quest frame time, exact reported freeze, end-to-end hand/controller ergonomics, aiming feedback and listening comfort remain open. Do not use the new work counters as a replacement for GPU/hardware profiling. Verify the longer full-Vinci menus and all public modes without manufacturing player state or weakening assertions. For a rollback, restore only this patch's runtime files from the named baseline while retaining later unrelated changes; do not reset master or erase saves.
