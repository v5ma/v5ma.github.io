# Aether Reach — The Silent Network

A separate, original first-person sky-city expedition for SVGN Interactive. Working title, first playable slice, not a complete commercial game. Nothing in this directory replaces SVGN.io Paper Delivery, Dino Atlas, or the Theology Wiki.

## Play

Serve this folder via HTTP (from the repository root: `python -m http.server 4173`). Open `/aether-reach/`. No package installation, account, API key, CDN or paid service is required. WebGL2 is required; a failed renderer leaves a readable error instead of a fake 2D game. Third-party renderer code is pinned and stored locally.

WASD moves; mouse or arrow keys look; drag-look remains available without pointer lock. E interacts with a nearby rail/relay/archive. Space jumps or releases the sky clamp with momentum. W accelerates, S brakes, C reverses on rails; Shift sprints or boosts. F or click fires. R reloads. Q spends suit energy to pulse/stun patrol machines. M opens the paused field atlas. Esc/P pauses. Touch controls are provided, but physical mobile performance is unverified.

Restore the greenhouse, freight and broadcast relays, then return to the signal terminal at Arrival Quay. The bridges form a complete foot route. Rails provide bidirectional alternate paths, not scene-loading teleports. Archives provide optional original world-building. Falls/death use a visible checkpoint rescue. The player can stay after the mission. Checkpoints/settings are local and versioned; unavailable storage is tolerated. No multiplayer, cloud saves, purchases, coupons or Supabase changes are included.

## Design boundaries

BioShock Infinite's first-person floating-city/rail traversal is the requested mechanical inspiration, not a source of copied assets. This project uses its own title, districts, writing, procedural art, weapon and pulse ability. It contains no Columbia, Booker, Elizabeth, commercial audio or extracted game data. Distinctive original characters, deeper combat and an expanding narrative are future development work.

The current expedition has five districts, five curved freight routes, five walkable bridges, three restoration relays, four discoverable texts and three patrol drones. Physics uses a fixed 120 Hz step with bounded frame catch-up. Art consumes the same authoritative district, collision and sampled rail definitions as simulation. All rail samples are tested against building collision bounds including roof clearance. Scene foliage/furniture are decorative and are not fully physical.

## Tests and continuation

`node --test aether-reach/tests/model.test.mjs` from the repo root tests saved-data validation, full walking connectivity, bidirectional rail completion, momentum release, combat, obstacles, mission state and checkpoint recovery. `python aether-reach/tests/browser.py` exercises the actual HTTP/WebGL client. Browser tests navigate through ordinary inputs using read-only observations; they do not set actor positions or mission progress. Model fixtures are separate evidence.

Future work lives in `ROADMAP.md`. Keep source modules separate rather than appending patches to Paper Delivery. No automatic branching claim: the user-described new branch was not visible, so the actual implementation branch is `feat/aether-reach-first-expedition`.

Technical references: https://threejs.org/docs/pages/PerspectiveCamera.html ; https://threejs.org/docs/pages/Raycaster.html ; https://developer.mozilla.org/en-US/docs/Web/API/Pointer_Lock_API . The existing repository's Three.js r177 distribution is reused byte-for-byte in this project's own vendor folder; see `vendor/LICENSE`.
