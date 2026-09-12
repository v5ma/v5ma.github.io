# Prism Current: AAA-quality production checklist

Updated for Control Room v0.3.0, 2026-09-11. This is the working production checklist, stored with the game. The original history remains in [ROADMAP.md](ROADMAP.md). Release evidence belongs in [QA.md](QA.md) and the pull request / GitHub Actions receipts, not in unchecked marketing claims.

## Target and status rules

Build an exceptional original rhythm game: responsive cuts, memorable music, authored movement, comfortable spatial presentation, accessible controls and reliable releases. AAA-quality is an aspiration for craft and completeness, not a claim that this prototype has a large studio budget or console certification.

Checked means the specified implementation exists. It does NOT mean every device passed physical acceptance. Hardware gates remain unchecked until someone records the device, browser, build, method and result. Each new upgrade must update this file, preserve records, run relevant tests, merge to the published branch and verify the public game. Do not leave the only deliverable on a development branch.

Owners: Development owns implementation and automation. Micah owns creative acceptance and prioritization. A physical tester owns hardware measurements and comfort acceptance. No physical tester is assigned yet. Priorities P0, P1 and P2 mean release blocker, next production work and later expansion. Effort S, M and L are relative scope, not delivery dates.

## Current upgrade: Control Room

- [x] CR-01 / P0 / Development / M. Add explicit standard-gamepad timing practice with LT, LB, RB and RT mapped to the four lanes. Save under the separate gamepad record category; do not relabel timing taps as tracked saber cuts.
- [x] CR-02 / P0 / Development / M. Support controller focus, track and chart selection, settings adjustment, play, pause, resume, retry, results and back navigation. Use D-pad or left stick, A, B, Menu and View. Preserve keyboard, mouse, touch and XR controls.
- [x] CR-03 / P0 / Development / M. Separate music and sound-effect volume, persist both, provide mute, effect-rate limiting and hit-text-rate limiting. Include Calm mix and Music only presets. Opening the mixer pauses the song and closing it does not silently resume it.
- [x] CR-04 / P0 / Development / M. Keep only one soundtrack source, cancel obsolete async resume operations, cap simultaneous hit sounds and pause controller practice on disconnect. Do not auto-resume when a controller returns.
- [x] CR-05 / P1 / Development / S. Show local-best quality goals at 50%, 75% and 90% without rewriting existing records. Goals describe the current best-score record, not permanent achievement unlocks.
- [x] CR-06 / P0 / Development / S. Store the production checklist, test procedures and release evidence beside the game. Expose the checklist from the game menu.
- [ ] CR-HW / P0 before hardware claims / Physical tester / M. Test a real Xbox-style controller by USB and Bluetooth, including trigger thresholds, disconnect, reconnect and full menu navigation. Browser or OS permission dialogs may still require a real click or keypress; record this separately from in-game controls.
- [ ] CR-XR / P0 before headset claims / Physical tester / M. Confirm that standard pads cannot interfere with tracked controllers, that existing AR transparency survives and that both hands, pause, recenter and tracking recovery work on a physical Quest.

## Gate A: reliable playable foundation

Dependencies: CR-01 through CR-06. Exit when the public release works across the declared browser/input matrix and its exact build is documented.

- [x] A-01 / P0 / Development / M. Retain original three-track charts, audio-clock timing, two-handed swept collision, no-fail completion and separate local input-mode records.
- [x] A-02 / P0 / Development / M. Keep automated scoring, geometry, lifecycle and audio invariants, plus native-browser controller acceptance. A mock or simulated controller is not a physical device test.
- [ ] A-03 / P0 / Development / M. Add versioned save export/import and recovery; prove old records survive malformed preferences, storage quota failures and interrupted loads.
- [ ] A-04 / P0 / Development + physical tester / M. Run desktop Chrome, Edge, Firefox, Android touch and Safari acceptance on declared supported versions. Publish unsupported cases clearly instead of silently failing.
- [ ] A-05 / P0 / Development / M. Test WebGL context loss/recovery, AudioContext interruption, repeated scene teardown, long-session memory growth and rapid input-mode transitions.
- [ ] A-06 / P1 / Development / M. Add an interactive first-run lesson for hand colors, hit plane, cut direction, timing and pause. Exit: five first-time players can finish the lesson without verbal coaching; record failures and revisions.
- [ ] A-07 / P1 / Development / M. Expose latency calibration with a measurable repeatability report rather than only a manual offset field. Separate visual/audio offsets if measurements justify it.

## Gate B: music and authored rhythm identity -- next content upgrade

Dependencies: stable transport and CR-03. Micah approves the musical direction before expanding the catalog. Preserve existing tracks and best scores; version any changed chart instead of invalidating old records silently.

- [ ] B-01 / P1 / Development + Micah / M. Produce one flagship original arrangement with a recognizable motif, distinct intro, verse, build, drop, rest and outro. Judge it by uninterrupted listening and playtests, not the number of simultaneous sounds.
- [ ] B-02 / P1 / Development + Micah / L. Author Flow and Pulse movement phrases for the flagship track. Add breathers, hand alternation and intentional musical accents. Verify no unintended unreachable or self-colliding sequences.
- [ ] B-03 / P1 / Development / M. Add phrase/section labels and richer end-of-song analysis: timing error distribution, miss locations and section improvement targets.
- [ ] B-04 / P1 / Development / L. Build a loopable practice section with speed control and a count-in. Keep slowed practice records separate from full-speed records; pitch behavior must be explicit.
- [ ] B-05 / P1 / Development + Micah / L. Expand to six distinct original tracks only after the flagship passes musical and movement review. Maintain a rights/provenance register for every new sound or outside asset.
- [ ] B-06 / P0 before new audio release / Development / M. Measure peaks, clipping, output level consistency and effect masking. Compare music-only and full-mix listening. Acceptance: clean output and no overlapping soundtrack instances on rapid restart.

## Gate C: access, comfort and control completeness

Dependencies: Gate A and authored chart tooling. These are distinct production features, not fulfilled by a compact reach slider alone.

- [ ] C-01 / P1 / Development + physical tester / L. Author seated and one-handed charts with separate score categories and measured reachable envelopes. Do not auto-mirror two-handed charts and call them accessible.
- [ ] C-02 / P1 / Development / M. Add remappable keyboard and standard-controller actions, duplicate-binding validation, reset defaults and clear active-device prompts.
- [ ] C-03 / P1 / Development + Micah / M. Provide color-independent hand identification, high-contrast symbols, text scaling and readable HUD presets. Verify symbols rather than relying on hue alone.
- [ ] C-04 / P1 / Development / M. Ensure every in-game dialog and settings field can be reached and dismissed with keyboard and standard controller. Add a dedicated in-headset sound/comfort menu rather than requiring desktop settings during XR.
- [ ] C-05 / P0 before physical launch / Physical tester / L. Record comfort sessions, safe recenter behavior, reach, controller orientation and tracking loss/recovery on real headsets. The rendered floor and any future room mesh are not safety boundaries.
- [ ] C-06 / P1 / Development / M. Audit screen-reader announcements and reduced-motion behavior. Keep per-hit announcements optional and never suppress important pause or error messages.

## Gate D: visual production and performance

Dependencies: Gates A and B. Preserve Jewelbox's crystal, metal and light identity. No environment effect should hide an approaching note or the real AR surroundings.

- [x] D-01 / P1 / Development / L. Preserve faceted gems, jewelry-styled hilts, shared materials, bounded effects, desktop physical transmission and lightweight transparent XR materials.
- [ ] D-02 / P1 / Development + Micah / L. Design three coherent stage themes and track-specific lighting cues with readability comparisons. Include an effects-off baseline.
- [ ] D-03 / P1 / Development / M. Replace generic hands/controllers with original readable models and alignment aids without changing collision endpoints silently.
- [ ] D-04 / P0 before performance claims / Physical tester / L. Measure CPU/GPU frame time percentiles, dropped frames, memory, audio latency and thermal behavior over 30-minute sessions on named hardware. Proposed targets: desktop 60 fps; headset 72 fps or the chosen session rate. These are targets, not current measured results.
- [ ] D-05 / P1 / Development / L. Define per-tier draw-call, triangle, texture and effect budgets from the measurements. Implement quality fallback with hysteresis and no gameplay-timing changes.
- [ ] D-06 / P1 / Development / M. Capture matched visual regressions for desktop, VR and transparent AR, including high contrast, reduced motion and each quality tier.

## Gate E: progression, creation and replay value

Dependencies: authored content and stable records. Keep local/private play the default.

- [ ] E-01 / P2 / Development + Micah / L. Build an intentional progression path with permanent goals, unlock previews and meaningful practice recommendations. Migrate the current local-best goals explicitly.
- [ ] E-02 / P2 / Development / L. Add validated local chart/audio import with size, duration, timing, schema and reach checks. Never upload or redistribute the user's audio without permission.
- [ ] E-03 / P2 / Development / L. Build a beatmap editor with waveform, beat grid, phrase preview, reach warnings, undo/redo and versioned export.
- [ ] E-04 / P2 / Development / L. Support deterministic replays and score verification before considering competitive leaderboards. Define integrity and privacy boundaries first.
- [ ] E-05 / P2 / Micah + Development / L. Research optional social competition, localization and platform packaging after the single-player experience passes. Each is a separate scoped project, not implied by this browser release.

## Gate F: release discipline and launch readiness

Dependencies: all P0 items for the explicitly announced platforms. Every upgrade, including small fixes, follows this gate.

- [x] F-01 / P0 / Development / S. Keep changes scoped to Prism Current and its own tests/workflows. Do not reset other games or private projects while merging a release.
- [ ] F-02 / P0 per release / Development / S. Run all applicable automated tests on the exact candidate commit and link results in QA.md or the release PR. Resolve code failures before calling the candidate validated.
- [ ] F-03 / P0 per release / Development / S. Commit, merge to master, confirm GitHub Pages deployment and compare the public runtime files against the committed release. A merge alone is not proof of public deployment.
- [ ] F-04 / P0 per release / Development / S. Record limitations and rollback reference, verify old saves and smoke-test the public game without injected scores or accelerated clocks.
- [ ] F-05 / P0 before launch / Micah + physical tester / L. Obtain structured external playtest feedback, fix critical defects and review the supported-device matrix, accessibility notes, licenses, privacy and support process.

## How the next round is chosen

First resolve any P0 regression found in Control Room. Then implement B-01 and B-02 as the next substantial content release, with B-06 as its audio acceptance gate. Continue physical CR-HW and CR-XR acceptance separately; never mark those complete based on emulation. After the flagship song is enjoyable, prioritize A-06 and C-01 before bulk catalog expansion.
