# SVGN.io Paper Delivery / Signal City

The existing browser game at `/svgn-planet/`. Start riding, then choose **Jobs (J) → Take the assignment** for the new Waterfront File investigation. The original eight-delivery neighborhood route stays available. This is one scene and one running actor, not a separate demo.

Read [Signal City: gameplay, controls and limitations](./SIGNAL-CITY.md) and the [versioned development board](./development/roadmap.html). The board retains the broader open-world feature requests and labels implemented systems separately from planned work.

## Play

WASD/arrows move. F mounts/dismounts or enters/exits a nearby stopped car. Q throws papers; E interacts. Space hops or brakes a car; Shift boosts. J opens jobs/garage, X scans, Z changes the selected device, hold H links it. R deploys/recalls a drone; Space rises and C descends while piloting. C on foot crouches; T uses the nonlethal pulse. V changes the camera; M maps; P/Escape pauses. Drag orbits the view. The default camera follows the readable character, not the world's center.

The mission takes James Vega from the SVGN desk to Open Signal's contact, a security yard, Beacon Quay and back. The powered checkpoint, rear alley and remote-drone paths offer different approaches. Devices, traffic, detection, fuel, car condition, garage credits and rewards are all local fictional simulation, never real-network hacking or real-money purchasing. There are three enterable car models in addition to the bicycle/electric-unicycle and walking modes.

## Runtime and saves

No npm dependencies or API key are needed. Serve the repository root with `python -m http.server 4173`, or play the hosted page. Three.js is bundled with its MIT license. City state is decomposed into authored world data, progression, actions, device selection and simulation modules; the renderer and UI consume that state through the existing app.

Paper progress uses `svgn.paper-delivery-3d.v1`; the new campaign uses `svgn.signal-city.v1`. Compatible old paper progress may be read from `svgn.little-planet.v1`, never written back or cleared. The fresh-paper-route button keeps city achievements/upgrades but clears transient car/drone control. Reloads restore earned progress at the newsroom, not every transient object position. Local saves are not anti-cheat accounts.

Phone automatic graphics retain capped pixel buffers, 30 fps and no shadows. Context loss offers an in-game recovery route. Completing either assignment leaves the game running. The original physical-device two-second exit was not independently reproduced; emulated Chromium cannot certify a particular phone, Safari driver or operating-system tab lifecycle.

## Verification

`node --test svgn-planet/tests/*.test.mjs` exercises original delivery, geometry and city model fixtures. Read-only Actions run the old full desktop delivery, sustained emulated-touch/graphics-recovery tests, and the actual new city investigation with normal controls. No native test assigns actor positions, velocity or completion state. Model fixtures are separate. Actual source receipts and captures are preserved in artifacts. Publication compares public file hashes with the merged source.

The first city run found a moving-car target-selection failure; the fix locks selection to object identity rather than a changing distance rank, and records the captured case as a regression. Taxi endpoint turnaround is direction-aware. Source tests are not rewritten during verification.

This is a small stylized first expansion, not a state-sized map or GTA/Watch Dogs asset, visual or feature parity. Combat beyond the electronic pulse, full cover controls, interiors, advanced parkour, vehicle variety beyond the three cars and existing cycles, property/faction systems, cloud saves, purchases, coupons and multiplayer are roadmap items, not implemented backend features. Other hosted applications and the separate side-scroller Workshop remain untouched.
