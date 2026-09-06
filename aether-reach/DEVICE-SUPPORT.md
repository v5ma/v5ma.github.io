# Devices and current boundaries

The v0.3 candidate retains v0.2 Xbox-standard gamepad and experimental WebXR support. Physical Xbox USB/Bluetooth and Quest 3 frame time, tracking and comfort have not been tested here.

## Desktop / Xbox

Keyboard: WASD moves, mouse or arrows look, Space jumps/releases, E interacts/hooks, C reverses, Shift sprints/boosts, F/click fires, R reloads, Q pulses, M maps, P/Esc pauses. B opens a kiosk in range, Z toggles aim, right mouse holds aim, digits 1–4 select owned weapons. Rail free-look is now the default; the camera-follow setting remains optional.

Standard gamepad: left stick moves, right stick looks, A jumps/releases, Y interacts/hooks, X reloads, RT fires, LT aims, LB pulses, RB reverses, L-stick click boosts, View maps, Menu pauses. D-pad up/down cycles weapons; right opens nearby Outfitters. Menu D-pad or stick selects, A confirms and B closes. Neutral reconnection/held-trigger protection and look/inversion settings remain.

## Quest 3 target / WebXR preview

Enter VR appears only in a capable secure browser. The existing immersive local-floor session uses independent tracked head/controller pose, joystick movement, 30-degree snap turn, world-space status/menu panels and safe exit/refusal handling. Original bindings remain in Controls & settings. The model supports selected-weapon firing through the controller ray; full weapon-specific tracked presentation, richer inventory ergonomics and hardware comfort are not complete.

The 4x Longglass optic changes the FLAT-SCREEN camera projection only. XR eye projection is never globally zoomed. A true tracked magnified lens is X07 in the roadmap, requiring render-target and physical-device checks. Climbing, gliding, hand tracking, full embodied reload, shared rooms and multiplayer do not exist merely because WebXR is supported.

## Evidence scope

Pure model tests, native ordinary-input WebGL tests and emulated-device tests are separate evidence categories. Device emulation supplies API poses/buttons while the game/renderer run normally; it cannot certify real pairing, tracking or comfort. No private content, account credential or telemetry is part of the public adapter.
