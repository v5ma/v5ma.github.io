# Signal City / The Waterfront File — v0.3.0

An additive open-world campaign in the existing online `svgn-planet/` game, not another standalone demo. Keep SVGN.io Paper Delivery as the app identity. The staged development board is at `development/roadmap.html`; its source is `development/backlog.json`.

## Start and play

Start riding, press **J** (or Jobs), and choose **Take the assignment**. This makes the current objective the Waterfront File rather than a paper delivery. Return to the paper route through the same Jobs board. James Vega, Open Signal and CivicGrid are original working names, editable before a larger narrative release.

The field desk is beside the existing depot. Collect the kit, meet Nia at the new plaza, obtain evidence from the secured yard, record the quay report and return to publish after losing the trace. The yard offers a powered front gate, an unpowered rear alley and an overhead drone approach. These are authored paths in the same world, not teleport/menu choices. Optional side dispatches are simple one-time proximity deliveries, not a full service-job career.

**WASD/arrows:** movement; **F:** enter a nearby slow car, exit after braking, or switch bike/unicycle and walking elsewhere. **Space:** hop or car handbrake. **Shift:** pedal/sprint, or drive with nitro after fitting it. **Q/E:** original paper throw/nearby delivery; **E** also interacts with a nearby story objective. **X:** scan. **Z:** cycle scanned targets. **Hold H:** link a device after stopping and getting within line-of-sight/range. **R:** drone deploy/recall. **Space/C while piloting:** rise/descend. **C on foot:** crouch. **T:** nonlethal short-range pulse. **J:** Jobs and garage. **M/P/V:** map, pause, camera. Touch buttons expose the primary actions; physical-device ergonomic testing remains necessary.

The scout has limited range, altitude and battery. Your body stays at its launch point and may be detected; recall restores control there, never at the drone position. Traffic, gate, camera loop, speaker diversion and cars are fictional local simulation objects. No external device, phone, account or surveillance system is contacted.

Switchback Garage requires physical proximity. Service costs 20 in-game credits; fitting nitro costs 60 once. The first 80 credits are a starter grant, not earned income. Paper delivery grants 10 once per address; side jobs and investigation completion pay additional credits. No real-money store exists.

## Runtime boundaries

`city-world.mjs` owns added road/structure/device locations, rectangular collision and local line-of-sight geometry. `city-model.mjs` extends the existing fixed-step actor with cars, drone, mission state, garage and patrol trace. `city-scene.mjs` adds geometry to the existing Three.js scene; `city-ui.mjs` supplies the board, minimap and contextual controls. Original `world.mjs` retains the curved topology and character-scale neighborhood; new dry road/bridge height and consistent vegetation clearing accommodate the addition. There is one renderer, not a second hidden game.

Original route data uses `svgn.paper-delivery-3d.v1`. City progression uses `svgn.signal-city.v1`. Neither clears sibling game data. Completed investigations resume at the newsroom; transient car positions, patrol search, drone flight and alert state are not full-world saves. Credits/upgrades/completed jobs persist. Local saves are not tamper-proof competitive accounts.

## Verification and known limits

Read-only Actions acceptance checks deterministic fixtures and actual browser play through ordinary keyboard/UI, plus the retained delivery and emulated-touch/context-recovery scenarios. The observer returns copied state. Seeded model fixtures, ordinary-input complete routes and fault-injection recovery are different evidence; only passing final reports should be presented as acceptance. The user's earlier physical-device tab exit is not diagnosed by Chromium emulation.

This milestone is a small, stylized city addition, not a state-sized map or reproduction of the San Francisco Bay Area. There is no weapon targeting/cover-fire system, articulated climbing, enterable building interior, RC jumper, six-tier police/military response, clothing shop, property business, gang territory, aircraft, swim/dive, train, multiplayer, account/payment/coupon service or Supabase deployment yet. There is a nonlethal pulse, rudimentary sight/cover/trace, a small garage economy and distance statistics. Vehicle damage is aggregate condition, not individual tire/body-part simulation. Cars use arcade steering and one simple traffic agent; realistic traffic is still a backlog item.

The roadmap retains those larger requests with explicit dependencies and acceptance criteria. Asset fidelity and human enjoyment need ongoing iteration; passing tests alone does not establish either. Keep every unrelated hosted game and the separate side-scroller Workshop intact. Revert the scoped release to roll back, never reset the repository or delete user saves.
