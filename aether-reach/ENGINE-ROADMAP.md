# Engine mastery and Quest 3 track

The current plan is [roadmap.json](./roadmap.json), browsable as a [Kanban](./roadmap.html). Its IDs replace the initial Q01-Q08 sketch with implementation tasks and separate acceptance gates.

The model (`model.mjs`), rendering (`scene.mjs`), browser adapter (`app.mjs`), pure input normalization (`input-core.mjs`), device action binding (`controllers.mjs`) and XR lifecycle/rig (`xr-session.mjs`) remain separate. The v0.2.0 candidate includes an actual immersive-vr entry path, not only a feature request. Nevertheless, no physical Quest 3 or Xbox verification has been performed here.

## Present controls foundation
Standard gamepads provide analog movement/looking and action edges. XR controllers are read from handed input sources, not assumed to be ordinary desktop gamepads. The locomotion rig keeps headset orientation independent of rail steering; tracked weapon rays are separately validated by collision and distance. Menus, session suspension and device disconnects clear held actions.

## Next mechanical work
Climbing and gliding are unimplemented. Each needs a focused collision/comfort test scene before being combined with rail entry/release. Real two-hand reload/stabilization, richer enemies, tactical cover, interior exploration, a 3D authoring interface and multiplayer are later tasks, not implied by the new device adapter. Existing Paper Delivery tools are not silently treated as features of this separate game.

The physical-headset gate checks reference space, tracking, frame time, sustained rendering, controller labels, pause/resume and comfort. A stereo API emulator exercises the real renderer and game logic, but cannot establish real headset tracking quality or user comfort.

Primary references: https://threejs.org/manual/en/webxr-basics.html ; https://developer.mozilla.org/en-US/docs/Web/API/XRInputSource/gamepad ; https://developers.meta.com/horizon/documentation/web/browser-specs/ . All dependencies remain pinned and local. Private narrative and authoring remain outside this public project.
