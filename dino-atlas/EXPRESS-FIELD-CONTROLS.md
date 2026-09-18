# Express travel and field controls

Candidate build ranger-express-20260917.1; Tidegate entry tidegate-20260917.2. Baseline master dd4a9d2a35ea667fd33f3ed2b597aeda15cb27e5; runtime baseline d315307210d30736e4c9085e32bbc007a882583b, release dino-portal-20260917.1. Current-master comparison showed only portal closeout documentation and unrelated Theology work beyond that runtime. Never overwrite those changes with an archived source tree.

The user's request is a much faster unlimited vehicle speed mode, obvious destinations and active-player controls with interaction on grips and aim/fire on left/right triggers. Unlimited means no duration, stamina, fuel-charge or cooldown limit; it does not mean infinite numeric velocity, collision bypass or expanded world bounds.

## Travel

Click the left stick once (Xbox or Quest), press T, or choose the Express field button to toggle express while aboard a jeep, buggy, boat or helicopter. Choose 2x, 4x or 8x in Settings, with 4x as the default. These multiply propulsion/top-speed targets within the existing physics; they never accelerate the world clock, wildlife, mission timers or reloads. Legacy held boost remains available. The helicopter's vertical travel also gains the selected multiplier. Diagonal flight is normalized.

Brake/hover, opening a panel, tracking/input loss, session exit, boarding/exiting or changing actor turns express off. Reload never restores armed speed. Resume always requires an intentional new toggle. Existing ground collision, CCD, shore restrictions, safe boarding, flight-height limits and finite level boundaries remain. Very high settings are optional; approach docks/doors normally and brake early. No physical comfort or braking-distance certification is claimed.

## Controls

Quest Active is the default for the new separate preference key. Either grip interacts with the ordinary in-reach handler. LT aims and RT fires in every mode; neither changes throttle or altitude. The left stick travels/steers; the right stick turns or rotates the portal, with its vertical axis controlling helicopter altitude. A jumps on foot or brakes/hovers a vehicle. B opens/closes menus. X reloads; Y boards/exits. Left-stick click toggles vehicle express; on foot its held action runs. Right-stick click opens the map. Direct Water/Zapper field tiles remain available without cycling. Trigger/pinch selection still consumes UI presses and cannot also fire through the panel.

The saved Legacy Quest option retains the previous face/grip/trigger rules. Xbox defaults to its familiar A interact, X reload, Y board, B brake/back, RB tools and View map, with trigger driving and LB aiming. The optional Xbox Active profile moves driving onto the left stick, puts helicopter altitude on D-pad up/down, and reserves LT/RT for aim/fire. A/X/Y/B, menus and direct tool selection are otherwise retained. Existing quick-tool preferences are independent.

Settings and the field controls remain navigable through synthetic Xbox and the same tracked/hand-ray panel. Hand hold-to-move/fire tiles are retained. Device-specific physical acceptance is not inferred from shared handlers.

## Navigation

Both games retain their actual selected task and stage logic. An optional goal compass names the current destination, distance, bearing and known relative height; a world-space ring/arrow marks it without becoming a collider. The full map labels GOAL prominently, enlarges the target marker, and draws the player as a heading arrow. The Classic minimap pins off-screen goals to its visible edge. XR mirrors the same map and current goal text.

These are destination cues, not invented routes through walls or water. Tidegate's corrected circulation and available/closed crossing distinctions remain. The objective changes to the bridge and report when the existing rules say so; no observation/feeder itinerary flag is added. This follows the supplied place-mastery framework's information/embodiment concerns while keeping learning and route choice intact. Guidance can be disabled for exploration.

## Compatibility and verification

Only dino-atlas.travel-controls.v1 is new. Historical mission, presentation, inventory, reward and quick-tool keys remain unchanged. Preferences validate finite multipliers and do not serialize an active express toggle. The character-centered portal keeps its accepted size, placement, per-eye mask and automatic shell transparency; no vendor file is changed.

All 181 original model tests passed after the first implementation. The expanded local suite passes 198 tests, including trigger separation in every mode, neutral/blocked source behavior and temporary pose-loss recovery, 60 simulated minutes of nondepleting express policy, settings isolation, bearings, actual vehicle acceleration, diagonal normalization and a fast jeep and an 8x helicopter versus thin solid walls. Real-Rapier fixtures measured the jeep at about 15.08 versus 60.33 game units/second and the Classic helicopter at 14.62 versus 58.48 after the fixed measurement interval. These isolated fixtures are not human route times or one-hour headset flights. Initial strict assertions exposed negative-zero neutral values; normalization was corrected and failure output is retained.

The new native runner uses actual input and collision to walk to and board each game's helicopter, climb with the mapped stick, fire without changing altitude, fly in express, brake/hover and recover through menus/reload. It also captures map/controls and checks saved Active/Legacy settings. Device/session and inspection poses are explicitly mocked; gameplay state is not assigned. All original Tidegate, service, portal and Classic suites remain required.

Local Chromium navigation is blocked by administrator policy. Native rendering uses GitHub Actions, not a workaround to that restriction. Candidate, merged source and public-byte/play checks remain separate. The intended release is dino-express-20260917.1, created only after the established public gate succeeds, without replacing historical tags. See the current handoff for actual completed results rather than treating this plan as acceptance.

Physical Xbox, Quest controllers/hands, real headset stereo/passthrough, comfort at express speed, hardware performance, readable markers under varied lighting and human wayfinding remain open. No human enjoyment or production-grade level quality is claimed. Next iteration should address observed input conflicts and braking/landing usability before expanding the world.

Technical basis: bundled Rapier and Three versions unchanged. WebXR primary trigger index 0, squeeze index 1 and thumbstick axes 2/3 follow https://www.w3.org/TR/webxr-gamepads-module-1/ ; the face-button layout is the existing Quest-targeted project mapping, not a claim about arbitrary XR devices. Collision and CCD follow https://rapier.rs/docs/user_guides/javascript/rigid_bodies/ .
