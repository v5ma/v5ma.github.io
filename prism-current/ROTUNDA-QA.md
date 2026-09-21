# Rotunda source and publication evidence

PR #205 records exact candidate, merge and public verification. Physical Quest/Xbox/touch approval and sustained ordinary-resolution performance are separate from all automated results.

First native run 35551508922 passed 237 model tests, scene-menu placement/reset, actual screen launch, a paused music adjustment without state loss, and a complete Duck Armada battle. It sampled a next-button position while the pedestal was still opening after completion. That click missed, so the test timed out instead of declaring the next chapter playable. Artifact 10618283244 (SHA-256 f764e9d393b45caf0d77759c370923f9b51892ea8ded7424b41ffbb81d9fcdbc) preserves the trace and screenshot; no script or shader errors were recorded.

The input producer now waits for the actual opening animation before projecting a target and explicitly confirms the chapter change. It does not set game phase or UI position. Source review also moved the desktop aim marker into the renderer, avoids hidden-menu repainting during combat and preserves furniture yaw for a vertical head orientation. Combat core, health, scoring, boss rules and music are unchanged.

Stage run 35551908665 then passed all 237 model tests and 52 native checks. Artifact 10618703329 was downloaded and its ZIP SHA-256 verified as 7d69eda4702cd195bf9c0c5e30ec761ddfa956259ac635ed2b0c3a625fb736c4. Both Arcade chapters completed through real-time pointer/keyboard input. Duck Armada recorded 37 slices, 131 laser hits, 25 blocks and 44 boss damage; Mothership recorded 31 slices, 153 laser hits, 70 blocks and 60 boss damage. Both were actual victories, not forced completion or no-fail overrides. No uncaught JavaScript or shader error was captured.

The same stage run exercised controller menu navigation and reconnect, all fourteen transformed AR/VR targets with native-shaped input collections, hand pinch, head-independent placement, opacity and actual AR shader alpha, direct reset, stow/resume, wrist/floor HUD, removal of the old movement pause and same-battle session exit/re-entry. Actual 1440x1000 scene and panel-texture images were inspected separately from small-buffer gameplay checks.

The successful modified worktree was committed as dec5600a6f4d315acc44df07d0091c77f78227af. Its pre-edit checkout was dde39f51227a5ee7ae3d2e7a97d16b290d9bd43e. The artifact contains both checkout-commit.txt and runtime-commit.txt; those distinct identities must not be conflated.

The clean candidate removes all four temporary patch/workflow files, introduces a read-only final verifier, updates documentation while archiving prior versions, and adds a bounded screen-presentation refinement: appropriate input labels, Home placement recovery, first-focus selection for supported modes and viewport fitting. The corresponding test observes focus rather than assuming an initial item, and adds Home plus fourteen narrow-viewport control checks. Those refinements require their own final clean-source and public results; the 52-check stage receipt does not pre-approve them.

Source/public workflow outcomes and exact artifact receipts belong in PR #205. A merge alone does not prove public publication. Local HTTP Chromium navigation and local WebGL are unavailable; actual renderer tests run through GitHub Actions. Physical-device and owner acceptance remain open.
