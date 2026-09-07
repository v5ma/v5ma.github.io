# Devices and current boundaries

The tactical v0.4.1 patch retains Xbox-standard controls and the experimental WebXR adapter. Physical Xbox USB/Bluetooth and Quest 3 tracking, frame time and comfort remain unverified.

Keyboard: WASD moves, mouse/arrow keys look, Space jumps/releases, E interacts/hooks, C reverses, Shift sprints/boosts, F/click fires, R reloads, Q casts the selected power, M maps, P/Esc pauses. B opens a nearby kiosk, Z toggles aim, right mouse holds aim and 1–4 chooses an owned gun. G opens/folds the airborne Foldwing. N opens field builds, T cycles learned powers and J surveys an aimed live unrecorded class. Rail free-look stays the default.

Standard gamepad: left stick moves, right stick looks, A jumps/releases, B glides, Y interacts/hooks, X reloads, RT fires, LT aims, LB casts, RB reverses, L-stick click boosts, View maps and Menu pauses. D-pad up/down cycles weapons, right opens nearby Outfitters and left opens the field kit. In menus A activates and B closes. Held-button neutralization and disconnect pause remain.

Touch keeps movement and look pads plus action buttons, with dedicated Field/Power/Survey controls above the look surface. Menus pause the simulation. Frame/UI settling is verified by observing actual state, not assuming a fixed render delay.

## Quest 3 target / immersive preview

Enter VR is enabled only for a capable secure browser. The local-floor session uses independently tracked head/controllers, joystick movement, 30-degree snap turning, spatial status/menu panels and safe refusal/exit handling. Right controller aims the gun. Left trigger casts the selected power; Current/Cinder use the left target-ray pose. The local conductor diagram is rendered in the spatial field menu with its button controls. Hardware readability and comfort remain to be checked on the actual headset.

The 4x Longglass optic changes only the flat-screen camera projection. The XR eye projection is never globally zoomed. A true tracked magnified lens, climbing, hand tracking, full embodied reload and multiplayer remain future work. Foldwing gliding exists; its physical headset comfort is not certified.

Pure model tests, native ordinary-input browser tests and device-API emulation are separate evidence categories. Emulated poses and buttons exercise the real model/renderer but cannot prove real pairing, tracking, stereo quality or sustained performance. Public files contain no private narrative, privileged credentials or telemetry.
