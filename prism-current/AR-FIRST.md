# Prism / AR-first art direction and production checklist

Owner decision, 2026-09-22: AR is the primary Prism experience and the owner's personal playtest target. Screen and VR remain supported alternatives, not the starting point from which AR scenery is subtracted. This supersedes the earlier plan to hide every tree and bank as the final AR art direction. That hiding remains the current runtime behavior until the replacement is actually implemented and tested.

The design is a playful archipelago appearing inside the real room: a narrow current, compact islands with trees and grasses, a few floating clouds, expressive toy enemies, fruit and purple blocks. The room is intentional negative space. We are not building a full opaque landscape around the player or requiring portals into the game. Preserve Easy difficulty, slower enemies, health cases, readable HEALTH, four modes and finale-only bosses.

## What is saved now versus what is still proposed

Water0.1.0, Fire0.1.3 and Trees0.1.3 remain integrated into the current game. New Toon0.1.0 and Cloudlets0.1.0 are reusable library-only implementations, not loaded by index.html. They do not change the played game yet. modules/environment/AR-LIBRARY.md explains usage and limits; AR-REFERENCE-REVIEW.md records inspected sources and inaccessible references. No Disney cloud data, commercial Grassworks source, premium UI kit, or private hub asset has been imported.

## Composition checklist

- [ ] AR-01. Put Play in AR on each supported chapter card, remember the mode, and make unsupported AR explicit rather than silently opening VR. Keep current deliberate start/pause/resume/exit behavior.
- [ ] AR-02. Replace the blanket vegetation exclusion with a specific AR-island composition, not the full screen landscape. Prototype two small side islands with one existing tree each and no wall of distant banks. Do not move the player's camera or reduce combat scale to a tabletop without approval.
- [ ] AR-03. Keep scenery out of the tested approach corridor, hand-swing area, numeric health gauge and every paused-menu placement. Check projected silhouettes from seated, standing, leaning and permitted sidestep viewpoints, not only world-coordinate clearance.
- [ ] AR-04. Use isolated cloud clusters above/beside islands and behind enemy staging, not between fruit and hands or as full-view fog. Maintain a near-viewer exclusion region and an optional scenery reduction setting. Scenery cannot hide required switches or health items.
- [ ] AR-05. Preserve the room between objects and beneath the player's safe standing space. Saved water opacity remains independent of difficulty and scenery density. Do not draw a ceiling skybox, full-screen haze or an opaque sea over the real floor.
- [ ] AR-06. Plan one clear virtual key-light direction, a gentle fill and a controlled palette. Keep targets legible against bright and dark passthrough. No claim that a virtual moonlight actually changes the photographed room; light/depth sensing is optional and feature-detected, never silently assumed.
- [ ] AR-07. Reuse soft water highlights and localized wakes, then budget real virtual-scene reflections separately. Never label analytic sky shading a reflection of the actual room. No camera-image sampling or extra mirror pass is assumed.
- [ ] AR-08. Establish depth with separated foreground gameplay, side/middle islands and restrained farther landmarks. Keep actual threats within readable forward angles and comfortable reach; distant decoration is not a new attack origin by default.
- [ ] AR-09. Prefer small synchronized tree, cloud, water and flame motion. The host's paused clock stops all decoration. No cinematic fly-through, head steering, forced dolly, camera bob or progressive full-view blur in AR. Animate the interface or scene object, not the player.
- [ ] AR-10. Keep the in-scene Rotunda and wrist/floor displays. Strong hover/press states and readable HEALTH outrank attractive glass panels. Transform controls and their picking together. New materials must not swallow rays or make a menu press also shoot a weapon.
- [ ] AR-11. Define silhouette, light/shadow palette, roughness, density and motion before prompting an asset. Use a hybrid: readable toy-like enemies and island forms, softer clouds, distinct water highlights. An anime label is not a substitute for art direction.

These are prospective acceptance tasks, not checked-off implementation claims. The user's supplied checklist about lighting, reflections, depth, subtle motion, minimal UI and specific art direction is adapted here to AR; its suggested camera motion is explicitly not imported into headset play.

## Rendering and reuse checklist

- [x] LIB-01. Save an original bounded toon-material factory with classic/ES entry points, a shared nearest-filtered light ramp, caller-owned renderer and explicit material disposal. No forced conversion of old game materials.
- [x] LIB-02. Save original seeded mesh-cloud clusters with three prebuilt detail levels, a shared XR detail decision, bounded paused-clock motion, near-viewer suppression and resource ownership. This is not volumetric cloud or Gaussian-splat rendering.
- [x] LIB-03. Keep original implementation and third-party references separate. Record license, provenance and observed versus unverified claims. Store no complete private/multigame brief or private hub code.
- [ ] LIB-04. Build an island-composition module with a top footprint, rock underside, planting sockets and per-mode clearance. Reuse existing trees through explicit AR placement rather than patching all hosts to show their entire forests.
- [ ] LIB-05. Add independently authored local grass patches, bounded instances, distance detail and shared wind. Do not publish a licensed commercial implementation as a shared module. Test pixel coverage as well as triangles/draw calls.
- [ ] LIB-06. Evaluate real volume-cloud rendering separately. A VDB conversion/import pipeline and asset attribution are distinct from a runtime shader. Start with a small cropped/downsampled volume; no gigabyte download in ordinary game startup.
- [ ] LIB-07. Evaluate localized mist, spray, contact shadows and lighting/style helpers individually. Bound every effect's screen coverage, particle count, lifetime and ownership. Avoid stacking all expensive features before measurement.
- [ ] LIB-08. Keep create/update/reset/dispose conventions where appropriate, injected THREE, versioned deterministic descriptors, documented coordinate spaces, query-only observations and stable IDs. Static material factories need no pretend update clock. Loading preparation belongs in a cancellable host path before music.
- [ ] LIB-09. Prove the integrated AR path first: actual rays/buttons, health, healing, both Easy bosses, pause/volume, same-mode re-entry, room visibility, stereo consistency, quiet mode and bounded allocations. No state assignments or auto-resume may manufacture a pass.
- [ ] LIB-10. Measure named physical Quest configurations at ordinary resolution. Record CPU/GPU/frame gaps, startup versus steady cost, memory, silhouettes and owner feedback. Model/object checks, native emulation and screenshots do not replace a headset test.

Existing Friendly Current frame-pause and narrow-screen failures remain open in PLAYABILITY-CHECKPOINT.md. Library-only work adds no GPU load to that build. Resolve reproducible causes and validate the intended integration before enabling scenery broadly. Preserve the timing safeguards and all score/health rules.

## Proposed nine-chapter AR adaptation

Citrus Creek uses two orchard islands and optional floating harvest baskets. Its fruit patterns and late harvester boss remain visible independent of trees. Bubblebath Bay uses disconnected pool-edge islands and contained water/bubbles, not an opaque room-sized swimming pool. Clockwork Canopy hangs small workshop islands at the sides; trees never surround the player's swing space or conceal launches.

Emberworks Harbor uses a few furnace docks and distant upward exhaust, with authored coolant controls always separately visible. Frostfloat Fjord uses ice islands and restrained sparkle, never a slippery camera or blizzard over passthrough. Sky Parade emphasizes airship routes and localized clouds without moving the viewer or requiring repeated overhead reach.

Lunar Lagoon uses moon-rock islands and a small luminous water ribbon, leaving the real room as the surrounding space rather than drawing a star-filled sky sphere. Stardust Conservatory combines floating planters, tree crowns and visible harvest controls without solid greenhouse walls. Prism Confluence brings recognizable island landmarks together but limits simultaneous scenery and attack demands; its boss still arrives only at the end.

These nine concepts are design only, not nine added levels. Current gameplay stays Duck Armada and Mothership. Easy remains Easy in every proposed chapter, with readable recovery and health supplies. All fundamental interactions must work in AR; scenery reductions may change decoration, never remove necessary mechanics.

## Next concrete integration slice

Build the two-island Duck Armada AR composition with two small cloud clusters, one optional narrow grass patch and the existing water/fire. Use a saved AR scenery preference and a reset placement path. Validate with the current fixed player stage and actual tracked controllers before expanding the campaign. Keep the library reusable and the host adapter small. Save directly to reconciled master, no PRs, staging branches, new workflows or changes to other games.
