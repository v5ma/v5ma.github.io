# Dino Atlas: Wild Frontier

This is the first playable vehicle-driven upgrade of the existing Dino Atlas, not a replacement of its learning data. Open index.html over HTTP(S). The original 2D/3D walking expedition is preserved at walking.html, and the fossil lab, quizzes, journal, and illustrations remain at field-guide.html.

## Play

Drive through the main gate, observe a plant-eater, restore the northeast relay, recover the field recorder in the northern habitat, and deliver it to the visitor center. Amber markers and the map identify the current objective. Stop before interacting. After delivery, the park remains open for free exploration and six dinosaur observations. The equipment yard includes pushable crates and a ramp.

WASD or arrow keys drive. Space is the handbrake. Shift boosts. E interacts. H sounds the horn. J hops. R recovers the jeep at base without clearing the mission or journal. Drag to orbit, scroll to zoom, C changes camera, M opens the map, and Escape pauses. Mobile devices have pointer-based steering and pedal controls. Standard gamepads use triggers for forward/reverse, the left stick for steering, A for interaction, B for handbrake, X for horn, Y for recovery, the left shoulder for a hop, and the right shoulder for boost. Controller mappings can vary by device.

The menu offers orbit/chase cameras, dusk with headlights, reduced motion, and low graphics. Low graphics are selected automatically after sustained slow frames, unless the user has chosen a quality. Audio is opt-in and synthesized locally. It includes an engine tone, interaction tones, and a two-tone horn, not film music, recorded dinosaur calls, or a full environmental soundtrack.

## Architecture and provenance

Three.js uses the existing locally hosted distribution and retains vendor/LICENSE. Rapier 0.17.3 is pinned and self-hosted as vendor/rapier.mjs, copied without logic changes from the rapier.es.js distribution of @dimforge/rapier3d-compat. Its embedded WASM needs no external fetch. vendor/RAPIER-LICENSE contains Apache-2.0. Rapier is developed by Dimforge and contributors: https://github.com/dimforge/rapier.js and https://rapier.rs/.

The interface and playful vehicle-driven navigation are inspired by Bruno Simon's portfolio at https://bruno-simon.com/ and https://github.com/brunosimon/folio-2025. This build is an independent implementation, not a wholesale clone or asset extraction. It does not copy Bruno's code, models, branding, level, audio, or portfolio content. The current reference project uses a much larger custom world and feature set. This first playable build does not claim equivalent polish or feature completeness.

The jeep, buildings, plants, dinosaurs, signs, and terrain are original procedural geometry. The cream-and-red safari aesthetic is movie-inspired, but no Jurassic Park logos, film models, characters, soundtrack, or dialogue are included. This is not an officially affiliated franchise game. Animal designs, sounds, habitats, and behavior are stylized gameplay, not validated reconstructions. The fictional reserve deliberately includes animals from different periods and places. Existing field-guide evidence and uncertainty notes distinguish those facts from the game's fiction.

ranger-data.js contains deterministic world data, save validation, campaign progression, and simple animal behavior. ranger-physics.js contains the Rapier raycast jeep with four-wheel suspension, steering, braking, collisions, jumping, and recovery. ranger-art.js constructs the original models. ranger-world.js builds the reserve. ranger.js connects rendering, input, mission state, UI, and persistence. ranger-audio.js provides opt-in synthesized audio.

## Saves and safety

The existing dino-atlas.progress.v1 key is retained. New observations merge into the current journal before writing; old notes, excavations, and quizzes are not reset. New mission progress uses dino-atlas.ranger.v1. The original clue key is unchanged. Recovering the jeep keeps progress. Restarting the mission clears only the new ranger campaign. Nothing is uploaded to a server. There are no accounts, analytics, API keys, AI services, or paid dependencies. Normal runtime assets are all same-origin.

## Verification

Run npm test for the original tests, and node --test tests/ranger.test.mjs for campaign, save, dinosaur model, and real physics tests. Run python tests/ranger-browser.py with Python Playwright and Chromium installed for actual HTTP/WebGL tests and screenshots. The browser suite uses real controls for driving, turning, recovery, pause, touch, and passage through the restored gate. It uses explicit ?test=1 repositioning only to accelerate station-interaction coverage; those tests are not evidence that a human drove the entire course. Debug repositioning is absent unless ?test=1 is present. Workflow artifacts contain the actual report and screenshots. Treat the report for a particular commit, not this document, as the authority on passing tests.

## Scope and next work

This version supplies one compact, playable mission. It has simple roaming, startled herbivores, and a bounded pursuing tyrannosaur; it does not have full navigation meshes, complex ecological AI, a cinematic campaign, multiplayer, gamepad certification, photorealistic models, or feature parity with Bruno's site. A deeper campaign, better terrain elevation, model animation, sound design, accessibility options beyond the current controls, and testing on physical mobile devices are future improvements.

## Rollback

Revert the Wild Frontier upgrade commit, or restore index.html from walking.html. Do not clear localStorage. Other games, root navigation, the original field-guide modules, original expedition modules, and existing saved data are outside this change's scope.
