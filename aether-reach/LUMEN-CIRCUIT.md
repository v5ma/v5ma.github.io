# Aether Reach 0.6.0 - Lumen Circuit

The existing expedition and local save key are retained. This release adds six service-ladder rooftop areas, two multi-level signal houses, two sky-rail links, three guarded side adventures, six supply caches, two archive records and two additional humanoid combat profiles. The original twelve districts, thirteen sky-rails, ten side adventures, ferries, lifts, relay story, equipment and Quay art remain. The totals are fifteen sky-rails and thirteen side adventures. The separate southern living-city candidate is unchanged.

## Controller-only play

The left stick moves and climbs; the right stick looks. A jumps or leaves a rail or ladder. B opens/folds the Foldwing in flight, or lets go of a ladder. Y interacts, catches a nearby rail or climbs a nearby ladder. X reloads. RT fires and LT aims. LB casts the selected power. RB reverses a rail while riding, otherwise cycles available powers. L3 sprints or boosts a rail. R3 surveys a target. D-pad up/down changes weapons, left opens the field rig and right opens equipment. View opens the atlas and Menu opens pause.

Pause provides the adventure journal, atlas and recovered archive, equipment catalogue, field rig, settings, remapping, notice dismissal, checkpoint recovery and title screen. Every in-game dialog uses the same focus model. A selects, B returns one level, D-pad or left stick navigates, left/right adjusts sliders and selectors, right stick or LT/RT scrolls, and LB/RB pages through long menus. Conductor tiles use three-column navigation. Focus is restored after purchases and nested dialogs. Held actions are blocked across menu changes and reconnects. A controller does not request pointer lock.

Gameplay remapping swaps actions rather than orphaning them. Menu controls and the Menu/View buttons remain fixed. Deadzones, look response, inversion, look speed, toggle sprint, toggle aim and optional supported vibration are saved separately from expedition progress. New-expedition and controller-reset confirmations are in-game dialogs, not native confirm boxes. Catalogues permit owned-weapon selection away from a kiosk, but purchases still require real kiosk proximity.

## Rooftop routes

The Theatre Lantern Walk, Gannet Signal House, Aurelian Lens Terrace, Stormglass Lightning Deck, Dawn Courier Loft and Solstice Prism Crown each have a continuous service-ladder route from their original streets. Hold forward/up to ascend and back/down to descend. Release the stick to hold position. Jump or B lets go. Ladder state is transient and never restored as an arbitrary-position save.

Gannet and Dawn contain lower rooms, internal stairs and upper mezzanines. The Lantern-to-Lens Skyway links Theatre and Aurelian rooftops. The Lightning Courier Express links Dawn and Stormglass rooftops. All roof areas can also be approached through the existing Foldwing system.

The City Above the City pays once for six nearby survey interactions. Letters That Never Landed requires three separate rooftop parcels delivered to the Clockmaker's Arcade courier desk. The Lumen Circuit requires Theatre, Stormglass and Solstice beacon rings at 2, 1 and 3, followed by energizing the circuit at that same desk. Longshot has longer range, faster projectiles and a slower firing cadence; Skirmisher has shorter range, faster movement and lower-damage frequent fire. Both use existing cover collision and salvage rules.

## Verification scope

The Node tests exercise old and new movement, collision, saves, purchases, rewards, input boundaries and every ladder in both directions. The browser controller journey uses an emulated standard Gamepad API to operate the real HTTP/WebGL application; it never assigns actor position, game time, credits or objectives. Light rendering is selected for bounded software-GPU input tests; it is not a performance claim about Prismatic mode. Physical Xbox USB/Bluetooth testing and physical Quest 3 tracking, comfort and frame-rate testing remain pending. Browser permission prompts and headset operating-system UI are outside game control.
