# Vesperfall — The Bellward Trials

An original A-Frame archery roguelite prototype, targeting Quest 3 through immersive WebXR and offering a keyboard/mouse practice mode. This is not a port, asset pack or endorsed version of any commercial game. The model, code, world layouts, UI and procedural artwork are original; A-Frame is vendored under its license.

## Run

Serve the repository root over HTTP for desktop development (`python -m http.server 4173`). Open `/vesperfall/index.html`. Immersive VR requires HTTPS (or a trusted localhost origin), an immersive-WebXR-capable browser and tracked controllers. The public app fetches no CDN assets, remote fonts, models, credentials or accounts.

## Play

A seeded sector has nine connected cloisters, ten door/bridge links, five wardens, optional supplies, three practice targets and one locked beacon. Clear the wardens; reach the beacon and interact; choose a blessing to generate the next sector. Depth increases health/difficulty, cycles among three original palettes, and rerolls the layout. This is endless sector succession, not an unbounded continuously streamed world. Renown from kills is banked at death or sector completion, once per active run. Two permanent upgrades apply on the next run. Saves are local, editable client data, not a secure leaderboard.

Desktop: WASD moves, mouse (after clicking) or arrow keys looks, hold click or Space to draw, release to fire, Q/right-click cancels. 1/2/3/4 choose standard/cinder/frost/blink. E uses the beacon. Ctrl crouches, M toggles the map, P/Escape pauses. Standard gamepad: sticks move/look, RT draw/release, A interact, Y cycle arrow, B toggle blink, LB cancel, Menu pause. Touch has movement, drag looking, draw and interact buttons.

Quest preview: bow is held in the chosen bow hand. Bring the other hand close to its string, hold the draw-hand trigger, physically draw back and release the trigger. Both controller poses must be valid. Draw-hand A cycles arrows; B toggles blink arrows. Bow-hand X interacts; Y opens the spatial menu. Right/draw-hand stick snap-turns. Blink-arrow travel is the default; slow stick locomotion is opt-in. The menu supports controller rays or stick navigation and has Exit VR. Draw lengths of 40/56/70 cm are options, not calibrated anatomical claims. Camera head tracking remains independent of locomotion. Pose loss, pausing, overextension and session changes cancel a drawn arrow.

Standard arrows are unlimited. Cinder bursts affect nearby unoccluded enemies. Frost slows enemies. Blink arrows move you only after a projectile reaches a clear floor with sufficient landing space. Teleport preview is approximate; it cannot bypass walls or place the player inside an enemy. Misses do not refund special arrows. Real head position is used for incoming bolts so ducking/dodging changes collision.

## Honest scope

Physical Quest 3 testing is still required for hand alignment, bow feel, locomotion comfort, floor calibration, stereo performance, thermal behavior and battery use. API emulation is not that testing. There is no crossbow, hand-tracking-only mode, full-body avatar, multiplayer, cloud save, commercial asset reuse or complete campaign in this first release. Continuous cliffs are prevented by the virtual footprint; do not rely on the game for real-world boundary safety. Play in a clear space and stop if uncomfortable.

The public prototype uses disposable original lore. No private repository, unpublished story, privileged service key or private narrative material is part of this app or its build. Existing public games are separate. Only the new folder and the root homepage link are intended changes.

## Architecture and tests

- `core.js`: deterministic generation, connected layout, collision, ballistic shots, enemies, rewards.
- `input.js`: tracking-aware two-hand bow state machine and bounded local profile.
- `art.js`: original batched geometry using A-Frame's THREE instance.
- `app.js`: A-Frame component and VR/desktop lifecycle, rendering and controls.
- `tests/core.test.cjs`: finite seed, physics, progression and input fixtures.
- `tests/browser.py`: real HTTP/A-Frame desktop mission and emulated-XR acceptance. Input drivers send keys or device poses; they never assign player position, enemy health or progress.

Run `node --test vesperfall/tests/core.test.cjs`. Browser suites require Playwright Chromium and a server at 4173. See the separate source/publication workflows for exact source hashes and reports. Do not equate a working renderer or a passing fixture with fun or hardware certification.

### Primary technical references

- A-Frame 1.8.0 release: https://github.com/aframevr/aframe/releases/tag/v1.8.0
- A-Frame WebXR system: https://aframe.io/docs/1.8.0/components/webxr.html
- A-Frame tracked controller concepts: https://aframe.io/docs/1.8.0/components/tracked-controls.html
- A-Frame renderer settings: https://aframe.io/docs/1.8.0/components/renderer.html
- WebXR input sources: https://immersive-web.github.io/webxr/#xrinputsource-interface


## Gothic gallery pass / v0.2.0

This continues the existing Vesperfall A-Frame implementation. The separately supplied Gloamward source candidate is not silently mixed into its mechanics. `/gloamward/` forwards to the maintained browser game to keep the previously suggested address useful.

New original assets: generated masonry/cobblestone textures, radial rose glass, vault ribs, window tracery, paired pillars, archive props, a bow wrist brace and enemy armor trim. References informed architectural scale, material contrast and first-person composition; no screenshot, ripped asset, franchise character, level, dialogue or sound is included.

The starting room has a real 3.2 m choir gallery. Walk to the left-hand staircase near the starting courtyard's back edge, ascend, cross the upper walk, then return down the same stair. Walking, clearances, blink landings and arrow collisions account for height. This is one accessible upper gallery, not a claim that every visible tower is explorable. Other room doorways, five-enemy progression and blessing gates remain connected.

A-Frame references: https://aframe.io/docs/1.8.0/introduction/best-practices.html and https://aframe.io/docs/1.8.0/introduction/developing-with-threejs.html . Runtime creation remains owned by the existing A-Frame component; static repeated geometry is batched and local textures are reused. No hardware FPS or headset comfort claim follows from this implementation.

Release gates: core/vertical checks, desktop controls, actual full expedition, tracked-device emulation and normal-input gallery ascent/return, followed by served-file hash verification. Quest 3 physical play-space, tracking, draw calibration and sustained performance remain open.
