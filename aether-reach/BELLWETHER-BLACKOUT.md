# Aether Reach 0.9.0: Bellwether Blackout

A connected public side-adventure in the existing Bellwether district. This is the first district-sized mission toward production gate G1, not a claim of a finished campaign or AAA quality.

## Where to start

Choose **Bellwether Blackout / track district adventure** from Pause, or track its card in the Adventure journal. Walk west from Arrival Quay or take Bellwether Local. Use the brass dispatch desk in eastern Bellwether at (-84, 7, -4). No earlier adventure is required. X interacts; A and B retain their existing movement/menu behavior.

## The route

Stop two street disruptors with the existing weapon and power systems. Enter the Clockmaker's Arcade, read the maintenance card, and set its separate supply, return and balance dials to 2, 1 and 3. Use the east-wall tester. Climb the Theatre service ladder from the south street, or approach the roof using an existing compatible traversal route.

Activate the Theatre receiver. Defeat two boarders, then the signal guard. Stay within 2.8 meters of the receiver for six simulated seconds after the fight to synchronize it. Return to the dispatch desk to receive the once-only 300-credit reward. Four public market lamps remain lit after the receiver is restored, including after save/continue.

The journal and atlas track the current stage rather than sending the player to the final roof before the Arcade work is done. D-pad up displays a short-range ground arrow for the tracked mission where the next local step has supported ground and a clear line. It is a direction hint, not a global pathfinder.

## Save and input guarantees

The existing expedition key, purchased weapons, two-slot carry rules, controller remaps, campaign and old adventure IDs are preserved. Mission stage and circuit positions are added to the version-1 save. Player position, temporary attackers, live enemy health and synchronization timers are not saved. Starting the mission sets the checkpoint to the actual Bellwether rest pavilion. An interrupted street or roof fight restarts at its local console while completed circuit work is retained. Repeated reports cannot mint another reward.

The mission adds no operating-system popup. Its journal, maintenance record and pause shortcut use the existing fixed A/select and B/back menu navigation. Mission cues share the existing audio buses and adaptive music transport, with distinct circuit and stage chimes. Browser audio permission and physical listening remain separate acceptance work.

## Verification scope

`tests/bellwether.test.mjs` checks real model shooting, prerequisites, independent dials, the two rooftop waves, the six-second hold, one-time payment, save migration, interruption, continuous foot/ladder routes and bounded rendering pools. Unit fixtures isolate this mission from unrelated enemies.

`tests/bellwether-browser.py` and its test-only input driver operate the actual HTTP/WebGL application through an emulated Gamepad API, without writing player position, health, ammo, credits, enemy health or mission progress. The review workflow records reports and screenshots. Light rendering on software Chromium is not a physical Xbox/Quest or GPU performance certificate. G1 still needs player approval of pacing and the connected adventure as a whole.
