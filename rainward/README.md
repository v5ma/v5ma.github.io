# Rainward v0.11.0 / First Light

Current release: [FIRST-LIGHT.md](FIRST-LIGHT.md). The Floodgate now has optional field records, two readable approach plans, contextual guidance and an improved rain garden.

# Rainward v0.10.0 / Field Ready

Current release notes: [FIELD-READY.md](FIELD-READY.md).

Production checklist: [AAA_CHECKLIST.md](AAA_CHECKLIST.md). Interactive board: [roadmap.html](roadmap.html). Canonical task data: [production-plan.json](production-plan.json).

The sections below retain earlier implementation history; the current release notes and evidence take precedence for changed behavior.

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

## v0.4 — Clue guidance and Bellweather Terminus

The existing conservatory clue is at its western archive entrance. E / Y reads it. From the garden toward the north, set Garden to SUN, Archive to LEAF and Deep to WAVE. Map / Hints now identifies the inscription, numbers the controls, shows their current states and offers optional location, interpretation and solution hints. Reading hints never operates a control or grants progress.

Chapter 03 is Bellweather Terminus, an independently authored railway hall and two service wings. Recover the Signal Prism and Traction Key and route power through three linked breakers. Signals and platform must be on; the flooded pump must remain off. The help system can derive a solution from the current switch state, not only the untouched starting arrangement.

The rendering pass uses locally authored deterministic albedo, height and roughness textures, metre-scaled world projection, revised environmental color/light balance, irregular rock geometry, smaller head proportions and movement-linked gait. Reduced Graphics retains the same world-scaled color and live circuit lights while omitting expensive PBR microdetail. These are procedural assets, not photogrammetry or imported AAA art. The current models and animation are not production-quality characters; the roadmap calls for an original rigged asset pipeline rather than claiming that more effects alone will solve that gap.

The previous chapters, fixed-input gameplay rules, single checkpoint namespace, and v1/v2 save compatibility are preserved. WebXR, swimming, climbing, multiplayer, paid accounts and private narrative are not added. A third chapter is a new environment and puzzle, not a representation of a finished long campaign.

Native acceptance must cover the complete third chapter, both earlier chapters, puzzle guidance without mutation, full and reduced material shader compilation, controller and phone-width UI. Model checks and screenshots are not substitutes for a real playthrough or physical-device approval. Deployment status is recorded in the release PR and public hash-verification receipt.

## v0.6 — Living Light

Scanned-asset recovery, shader rendering and bounded simulation timing are documented in [VISUAL-UPGRADE.md](VISUAL-UPGRADE.md). Three existing chapters remain; this is not a new chapter. Full quality adds depth contact shading, bloom and animated materials; Reduced Graphics bypasses fullscreen effects. An experimental stationary WebXR overlook is included, not VR combat or locomotion. Physical headset performance and comfort are unverified. Earlier changelog limitations describe those earlier releases. Publication is established by the final PR receipt, not this candidate note.

## v0.8 — Reclaimed City and Whiteout

Rainward now contains six expeditions. Meridian Ward, Breakwater Signal and Whiteout Market extend the original campaign with much larger street networks, multiple building entrances, alternate stealth routes, ten-enemy encounter sets, persistent field tasks and chapter-specific pressure/interlock puzzles. The Whiteout chapter adds a snowbound market and transit district with a separate weather treatment.

The survivor and human enemies use a new articulated procedural humanoid rig with smaller anatomical proportions, layered clothing, hands, facial features, backpacks and carried equipment. New raider, marksman, sentinel and shrieker roles vary pursuit, attack range, durability and alert behavior. This remains original procedural browser art rather than imported commercial character assets.

Field tasks are checkpoint-persistent and may be required or optional. They cover repairs, records, supply protection, route marking and signal work, with prerequisites and one-time rewards. The original three chapters receive optional field tasks without changing their original completion routes.

The release retains keyboard, touch and standard gamepad controls, fixed-step simulation, scanned environment options, the cinematic render pipeline and the experimental stationary WebXR overlook.

Critical mission pickups and optional field tasks use separate interaction points, so optional work cannot mask a required objective during a dangerous encounter.
