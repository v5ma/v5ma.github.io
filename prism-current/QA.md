# Undertow 0.9.0: main-rhythm correction

The owner's rejection of the previous music and default play is the starting point, not a defect waived by old test totals. Read UNDERTOW.md for the diagnosis and changed main-game behavior. PR #189 records exact source, native-browser, failure and publication receipts. A successful software test does not prove that the music is enjoyable.

The default is Undertow/Pulse, not First Light/Flow. Both new charts contain eight actual cut directions without dots; the song is a new original 132 BPM synthesized arrangement. The idle preview follows the selected chart. The pool is the actual rhythm venue in browser and VR; transparent AR omits opaque walls. Existing music/chart/save data is retained.

Pure tests check every new note through the slice evaluator, reverse-direction rejection, hand alternation, timing bounds, audio finiteness and unchanged legacy golden data. Native acceptance starts from an untouched page, plays the full new song through gamepad input, uses the new headset chart shortcut and scores through a tracked blade. Legacy suites explicitly select the legacy track they test; they do not substitute for the new-default suite.

The accepted staged source is commit 4ae119b35dc31da5d753abc99c902164db9d6129. Run 35404783426 passed 176 Node tests and 27 native checks, including a full 286-hit desktop run and the new VR/AR cases. Its downloaded artifact 10572057237 matched SHA-256 5b4269e1a0c17b702c01d33a904f1e6db26079c517a80b1c985049a40000754b. The full-resolution menu and small-buffer stereo screenshot were inspected. These are source results, not proof of deployment; final candidate and public receipts must be checked separately.

Earlier failures are retained in PR #189. They included a 0.348-second startup render gap before judgments, headset readiness refusals and tracked pose gaps of 130.612 milliseconds exceeding the unchanged 85-millisecond guard. Static venue boxes now use five instanced material batches. Fixed opaque hilt pieces are merged by material with transformed bounds checked; tiny hilt rings use fewer segments, and Undertow XR omits per-note halos/sparkles while retaining glyphs and facets. No scoring window, blade endpoint or runtime pause safeguard was relaxed.

The native test now closes its completed desktop renderer before starting the separate headset case, instead of making two games compete on the same software GPU. The same full-song and tracked-strike assertions remain. One-eighth desktop rendering and a small emulated stereo framebuffer establish functional behavior, not physical Quest/Xbox frame rate. The 1440x1000 menu capture is separate visual evidence.

The temporary source-transport scripts and write-enabled staging workflow are removed before release. Published verification must compare runtime hashes and replay the main entry, along with retained song/practice/lesson/water paths. A merge is not publication evidence. Local Node tests are reproducible, but this container cannot render WebGL; native HTTP browser evidence comes from GitHub Actions.

Human listening, play enjoyment, physical comfort, hand-tracking UI and sustained device performance remain distinct unfinished acceptance obligations. Revert only this release on current master to roll back; do not reset sibling games or delete previous saves.
