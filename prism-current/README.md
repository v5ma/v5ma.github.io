# Prism Current / Rotunda 0.11.1 + Currentworks Water 0.1.0

The current application is 0.11.1; unchanged Rotunda/XR components retain their 0.11.0 revision. The main river now uses the independently reusable Currentworks Water 0.1.0 module. Its geometric waves, surface detail, depth color, foam, boat wakes and destruction splashes are driven by the existing pausable host clock and real game observations. The saved AR-opacity and quiet/quality controls remain in the existing Rotunda. Read INTEGRATION-AUDIT.md for the branch reconciliation, source-versus-live distinction and features not yet implemented. AGENTS.md records the owner-required direct-master workflow.

The ordinary index.html entry now presents a scene-rendered pedestal with direct AR, VR and screen-play choices for Duck Armada and Mothership Channel. Read ROTUNDA.md for this release's controls, placement, movement, HUD, sound, opacity and paused-XR recovery behavior. The previous README and dependency/history notes are preserved at README-v0101.md.

B/Y pauses or resumes in XR. The rotunda rises when summoned and stows during battle. Point and trigger, hand pinch, or thumbstick/A-X selects its controls. Placement can be adjusted without moving the camera; a paused XR thumbstick click resets it. Score, hull and combo appear on a compact controller display or an optional floor display, not a head-mounted dashboard. The game no longer pauses merely for moving outside the former small positional rectangle; genuine tracking and visibility interruptions still pause.

In screen play, use the rendered buttons, keyboard navigation or an Xbox-style controller. P or Menu pauses. F2 and Controls / Accessible text controls retain semantic HTML controls as an alternative. Combat bindings and the existing soundtrack are unchanged. AR opacity and layout preferences have an isolated saved namespace.

Exit XR ends the actual session and leaves the current battle paused in memory. Re-enter the same AR/VR mode and explicitly resume to continue it. This does not promise persistence of an unfinished encounter after closing the browser.

The retained rhythm.html entry still provides the previous tracks, lessons and Practice Lab. Floodgate Recovery remains at water-mission/index.html. Existing score formats and completed progress are preserved. No other game, private hub implementation or portal system is included.

The active board is AAA_CHECKLIST.md. QA.md, INTERRUPTION-RECOVERY.md, ROTUNDA-QA.md and historical PR #205 distinguish exact-source tests, public-file verification and physical-device acceptance. User feedback remains authoritative even where emulated tests passed. This is a focused UI playtest release, not a claim that the whole attached brief, color-bonus scoring, new hazard rules, new music or every AAA gate has been implemented.

## Reusable environment modules / first pass

Start at [modules/environment/README.md](modules/environment/README.md) for the actual API and vanilla Three.js usage, [ROADMAP.md](modules/environment/ROADMAP.md) for the five-pass direction, and [CHECKPOINT.md](modules/environment/CHECKPOINT.md) plus [VALIDATION.md](modules/environment/VALIDATION.md) for durable source and verification state. Water accepts the caller's Three.js and does not own input, the renderer, camera, saves or the simulation loop. Both a classic script and an ES-module entry are provided.

River, lagoon and storm are construction presets in the reusable module; they are not three new playable chapters. The main game uses river. Sky reflection and authored-bed refraction are approximations, not a reflected copy of the scene or real room, and no FFT ocean or physical fluid solver is claimed. The original soundtrack, combat, menus and record formats are unchanged. Fire and tree modules are the next separate passes, not delivered features of this water pass.

Prism now declares its own CommonJS package scope for Node tests so the unrelated root Cloudflare project's ES-module setting does not reinterpret these classic/UMD scripts. Browser loading is unchanged, and water.mjs remains the explicit ES-module facade. Do not change the repository root package to repair a game-local test.
