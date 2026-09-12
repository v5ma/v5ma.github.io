# Spectral Observatory v0.7.0 verification

Source and public receipts belong in [PR #127](https://github.com/v5ma/v5ma.github.io/pull/127). This document describes test scope; a written test is not a passed run. Prior verification notes remain verbatim in [QA-v060.md](QA-v060.md).

The new spectral suite uses production A-Frame/WebGL and original music. It verifies actual shader programs, controller theme selection, preference reload, Classic/Light/zero/quiet behavior, resource reuse, a real input-generated hit and ripple, unchanged note positions, paused animation, cleanup and emulated transparent AR. Four 1440x1050 menu captures compare the three new themes with Classic. The existing song, mixer, Practice Lab, First Steps, pointer, emulated XR and Jewelbox suites remain required.

Local Node tests cover the six-slot pool, malformed data, event validation/expiry, policy gates, shared resource allocation, materials and disposal, alongside existing chart/audio/save/lifecycle fixtures. Local HTTP Chromium navigation is restricted; actual browser acceptance runs in GitHub Actions. Reduced gameplay rendering ratios verify behavior, not consumer GPU frame rate. Full-resolution menu review is separate.

The spectral push workflow compares all manifest-listed Prism files with the committed release on GitHub Pages and then tests the public shader flow. The existing published-game workflow separately exercises full songs, controller menus, practice and lessons. Both outcomes, exact commit and observed failures belong in the final PR receipt.

[Shader notes](SPECTRAL_NOTES.md) define the artistic/runtime boundaries. Physical Xbox/Quest, sustained performance, human readability/comfort and broad browser acceptance remain open. AR and VR deliberately keep the original lightweight art. Revert only this release on current master for rollback; no score migration or deletion is needed. Classic Jewelbox remains a per-device fallback.
