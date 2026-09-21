# Currentworks recovery checkpoint / 2026-09-21

Recovered the water.js and water.mjs source from the user's Prism-Environment-Pass-1.zip, without reimplementing the module or replacing the game. This first direct-master checkpoint saves the standalone module only. It is deliberately not loaded by the live game yet. The next checkpoint will preserve the API documentation and tests and integrate it against the current Prism art source, then independently verify the published game. Do not claim this checkpoint changes the visible water.

Baseline read: c839f1229345c653ac408530da501c8acd01aff8. The previous source package records water.js SHA-256 8f2a03185a6f8de5a971016a38b1cef7372cdff85ce17a7f0ba1b37ff555093b. Read the latest remote master before any further write; never restore a whole old snapshot. No PR, new branch, publishing helper or write-enabled CI is required.

The reusable water module takes the caller's existing THREE namespace and pausable clock. It has no input, storage, rendering-loop or camera ownership. Local-space observations drive bounded wakes and splashes. Three presets, quality caps, quiet motion and opacity are supported. Reflection is an analytic sky approximation, not a copy of the real room or scene. See forthcoming README/API and verification notes for exact scope.

Fire will be a separate reusable module; trees follow separately. The earlier monolithic Tide + Ember patch is recoverable research/source, not something to apply wholesale over the current game. Preserve controls, scores, XR/Rotunda fixes and other games. Save each usable module directly to master as it is ready so work survives interruption.
