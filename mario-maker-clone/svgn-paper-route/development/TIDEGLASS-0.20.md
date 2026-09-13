# Tideglass Baths, v0.20.0

Build: `sky-cycle-tideglass-2026.09.13`. A new playable water destination inside the existing Sky Cycle. The seven original route indices and IDs are retained; Tideglass is appended as route 7, with stable ID `tideglass-baths`.

## Play

Open Sky Cycle with `?destination=tideglass-baths`, select Tideglass Baths from Routes, or use Water portal in the header, pause menu or Flight Deck. A matching portal marker near the start of Sunrise Borough opens the same destination selector with E or D-pad Down. Travel explicitly starts a new route run; it does not bank unfinished discoveries or pretend to preserve a suspended run. The selector warns about this and blocks travel while the Workshop has an unsaved draft.

The level is a vaulted tiled bathhouse with three pools, chrome ladders, benches, warm ceiling panels, portal rings, a dry promenade, four checkpoints and five optional delivery targets. Its presentation is inspired by the supplied indoor-pool references while keeping Sky Cycle's side-scrolling unicycle controls. It is not a first-person swimming game. Water is scenic, behind the collision road; falling or swimming mechanics are not introduced in this release.

Ride to the brass wheel in the Sluice Gallery and press E or D-pad Down. Mirror Pool lowers over 150 active simulation steps and the sluice rises. This reveals the waterline deck and makes its authored rail available to the physics engine. Take the mint-marked jump approach to ride the short optional branch and return naturally to the dry road. The entire level can also be completed on the continuous promenade without opening the sluice.

Finish through the exit ring to record a visit. Opening the sluice and observing at least 140 units of forward travel on its rail before the finish earns the optional Bathhouse Keeper seal. A brief touch, a closed sluice or an unaccepted finish cannot earn the seal. Repeated win callbacks cannot duplicate a visit. The Water portal selector provides a controller-accessible route back to Sunrise Borough.

## Water, art and input

Pool surfaces use the existing pinned Three r177 renderer with procedural normal variation, view-angle transparency, soft highlights and caustic-style light patterns on ceramic walls and floors. Mirror Pool is a raised pressure basin with retaining glass and ceramic walls around its initial high waterline. These are stylized shaders, not ray-traced caustics, fluid simulation, or live render-to-texture portals. The elevated scenic camera, including the existing wide-view preference, reveals the pools while leaving the side-scrolling collision plane unchanged. There is no fullscreen VHS distortion, shake or forced blur copied from the references.

The bathhouse has its own material treatment; the generic outdoor Prismatic pavilions and sky effects do not appear inside it. The existing motion preference and operating-system reduced-motion preference freeze decorative shader animation. Mechanical sluice and water-level changes follow simulation steps and freeze when the game is paused. The supported 2D renderer has a matching tiled-pool backdrop and visible sluice state.

The portal selector is a native dialog operated by the existing Flight Deck controller focus system. B closes only the top dialog and restores the parent pause. Losing visibility, focus or a controller cancels an automatically owned resume. Nearby world prompts support E, D-pad Down and a touch/mouse button without replacing saved gameplay bindings. Objective and interaction placement measures the existing flight HUD, including its raised mobile layout, rather than covering the riding instruments.

## Save and source boundaries

The independent record key is `svgn.skycycle.bathhouse.v1`. No original delivery records, career badges, Market Pilot seals, exploration stamps, Workshop drafts, audio settings or controller remaps are migrated or cleared. A failed record write is disclosed as session-only progress. The level remains playable without successful local storage.

The closed/open rail is controlled through the live rail list only; the canonical level code and the authored custom curve document are not rewritten when the sluice changes. Checkpoint respawns retain the current run's sluice state, while a new run closes it again. Existing authored and edited copies of all previous courses remain unchanged. Edited bathhouse courses can operate the mechanism but cannot earn authored-route records.

The integration modifies only the campaign loading sequence, a 2D backdrop hook, the outdoor-effects boundary, paused-dialog scene reuse, and the release/cache identifiers. New art resources remain under the existing disposable scene root. Roll back only the ten owned runtime files named in the verification receipt; never reset repository history or revert other games. Keep the isolated save key for later compatible versions.

## Acceptance and limitations

Source-specific completed evidence, the actual tested commit and independent public-byte verification are recorded in `verification/tideglass-0.20.json`. Unit/model tests and native browser runs are separate evidence. A successful fixture is not described as a full native playthrough, and a scheduled workflow is not counted as a passing test.

The local exact-source suite passes 35 new checks, covering destination/state preservation, real Three node-material construction and nine isolated carried-state rail runs. The 88 existing Sunrise, Compass, Flight Deck and Luminous rules also pass. These 123 rule/model/graph checks do not replace native rendering and complete-route tests.

The browser acceptance suite uses normal key/button input and sampled standard Gamepad input. It starts through the destination link, renders pools and portals in 3D, operates the sluice and checks its paused state, reaches the real optional rail, and completes the route through the original win logic. Complete movement uses the supported 2D view on the software-rendered runner; 3D scene captures and sluice rendering are checked separately. It also tests a full dry-route finish, replay reset, return travel and persistence after reload. There are no player-position assignments, forced wins or score assignments in native acceptance.

Physical Xbox hardware, actual mobile devices, native WebGPU execution, full hardware-accelerated 3D route completions, long-session memory/frame-time budgets, all old expert courses and independent human playtesting remain open. The bathhouse is a playable first destination, not a claim that the whole AAA roadmap is complete.

## Rejected native candidate and accepted gameplay evidence

The first native run, `34738654629`, tested integrated commit `9c64695cf5e59d3210175ebd8d472865cd24f309` and failed during bathhouse art construction. The legacy renderer exposes a selected constructor facade rather than the complete Three namespace; `m.THREE.TSL` was absent. The failed artifact `10311502811` retains the error, blank-scene capture and video. It is not counted as passing gameplay or shader evidence.

The correction imports TSL from the same vendored r177 module already used by the game's other shaders, and the art test now deliberately omits TSL from the engine facade to exercise the actual integration boundary. It also adds retaining walls around the raised basin and does not alter the route's collision grid.

Candidate `df51bb4c8f41112b5d8aa3d40db74f9353c50a3e` passed both jobs in run `34739134804`: 23 native destination checks and 21 existing Sunrise checks. Artifact `10311922923` records two real first-attempt bathhouse completions, one with the sluice and rail and one entirely on the dry road. Artifact `10311898119` records three first-attempt Sunrise completions. Both reports contain no uncaught JavaScript exceptions. Four generic blocked-resource messages from the origin-restricted destination harness are retained, not hidden or presented as shader errors.

Capture review then identified an overlap between the objective and existing flight HUD. Candidate `9cb7afe8e82854be5681f29dabd41d59185dc41d` corrects the layout without changing course geometry, shaders or progression, and adds desktop/mobile no-overlap checks. Run `34739539558` tests that exact final runtime; completed results belong in the verification receipt. The earlier accepted candidate must not be relabeled as a later commit's test. CI now uses read-only repository access and records the actual checkout SHA.
