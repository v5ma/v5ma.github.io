# Tideglass Aquatic Center / v0.10.0

Tideglass is an optional indoor zone in Neighborhood Missions. It shares the existing renderer, original save slot, wallet and application; it is not a separate spinoff. Enter the civic building just behind the original depot, or choose Menu / Visit Tideglass Aquatic Center for an explicit transit trip.

## Three water missions

Through the looking water: seven rings across the shallow and deep ends. Targets have real depths; swimming above a deep ring does not count. The clock measures a personal best, not a failure deadline. First completion pays 300 credits.

The things we leave behind: recover four submerged keepsakes with X / E, then hand them to the poolside lost-and-found locker. Returning to the deck keeps collected items. First completion pays 360 credits only after the handoff.

A clearer current: swim to three circulation valves and align their dials with the marked settings. Wrong settings and remote interactions cannot award progress. This is a game puzzle, not real pool-maintenance instruction. First completion pays 380 credits.

Completed records and best times persist. Replays pay 55 percent of the first reward. Replacing an unfinished water mission requires confirmation. The pending city contract is separate and does not advance while swimming.

## Swim controls and exits

Xbox: left stick moves horizontally, right stick looks, A rises, B dives, RT swims faster, LT slows, X interacts, Y returns safely to the deck, RB switches first-person/chase camera, and R3 recenters. View or D-pad down opens the water-mission board. Menu pauses; B returns from every pool dialog. Axis inversion and sensitivity reuse the existing camera preferences.

Keyboard: WASD/arrows moves, Space rises, Ctrl/B dives, Shift swims faster, E interacts, F returns to the deck, V changes view, C recenters, and M/J opens water missions. Touch retains the movement stick and adds Rise, Dive, Missions and Deck controls.

The main ladder near the shallow end is usable with X. Y/deck recovery remains available anywhere. Return to the city from the marked exit or the pause/mission menu. There is no oxygen countdown, stamina depletion or drowning penalty. City speed and traction are unchanged. Swimming slows when movement input is released; road cruising retains its own behavior.

## Water rendering

The pool has real sloped tiled geometry, procedural grout and tile variation, animated caustic-like light patterns, wave normals, capped interaction ripples, depth tint, Fresnel highlights and underwater fog. Caustics and water absorption are artistic approximations, not a fluid or path-traced light solver.

Balanced/High water uses two bounded local room captures: refraction no larger than 768 by 512 pixels, and a 384 by 384 planar reflection. Only the indoor pool scene is drawn; the city is not rendered behind it. These are real scene captures, not ray tracing. The two render targets are reused and released on exit, graphics recovery or switching to lightweight mode. The renderer restores render-target, clipping, shadow-update and exposure state after capture.

Low graphics and the independently saved Lightweight pool water option use transparent water without extra captures. Reduce motion freezes waves, moving tile-light patterns and interaction ripples. The pool art and swimmer are original stylized geometry; this release does not claim finished AAA character modeling.

## Audio and saves

Pool ambience and splash, pickup, valve and completion cues use the existing music/effects/ambience buses and the same original soundtrack transport. Underwater filtering reduces high-frequency sound while submerged. Outdoor tires, birds and rain do not keep playing inside the pool. Mute, quiet mix and pause still apply.

Only validated records, active mission steps and elapsed time are added to the original v1 save. Reload returns safely outside rather than spawning underwater; the water mission can be resumed. The city route, 102 city contracts, Homecoming and cosmetics are retained. No automatic telemetry is added.

## Acceptance and limits

Automated tests and screenshots belong in production/evidence/. Browser tests use actual WebGL rendering with synthetic standard Xbox input; they do not certify a physical Xbox controller or the user's GPU frame rate. The water journey should complete all three missions through real swim inputs without teleporting the swimmer to objectives.

This release is one indoor aquatic center. It does not add open-ocean swimming, boats, flood missions, a fluid simulator or a horror/VHS mode. The user's reference images inspired the tiled basin and underwater atmosphere; no game art was copied from those screenshots.

## Technical references

Three.js WebGLRenderer: https://threejs.org/docs/pages/WebGLRenderer.html

Three.js WebGLRenderTarget: https://threejs.org/docs/pages/WebGLRenderTarget.html

Three.js RenderTarget lifecycle: https://threejs.org/docs/pages/RenderTarget.html

MDN WebGL best practices: https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices
