# Living Herds candidate verification

Candidate source: `5f9c881029956b2b4a41f8e880d10f49bf40789d` plus this receipt-only commit.

Automated evidence before publication:

- Full Dino Atlas model/physics/save suite passed on the Living Herds source, including Storm Response, Ranch & Coast, Spectacle & Trade, and legacy journal/vehicle tests.
- Native Chromium/software-WebGL Living Herds journey passed controller navigation, RT driving, grazer observation, water response, X reload, pause-safe reload, wildlife cue setting, predator warning, zapper interruption, articulated rigs, one-time economy reward, reload persistence, roadmap navigation, and zero uncaught JavaScript errors.
- The prior Storm Response browser journey exposed one final-pier interaction race: the prompt could be shown below 3 m/s and then A could be rejected if boat physics nudged speed over 3 m/s on the next frame. `storm-mission.js` now gives the boat-only East Pier delivery a bounded 6 m/s interaction tolerance while all location, height, story-stage and vehicle-mode constraints remain. `storm-delivery.test.mjs` locks this behavior and rejects a 6.5 m/s pass-by.
- The next complete Storm Response rendered journey is part of the Living Herds workflow and publication validation.

Manual gates remain open: physical Xbox hardware, human first-time playtesting, real audio devices, animation/art review at normal viewing distance, and consumer-GPU performance profiling.
