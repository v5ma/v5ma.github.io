# Leonardo’s Guild — The Stolen Folio

A separate, original third-person 3D Renaissance adventure for SVGN. **Single-player first chapter**, not yet an MMO. An alternate history: Leonardo’s bicycle and pedal carriage are fictional experimental inventions, not assertions about historical artifacts.

## Play

Open `/leonardos-guild/index.html` from the public homepage, or serve the repository root with `python -m http.server 4173`. The included Three.js renderer is local, pinned, MIT-licensed, and requires WebGL2. No API key, installation, network account, analytics or external asset download is required. The low-power link switches off shadows, without changing the world or simulation.

W/S accelerate, brake and reverse; A/D steer. Shift pedals harder or sprints. Space hops on the bicycle or jumps on foot, and brakes the pedal carriage. Q/C throw sealed letters left/right. F mounts or dismounts a nearby invention after stopping. X inspects mechanisms; hold H beside one to operate it. J swings the staff on foot; hold K to brace. B, or F at the market stall, opens the shop. M opens the map; P/Escape pauses. Drag the world to look around. Touch buttons are included; physical-phone/controller testing is still needed.

## First commission

You begin as Leonardo’s apprentice, on his bicycle in Vinci Heights. Deliver four plans, earn florins, trade for supplies or a reinforced staff, restore the market waterwheel, and cross toward the Arno outskirts. Dismount to confront a folio guard. Attacks are non-graphic and telegraphed; bracing and retreat remain available. Retrieve the folio and return to Leonardo to finish. You may continue roaming, delivering letters and using the inventions afterward.

The three connected districts contain 45 homes, independent streets/crossings, walking townspeople, wagon traffic, Renaissance-style buildings, market awnings, belltowers and workshop experiments. The distant skyline is background scenery, not a promised playable city. The aerial screw is scenery, not a flyable vehicle. Shops spend **in-game florins only**.

## Scope and preservation

Forked from the preserved SVGN City source at `1fe25b143a788fa74a17cd77b43db7f6c9b95929`. Bicycle/on-foot movement, mounting, camera, physical delivery projectiles, map and fixed-step collision handling are retained. Modern street signs, vehicles and architecture are adapted to a distinct Renaissance world. All new geometry and story are original SVGN content; reference screenshots and commercial-game assets are not shipped.

Only `leonardos-guild/`, its scoped CI workflows and the homepage entry belong to this release. Paper Delivery, its Workshop, Aether Reach, Rainward, Dino Atlas, Theology, the private NerveGear project and the separate SVGN City candidate remain untouched. Saves use `svgn.leonardos-guild.v1` only; existing game saves are never migrated or cleared.

Multiplayer persistence, guilds, trading between players, account purchase/coupons, large battles, further towns, interiors, and historical/educational research are future work. No Supabase schema, payment system or production authentication is modified. See [ROADMAP.md](./ROADMAP.md).

## Verification

`npm test` runs deterministic model tests, including complete mission gating, physical letters, stopping/mounting, collision substeps, local shop spending, cooldowns, defense and save validation. These fixtures may explicitly set starting states; they are not native gameplay claims.

`python tests/browser.py` exercises served WebGL2 via normal keys/UI, completing the commission, opening shops and maps, preserving saves and replaying after reload. Its read-only observer `LeonardoGuild.inspect()` returns copies, not controls or a teleport API. CI records source identity, screenshots and any failure without rewriting runtime files. Hardware performance and subjective visual parity are not certified by software-rendered CI.
