# Engine mastery and future Quest 3 adapter

The public demo is the test environment for mechanics, not a release of any private story. The existing first-person model, rendered world and input adapter remain separate. Population: One and BioShock Infinite are mechanical references, not source-asset dependencies. The headset features below are planned, not delivered by the desktop demo.

| ID | Mechanical goal | Dependencies and acceptance |
| --- | --- | --- |
| Q01 | Action-based input and tracked rig | Preserve desktop/touch bindings; separate head pose, locomotion rig and controller aim; no forced rail-camera head rotation. |
| Q02 | Two-handed climbing | Hand contact, grip/release, body collision, both-handed transitions and recovering from a missed hold; physical Quest 3 playtest. |
| Q03 | Gliding and rail release | Preserve release momentum; explicit deploy/cancel; stable landing volume; no unintended flight from a modal/menu input. |
| Q04 | Embodied weapon handling | Independent tracked aim, two-hand stabilization, reload interaction and pulse; revalidate enemy/wall occlusion. |
| Q05 | Shared rail/flight/foot traversal | Readable attachment range, deliberate reverse/switch, reachability maps and recovery routes; no scripted player teleport. |
| Q06 | VR interface and comfort | World-space HUD, ray/poke UI, snap/smooth turn choice, comfort vignette and session-loss recovery; do not port the flat HUD unchanged. |
| Q07 | Temporary tactical cover | Only after movement/collision is stable; constrained placement, clear resource use and no geometry exploits. |
| Q08 | Headset performance gate | Measure CPU/GPU frame times on Quest 3, stereo rendering, controller tracking, suspension/resume and sustained play. No performance claim from software WebGL. |

Mechanical reference: POPULATION: ONE's developer describes climbing, gliding and cover building at https://www.populationonevr.com/ . These are design inspirations, not implemented features or imported assets. Meta's locomotion guidance (https://developers.meta.com/horizon/documentation/iwsdk/concepts/locomotion/) supports explicit comfort choices and target-headset testing; no SDK migration is committed by this plan.

Unpublished narrative remains outside this public project and its workflows. See PUBLIC_BUILD.md. A later approved content package must not introduce hidden private endpoints or credentials into the browser.
