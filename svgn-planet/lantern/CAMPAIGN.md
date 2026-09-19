# Lantern Ward campaign: Night Watch Cases 02-06

This campaign expands the existing courier/social neighborhood instead of replacing it with a separate combat map. It is an original Neighborhood Missions campaign that learns from embodied VR action games without copying Batman characters, story, art, dialogue, locations, or licensed assets.

The campaign unlocks after Signal Hijack. The player keeps all delivery-loop shortcuts, resident stories, interiors, Watch credits and chapter progress. Campaign rewards are a separate exactly-once ledger inside the existing validated chapter save.

Case 02, Rooftop Run, teaches the cape rig as traversal. The player meets Sal, recovers the folded rig on the print terrace, reaches the loft launch rail and glides back toward a familiar terrace. The cape remains available afterward. Xbox holds LB+RB after unlock; XR uses a low two-hand grip-and-spread gesture. The gesture supplements rather than replaces stick movement and direct buttons. Real-device comfort remains open.

Case 03, Quiet Circuit, is the predator-stealth showcase. A roof overlook reveals three service-sentry patrols. The player can use height, service circulation, smoke and behind/drop takedowns, then cross a market service vent and disable the greenhouse relay. Patrol awareness, search, pursuit and return-to-route are explicit small state machines. Residents are never attack targets.

Case 04, Rooms of the Ward, turns the authored city interiors into a systems investigation. The route links Ada's press room, Bea's kitchen, Tomas's storehouse, Lin's greenhouse service bench, Neri's workshop floor, the lower canal service bed and a return to Ada. These spaces already belong to the neighborhood's ordinary work; the case uses those functions rather than placing generic combat rooms over them.

Case 05, Courtyard Surge, is the freeflow-style combat showcase. The first wave occupies the receiving court and the second occupies the loading loft, forcing a vertical reposition between waves. A strike can lunge across a clear lane to a nearby target. Blue windups create timed counter openings. Holding guard indefinitely blocks but does not repeatedly earn counters. Shield sentries require a counter, pulse or rear angle; smoke breaks sight. Only one enemy initiates a windup at a time.

Case 06, Last Light, combines learned relationships. The player meets Sal at the radio loft and can choose a stealth roof approach or direct courtyard combat approach without losing evidence. Both lead to the same bell-tower relay and a return through the neighborhood's learned connections. The campaign does not require an invisible preferred-route checkpoint.

## XR embodiment

The native WebXR renderer remains authoritative. No A-Frame wrapper was introduced because the existing renderer already owns the per-eye portal, first-person VR/AR, collision, input neutralization and scene state. Replacing that stack would not by itself improve menu or interaction quality.

Normal controller/hand play keeps menus and long pointer rays hidden. The first XR menu page retains Resume plus the urgent first-person/diorama and aperture controls. Richer mission, tool, control and save pages are reachable from there. Destructive actions default to keeping current progress.

The Action profile keeps movement on the movement stick and turning on the other. Main grip interacts, main trigger strikes, the other trigger aims a tool, and trigger plus main trigger uses it. The other grip guards/brakes. Stick click sprints or cycles tools according to role. Handedness and stick ownership are independent preferences.

Campaign body zones are direct interactions rather than menu inventory. Reaching to the chest selects the service grapple, reaching the forearm selects pulse, and reaching to the outer hip selects smoke. Cape deployment uses both low grips spread apart after unlock. These zones are intentionally separated and unit-tested, but physical reach, clothing/body-size accessibility and false positives require Quest 3 testing.

## Preservation and recovery

Save key `svgn.lantern-ward.v1`, chapter `lantern-ward-01` and layout `1` remain unchanged. Campaign state is additive and validated. Existing 600-credit chapter, resident-story and 180-credit Signal Hijack ledgers remain separate. Transient enemy health, alertness, cooldowns, lunges and glide state are not serialized. A save during a lunge or unsupported movement recovers to the last safe supported position.

The original neighborhood remains isolated behind its frozen legacy contract. Do not clear localStorage, reinterpret original coordinates or combine reward ledgers. A rollback to an older parser must explicitly preserve/export additive campaign data before writing the save again.

## Acceptance boundary

Model acceptance must cover every case, alternative finale route, exact reward ledger, timed counter behavior, shield rule, stealth takedowns, cape movement, holster zones and inherited save/controller contracts. Real browser acceptance must complete the campaign through actual input paths and retain all inherited suites. Physical Quest 3/3S, Touch Plus, hand tracking, Xbox, comfort, sustained frame timing and unfamiliar-player comprehension are separate gates.
