## Pilgrim's Rest v0.9.0 and the production path

The current release adds bounded local saved expeditions with paused continuation, combined progression receipts, Xbox/Quest save menus and damaged/stale-save recovery. See [Pilgrim's Rest](./PILGRIMS-REST.md) for behavior and limitations.

The long-term plan is stored here: [Production board](./roadmap.html), [Excel workbook](./AAA-PRODUCTION.xlsx), [quality-gated roadmap](./AAA-ROADMAP.md), and [canonical task data](./roadmap.json). The board preserves the original task IDs and now maps 76 tasks through 7 milestones. Device and human acceptance remain separate from software implementation. The workbook is a versioned six-sheet snapshot, not automatic GitHub synchronization.

Current release: 0.8.0 Resonant Hunt. See RESONANT-HUNT.md for the current audio controls, reversed Quest grip roles, weapon-hand crossbow trigger, palm familiar, pickup pull and tactical quiver. Older release notes below describe their historical controls.

# Vesperfall — Arrows Unchained

Original A-Frame browser archery roguelite, with a Quest 3-targeted immersive WebXR preview. The current development series is **v0.5.0 / Living Cathedral**. Check the publication workflow for the version actually served at https://v5ma.github.io/vesperfall/index.html . A branch or successful model test is not a deployment receipt.

The game remains in the existing `vesperfall/` folder. The earlier `gloamward/` address forwards here. Other public projects and unpublished story material are separate. No private narrative, privileged service key, account system or remote story import is part of this app or its workflows.

## Play and controls

Defeat five wardens, reach the open beacon, choose a blessing, then enter another generated sector. Enemy-free practice and single-opponent combat trials use the same movement/projectile rules without advancing permanent achievements.

Desktop: WASD moves; mouse dragging or arrow keys look. Hold click or Space to draw; release to fire. Q/right-click cancels. 1/2/3/4/5 select Standard/Cinder/Frost/Blink/Volley. E uses the beacon. Ctrl crouches; M toggles the atlas; P/Escape pauses. V switches bow/crossbow; R manually reloads; hold H raises Wardglass; B spends a regenerating shard step. Clickable/touch equipment controls expose the same actions.

Standard gamepad: sticks move/look, RT draws or fires, A interacts, Y cycles arrows, B toggles Blink, LB cancels, Menu pauses. LT holds the shield, X reloads, RB shard-steps, and right-stick click switches weapon. Unknown non-standard mappings are not promised. Physical Xbox/controller testing remains open.

Quest preview: select a bow hand in the menu. Bring the other controller to the string, hold that hand's trigger, pull back and release. Both poses must be valid. Draw-hand A cycles arrows; B toggles Blink. Bow-hand X interacts and Y opens the spatial menu. Draw-hand stick snap-turns. Bow-hand grip holds the shield; draw-hand grip performs a shard step. Bow-hand stick click changes weapon; draw-hand stick click reloads the crossbow. The crossbow aims with the bow controller and fires with the draw-hand trigger. Pose loss and session/menu transitions cancel held actions and require a fresh neutral trigger. Spatial menus provide Exit VR.

Blink-first locomotion is the default; slow stick locomotion is opt-in. Draw-length options are 40/56/70 cm, not anatomical calibration guarantees. Head tracking remains independent of virtual movement. A clear real-world play space is still required: virtual collision is not a physical safety boundary. Stop if uncomfortable.

## Living Cathedral: more than shuffled square rooms

Each bounded sector still uses **nine logical room positions** and a connected spanning path with two extra graph links. It is not an unbounded, streamed or arbitrary freeform city. The same seed and depth recreate a layout; increasing depth rerolls it.

What changes in v0.5: seeded column/row spacing, true room width/depth, physical perimeter shapes, bridge lengths and the placement of a high inter-room route. Five new families accompany the preserved Choir Court: the 16×22 m Long Nave, 20×18 m Rain Court, actual cross-shaped 20×20 m transept, 16×18 m Archive and 18×20 m Belfry. Doorways are cut only where graph connections actually exist. Naves and archives have solid pitched roof volumes; courts remain open. Decorative skyline details are not all enterable spaces.

**Processional Skywalk:** ascend a room's stair to the 3.2 m gallery, cross an elevated connection to another room, and descend its other staircase. Travel works in both directions and the ground route is still available. The route has physical floors, side rails, doorway clearances and stair-mouth slab notches.

**Belfry Crown:** a second flight begins on an upper gallery and reaches a 6.4 m balcony. Climb, explore, and return through the same continuous geometry; no scripted teleport is used to make the stairs work.

Two optional reliquaries reward these routes: the skywalk cache and belfry cache each add 100 run score and restore up to 12 vitality. They are single-use within the sector and height-gated, so walking underneath cannot collect them. Practice can demonstrate the reward but never banks Chronicle progress or renown. Their gold diamonds and the dashed upper connection appear on the rescaled atlas. District names and current elevation help orient the player.

For a first look, use seed `BELL-01`, choose Practice, then press M. The gold upper link joins the High Belfry and Rain Court; a second stair in the Belfry reaches its crown. Other seeds preserve the circulation rules but change the arrangement.

## Graphics and real asset intake

This is an art-production pass, not another concept-image promise. The app now uses local, optimized **Poly Haven CC0** assets: Castle Brick 01 and Cobblestone Floor 02 by **Rob Tuytel**, plus Marble Bust 01 by **Rico Cilliers**. Photographed color/OpenGL-normal/packed-occlusion-roughness-metalness maps are limited to 1024px. The sculpture retains its 17,456-triangle mesh and embeds 512px material images into a 586,700-byte GLB. The seven binary derivatives total about 2.15 MB. Exact bytes, authors, original URLs, transformations and checksums are recorded in `assets/cathedral/ASSET-REGISTER.json`. License: https://polyhaven.com/license . The website's example renders are not used.

The original structural artwork now uses continuous beveled pointed arches instead of rows of little blocks, lathed balustrades, clustered columns, distinct roof silhouettes, original leaded rose-glass patterns, contrasting trim and world-scaled UVs. Materials and the loaded sculpture are reused across generated sectors. Static geometry is batched by material and spatial cell so offscreen portions can be culled. Small balustrade posts have a lighter mesh than foreground columns.

Optional desktop sun shadows are cached for static architecture and refreshed when the world/sculptures rebuild or the option changes. This is not animated character-shadow support. Shadows are disabled during immersive VR and start disabled on coarse-pointer devices. There is no promise of a particular frame rate without profiling physical hardware. Daylight/twilight settings remain available.

The old stylized bow, hands and combat characters remain a visual gap; this pass does not pretend a stone material makes them finished character art. Detailed imported character/weapon assets, animation and richer foliage need separate coherent art/rigging work. Do not scatter unrelated free packs into the scene.

## Preserved combat and progression

The Living Bow uses actual draw strength; Bellsteel has a separate loaded/empty state and timed manual reload. Switching weapons does not refill it. Standard arrows are unlimited; Cinder/Frost/Volley charges are finite. Cinder detonates on first impact including stone/floors and respects blast occlusion. Frost briefly freezes and interrupts attacks. Volley releases three independent projectiles for one charge, after its milestone is earned; practice has a separate trial supply.

Wardglass is a directional disk, not omnidirectional invulnerability. It consumes guard, breaks and recovers; raised guard prevents firing. Short shard steps follow supported, unobstructed ground and stop at walls, enemies or gaps. They are button-triggered microdashes, not a physical throwing gesture. Crossbow winding is likewise a button action, not a tracked-hand reload gesture.

Blink previews use the same fixed-step projectile and first-hit/landing rules as actual arrows. Green indicates a valid destination at the current draw strength; coral indicates a blocked/invalid trajectory. Changing draw before release changes the path, and an enemy can move into the destination. Neither previews nor blinks ignore the underside of floors or solid roofs. A light draw is useful for nearby upper landings.

Ash Cantors telegraph committed three-bolt volleys. Rift Hounds charge a fixed line and recover. Bell Sentinels deflect frontal torso shots while exposing head/flank/recovery opportunities. Ground patrol routing remains room-graph based; this is not a claim that every enemy has advanced multistorey navigation.

The local Chronicle banks new run-counter deltas on death, sector completion or a deliberate restart: five kills unlock trial Volley charges for new runs; three precision hits improve reload; five blocks improve guard; five blinks add a shard charge; one cleared sector unlocks optional Nightfall. Practice never advances those totals. Existing renown, purchased health/power improvements and records migrate in place. These are editable local client records, not secure cloud accounts or full-run save/resume.

## Verification and release

`node --test vesperfall/tests/*.test.cjs` exercises the deterministic source. The v0.5 model suite includes 100 seeds walked continuously through both directions of the skywalk and up/down the belfry, correct-height one-time rewards, and floor/projectile clearance checks. A finite seed sample is not a universal proof or a human enjoyment rating.

Native Playwright checks use the actual HTTP A-Frame renderer and ordinary keys/buttons; observations guide navigation without assigning player positions, enemy health, game time or rewards. The `cathedral-browser.py` visual suite records matching views of the exact prior version and current scene at full pixel ratio. Long route checks reduce only the software GPU drawing buffer, disable the exposed desktop-shadow option, and record their resolution in the report. Model fixtures, native rendering, emulated XR and physical-device acceptance are different evidence categories. An earlier route timeout is retained; diagnostics distinguish time limits from actual movement stalls.

Existing equipment, full-sector, gallery, combat, launch and emulated-XR suites remain release gates. Physical Quest 3 controller alignment, bow feel, floor calibration, comfort, sustained stereo frame time, thermal behavior and battery use are still unverified. Passing API emulation is not hardware certification.

Read-only workflows preserve exact tested-source hashes, screenshots and failure reports. The separate publication workflow compares declared served bytes to the merged source and launches the actual homepage game card. Only that receipt establishes a public release; metadata and this README alone do not.

## Source map

- `core.js`, `encounters.js`: movement, projectiles, guard, foes, rewards and deterministic combat.
- `districts.js`, `architecture.js`: seeded plans and shared physical floors/solids.
- `cathedral-art.js`, `cathedral-ui.js`: material-authored world, local glTF, scaled atlas and visual settings.
- `art.js`, `gothic-art.js`, `hunt.js`, `arsenal.js`: retained equipment/foe rendering and input feedback inside the existing A-Frame scene.
- `input.js`, `chronicle.js`, `app.js`: input, lifecycle, local records and the shared runtime.
- `scripts/prepare-cathedral-assets.py`: optional named-asset production intake; never called by the game or read-only tests.
- `roadmap.json` / `roadmap.html`: committed plan and browser-local planning board. Board edits do not mutate GitHub or saved runs.

A-Frame is vendored under its license. Technical references: https://aframe.io/docs/1.8.0/introduction/developing-with-threejs.html and https://aframe.io/docs/1.8.0/components/material.html . No external runtime CDN, account, tracking service or commercial-game asset is required.


## Jewelglass / v0.6.0

The current material/foreground/effects update and its exact scope are documented in [JEWELGLASS.md](./JEWELGLASS.md). Choose Balanced, Jewel, or Classic in Pause / settings → Jewelglass. Jewel provides desktop optical refraction on two hero stones; WebXR falls back automatically to bounded reflective materials. All existing runs, seeds, combat and Chronicle records remain on the same engine.
