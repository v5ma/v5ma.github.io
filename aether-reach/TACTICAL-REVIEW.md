# Tactical relay development and review

This patch grows the public Aether Reach game using original fictional mechanics. The security puzzle controls only an in-game turret; it never connects to a computer, account, external security system or private repository. The living-city PR62 stays separate.

## Gameplay direction

Current and Cinder use the same occlusion/damage rules as firearms while keeping independent energy and cooldowns. Authored water conducts Current; oil holds a timed Cinder burn. The optional Atrium recovery links preparation, a visible connected-port puzzle, limited friendly security, six incoming machines and a one-time reward. Surveying a living class once opens passive choices and gives a numeric weapon bonus, not an unbounded farming reward.

The reference study used the developer BioShock Remastered manual (https://www.feralinteractive.com/en/manuals/bioshockremastered/latest/steam/) for security, passive builds and enemy research, and the publisher BioShock 2 description (https://store.2k.com/pt-BR/game/buy-bioshock-2) for simultaneous gun/power play. It does not claim every supplied third-party article or embedded video was inspected. Assets, code, labels, story and the optional objective are original.

## Defects exposed during review

1. A focus orb had authored radius .065, but an animation reset its scale to 1. The corrected animation preserves its base scale, and a 200-update regression checks its bounds. Repeated effects reuse fixed pools rather than adding objects without limit.
2. An unlimited friendly turret made unattended victory possible. Each attempt now has fourteen capacitor shots. Both ordinary and Engineer-equipped unattended model runs fail; active weapon/power play is required.
3. The first native input attempt issued actions before asynchronous dialog close/resume had settled. The fixture now observes the closed dialog and resumed normal simulation before sending the next key. It does not step the game or assign its clock.
4. A proposed observation waypoint was on the edge of the Quay deck and caused a real fall. It moved inward to a safe existing point, and the lesson now asserts zero rescues. No deck, collision rule or interaction range was expanded to conceal the problem.
5. The phone look-drag surface intercepted Field buttons. The actual field toolbar now sits above that surface, hides outside gameplay and remains hidden during XR; native dialogs retain priority. The test must click the visible button without force or direct model invocation.
6. Coarse keyboard-look ticks on a slow software renderer could oscillate around the desired aim. The test now uses the game's existing native mouse drag-look for precise aiming. Enemy hit volumes, aim assistance and damage are unchanged. Keyboard movement and all success assertions remain.

## Completion gates

Model checks cover independent resources, range/occlusion, status effects, timed hazards, circuit connectivity, proximity, passive restrictions, actual defense failure/success and safe one-time saves. Native tools/recovery runs must acquire the rig, survey and combine power/gun, rotate the actual puzzle, ignite oil, defend the physical collector and resume saved legitimate progress using ordinary input.

Preserve original expedition, arsenal, rail-transfer, Foldwing, Xbox-standard and emulated XR regression results. Inspect actual final screenshots before claiming visual improvement. Physical hardware and player-rated balance remain open, even when browser automation passes.

PR69 records exact final statuses; this document is not itself proof of success or deployment. Require a successful hosted-file hash comparison and restore-checked versioned GitHub Release before announcing a published update. Tactical evidence is copied into the release only if it matches every declared published file hash.

The canonical roadmap now includes T01–T08 for current systems and the unimplemented telekinetic/projectile, placed-defense, boss and deeper-build work. No private narrative was accessed or published.
