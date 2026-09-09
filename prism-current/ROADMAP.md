# Prism Current / development board

| Stage | Task | Acceptance / boundary |
|---|---|---|
| Implemented, verification pending | Original rhythm score and charts | Complete 3 tracks; audio-clock pause, scoring and no-fail finish; no silent copyrighted downloads. |
| Implemented, verification pending | Swept two-handed saber contact | Hand, direction, timing and body sweep; stationary or lost-pose blades cannot score. |
| Implemented, verification pending | AR stage and spatial controls | True immersive-ar/alpha blend, no opaque backdrop; start/pause/recenter/exit in headset. |
| Implemented, verification pending | Browser practice | Pointer slicing, timing-only keyboard mode, touch blade selection, distinct local records. |
| Open physical QA | Quest 3 floor height / controller alignment | Verify both hands, reach, stage yaw, loss/recovery, guardian and recenter on the actual device. |
| Open physical QA | Sustained headset performance and audio latency | Measure frame times, thermal behavior, haptics, Bluetooth latency; adjust budgets from measurements. |
| Next | Better music production and authored flow | Longer contrasting tracks, meaningful rests and rhythm phrases; artists/license register for outside work. |
| Next | Input remapping and Xbox practice | Real standard-pad test; avoid colliding mappings with XR controllers. |
| Next | Accessible one-hand and seated charts | Authored reachable patterns, selectable roles, separate score categories; not simply remove one controller. |
| Later | Custom charts and audio import | Local user-file import, strict validation, clear licensing and no unapproved redistribution. |
| Later | Beatmap editor | Edit music-relative note times/directions, preview reach, export versioned documents. |
| Later | Optional room-aware placement | Opt-in hit testing/scene constraints with privacy and explicit failure states; never assume a mesh makes an area safe. |

The prototype is isolated from the other hosted games. Existing saved progress
and private projects are outside its source, build and deployment.
