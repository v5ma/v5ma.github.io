# First Steps v0.6.0 verification

This release adds input-graded browser lessons, not catalog songs or score migrations. Read [FIRST_STEPS.md](FIRST_STEPS.md) and the actual source/public workflow receipts. A completed automated curriculum is not five human onboarding tests or a physical controller qualification.

Run `node --test prism-current/tests/*.test.cjs` and `python prism-current/tests/lessons-browser.py` with the repository served and Playwright Chromium installed. Local Node checks run in the development container. Local HTTP Chromium navigation is blocked, so actual-renderer source and public tests run in GitHub Actions.

The new browser suite deliberately fails an exercise, retries it, completes the full curriculum through emulated controller input, checks that disconnect cannot earn manual-pause credit, and exercises keyboard and pointer handlers. It checks lesson-only persistence and return to the unmodified First Light song. Existing full-song, Practice Lab, Tidal Bloom, mixer, pointer, emulated XR and art checks remain. Gameplay uses a reduced software-rendering buffer; a separate full-resolution menu screenshot provides visual evidence, not a frame-rate measurement.

Human novice review, touch-device usability, physical Xbox/Quest comfort/performance and in-headset tutorial design remain open. Rollback must revert only this release on current master, preserving other games. The harmless new lesson-completion key can remain; original song and practice records are not migrated.

Previous verification notes are preserved in [QA-v050.md](QA-v050.md), including references to earlier releases. The source PR and final publication receipt record exact commits, tests and observed failures; do not treat this procedure as proof that a run passed.
