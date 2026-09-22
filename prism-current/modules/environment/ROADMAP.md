# Currentworks continuation / Passes1-4 saved

The user authorized five or more iterative passes and periodic durable checkpoints. This plan does not schedule background work. Save usable changes directly to fresh master without PRs or staging branches, preserving concurrent work, ownership, APIs and evidence.

## Completed module foundations

Pass1 implemented Water0.1.0: wave geometry/normals, generated detail, authored-bed depth, Fresnel sky approximation, foam, wakes/splashes, query and cleanup. It observes real game events without changing gameplay. PUBLIC-PASS1.json retains its original evidence.

Pass2 implemented Fire0.1.3: bounded burst/jet/impact volumes, smoke, embers, lights, pause/reset/disposal and loading preparation. Prism uses destruction bursts, not a new flamethrower. FIRE.md and PUBLIC-PASS2.json retain the original API, compatibility limits and accepted results.

Pass3 implemented Trees0.1.3: seeded palms/alders/willows, shared-skeleton prebuilt detail levels, actual leaf geometry, shared root-fixed wind, preparation and cleanup. Eight trees frame the river outside the action corridor and stay hidden in AR/Mothership. TREES.md and PUBLIC-PASS3.json retain source/public results and failed attempts. No external tree code/assets were copied.

## Pass4 delivered

Host0.11.3 avoids redundant same-ratio canvas resets. Its native negative/fixed test proves the old repeated resize calls and their removal while preserving actual quality changes and drawing resolution. The existing0.35-second safeguard and all gameplay requirements remain.

The new RiverArt integration shares one bed function between water optics and visible banks, tracks wet shading with the real tide, grounds the existing trees, and replaces old block/cone scenery with sloped ground, irregular stones and narrow reeds. It reuses the water texture for bank detail and a compatible sky palette. Module source/APIs, combat, saves, soundtrack and XR/Rotunda logic remain unchanged.

Runtime52b054d1 passed both source/public162-check journeys, both normal Arcade chapters, source322 models and117 public hashes. Exact results and preceding failures are in PUBLIC-PASS4.json. This is named automated evidence, not physical-device or photorealistic approval.

## Pass5: remaining polish and measured validation

Use owner Quest feedback and ordinary-resolution frame-time evidence before adding GPU cost. Reproduce residual input/timing issues with the saved bounded diagnostics; CPU render submission is not GPU completion. Keep every real first-slice, first-destruction, pause, save and session test. Do not remove guards or auto-resume tests to fabricate success.

Refine fuller organic crowns, bark, gradual bank transitions, less periodic flame shapes and smoke breakup, while retaining corridor visibility and unobstructed AR. Revalidate sky/light coordinates after translated or rotated recentering when improving analytical reflection coherence. Add a zero-time paused-animation fixture before deciding whether to change the existing host time fallback. These are next checks, not already delivered fixes.

Repeat both battles and the full screen/AR/VR journey: sound, placement, opacity, pause, exit/re-entry, visibility/input loss and records. Check resources/disposal and named-device frame-time percentiles, heat and stereo comfort. Screenshots and low-resolution emulation do not establish sustained performance or fun.

More passes may be warranted by real bugs, weaker visuals or physical-device results. New blade scoring/color rules, expanded hazard feedback, full hand-only combat, new music, WebGPU and FFT fluid simulation are separate work, not silently included by decorative upgrades. Preserve private hub/brief boundaries and sibling projects.
