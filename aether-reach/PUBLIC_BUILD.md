# Public mechanics demo boundary

The public project is an engine-and-controls prototype. Its small expedition, setting, character labels and archive text are disposable prototype content, not an adaptation of unpublished narrative work.

## Separation

- Do not check out, submodule, fetch, copy, bundle or upload private repositories in any workflow for this project.
- Keep unpublished narrative, production bibles, unreleased character art, dialogue, plot outlines and their provenance in the private authoring workspace. A disabled interface, obfuscation or client-side password is not a privacy boundary.
- The public app has no private-origin requests, privileged credentials, remote story loader, account system, payment code or analytics. Local game saves contain relay IDs, archive IDs and a checkpoint ID, not manuscript text.
- Any later adaptation needs an explicit public-content approval step. No private content or private repository identifiers belong in public payloads or build logs.
- Review artifacts contain only public code, screenshots, model observations and version hashes. Do not broaden source snapshots to other repositories.

## Mechanics first

Version 0.2.0 retains desktop keyboard/mouse and touch and adds standard gamepad controls plus an experimental immersive WebXR adapter. The Quest 3 target is not physically tested or certified. The pure movement/combat model, renderer, browser UI, input sampler and XR rig remain separate. Device API emulation exercises code and the actual renderer; it does not prove real headset tracking, comfort or performance.

Climbing, gliding, full embodied weapon reload and cover building still need their own collision and comfort work. Multiplayer and cloud profiles remain separate security/synchronization projects. Keep independent headset orientation; do not repurpose rail-follow camera rotation as a forced head movement.

Use original assets and UI artwork. Mechanical inspiration is not permission to copy another game's textures, audio, characters or narrative.

## Release gate

Require deterministic model/input tests, native HTTP/WebGL expedition/interface/launch regressions, clearly identified device-API tests and public-file SHA-256 comparison. A desktop screenshot or simulated XR session never closes a physical Xbox or Quest 3 gate. The public board fetches only its local roadmap JSON and stores edits under its own namespaced key; it is not a GitHub client.
