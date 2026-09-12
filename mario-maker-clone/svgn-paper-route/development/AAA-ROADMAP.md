# Sky Cycle: AAA-quality development roadmap

This is the canonical, living production checklist for Sky Cycle, the existing side-scrolling game in `mario-maker-clone/svgn-paper-route/`. It is not the roadmap for Neighborhood Missions, Prism Current, or Dino Atlas. Updated September 11, 2026.

AAA is the quality ambition, not a status conferred by a version number, graphics setting, or this checklist. A checked implementation item does not certify its entire milestone. Each milestone needs recorded acceptance evidence before its release gate is complete. Do not invent a completion percentage from differently sized tasks.

## Product pillars and non-negotiables

Preserve the momentum-driven bicycle/unicycle identity: read the route, commit to a line, launch, catch, deliver, and discover an alternate path. Ground adventures and optional expert sky routes remain part of the same game. The editor, independent Bezier controls, authored-route progression, original instrumental score, and existing saves must survive every upgrade. Do not replace this game with a new prototype.

A console controller should operate the normal play loop, routes, pause, results, settings, and confirmation dialogs. An attractive screenshot is not acceptance evidence for an unrideable level. Reachability fixtures supplement, rather than replace, recorded real-input playthroughs. Never grant progression from an editor simulation or a partially loaded route.

## Current source baseline

Existing development notes document ground adventures, launch loops, the two-face rail implementation, Hookline Run, the Workshop, Ride Lab, optional flight prediction, Cloudpost relay routes, and Prismatic/Crystal+/Classic rendering. See `RIDE-LAB.md`, `CLOUDPOST-RELAY.md`, `ARRIVAL-WINDOWS.md`, and `PRISMATIC-MATERIALS.md`. These notes are historical evidence, not a new claim that all outstanding branches, devices, or expert routes have passed this release.

## Milestone A: Flight Deck and controller-safe replay, v0.16.0

Implementation scope for this upgrade:

- [x] Add a Flight Deck with route-by-route career records and a visible local-save status.
- [x] Add five optional badge types: Route cleared, Clean wheels, Every doorstep, Air courier, and Express delivery. Only applicable goals appear on each route.
- [x] Settle badges only after the real engine accepts the finish of an unmodified authored route. Retain existing medals and keep career data in its own storage key.
- [x] Count active simulation time across checkpoint retries, excluding pauses. Prevent retrying from erasing a clean-run failure.
- [x] Make Start pause/resume gameplay instead of unexpectedly entering the editor. Use View for the Flight Deck and retain saved gameplay remaps.
- [x] Add controller focus, confirm/back, nested-dialog ownership, separate audio-slider adjustment, neutral-input transition protection, and disconnect cleanup.
- [x] Preserve the original tile-editor controller path. Explicitly disclose that advanced Bezier handle editing still requires a pointer.
- [x] Add pure-rule tests, an isolated browser fixture, and real-game controller smoke tests with separately labeled reports.
- [ ] Attach passing exact-commit browser reports and inspect their captures before release approval.
- [ ] Confirm master publication by comparing public runtime bytes with the merged source.

The two unchecked gates above are release evidence, not features. The companion release note records the tested commit and publication result when available. Physical Xbox-controller testing, all-route badge attainability, and a full native gameplay regression are not implied by the smoke suite.

## Milestone B: Authored-route playability and discovery, next content upgrade

- [ ] Select one beginner-to-intermediate chapter as a reference-quality vertical slice, with a beginning, escalation, optional reward line, and satisfying finish.
- [ ] Reconcile outstanding authored chapter geometry with two-sided grip; do not silently merge older one-sided layouts.
- [ ] Convert useful Ride Lab traces into environmental cues for launch timing, speed choice, braking, and receiving rails, without steering or snapping the rider.
- [ ] Add discoverable alternate routes, distinctive landmarks, and checkpoints that preserve earned deliveries.
- [ ] Verify that every offered badge is attainable on its route; retune or remove inappropriate goals rather than leaving impossible objectives.
- [ ] Record at least three clean real-input completions of the reference chapter, including a slower/new-player line and its optional branch.

Gate: The chapter remains enjoyable and readable without developer knowledge, debug state changes, or a mouse during ordinary controller play. Preserve both failed attempts and successful evidence.

## Milestone C: Rider, world, and encounter production

- [ ] Establish an original art bible for riders, bikes, unicycles, districts, materials, silhouettes, and lighting.
- [ ] Replace placeholder-looking models with authored, optimized assets and maintain an asset-license ledger.
- [ ] Add coherent rider animation for pedal/throttle, lean, braking, jumps, catches, whip use, impact, and recovery.
- [ ] Build distinct neighborhood characters, readable enemy behaviors, and environmental interaction tied to delivery objectives.
- [ ] Add encounter variety and memorable set pieces without obscuring collision geometry or safe landing surfaces.

Gate: Art and animation reinforce movement and threat readability. Review close-up and moving captures in both preferred and fallback rendering modes.

## Milestone D: Audio and sensory comfort

- [ ] Audit all effects for overlapping notifications, repeated attacks, clipping, and unintentional simultaneous music sources.
- [ ] Add notification-density and transient-intensity options beside the existing separate effects/music controls.
- [ ] Author material-specific riding, braking, impacts, catches, wind, and district ambience with voice-count limits and cooldowns.
- [ ] Add musically coherent transitions, restrained ducking, and a testable single-owner soundtrack lifecycle.
- [ ] Test quiet, headphones, low-volume, muted-music, muted-effects, pause/resume, and background-tab cases.

Gate: A long play session sounds pleasant, important cues stay audible, and no continuous effect or music track survives the state that owns it.

## Milestone E: Campaign and progression depth

- [ ] Develop a coherent delivery campaign with character motivation, chapter arcs, discoveries, and optional tasks.
- [ ] Add meaningful replay incentives without invalidating existing medals or requiring a new account.
- [ ] Design a transparent progression and cosmetic economy; keep paid-account and entitlement changes outside gameplay patches.
- [ ] Add understandable objective failure/retry messaging and a route journal with controller navigation.
- [ ] Evaluate races or ghosts as a separate, validated feature rather than treating an unverified legacy ghost path as production-ready.

Gate: Players understand what they are doing, why it matters, what improved, and what opens next. No mandatory progress can become permanently blocked.

## Milestone F: Accessibility, input, and editor completion

- [ ] Test physical Xbox controllers on Windows and a second desktop platform, including disconnect/reconnect and mixed keyboard input.
- [ ] Complete controller support for all editor panels, Bezier authoring, save/export warnings, and destructive confirmations.
- [ ] Add adjustable deadzones, input-remap conflict reporting, scalable text, color-independent cues, and reduced-camera-motion settings.
- [ ] Validate touch targets and layouts on actual phones and tablets in portrait and landscape.
- [ ] Audit keyboard focus, screen-reader announcements, contrast, and motion sensitivity through the full player journey.

Gate: A player can start, finish, replay, adjust settings, recover from failure, and leave safely with their chosen supported input method.

## Milestone G: Performance, resilience, and technical debt

- [ ] Define named reference devices and explicit scene, memory, draw-call, startup, and frame-time budgets before promising performance.
- [ ] Target a stable 60 fps on the selected desktop reference and choose/document a realistic mobile fallback target.
- [ ] Profile worst-case route geometry, workers, particles, audio buffers, asset loading, and long-session memory growth.
- [ ] Exercise WebGPU/WebGL/2D fallback behavior, lost context, offline revisits, stale caches, and interrupted downloads.
- [ ] Gradually extract the large legacy index into tested modules without breaking its global integration contracts.

Gate: Published traces and long-session runs support the stated device targets. A failure must produce a recoverable state, not an invisible character or frozen input.

## Milestone H: Release qualification and operation

- [ ] Maintain exact-source unit, geometry, carried-state physics, native route, editor, controller, and accessibility suites.
- [ ] Preserve test failures, videos, screenshots, browser versions, source SHAs, and unsupported-device limitations.
- [ ] Run save migration and rollback rehearsals with representative old progress and Workshop drafts.
- [ ] Maintain asset licenses, dependency inventory, privacy/security review, and deployment/runbook documentation.
- [ ] Conduct external playtests and address critical usability defects before calling the game release-ready.
- [ ] Complete any platform-specific packaging, certification, ratings, and distribution work only after the target platforms are chosen.

Gate: No known progress-loss or release-blocking defect remains on the declared support matrix. Publish every accepted upgrade, verify the public bytes, and keep a scoped rollback available.

## How to continue this roadmap

For each upgrade, choose a small coherent slice, record the problem and acceptance conditions, implement it in the existing game, add exact-source tests, review captures, merge safely, and verify publication. Update this file and a dated release note beside it. Keep implementation, automated evidence, physical-device checks, and public-release verification separate. Never check an item merely because code exists or a workflow was scheduled.
