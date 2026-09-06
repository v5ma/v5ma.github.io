# Public mechanics demo boundary

The public project is an engine-and-controls prototype. Its current small expedition, setting, character labels and archive text are disposable prototype content, not an adaptation of unpublished narrative work.

## Separation

- Do not check out, submodule, fetch, copy, bundle or upload private repositories in any workflow for this project.
- Keep unpublished narrative, production bibles, unreleased character art, dialogue, plot outlines and their provenance in the private authoring workspace. A disabled interface, obfuscation or client-side password is not a privacy boundary.
- The public app has no private-origin requests, privileged credentials, remote content loader, account system, payment code or analytics. Local saves contain relay IDs, archive IDs and a checkpoint ID, not manuscript text.
- Any later adaptation needs an explicit public-content approval step. Public placeholder interfaces may use generic IDs; no private content or private repository identifiers belong in the public payload or build logs.
- Current review artifacts contain only public code, screenshots, model observations and version hashes. Do not broaden source snapshots to other repositories.

## Mechanics first

This release targets desktop keyboard/mouse and emulated touch. It does not advertise immersive VR support. Keep the pure movement/combat model (`model.mjs`), renderer (`scene.mjs`) and browser input/UI adapter (`app.mjs`) separate.

The next headset adapter must preserve the model's authoritative state while adding tracked controllers/hands, embodied weapon interaction and an independent head pose. Rail-follow camera rotation must not overwrite headset orientation. Climbing, gliding, rail-to-flight transitions and cover building each need their own collision/comfort tests before combining them. Multiplayer and cloud profiles remain a separate security and synchronization project.

Use original assets and UI artwork. Mechanical inspiration is not permission to copy another game's textures, audio, characters or narrative.

## Release gate

Require deterministic model tests, native HTTP/WebGL expedition, interface and launch/touch checks, and a successful public-file SHA-256 comparison. A model route, desktop screenshot, or emulated touch test does not certify physical Quest 3 tracking, frame rate or comfort.
