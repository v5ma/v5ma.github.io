# Rainward future direction and running work log

This is the durable design record requested by the owner on September 22, 2026. Update it during implementation and after verification, not only when a chat ends. Read DEVELOPMENT-HANDOFF.md, AGENTS.md, release.json, production-plan.json and this file at the beginning of a continuation. Repository source and actual receipts outrank earlier chat claims.

## Player experience

Build a focused survival-stealth adventure through reclaimed places, not a replacement demo or a collection of bigger empty maps. Borrow general design principles from The Last of Us: functional rooms with traces of ordinary life, constrained resources, contrasting quiet and pressured stretches, observation before commitment, interconnected interior/exterior routes, and escape after detection. Do not copy franchise layouts, characters, fiction, audio or assets.

Every encounter needs a readable destination, an observation opportunity, hard cover distinct from foliage concealment, a meaningful alternate route and a recovery option. A route trades time, exposure, information or resources; it should not simply be better in every way. Let machinery and optional repairs change real circulation that enemies can use as well. Environmental stories should be visible in rooms and objects before they need a text explanation. Avoid filling paths with explanatory signs or turning every pickup into a menu.

Maintain the current praised character bodies/faces and recovered animation. Preserve seven chapter identities, current and older saves, finite resources, reward idempotence and the existing controller remaps. Keep fast no-fatigue default running and selectable legacy movement. Survival tension should come from exposure, resource decisions and enemy behaviour, not compulsory slow travel. Maintain Xbox gameplay and every menu, Quest controller input, hand UI, first-person VR/AR and third-person portal views. Never attach a compulsory menu to the player's gaze or force their head orientation.

## Implemented level foundation

Reclaimed Places was committed as a1b74d4174e94a169925366790b99d3476961eef. Floodgate's formerly solid quay ruin contains connected pump and evacuation rooms, an observation sill, multiple exits and contrasting exposed approaches. Terminus has a dry-record outer aisle and dispatch/workshop escape shutters opened by its existing optional tasks. The original puzzle, components and rewards remain required/unchanged as appropriate. Read RECLAIMED-PLACES.md and reclaimed-places.mjs rather than rebuilding these features.

The subsequent 953a187e2d1c97c0e88823cd4963e73bcfb59c22 art correction moves quay plaques onto solid surfaces and removes mirrored backs. This is the latest Rainward source found when resuming at repository master efdd38a3565a9e34701eacc48c1894a5b82b547c.

## Immediate continuation

Finish delivery and playability verification of these two chapters before multiplying their geometry. Inspect the exact-source screenshots and failure reports. The original a1b74d4 living-enemy browser journeys passed both chapters, but the 953a187 district replay died in the existing freight aisle with a smoke remaining. That is a real failed journey, not permission to change health or remove enemies. Diagnose input timing and route recovery separately from level defects, retain the failed trace, and never label a model fixture as a native playthrough. The 953a187 publication verifier reported failure; inspect it and independently compare current served bytes before declaring delivery.

Make the new direction easy to discover from the existing title/chapter selection and journal without starting a different demo, planting progress or replacing a player's checkpoint. Where an existing task opens a route, its complete description and completion feedback should explain what actually changed. Any new fix must be narrowly scoped, tested and directly committed to freshly reread master without force or a new PR.

## Future chapter work, not yet implemented by this record

Conservatory should develop horticultural terraces, water-state clues, maintenance circulation and visible return connections. Meridian should deepen occupied rooms and household/service relationships rather than repeat anonymous blocks. Breakwater should contrast exposed height, sightlines and shelter. Whiteout should use memorable thresholds and reliable sound landmarks under poor visibility. Northlight should link dry observation, submerged recovery and service corridors. Expand only after real movement, camera, resource and encounter tests of the previous slice.

Weapon handling, enemy tactics, authored Foley, interior acoustics, dramatic silence and additional interaction families remain separate roadmap work. Do not claim new weapons, imported action clips, arbitrary climbing or full campaign redesign merely from a level-art pass. Map changes to existing RW-009, RW-011, RW-012, RW-013 and RW-028 tasks; keep all human approval gates open until actual review.

## Save checkpoints for future chats

At each meaningful checkpoint, record the exact commit, changed paths, tests actually run, unresolved failures and next action here or in a linked evidence receipt. Before reporting a release, record a successful public-file comparison separately from the GitHub commit. Keep local model tests, ordinary-input browser journeys, artificial XR device rendering, physical Quest/Xbox and human quality judgments distinct. Do not clear localStorage, overwrite concurrent sibling work, create unnecessary workflows, or substitute a scheduled job for completed delivery.

Current session checkpoint: source and current CI recovered; local source extracted from the authentic 953a187 district artifact (SHA-256 6c1833594f3671b97b3ac0e1b273efc7ba7dea824b2cfbf1b1c9633d30933970). No new runtime edit or completed publication claim is made by this notes checkpoint.
