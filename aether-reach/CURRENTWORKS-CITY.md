# Currentworks City 0.17.0

The owner requested the reusable graphical library at prism-current/modules/environment in addition to the existing story work. This applies four actual library modules to the current Aether expedition, rather than replacing the game with another island demo. Read FUTURE-DIRECTION.md and DEVELOPMENT-HANDOFF.md on resumption.

## Source and compatibility

The host is still the existing Three.js r177, with one renderer, simulation, input system and animation loop. The library was written and previously tested against Prism's r184. Aether therefore needs its own real shader and stereo-aperture tests; Prism's receipts are not Aether acceptance. UPSTREAM.json records all eight exact upstream blob identities and SHA-256 hashes. Byte-identical snapshots live inside vendor/currentworks so independent Aether source backups remain self-contained. Updating those snapshots is deliberate, not an unreviewed dependency on another game's changing live scripts. All placement, quality and water-footprint adaptation lives in currentworks-layout.mjs and currentworks-view.mjs, not in modified library copies.

The approved 0.16.0 story and its two UI repairs are retained. Its previously unfinished source run 35780975207 at c4b9c19fd1d7b7c891c68b672592aa1497e6a6dc has now completed all seven suites successfully. That establishes the recovered software baseline, not the new graphics or a physical headset result.

## What changes in the actual game

Currentworks Water replaces the existing water-patch surfaces nearby. The authored centers, circular radii, tactical targeting plane, hazard timers, damage and original warning rings remain authoritative and unchanged. A host shader mask trims the rectangular library mesh to each real disc. A low vertical scale keeps ripples close to those existing shallow surfaces. Charged patches retain a blue electrical cue. Actual eligible shot/power impact events create cosmetic splashes; the adapter does not manufacture impacts or award hits. Distant patches retain the original inexpensive material.

Currentworks Trees replaces only the old decorative trunks/crowns in twelve existing Bellwether and Garden planters. The planter meshes remain. Bellwether uses alder forms and the Gardens use willow forms. Detail selection is shared across both eyes, with the library's XR cap and bounded wind driven by the existing pausable simulation clock. This adds no tree collision, new route or enemy cover. It does not replace human models or reskin the entire city.

Six Currentworks Cloudlets formations provide actual opaque 3D lobe geometry around the city. They are positioned in world space away from the streets, not attached to the camera. The Toon helper provides their shared stepped-lighting material and underside vertex shading. These are mesh clouds, not VDB volumes, Gaussian splats or physically simulated atmosphere. They pass through the same per-eye world aperture as other scenery, never a new head-following transparent sheet. The near-viewer suppression is a visual precaution, not room sensing.

The existing Materials and effects quality setting controls these effects. XR uses Light water; foliage and cloud LOD are capped by their own module rules. Reduced motion suppresses wind, wave displacement, and cloud drift. Paused gameplay freezes their absolute time. A normal settings checkbox restores original foliage and patch surfaces without changing the expedition. It is operated by the existing controller/spatial UI; no new gameplay input is introduced.

Preparation runs before gameplay input/audio begins. Tree buffers are exercised by the bounded upstream loading hook; Aether's water/cloud shaders compile with the host lights. If preparation rejects, the host retains the original decorations and reports the error rather than abandoning the expedition. No persistent render target, new camera feed, external texture download or extra scene-render pass is added. The water's reflected sky and shaded bed are analytic, not reflections/refraction of the real room.

Fire and the separate island helpers are intentionally not activated in this slice: no new flamethrower, damage system, route, private hub or island scene is implied. They remain later integration candidates subject to authored purpose and GPU budgets.

## Evidence and limits

The local HTTP Chromium attempt was blocked by administrator navigation policy. Its failure is retained locally; it is not a gameplay pass. Real r177 object/model tests exercise provenance, exact placements, read-only updates, preparation fallback, pause/reduced motion, charged water, impact eligibility, toggles, portal material ownership and disposal. A separate real-GPU fixture exercises the game adapter, tree warmup, water/foliage/cloud draws and scaled paired-eye aperture pixel containment. The existing seven-suite workflow runs it in the render job. The controller mission and hand story journey retain their original real movement/progress checks and add graphics preparation, toggle, draw and pause observations.

Record actual native, hosted-byte and archive outcomes in release-receipts/aether-v0.17.0-20260922.json after running them. A successful older build, a local object fixture, or a source commit is not a live or physical pass. Physical Quest 3 appearance, sustained frame time, stereo comfort, Xbox device pairing and human narrative comprehension remain open.

The next bounded improvement is observation-led visual/mission clarity within the existing arrival-to-Bellwether chapter: verify that new foliage does not obscure named interactions or enemy silhouettes, and that readable story text survives changing window scale. Do not expand the map or activate expensive reference effects before this integrated slice is assessed. Revert only Aether paths with a forward commit if needed; never reset master, overwrite a versioned release or clear browser storage.
