# Rainward future direction and running work log

This is the durable design record requested by the owner on September 22, 2026. Update it during implementation and after verification, not only when a chat ends. Read DEVELOPMENT-HANDOFF.md, AGENTS.md, release.json, production-plan.json and this file at the beginning of a continuation. Repository source and actual receipts outrank earlier chat claims.

Current completed checkpoint: the playable Reclaimed Places build at e361025f37bc19e836ee18328cb9da239d361f32 is verified live. See evidence/reclaimed-places-20260922/playtest-verification.json and PLAYTEST-HANDOFF.md in that same evidence directory. Earlier checkpoint paragraphs below are historical; the final section records their resolution.

## Player experience

Build a focused survival-stealth adventure through reclaimed places, not a replacement demo or a collection of bigger empty maps. Borrow general design principles from The Last of Us: functional rooms with traces of ordinary life, constrained resources, contrasting quiet and pressured stretches, observation before commitment, interconnected interior/exterior routes, and escape after detection. Do not copy franchise layouts, characters, fiction, audio or assets.

Every encounter needs a readable destination, an observation opportunity, hard cover distinct from foliage concealment, a meaningful alternate route and a recovery option. A route trades time, exposure, information or resources; it should not simply be better in every way. Let machinery and optional repairs change real circulation that enemies can use as well. Environmental stories should be visible in rooms and objects before they need a text explanation. Avoid filling paths with explanatory signs or turning every pickup into a menu.

Maintain the current praised character bodies/faces and recovered animation. Preserve seven chapter identities, current and older saves, finite resources, reward idempotence and the existing controller remaps. Keep fast no-fatigue default running and selectable legacy movement. Survival tension should come from exposure, resource decisions and enemy behaviour, not compulsory slow travel. Maintain Xbox gameplay and every menu, Quest controller input, hand UI, first-person VR/AR and third-person portal views. Never attach a compulsory menu to the player's gaze or force their head orientation.

## Implemented level foundation

Reclaimed Places was committed as a1b74d4174e94a169925366790b99d3476961eef. Floodgate's formerly solid quay ruin contains connected pump and evacuation rooms, an observation sill, multiple exits and contrasting exposed approaches. Terminus has a dry-record outer aisle and dispatch/workshop escape shutters opened by its existing optional tasks. The original puzzle, components and rewards remain required/unchanged as appropriate. Read RECLAIMED-PLACES.md and reclaimed-places.mjs rather than rebuilding these features.

The subsequent 953a187e2d1c97c0e88823cd4963e73bcfb59c22 art correction moves quay plaques onto solid surfaces and removes mirrored backs. This was the latest Rainward source found when resuming at repository master efdd38a3565a9e34701eacc48c1894a5b82b547c.

## Initial continuation checkpoint

The original a1b74d4 living-enemy browser journeys passed both chapters, but the 953a187 district replay died in the existing freight aisle with a smoke remaining. That is a real failed journey, not permission to change health or remove enemies. Diagnose input timing and route recovery separately from level defects, retain the failed trace, and never label a model fixture as a native playthrough. The 953a187 publication verifier initially reported a stale art file; its later verified retry is recorded below.

Make the new direction easy to discover from the existing title/chapter selection and journal without starting a different demo, planting progress or replacing a player's checkpoint. Where an existing task opens a route, its complete description and completion feedback should explain what actually changed. Any new fix must be narrowly scoped, tested and directly committed to freshly reread master without force or a new PR.

## Future chapter work, not yet implemented by this record

Conservatory should develop horticultural terraces, water-state clues, maintenance circulation and visible return connections. Meridian should deepen occupied rooms and household/service relationships rather than repeat anonymous blocks. Breakwater should contrast exposed height, sightlines and shelter. Whiteout should use memorable thresholds and reliable sound landmarks under poor visibility. Northlight should link dry observation, submerged recovery and service corridors. Expand only after real movement, camera, resource and encounter tests of the previous slice.

Weapon handling, enemy tactics, authored Foley, interior acoustics, dramatic silence and additional interaction families remain separate roadmap work. Do not claim new weapons, imported action clips, arbitrary climbing or full campaign redesign merely from a level-art pass. Map changes to existing RW-009, RW-011, RW-012, RW-013 and RW-028 tasks; keep all human approval gates open until actual review.

## Save checkpoints for future chats

At each meaningful checkpoint, record the exact commit, changed paths, tests actually run, unresolved failures and next action here or in a linked evidence receipt. Before reporting a release, record a successful public-file comparison separately from the GitHub commit. Keep local model tests, ordinary-input browser journeys, artificial XR device rendering, physical Quest/Xbox and human quality judgments distinct. Do not clear localStorage, overwrite concurrent sibling work, create unnecessary workflows, or substitute a scheduled job for completed delivery.

Initial session checkpoint 741a96979430d6d2faf78c6b5d29bb76e9500eda saved this direction before runtime editing. Source was extracted from the authentic 953a187 district artifact (SHA-256 6c1833594f3671b97b3ac0e1b273efc7ba7dea824b2cfbf1b1c9633d30933970). The intermediate 67eff167ec889ef02611d72353918bca315e2951 checkpoint saved exact pending workflows and next design work before tests completed.

## Completed September 22 playtest checkpoint

Actual runtime source: e361025f37bc19e836ee18328cb9da239d361f32. Build: rainward-reclaimed-places-playtest-20260922. Version: 0.16.4. The title now identifies The Floodgate - RECLAIMED QUAY and Bellweather Terminus - ESCAPE ROUTES. The existing journal shows read-only route opportunities, current prerequisites and earned open states, and retains full task completion feedback. All seven chapter choices and the ordinary Start/Continue/save paths remain. No additional gameplay overlay or new button mapping is introduced.

All 469 hosted model/source tests passed, as did six continuous model missions. Separately, both real HTTP/WebGL browser missions passed from ordinary title Start through the new routes, extraction and earned checkpoint reload: Floodgate passed 15 checks with health 61 and five living enemies; Terminus passed 19 checks with health 53 and four living enemies. Neither mission fired a shot or removed enemies. These missions use synthetic standard Xbox inputs and the supported Classic/legacy movement option, not physical hardware or universal timing acceptance. The earlier freight-aisle death remains documented.

The four controller-view Field Desk journeys and the AR-hand journey's browser step passed, as did the retained-body motion fixture. The separate extended compositor workflow 35786158144 has not been confirmed complete by this checkpoint. Physical Quest/Xbox, passthrough appearance, sustained frame rate and unfamiliar-player approval remain open. Do not treat artificial XR devices or procedural-fallback captures as final hardware/art review.

Publication workflow 35786158103, third attempt, job 106949890366 succeeded. Its downloaded artifact 10720144019 was locally inspected: all 190 receipt paths returned HTTP 200 and matched the e361025 source manifest, including the five paths previously old or missing. Archive SHA-256: c2ff41821845b41a404b53dad91ef91982efe9d6728192f49d354249f9ed7334. Both earlier failed publication receipts are retained in the verification record. The 953a187 correction was separately verified against all 188 of its files before this newer build. A cancelled Pages job was never treated as successful delivery merely from its name.

This completion update changes notes only after the e361025 game was verified. It does not change any verified runtime file or release.json. The exact source receipt therefore remains evidence of that playable release, not a claim that subsequent documentation was already served at verification time.

Next: observe player route choices, right-stick scrolling to the lower journal advice, and the clipped edge of existing world guidance in tight rooms. Then design one Conservatory maintenance/observation loop against its existing archive-pages/garden-seeds tasks and shallow pools; do not silently turn old walkable saves into swim-required routes. Preserve the current original puzzle, lens/core positions and one-time rewards. This proposed next slice is not yet implemented.
