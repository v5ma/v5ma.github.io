# Leonardo’s Guild — A Living Town

Current published foundation: v0.5.0 Lantern Hours, verified by publication run 34280935372 (147 hosted files plus homepage). Nearby / I, Town guide, lamp circuit, restored services and a town clock are part of the same game.

Next candidate: v0.6.0 Cycle Works. Complete A Better Fit at Bartolo's existing indoor fitting station, then select the tuning bench through Nearby. Fit owned parts free, brake the bicycle with Z or touch Brake, and optionally practice the marked road before returning to report. Space still hops; old progress remains. Read CYCLE-WORKS.md and UPGRADE-CHECKLIST.md for exact scope and verification. Earlier layers are described below.


An original third-person Renaissance browser adventure for SVGN. Version 0.3 expands the same town: nine additional commissions, six walkable interiors, two basements, a locked northern garden, named residents, cats, character progression, Lantern magic and earned bicycle variants. **Single-player**, not yet an MMO. Leonardo’s bicycle, pedal carriage and magical research belong to an explicitly alternate-history story, not historical assertions.

## Play online

Open `/leonardos-guild/` from the existing SVGN homepage card. All code, procedural art and the pinned MIT-licensed Three.js renderer are hosted locally. WebGL2 is required. No API keys, real-money purchases, account installation or external asset download is needed.

W/S move, brake and reverse; A/D steer; Shift sprints/pedals harder. Space hops or brakes the carriage. Q/C throw letters. F mounts/dismounts after stopping. X inspects; hold H to operate the original mechanisms. J strikes with the staff; K braces. B opens the original nearby market stall. M opens the map, P/Escape pauses. The v0.2 analogue joystick, simultaneous camera/action touches, live quality settings and camera distance remain.

**New controls: T / Talk, N / Journal, R / Magic.** Dismount, approach Leonardo and ask about Ink and Feathers. Enter Ada’s signed doorway, speak with her, and bring the ink back. The journal tracks additional commissions and character points; its blue map destination does not move the player. The Talk and Magic touch buttons provide the same interactions.

## The town grows rather than restarts

The Stolen Folio remains the original complete adventure: deliver four plans, trade, restore the waterwheel, confront the folio guard, retrieve the folio and return to Leonardo. Its original 45 houses, delivery locations, streets, pedestrians and carriage are preserved. The northern extension adds four buildings and 160 metres of traversable terrain behind a mission-gated passage.

Only the six signed open-door buildings are enterable. Interiors have floor collision, furnishings, residents and camera cutaways. The workshop and inn have paired basement stairs; the inn cellar requires helping its owner. Vehicles remain parked outside. Further buildings, the distant skyline, and the research aerial screw remain scenery. Read [LIVING-TOWN.md](./LIVING-TOWN.md) for the nine-commission dependency chain, shops, cats, adult optional relationships and limitations.

Experience and bounded attribute points affect Vitality, Riding, Ingenuity and Empathy. Earned florins buy supplies or unlocked Cargo/Courier bicycle variants. Bartolo can re-equip the original bicycle for free. Lantern consumes focus and reveals the ledger. The flying-machine quest unlocks a research design only: **piloted flight is future work**. City-watch characters take part in an investigation; this is not a citywide police/wanted simulation.

## Persistence and preservation

The existing `svgn.leonardos-guild.v1` save namespace and outer JSON version 2 remain. Old saves retain their original progress and initialize a validated `life` record. Side quests, one-time rewards, attributes, bikes, relationships and discoveries persist on this device. Continuing starts at the workshop rather than inside a potentially blocked room. No sibling-game saves are cleared.

The game began from the preserved SVGN City engine `1fe25b143a788fa74a17cd77b43db7f6c9b95929`. This update stays in the Leonardo folder and its acceptance workflow; it does not alter Paper Delivery, Dino Atlas, Theology, Little Planet, Aether Reach, Rainward, Vesperfall, account/payment systems or Supabase. [ROADMAP.md](./ROADMAP.md) separates implemented features from future work.

## Verification

`npm test` runs the original mechanics/touch models and new dependency, save, reward, door, room, gate, magic, trade and relationship tests. The approach audit also detects an activity accidentally placed inside a sealed building and ambiguous cellar interactions. These fixtures may place actors explicitly; they are not claimed native replays.

`tests/browser.py` is the independent original full-commission HTTP/WebGL regression. `tests/life-browser.py` adds actual keyboard/UI journeys: a fresh ink commission with two interiors and a basement puzzle, and documented resumed-save stages for the watch investigation and northern garden. Those tests never write live actor position, clock or progression. Existing native touch/graphics/lifecycle tests remain. CI retains exact source hashes, failures and screenshots without rewriting runtime code. The post-merge publication workflow must match served files to the merged source before a live-release claim.

Physical hardware performance, every optional human route, full life simulation and multiplayer are not certified by software-rendered CI. The story, controls and art should continue to improve in the same map.
