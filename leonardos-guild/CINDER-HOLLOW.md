# Leo's Guild - Cinder Hollow v0.11.0

This is an expansion of the existing game, not a spinoff. It recovers the interrupted Steady Steps camera and articulated-character work and adds the first playable badlands region. The ordinary game files, existing homepage entry and original local save namespace remain.

## Start an expedition

Press D-pad Up, choose Expeditions, and mark the expedition gate. The gate stands at the south entrance to Vinci near the original starting position (0,-17). Stop, dismount with Y, then press X at the gate and choose Enter Cinder Hollow. Your bicycle stays parked in town. The same equipment, money, character, house stories and progress accompany you.

Cinder Hollow contains a west ridge, central causeway and orchard route connected by nineteen trail segments. Survey the three route stones, gather iron/resin, confront seven persistent creatures, and recover a guarded surveyor's case. The Hollow Warden is the stronger encounter. The first region uses simple telegraphed close-range enemies with different vitality, pace and damage; it is not a finished ranged/support-party combat system. Defeated creatures and gathered sources stay resolved after reload, rather than generating unlimited rewards.

Three Ways Through the Hollow pays 45 florins / 100 XP for surveying all three sites. Watch Beyond the Walls pays 65 florins / 140 XP after three creature victories. The Lost Field Case pays 90 florins / 200 XP after recovering the Warden's case. Accept contracts in the notebook and report completed contracts physically at the town gate. Each pays once. Surveying can be completed by avoiding combat.

Return through Gate Camp. Inside its marked sanctuary neither monsters nor the player may deal damage across the safety boundary. Rest at camp or the town gate to recover vitality/focus and refill the sling. Bank cargo in town; one iron and two resin make a field dressing. Carry up to three. A dressing restores up to 35 vitality and is not consumed at full health. Rescue/recovery loses no money, cargo, completed objective or parked vehicle.

## Safe town migration

The real app installs a validated region session on every load and reset. Vinci's streets, houses, attics, roofs, cellars and civic passages are protected from hostile combat. Town attacks cannot grant old rival victories. Speak with the existing folio watchman and house/route rivals at their actual positions using X to accept a truce. Their original one-time rewards and progression records remain. The folio watchman still requires the original delivery/waterwheel stage; Rocco still requires his actual warrant and evidence. No old quest is silently auto-completed and no finished save is reset.

The region adapter is intentionally separate from historical raw reducer fixtures, which retain their original simulation semantics. Region tests use the same installed adapter as the app. Do not confuse passing old raw tests with proof of live safety.

## Controls and calm audio

On the Console profile, left stick moves, right stick looks, LT aims or braces with the staff, RT uses the tool, LB opens equipment, X interacts or reloads while aiming, B dodges or closes a menu, and Y uses a dressing in the badlands. Y still mounts/dismounts in town. View opens the appropriate region map. D-pad Up retains Dispatch, now including Expeditions. Classic, keyboard and touch remain; G opens the field notebook, J strikes, O dodges and F uses a dressing. All notebook tabs, reports, supplies and back actions are controller accessible.

One existing soundtrack stream serves the whole game. Independent music/effects/environment controls, Quiet density and the user's stored settings are preserved. No new music track or notification chorus is added. Monster windup cues reuse the bounded existing warning channel. The badlands renderer reuses the same WebGL context, original geometry and shared character buffers; it does not import art from the reference screenshots.

## Status and next work

Farmlands are planned, not playable or purchasable. Multiplayer, autonomous town schedules, additional protagonists and a complete route-line planner are not claimed. The roadmap and historical checklist remain beside this document.

Acceptance must cover actual gate travel, field combat, supplies, contracts, return, independent audio, controller menus and save reload. Analytic/model fixtures are separate from fresh native browser journeys. Physical Xbox hardware, speaker/headphone listening and target-device performance still require human testing. See the release PR for exact source identities, actual screenshots, failures/retries and the independent public-byte publication receipt. A document or open PR alone is not proof of deployment.
