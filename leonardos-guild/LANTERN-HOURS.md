# Lantern Hours / v0.5.0 (published)

This continues the persistent UPGRADE-CHECKLIST.md priorities: easier discovery, useful consequences and character/lighting improvement before more errands. It stays inside the same city and retains all existing saves, missions, rooms, shops, vehicles, street work and licensed artwork. It is not a new map or another engine. Publication run 34280935372 verified all 147 public files and the homepage against merge a4d5544226c1318377b85c8b82ffb1523101e912.

## One nearby chooser

Press I or tap Nearby for all reachable conversations, workstations, stairs and services instead of guessing whether to press T or Y. The existing T/Y/N/V/F controls remain. A chosen conversation hands off to the original notebook dialog; a chosen activity opens its original work dialog. Each handoff clears held inputs and permits only the intended modal to resume the world.

Town Guide searches the 9 existing side commissions, 22 Market Life activities and 5 new service/civic entries. Filter by availability, progress or completion; marking a destination does not move the player or grant progress. Ground-floor destinations point to a real door, cellar destinations explain the stairs, and the garden remains locked by its original prerequisites. These 36 directory entries are not 36 newly authored missions.

## The Lamplighter's Circuit

First finish the existing Silent Crossing Bell repair at x=-10,z=127. Use I there to accept the additional lamp circuit. Three street switches have brass diagrams that state exactly which lamps they toggle. Travel between the Arch, Binders lane and Market lamps; make all three light, then return to the bell for the once-only 90 XP and 35 florins. Switches are reversible and resetting is free. The fixed route has no forced timer. Its saved outcome lights the actual lamp meshes, not just a menu entry.

## Previous work becomes useful on later visits

Finishing Enough for Everyone unlocks Emilia's community meal near x=14,z=207: up to 40 vitality and 25 focus, once per 180 seconds of active play, without another quest payout. The repaired garden bench restores up to 30 focus every 60 active seconds after both its original work and gate unlock. Ada's learned tonic recipe lets you bottle a portable restorative at the apothecary bench for 12 earned florins. Carry up to three; use one from Nearby / Satchel for up to 35 vitality and 12 focus while stopped on foot away from combat. Full health/focus never wastes a tonic or serving. Inventory, cooldowns and completed work survive reload; no real-money purchase or online account is involved.

## Time, gestures and atmosphere

The town clock starts at 08:00 for old saves and runs through one day per 36 minutes of active play. The Copper Cat's upstairs rest spot can switch to morning or evening. Waiting changes the light, not position, parked vehicles, simulation steps, cooldowns or mission outcomes. All earlier shops and missions remain available; this release does not implement NPC closing schedules.

Daylight, sky colors, clouds, atmospheric haze, window emission and lamp glows now change with the clock. The three circuit posts reuse the same licensed local lantern model; no new download packs are added. Quality allows at most three non-shadow local lights, Balanced one, Battery none. Existing lower-detail facade and material budgets are retained. This is a bounded visual effect, not a measured physical-phone performance guarantee.

Existing clothed characters now have shoulder and head pivots with authored walk, ride, work, greeting, listening and combat gestures. These are changes to the existing models, not professional rigged replacements or motion capture. Existing workers can give a dismissible once-per-site invitation while you pass nearby. An invitation does not stop, move or reward the player.

## Saves and acceptance

The existing version-2 save and namespace gain a separately validated city record. No original fields are renamed or cleared. Persisted clock precision is quantized to avoid writing storage every render frame. The lamp completion bit prevents duplicate payouts, including after reload. Distance, correct floor, stopped-foot state and prerequisites are checked at interaction time.

Node fixtures cover the complete circuit, failed/reset paths, old-save migration, service costs/caps/cooldowns, safe consumption, pure guide lookup, meaningful gestures and approach reachability. These fixtures explicitly set starting states and are not native journeys. tests/city-browser.py uses ordinary keyboard/pointer input for fresh discovery and a fresh full circuit including the original bell repair. Its service test explicitly resumes a documented v0.4 save; it never writes live actor, clock, rewards or completion state. Existing original-commission, interiors, Market Life and multitouch suites remain regression requirements.

Full NPC routines, professionally animated characters, connected underground areas, systemic policing, actual piloted flight and cooperative accounts remain on the larger checklist. Never promote those items to shipped because this narrower pass adds a clock or a gesture.
