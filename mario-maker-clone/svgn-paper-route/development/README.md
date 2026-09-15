# Sky Cycle current continuation

The v0.21.0 candidate is described in `PORTAL-NETWORK-0.21.md` and `verification/portal-network-0.21.json`. Its publication status is controlled by that receipt, not inferred from a branch commit. The previous v0.20 state and production history remain below.

The Portal Network implementation now resolves catalog destinations by stable IDs, preserves Tideglass 01, provides destination signatures, protects drafts and explicit new-run travel, and retains nested controller focus. The courier adds analytic pedal/grip contacts without modifying physics. A seated stereo XR layer provides tracked-controller and native hand-select UI. Physical Quest 3/Xbox, comfort, performance and full editor qualification remain open.

After accepted publication, continue the bounded water/audio sensory pass, then chapter quality. Before increasing scene detail, prioritize physical Quest 3 validation of both input modes and XR readability/performance. Do not claim the overall AAA milestones are complete.

---

# Sky Cycle development: start here

This folder is the persistent handoff for continuing the existing Sky Cycle at `mario-maker-clone/svgn-paper-route/`. A future chat or developer should begin with `RESUME-HERE.md`, then consult the canonical `AAA-ROADMAP.md`, the latest version note, and its verification receipt before changing runtime code.

## Current live release

Sky Cycle is currently v0.20.0, build `sky-cycle-tideglass-2026.09.13`. Tideglass Baths is the newest playable destination. Direct destination entry is available at:

`https://v5ma.github.io/mario-maker-clone/svgn-paper-route/?destination=tideglass-baths`

The tested runtime was commit `9cb7afe8e82854be5681f29dabd41d59185dc41d`. The release was merged by PR 143, merge commit `ccbec6ec6cd3dd0eb85d789482da75882e51af1b`. The publication receipt in `verification/tideglass-0.20.json` records that all ten owned public runtime files matched the accepted source after deployment.

## Read in this order

1. `RESUME-HERE.md` — concise current state, invariants, known integration traps, next-upgrade queue, and release checklist.
2. `AAA-ROADMAP.md` — canonical long-range path toward AAA-quality production.
3. `TIDEGLASS-0.20.md` — newest playable destination and current release boundaries.
4. `verification/tideglass-0.20.json` — exact commits, test runs, artifacts, publication evidence and open qualification gates.
5. `LUMINOUS-0.19.md` and its verification receipt — current shader/material architecture and graphics controls.
6. `SUNRISE-0.18.md` and its verification receipt — first reference chapter, Market Pocket Park, route guidance and controller journal behavior.
7. `ROUTE-COMPASS-0.17.md` and `FLIGHT-DECK-0.16.md` — exploration, career records, controller menus and save boundaries.
8. `GITHUB-RELEASE-PROCESS.md` — mandatory branch/test/merge/publish/live-verification process.

## Non-negotiable project rules

- Upgrade the existing Sky Cycle. Do not replace it with an unrelated prototype.
- Preserve existing saved progress, authored routes, Workshop drafts, music, physics and player-facing controls unless an upgrade explicitly and safely migrates them.
- Ordinary gameplay and UI should be fully usable with an Xbox-style controller; do not require grabbing the mouse merely to close dialogs or continue the normal loop.
- Every accepted upgrade should be committed, merged and published. Do not stop at “prepared,” “candidate,” “committed on a branch,” or “not yet published” when release access is available.
- A merge is not proof of publication. Verify the public runtime against the merged source before calling a release live.
- Native acceptance must use normal controls and the real win/progression path. Do not force wins, teleport the rider, assign scores, or mutate application state to make a failed test pass.
- Retain failed evidence and describe the fix. Do not erase the path by which a candidate failed.
- Keep tests, captures and performance claims accurately scoped. Software-rendered CI is useful acceptance evidence but is not physical Xbox, mobile-device, native-WebGPU or hardware-performance certification.

## Current design direction

The recent visual direction combines the momentum-driven delivery game with richer environmental destinations. The supplied pool references established a useful water-destination language: muted aqua/teal water, tiled walls and floors, chrome ladders, wet ceramic reflections, soft haze, restrained caustic-style highlights, and a calm/eerie liminal indoor-pool atmosphere. Tideglass implements that direction without applying a full-screen VHS filter or turning Sky Cycle into a first-person swimming game.

Water destinations belong to the portal system as distinct biomes. Tideglass Baths is Portal Destination 01. Future destinations should remain recognizable before entry through destination-specific portal signatures, but should be added one polished playable destination at a time rather than as a large set of unfinished scenes.

The portal/water concepts discussed but not yet selected for production include a rooftop infinity pool, flooded maintenance/station corridors, a subterranean cistern/reservoir, and a canal-focused destination. These are proposals, not committed levels. Swimming and underwater locomotion are also not part of the current game; adding them would be a separate gameplay decision rather than an assumed extension of Tideglass.

## Where to continue

The highest-value continuation is the prioritized queue in `RESUME-HERE.md`. The current recommended choice is either Portal Network v0.21, which generalizes the destination atlas and portal signatures around Tideglass, or an audio/sensory pass that gives Tideglass and the existing districts more distinct material and water soundscapes without changing physics. Keep the long-range Milestones B through H in `AAA-ROADMAP.md` open until their actual gates are met.
