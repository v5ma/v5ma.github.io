# Dino Atlas: Living Herds

Build: living-herds-20260912.1. This is an upgrade of the existing Dino Atlas, not a replacement game or a claim of completed AAA production quality.

## What changes in play

The existing 64 residents receive six explicit arcade behavior profiles. Heads and tails are articulated. Two-segment legs use travel-driven stride timing and world-space stance anchors. Animals can watch an approach, graze/feed, rest, retreat, warn, charge, recover and react to interruption. Hunters stop and display an amber ring before a bounded charge; breaking line of sight cancels the warning. Local spacing and shoulder-ray steering reduce crowding and obstacle crossing. Existing enclosure gates, feeder returns, water boundaries and no-damage vehicle recovery remain.

Water, horn and zapper retain strong first-contact guidance. Closely repeated pulses have diminishing shove strength and cannot continually reset a zapper stun. The wildlife call scheduler uses one shared budget, distance falloff and Balanced/Quiet/Off presets. Existing master, music, effects and ambience controls remain; this pass does not introduce another music track or certify the entire audio mix.

Menu > Living Herds: field study offers five connected tasks: observe the valley Triceratops quietly, guide it with water, recognize the western Allosaurus warning, interrupt it with the zapper, then file the report at the visitor center. Each step names the controls and displays a waypoint. The first report pays 450 credits through the existing reward ledger; replay does not repeat the payout. The study has its own dino-atlas.living-herds.v1 save. Selecting an existing story or activity suspends its tracking without resetting progress.

## Controller

Menu opens navigation, D-pad or left stick moves focus, A selects and B closes. In play, X reloads, Y boards/exits, RB changes tools, LB + RT aims/fires from a vehicle, and the right stick aims. No new mouse-only dialog is introduced. Wildlife density uses the same left/right setting adjustment as existing controls.

## Remaining limitations

Models are stylized, not anatomical reconstructions. Existing neutral adult length calibration is retained for Diplodocus, Tyrannosaurus and Triceratops only. Grouped behavior does not establish how extinct animals actually behaved. The rig is a procedural approximation, not motion capture or finished cinematic animation. Local ray avoidance is not navigation-mesh pathfinding and does not solve every tight passage. Visual review, no-fixture playtesting, physical Xbox, real sound hardware and consumer-GPU performance remain open quality gates.

## Verification

Node tests cover prior saves and activities plus warning timing, interruption/recovery, pulse limits, feeder arrival, herd spacing, blocked movement, finite rigs, stance anchors, reference lengths and the separate study state. Rendered acceptance uses native Chromium, software WebGL and synthetic standard Xbox input, with clear-lane fixtures to position the existing animals and player. Story regression uses the previous Storm Response journey. Publication verifies reviewed public runtime bytes and reruns the field study on GitHub Pages. Consult the stored receipts for actual outcomes; the test definitions alone are not passing evidence.

Implementation references, not dinosaur-behavior evidence:
https://rapier.rs/docs/user_guides/javascript/scene_queries/
https://threejs.org/docs/pages/Object3D.html
