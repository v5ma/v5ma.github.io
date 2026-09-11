# Ranger Operations release and implementation notes

Build identifier: ranger-operations-20260911.1.

## Preserved foundations

This change extends the published Wild Frontier game. It retains all original field-guide and walking modules, the six original discovery identifiers, the original five-step recorder campaign, and both original save formats. The old recorder route still works through the visitor gate, survey, relay, northern recorder and return bay.

The original RANGER-README.md describes the historical first release. Its controls and damage description are superseded by this release: R is now reload, F boards/exits, and G is manual local recovery. No integrity/health reduction is present in the active game loop.

## New scope

The island radius grows from approximately 86 to 310 world units. There are 14 distinct species definitions and 40 uniquely identified animated residents. Eight outer paddocks supplement the original northern predator habitat. Six rest/checkpoint stations connect through an expanded trail network. The wetland contains actual controllable boat movement; the helicopter supports ascent, horizontal flight, hover braking and landing. Both are original procedural vehicles, as are the preserved suspension jeep and service buggy.

Ranger Operations supplies outpost establishment, containment, species survey, vehicle familiarization, tool training and a ten-checkpoint patrol. These are working state-driven tasks, not promises of a longer narrative campaign. Enclosure feeders influence animal movement; closing a stocked pen with every resident inside records containment. The water hose and zapper use physics raycasts, separate ammo/reserves, cooldowns and simulation-time reloads. They affect animal behavior, not injury. Practice crates trigger physical chassis impulses when hit by a tool or rammed at speed.

All vehicles update when unoccupied. A persistent inverted state triggers local upright recovery rather than resetting the expedition or damaging the vehicle. Out-of-bounds/corrupt-position safety handling is a separate emergency safeguard. Voluntary travel to a visited outpost is available through the map. The boat remains at its lake when the ranger uses land transport, and can only be exited at the marked dock.

## Input and interface

The gamepad poller runs before the simulation pause check. Starting the game and closing dialogs therefore remain possible while physics is paused. Buttons are edge-triggered; changing input contexts requires neutral input before gameplay resumes, preventing a held menu button or trigger from carrying into the world. Menus provide focus rings, wraparound navigation, setting adjustment, long-panel scrolling, and B/Escape dismissal. No window.alert, window.confirm or window.prompt is used. A controller disconnect while using the pad pauses the simulation.

The same menu exposes the in-game species journal, operations, settings, resupply/travel, and a controller-friendly brushing interface backed by the original fossil-lab save routines. The full legacy guide still exists independently but is not required for the new campaign.

## Modules

frontier-data.js defines the expanded world, 14 species, 40 residents, six outposts, enclosures, safe save parsing and herding rules.

frontier-vehicles.js manages the physical vehicle fleet, kinematic on-foot controller, boarding/exit safeguards, flight, boat handling, impulses and local rollover recovery.

frontier-world.js adds outer roads, batched forest geometry, physical fences/gates, rest stations, wetland/dock, blast crates and patrol markers.

frontier-art.js constructs distinctive procedural vehicles and dinosaurs, merging static mesh parts while keeping legs and rotors articulated.

ranger-tools.js handles equipment charge, reserve ammunition and timed reloads.

ranger-input.js polls the standard-layout Gamepad API for both world and paused UI contexts, alongside keyboard/mouse/touch input.

ranger.js integrates those modules with the original campaign, Three.js, Rapier and original field journal.

## Provenance and limitations

The Gamepad API standard and Rapier character-controller documentation informed API usage: https://www.w3.org/TR/gamepad/ and https://rapier.rs/docs/user_guides/javascript/character_controller/ . The pinned Rapier 0.17.3 distribution and existing Three.js copies retain the supplied license notices.

The procedural jeep/world interface takes inspiration from https://bruno-simon.com/ . No Bruno Simon code, world, portfolio content, model or audio was copied in this expansion. No Jurassic Park logos, film assets, characters, music or dialogue are used. Animals coexist in a fictional mixed-period reserve; model anatomy, sizes, colors and behaviors are artistic gameplay choices. New resident descriptions are ranger gameplay notes, not additional validated scientific field-guide entries.

The browser suite uses an emulated standard Xbox Gamepad API object, real production input polling, real ES modules over HTTP, and real Chromium WebGL rendering. Position fixtures accelerate travel to targets/facilities; the suite does not establish that a human drove every path. Physical controller/haptics, real phone, Safari and XR hardware testing remain unperformed.
