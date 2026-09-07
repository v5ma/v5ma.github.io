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
