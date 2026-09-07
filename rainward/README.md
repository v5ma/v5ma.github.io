# Rainward — The Floodgate

An original third-person survival-stealth browser prototype, developed as a separate project in `rainward/`.

The public demo uses original procedural architecture, characters, sounds and mission text. It does not reproduce commercial game assets, characters, music or scripts. No private repository or unpublished narrative is read, bundled or linked by this project.

The first chapter features standing/crouching/prone movement, an over-the-shoulder camera, cover and grass concealment, patrol sight and hearing, distractions, finite ammunition, crafting choices, two scavenging objectives and an extraction point. Combat is stylized and non-gory. A complete route can finish without killing enemies.

Keyboard, touch and standard gamepad controls are included. Physical-controller acceptance remains separate from browser emulation. WebXR, multiplayer, paid accounts, cinematic story production and a general level editor are not implemented in this prototype.

Run a static server at the repository root and open `rainward/index.html`. No build step, package installation, external API or credentials are required. The Three.js renderer is vendored with its original license.

Validation and publication status will be recorded with the release. Model fixtures and simulated inputs are not a certification of physical devices, performance, fun or production quality.

## v0.2 — Read the district

V (or standard-gamepad D-pad right) swaps camera shoulder. A conservative camera boom reserves clearance around its near plane and clips after smoothing; it cannot deliberately force a minimum distance through a wall. Movement accelerates and stops gradually, sprint exhaustion has a recovery threshold, and vaults check the whole ground corridor rather than only the destination. Crouched dodges are refused inside a prone-only gap.

Enemy searches now sweep traversable locations around their last seen/heard clue and eventually return to patrol. They do not retarget to a hidden player. A new sightline starts a visible attack windup, so breaking sight or deploying smoke interrupts it. Nearby callout captions, noise and concealment readouts, and sightline-only threat arcs explain what is happening.

Changes stay in this project. Version 1 shelter saves remain compatible. Keyboard, touch and emulated standard gamepad tests are separate from physical-device acceptance. WebXR and multiplayer remain unimplemented.

Native regression covers the complete no-kill chapter, UI, controller input and the new camera/feedback. Read-only source manifests and publication verification are the release authority; see the scoped pull request and its Actions receipts.


## v0.3 — The Drowned Conservatory (release candidate)

This update retains the original district and adds a second selectable chapter with an arrival terrace, lantern garden, western archive, glasshouse, gated causeway and elevated northern sanctuary. A physical three-wheel clue puzzle changes the same gate geometry used by collision and pathfinding. Both chapter objective sets and all puzzle/drop state use validated local checkpoints. The default checkpoint key remains compatible with v1 saves. Starting another chapter currently replaces the single checkpoint after confirmation; export/multiple save slots remain future work.

Downed enemies leave deterministic supply drops. Scavenging respects inventory caps and keeps excess supplies in the world; checkpoint reload preserves defeated enemies and remaining quantities. Mire Hounds use a committed, telegraphed lunge; Rootbacks use a short-range slam followed by recovery. Both are original procedural creatures, not replacements for human patrols or automatic takedown targets.

The new landscape includes real arched columns, terraced elevation, a broken glass canopy, animated shallow water, waterfall planes, vegetation and warm lamps. Nearby main and chamber columns have navigation/body collision, and the third-person camera also tests raised ground. This is still stylized procedural art: no commercial asset quality, swimming, rope climbing, vertical ledge system, immersive XR or multiplayer is claimed.

The repository's native acceptance workflow retains the old UI, full district, controller and camera suites and adds full conservatory, visual/clue and physical loot/save tests. Pure model fixtures do not replace ordinary-input browser playthroughs. Only the final source manifest and successful publication receipt establish that a candidate is live.

Technical rendering reference: https://threejs.org/manual/en/how-to-dispose-of-objects.html (chapter resource cleanup). No private narrative or sibling game code is imported.
