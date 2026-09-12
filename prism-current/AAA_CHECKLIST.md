# Prism Current: AAA-quality production checklist

Updated for Practice Lab v0.5.0 on 2026-09-12. This is the active production checklist beside the game. The complete previous task specifications and release history are retained in [the v0.4 checklist](AAA_CHECKLIST-v040.md) and [ROADMAP.md](ROADMAP.md). Task identifiers remain stable. Current gameplay and verification details are in [PRACTICE_NOTES.md](PRACTICE_NOTES.md).

AAA-quality is the goal for craft, musical identity, accessibility and reliability, not a claim of a studio-scale budget or console certification. A checked implementation is not physical hardware acceptance. Development owns implementation and automation; Micah owns creative approval; a physical tester owns device measurements and comfort acceptance. No physical tester is assigned. P0 means release blocker for the declared scope, P1 means next production work, and P2 means later expansion. Relative effort S/M/L is not a delivery estimate.

## Current milestone: Practice Lab

- [x] PL-01 / P1 / Development / M. Rehearse the existing sections of all four songs, in both Flow and Pulse, without rewriting the authored source charts.
- [x] PL-02 / P1 / Development / M. Offer 60%, 75%, 90% and 100% playback, a four-beat count-in, optional count-in clicks and explicit lower-pitch behavior. Keep real-time scoring windows unchanged.
- [x] PL-03 / P0 / Development / M. Isolate completed practice records by song/chart/device/section/speed/version in their own storage namespace. Partial attempts and 100% section runs cannot replace full-song scores.
- [x] PL-04 / P1 / Development / M. Add opt-in repeated passes with a results review and fresh count-in. Cancel pending repeats on input, focus/visibility loss, mixer use or controller loss. Never auto-resume a disconnected run.
- [x] PL-05 / P1 / Development / M. Launch the weakest section directly from full-song results. Keep replay, return-to-song, settings and cancellation accessible through the standard controller UI.
- [x] PL-06 / P0 / Development / M. Add pure plan/audio/save fixtures, application integration fixtures, and actual-renderer controller acceptance. Preserve golden legacy chart/audio tests and all existing suites. Passing receipts are a separate release gate.
- [ ] PL-HW / P0 before hardware claims / Physical tester / M. Confirm count-in audibility, cut comfort and all new controls with actual devices. Numeric alignment and emulation do not complete this gate.

## Gate A: reliable playable foundation

Dependencies: current controls and audio transport. Exit: the published build works on the explicitly supported browser/input matrix, with reproducible receipts.

- [x] A-01 and A-02. Original rhythm, swept cuts, no-fail completion, input-specific records and automated scoring/geometry/audio/lifecycle coverage remain implemented.
- [ ] A-03 / P0 / Development / M. Versioned save export/import and recovery. Preserve old records under malformed data, denied storage and interrupted loads.
- [ ] A-04 / P0 / Development + physical tester / M. Declare and test Chrome, Edge, Firefox, Safari and mobile support; publish unsupported cases.
- [ ] A-05 / P0 / Development / M. Exercise WebGL context loss, audio interruptions, scene teardown, long-session memory and rapid input transitions.
- [ ] A-06 / P1 / Development + Micah / M. Interactive first-run teaching for hands, lanes, hit plane, direction and pause. Exit: five new players finish without verbal coaching, with failures recorded and revised.
- [ ] A-07 / P1 / Development / M. Repeatable measured timing calibration, distinct from the current manual offset and post-run timing diagnostics.

## Gate B: music and authored rhythm identity

Dependencies: stable transport and creative approval. Preserve old chart versions and records when music or movements change.

- [ ] B-01 and B-02 / P1 / Development + Micah + physical tester / L. Tidal Bloom's original arrangement and authored Flow/Pulse patterns are implemented. Human listening, enjoyment, physical reach and self-collision/comfort approval remain open.
- [x] B-03. Section guidance, measured timing bins, section quality and weakest-section feedback are implemented.
- [x] B-04 / P1 / Development / L. Browser section rehearsal, four speeds, count-in and opt-in repeats are implemented in v0.5.0. Practice records are separate even at full tempo. Slower playback lowers pitch. Read PRACTICE_NOTES.md for exact scope; in-headset practice and pitch-preserving stretching are future extensions.
- [ ] B-05 / P1 / Development + Micah / L. Expand to six distinct original songs only after the flagship receives creative approval. Maintain the asset rights register.
- [ ] B-06 / P0 before new music claims / Development + Micah / M. Numeric sample peaks/RMS and conservative hit-envelope headroom passed for Tidal Bloom. Human review of masking and perceived loudness remains open; this is not a LUFS/true-peak certification.

## Gate C: accessibility, comfort and control completeness

- [ ] C-01 / P1 / Development + physical tester / L. Author seated and one-handed patterns with separate scores and measured reachable envelopes. A reach slider is not an authored accessible chart.
- [ ] C-02 / P1 / Development / M. Remappable keyboard/controller actions, conflict checks and reset defaults.
- [ ] C-03 / P1 / Development + Micah / M. Color-independent hand symbols, high contrast, text scaling and readable HUD presets.
- [ ] C-04 / P1 / Development / M. Complete the browser dialog audit and add in-headset sound/comfort controls. Browser Practice Lab does not complete the headset menu requirement.
- [ ] C-05 / P0 before physical launch / Physical tester / L. Measure comfort, safe recenter, orientation, reach and tracking recovery on real headsets. Rendered floors are not safety boundaries.
- [ ] C-06 / P1 / Development / M. Screen-reader and reduced-motion audit; optional per-hit announcements, mandatory important pause/error notices.

## Gate D: visuals and measured performance

- [x] D-01. Jewelbox gems, hilts, shared materials, bounded effects, desktop optics and transparent XR materials remain implemented.
- [ ] D-02 and D-03 / P1 / Development + Micah / L. Three coherent stage themes, readable music-driven lighting, original hand/controller models and alignment aids.
- [ ] D-04 / P0 before performance claims / Physical tester / L. Measure frame-time percentiles, drops, memory, audio latency and thermal behavior over 30 minutes on named devices. Proposed targets remain desktop 60 fps and headset 72 fps or the selected session rate; these are not measured claims.
- [ ] D-05 / P1 / Development / L. Derive rendering budgets and stable quality fallback from those measurements, without changing scoring timing.
- [ ] D-06 / P1 / Development / M. Expand matched visual regression across desktop, VR, AR and accessible display presets. Current full-resolution artwork reviews do not complete the full matrix.

## Gate E: progression and creation

Dependencies: enjoyable authored content, stable records and privacy boundaries.

- [ ] E-01 / P2 / Development + Micah / L. Permanent progression and unlocks. Current best-score goals and practice pass counters are not a completed progression system.
- [ ] E-02 / P2 / Development / L. Strictly validated local chart/audio import, bounded files and no unapproved redistribution.
- [ ] E-03 / P2 / Development / L. Beatmap editor with waveform/grid, preview, reach warnings, undo and versioned export.
- [ ] E-04 / P2 / Development / L. Deterministic replay and score integrity before online competition.
- [ ] E-05 / P2 / Micah + Development / L. Scope optional social competition, localization and platform packaging after single-player acceptance.

## Gate F: every release must publish

- [x] F-01. Scope changes to Prism Current and its own verification. Preserve other games and private projects.
- [ ] F-02 / P0 per release / Development / S. Run applicable tests on the exact candidate and link the actual results. A written test is not a passing test.
- [ ] F-03 / P0 per release / Development / S. Commit, merge to master, confirm Pages deployment and verify exact served-file hashes. Do not stop at a branch or unmerged PR.
- [ ] F-04 / P0 per release / Development / S. Record limitations and scoped rollback, preserve saves and smoke-test the actual public game.
- [ ] F-05 / P0 before launch / Micah + physical tester / L. External playtest review, critical-defect closure, device matrix, accessibility, licenses, privacy and support.

F-02 through F-04 are recurring gates. Their outcome for a particular release belongs in its PR/publication receipt; the next release must perform them again. Prior Control Room and Tidal Bloom implementation and physical gates retain their status in the archived v0.4 checklist. CR-HW, CR-XR and TB-06 remain open.

## Next upgrade selection

Resolve any P0 regression first. The next product milestone is A-06, interactive first-run teaching, followed by C-01's authored accessible charts and A-03's save recovery. Continue human musical review and physical Xbox/Quest acceptance separately. Do not bulk-expand the song catalog or declare hardware readiness from emulated tests.
