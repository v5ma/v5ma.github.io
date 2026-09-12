# Functional acceptance is not a performance certification

The Control Room source workflows distinguish successful input, score/save correctness and recovery from sustained frame-rate qualification. Read each report's scope and any `software_frame_stall` value.

Keyboard automation reads the real audio clock rather than the frame-updated HUD timestamp. Pointer automation produces a smooth audio-timed trajectory through normal pointer events and stops after a valid hit. The prior frame-timestamp driver could create artificial stepwise motion between render updates, which is not a faithful continuous pointer trajectory. Game timing windows and velocity checks were not changed.

The emulated XR layer renders 120x160 pixels per eye with the original projection and pose geometry. Desktop functional suites use one-eighth pixel ratio; the controller suite uses one-quarter. A separate art suite retains full-resolution 1440x1050 before/after menu captures and checks the Cinematic shaders during small-viewport active play. These are software-rendered correctness checks only.

A measured CPU/software-renderer frame gap of approximately 0.319 seconds occurred immediately after a successful pointer cut during development. The game correctly paused at its unchanged 0.3-second stall limit. The pointer suite now records such a pause and tests real UI recovery, preserving the hit and avoiding an invented completed record. Passing this suite does not establish uninterrupted full-song pointer performance at a consumer display resolution. Hardware performance, latency and comfort remain open in AAA_CHECKLIST.md, including CR-HW, CR-XR and D-04.

No test alters scores, judged notes, song duration, the AudioContext clock or tracked game poses. Emulated device input and DOM input events are explicitly test-generated.
