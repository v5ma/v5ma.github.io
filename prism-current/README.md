# Prism Current / Coherence Pass 4 / 0.11.3

The current application is0.11.3 with reusable Water0.1.0, Fire0.1.3 and Trees0.1.3. The normal index.html still opens River Prism and its in-scene Rotunda. Duck Armada and Mothership Channel remain the complete existing battles, not replaced by graphics demonstrations.

Pass4 connects the river and its surroundings. Sloped banks, irregular stones and narrow reed leaves replace the old blocky banks and cone reeds. The visible ground and water optical bed use one authored terrain function; wet shading follows the actual rising tide. The eight existing trees sit on matching dry ground, and the sky palette now agrees with the water's analytical sky approximation. AR hides solid bank/forest scenery and preserves saved opacity; Mothership retains space.

The reliability repair prevents same-ratio canvas resets during blade switches, preference changes, loading completion and pause synchronization. Real quality/device-scale changes still resize appropriately, and active XR presentation is protected from screen sizing. The existing rendering-stall safeguard remains unchanged.

The verified runtime is52b054d1a29411d5f1d302cbefb791aacb9eb89f. Both source and public jobs in run35675405642 passed all162 rendering/input checks, including both complete Arcade chapters. All117 expected public files matched. Source models322 and the actual Three object checks also passed. modules/environment/PUBLIC-PASS4.json preserves exact artifacts, the negative/fixed resize reproduction and earlier failures. These tests do not establish physical Quest/Xbox/touch approval or sustained hardware performance.

## Existing modules and play

Water retains geometric waves, surface detail, authored-depth coloring, foam, boat wakes and destruction splashes. Fire retains actual-event flame bursts, smoke, embers and warm lighting without new damage rules or weapons. Trees remain seeded palm/alder/willow geometry with three prebuilt detail levels, shared root-fixed wind and loading preparation. They are stylized scenery, not collision objects or photorealistic assets.

All three modules are independently reusable through their .js and .mjs entries. Start at modules/environment/README.md, FIRE.md, TREES.md and CHECKPOINT.md. Supply the existing Three.js, renderer and pausable host clock. Fire and trees prepare during cancellable loading before audio; reset/dispose must not take ownership of another module or the game. This pass changes their host integration, not the module sources or APIs.

Chapter cards offer supported AR, VR and screen play directly. B/Y pauses or resumes in XR. The Rotunda rises when summoned, stows during combat and stays world-anchored when placed. Point/trigger, hand pinch, or thumbstick/A-X operates its controls. A paused XR stick click resets placement. Score, hull and combo use a controller display or optional floor display, not a head-mounted dashboard.

Screen play retains rendered controls, keyboard and standard-controller navigation. P or Menu pauses. F2 and Accessible text controls remain the semantic HTML alternative. Ordinary movement does not trigger the former arbitrary position restriction; genuine tracking and visibility interruptions still pause.

Exiting XR ends the actual session while retaining a paused encounter in page memory. Re-enter its matching AR/VR mode and explicitly resume. Closing or reloading the page does not preserve unfinished battles. Classic rhythm at rhythm.html retains five tracks, lessons and Practice Lab; Floodgate Recovery remains at water-mission/index.html. Combat, soundtrack, record formats and saved progress are preserved.

## Evidence and continuation

The full public entry and corresponding source image were visually inspected. The scene is more connected, but sparse crowns, simple terrain, analytical reflection and regular flame shapes remain polish limits. Neither a screenshot nor a low-resolution emulator certifies frame rates or enjoyment. Earlier source failures remain in versioned receipts even though this named source/public run passed.

Pass5 should use player/device feedback to refine crowns, bark, shore transitions and fire/smoke without obscuring the action or adding unmeasured cost. Reproduce any residual full-frame problem with the saved diagnostics before changing timing rules. AAA_CHECKLIST.md separates current implementation from recurring and physical acceptance.

Blade-color switching, either-blade base rewards, color-match bonuses, revised missile counterplay and gameplay explosion-radius feedback remain unfinished. Scenery does not substitute for these mechanics. No new soundtrack, full fluid simulation or hand-only combat is claimed.

Prism retains its CommonJS package scope for classic/UMD Node tests; water.mjs, fire.mjs and trees.mjs are explicit ES facades. Do not modify the unrelated root Cloudflare package. Existing dependency/license notices and historical documentation remain.

Write only to freshly reconciled master, without PRs, staging branches or force. Read AGENTS.md before editing. No private hub code, complete multi-game brief, portals, other games or saved-progress resets belong in this work.
