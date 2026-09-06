# Aether Reach development roadmap

The committed canonical roadmap is [roadmap.json](./roadmap.json). The [public Kanban](./roadmap.html) provides search, workstream filters, stable IDs, dependencies, acceptance criteria, evidence and local-only status editing/JSON export. Browser edits do not write GitHub or change game checkpoints. A versioned six-sheet Excel snapshot accompanies the development handoff.

## Implementation order
1. Preserve the playable floating-city expedition and public/private content boundary.
2. Make controller input dependable: analog movement, aiming, menu actions, release/reconnect behavior and physical Xbox checks.
3. Establish the immersive WebXR rig, independent tracked aiming, snap turning, headset-readable UI and safe session lifecycle. The v0.2.0 candidate is an experimental implementation, not a physical Quest 3 certification.
4. Measure physical headset frame time, room calibration and comfort before enlarging scenes or adding richer locomotion.
5. Develop climbing and gliding individually, then join them to rails with explicit momentum, collision and recovery rules.
6. Improve embodied weapons, enemies, branching traversal, environments, puzzles and audio within the measured performance budget.
7. Design authoring, authenticated cloud levels and multiplayer as later projects with their own security and synchronization gates.

Task states separate implementation, browser checks, physical-device QA and release. I03 (physical Xbox), X04 (physical Quest) and X05 (headset performance) remain open even when simulated-device tests pass. No made-up delivery dates or hardware performance promises are attached to the plan.

See [DEVICE-SUPPORT.md](./DEVICE-SUPPORT.md) for bindings and limitations, [PUBLIC_BUILD.md](./PUBLIC_BUILD.md) for content isolation, and [ENGINE-ROADMAP.md](./ENGINE-ROADMAP.md) for architecture guidance.
