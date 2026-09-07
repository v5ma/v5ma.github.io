# Street-view repair continuation — v0.2.1

This continues the **existing** SVGN.io Paper Delivery game at `/svgn-planet/`. It does not introduce another title or application. The close third-person view, normal-size rider, bicycle/electric-unicycle choices, eight deliveries, saved progress and nonterminal route completion are retained from v0.2.0. The old globe overview remains an optional camera, never the default playable view.

## Actual renderer changes

The street now has a directional blue/cumulus sky reconstructed from the live camera, including the depressed horizon of its curved terrain. Bulky globe-cloud geometry is shown only in overview. The foreground avenue uses deterministic leaf-cutout canopy meshes and branches instead of rounded canopy blobs. Shadows use the existing bounded desktop preset; touch retains no shadows and its capped drawing buffer. Asphalt and ambient-light color are less green. These are original rendering code and procedural assets; no supplied screenshot is embedded as scenery.

## Reliability and evidence

The existing browser lifecycle controls continue to release held input on a focus blip without quitting. Explicit pause or hiding the page is separate. Context loss has an in-game recovery path using the retained WebGL extension after the renderer rebuilds its state; completed progress stays intact. Finishing a round and loading a completed save do not stop free play.

Acceptance tests extend the full eight-delivery/depot/reload scenario and the sixty-second emulated-touch scenario. They observe the sky's actual render submission, inspect the real capture for visible blue sky, inject a focus-loss event and a WebGL interruption, and confirm recovery with the new materials. Model fixtures, fault injection, native ordinary-input gameplay and screenshot inspection are distinct forms of evidence.

The user's precise two-second exit on their own device has **not** been independently diagnosed. An operating-system tab termination or physical Safari/device-specific driver failure is not ruled out by Chromium. The current art still differs materially from the reference's detailed foliage, skyline, architecture and animation. Passing pixel or geometry checks does not establish visual parity or enjoyment.

The final release stays in the existing folder and uses the existing homepage card. Verification reads committed source only. Publication compares deployed bytes to that source; the receipt's version comes from release.json. No sibling game, account, payment, multiplayer, private-story or Supabase configuration changes are included. Use a scoped revert for rollback, not a reset of repository history or deletion of player saves.
