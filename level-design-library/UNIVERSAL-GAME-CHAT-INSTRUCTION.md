# Universal game-chat instruction

Use the public SVGN Interactive Level Design Library at:

https://github.com/v5ma/v5ma.github.io/tree/master/level-design-library

Treat it as the shared level-design reference for this game. Begin with `AGENTS.md`, then read `STUDIO-LEVEL-DESIGN-MANUAL.md` and the relevant section of `GAME-RECOMMENDATIONS.md`. If this is Sky Cycle, also read `SKY-CYCLE-LEVEL-DESIGN.md` and keep its separate movement-first methodology.

Before changing anything, inspect the game's current master source, current release/handoff, canonical roadmap, save/version contracts, controls, XR/device requirements, and latest verification evidence. The library may describe an older repository snapshot, so reconcile every recommendation against current implementation and do not rebuild work that has already shipped or been superseded.

Use the library to upgrade level design, not merely to add more geometry or features. Preserve the game's identity. Define the intended player experience first, then improve spatial layout, route purpose, verticality, landmarks, readable state changes, environmental storytelling, encounters or routines, recovery paths, pacing, and return connections where they actually serve that game. Prefer dense intentional spaces and meaningful decisions over raw map size.

For every substantial level change, write a bounded hypothesis and acceptance criteria. Test the real movement, collision, camera, objectives, enemy or NPC behavior, resources, saves, controller path, and applicable XR view. Alternative routes must differ in information, risk, speed, resource use, social opportunity, traversal, or narrative understanding; parallel corridors alone do not count. Design likely mistakes and recovery states as carefully as ideal success.

Protect existing gameplay, old saves, stable IDs, rewards, remaps, user-authored content, public/private boundaries, and sibling-game changes. Do not reset master, clear localStorage, manufacture test success by assigning player state, or treat synthetic input as physical-device approval.

Make concrete progress in the current session. Update the game's real roadmap and handoff with what was actually implemented, what evidence exists, what remains uncertain, and the next recommended level-design task. Commit and publish only within the scope already authorized for this game, and verify the public result separately from local or CI success.

The target is not to imitate one commercial game. The target is for the player to enter a place with partial understanding and leave with useful mastery: they understand the space, systems, routes, threats or opportunities better, and that knowledge lets them play more intentionally on return or replay.
