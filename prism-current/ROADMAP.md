# Prism Current / development board

The current task-by-task production path is [AAA_CHECKLIST.md](AAA_CHECKLIST.md), added with Control Room v0.3.0. It contains priorities, owners, dependencies, acceptance criteria and open hardware gates. [QA.md](QA.md) records release verification. This document preserves the original development history below.

The implementation is complete enough for a first playable release; the PR and
publication workflow are the authoritative browser/deployment receipts. Physical
Quest acceptance is deliberately separate and has not been completed.

| Stage | Task | Acceptance / boundary |
|---|---|---|
| Implemented | Original rhythm score and charts | Complete three tracks; audio-clock pause, scoring and no-fail finish; no copyrighted downloads. |
| Implemented | Swept two-handed saber contact | Hand, direction, timing and blade sweep; stationary or lost-pose blades cannot score. |
| Implemented | AR stage and spatial controls | True immersive-ar/alpha blend, no opaque backdrop; start/pause/recenter/exit in headset. |
| Implemented | Browser practice | Pointer slicing, timing-only keyboard mode, touch blade selection, distinct local records. |
| Automated acceptance | Full song, pointer and emulated AR suites | Read exact reports in PR82. Tests use UI/input events, not injected scores or clock acceleration. |
| Open physical QA | Quest 3 floor height / controller alignment | Verify both hands, reach, stage yaw, tracking loss/recovery and recenter on the actual device. |
| Open physical QA | Sustained headset performance and audio latency | Measure frame times, thermal behavior, haptics, Bluetooth latency; adjust from measurements. |
| Next | Better music production and authored flow | Longer contrasting tracks, meaningful rests and rhythm phrases; license register for outside work. |
| Implemented in v0.3 / physical QA open | Xbox timing practice and controller menus | LT/LB/RB/RT timing lanes; D-pad/stick focus; A/B/Menu/View controls; separate records; no XR substitution. Custom remapping remains open. |
| Next | Accessible one-hand and seated charts | Authored reachable patterns, selectable roles, separate score categories. |
| Later | Custom charts and audio import | Local user-file import, strict validation, no unapproved redistribution. |
| Later | Beatmap editor | Edit music-relative note times/directions, preview reach, export versioned documents. |
| Later | Optional room-aware placement | Opt-in hit testing/scene constraints with privacy and explicit failure states; meshes are not safety guarantees. |

## First acceptance corrections

A-Frame wraps a component's reserved `pause` lifecycle and removes it from the
render tick list. User/game pause now uses `pauseRun` instead, so headset menus
and resumes keep rendering. Menu selections are captured before rebuilding
controls, and an aborted async load cannot revive an abandoned track. Ending XR
returns to track selection: a mouse cannot finish and save an AR-scored run.

The prototype is isolated from other hosted games. Existing saved progress and
private projects are outside its source, build and deployment.

## Jewelbox / graphics-first v0.2

Implemented: cut-gem mesh assets and jewelry-styled saber hilts; PMREM studio reflections; desktop physical transmission/dispersion/clearcoat/iridescence; original GLSL caustic-like floor, blade energy, glow and fading ribbon effects; all effects share materials and bounded pools. Shader-based translucent XR replaces desktop transmission, never the real-world camera feed. New quality/quiet controls preserve score data.

Acceptance gates: pure tests, unchanged complete-song and pointer checks, emulated AR/VR with transparency checks, and native matching before/after renderer captures. Consult the release PR / served-file workflow for actual pass status rather than treating implementation as hardware certification.

Open: physical Quest measurements and visual calibration; richer music/art direction; hand models; user-chart import and seated/one-hand charts. The floor has stylized shader lighting, not physically traced caustics. Real-room refraction/occlusion remains unsupported.

## Control Room / controls-and-audio v0.3

Implemented: standard-controller timing practice, controller-accessible browser menus and mixer, separate music/effects volume and mute, Calm mix and Music only presets, limited hit sounds and text, disconnect pause, cancel-safe single-source soundtrack transport, and local-best quality targets. Existing charts, scoring rules, graphics and score keys are retained. Gamepad records have their own mode suffix. Controller permission/audio-unlock behavior depends on the browser; physical Xbox/Quest acceptance is still open.

Next content work is an authored flagship original song and movement charts, not overlapping background music or indiscriminate extra effects. See checklist B-01, B-02 and B-06.
