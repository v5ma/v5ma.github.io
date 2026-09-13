# Leo's Guild - Stillwater Works v0.12.0

This is playable game code, not a concept screenshot. It builds on the published Cinder Hollow and recovered Steady Steps release. The pool references informed water clarity, tiled surfaces, ripples and submerged detail; their modern VHS presentation and horror branding are not copied into the Renaissance game.

## The Drowned Workshop

Open D-pad Up, Expeditions, Contracts and record The Drowned Workshop. Depart through Vinci's southern expedition gate, then go west from Gate Camp to Stillwater Cistern. Mark the cistern from the expedition notebook. The dry controls are on the south side, near (236.3,16).

Use X to read the slate. Close INLET, open OUTLET and BYPASS, then apply the sluices. Water takes actual simulation time to drain. The southern sloping ramp initially blocks entry into deep water; after draining it leads to a shallow tiled floor where you can wade to the waterproof survey lens. Recover it with X. Return up that same ramp to the dry controls, open INLET, close OUTLET and BYPASS, and apply the sluices to refill. Report the restored system physically at the town gate for 80 florins and 180 XP, once.

Wrong valve settings consume no resources. Refilling is available only from the dry platform after retrieving the instrument. There is no drowning timer, forced combat or new sound-notification stream. Reload returns you to safe Vinci while retaining the hydraulic checkpoint, recovered lens and reported reward. Unfinished water-level transitions resume at a safe checkpoint. The original three contracts, all prior house stories, controller profiles, quiet sound settings and save namespace remain.

This first water mission implements changing water levels, a real ramp and shallow wading. It does not yet implement free swimming, diving, boats or underwater combat. Those require their own controls, animation, accessibility and recovery work before they can be advertised as playable.

## Actual rendering

cistern-art.mjs renders the tile floor and walls with procedural caustics, a gently displaced surface and view-dependent Fresnel shading. One reused scene-colour render target supplies refraction of the actual scene behind the water; no generated image or screenshot is used as a texture. Reflected environment colour is procedural, not a claim of ray-traced or full-scene reflections. The additional refraction pass operates near the basin only, at a width of 256, 512 or 768 pixels for low, balanced or high quality. No new light, music track or sound buffer is allocated for this mission.

The terrain mesh is cut at the basin footprint, and the sloped entrance shares the movement reducer's geometry. Actual water depth controls whether the player can enter and slows shallow wading. Camera height follows the occupied basin floor, not the old surface terrain. Shader time and water simulation freeze while paused.

## Acceptance and continuation

The model suite tests remote-action rejection, actual water travel, the dry-platform requirement, reversible errors, one-time rewards, safety and old saves. A fresh native browser journey uses virtual Xbox input for every gameplay and menu action, with one declared Enter press for browser audio permission. It must capture the filled, drained and restored basin, actual wading, shader compilation and save/reload. This is not physical Xbox, speaker or target-device performance certification.

The release PR holds actual acceptance outcomes and the independent post-merge live-file receipt. AAA-ROADMAP.md and UPGRADE-CHECKLIST.md remain the durable continuation plan. The next water candidates are a second sluice-linked basin, pressure-controlled routes, and swimming/diving only after proper physical traversal and controls are built. Farmlands remain planned, not playable.
