# Dino Atlas spatial console

Work in progress, not a publication receipt. Baseline master: 7ccc6cceb43f1c3031454c8dc30b52646718baff. Runtime matches the verified Classic XR entry source at 5349808186e039b7da0de8eb00c56a094b5e4a3c; intervening Dino edits are documentation only. The exact source archive hash and all 71 runtime manifest hashes were independently checked during recovery.

Implement the player's requested clear play view in both full existing worlds. Replace the always-visible/head-following field board with a deliberately summoned, height/size-adjustable floor rotunda. Retain a compact controller/wrist status surface and hand-ray menu access. Opening a menu must show it; closing must restore play and stop hidden hit targets and held actions. Keep all existing gameplay mappings, saves, mounted assignments, Express travel, regular-game AR/VR entry, and the character-centered full-world portal.

Scope is Dino game code, tests, its roadmap and a narrowly scoped verification workflow. No engine migration, hub implementation, credentials, private review content, cross-site links, sphere portals or walking portals are part of this pass. Retain sibling-game work. Do not upload the user's combined private/public source brief wholesale.

Candidate and publication are separate checks. Run all model/physics tests, actual-input menu/pose/tracking tests in both scenes, and public byte/readback checks. Report synthetic XR and software-rendered results as such; physical Quest/Xbox, comfort and human readability remain open. The existing screen-mode DOM interface remains the accessible fallback until a separately tested canvas-native screen UI replacement is ready.
