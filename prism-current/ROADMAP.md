# Prism Current / development board

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
| Next | Input remapping and Xbox practice | Real standard-pad test; avoid colliding mappings with XR controllers. |
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
