# Graphics first — coastal neighborhood art pass (0.2.2)

The current priority is the visible game, not more mechanics. This release is a scoped environment-art replacement in the existing `svgn-planet/` application. The Signal City feature candidate stays separate until the visual baseline is approved. No new title, game folder, mission or online account system is added.

## Finished source art, not more placeholder solids

Quaternius **Downtown City MegaKit Standard** supplies recessed windows, brick walls, trim, cornices, wooden door assemblies, slate roofs and dormers. Modules are assembled at the original homes' playable scale; entire high-rise buildings are not shrunk into tiny houses. One- and two-story variations retain the original ground footprints and mailbox approaches. Shallow porches and low pickets remain decorative, as before.

Quaternius **Stylized Nature MegaKit Standard** supplies branching tree meshes, textured leaves and bark, flowering shrubs, planters, ferns and ground plants. Scenery uses spatially local instancing batches instead of rendering far-side trees. Poly Haven asphalt and concrete use local color/normal/roughness maps with meter-scaled road coordinates. A grass texture uses triplanar mapping to avoid stretched streaks at the world's poles. A resized CC0 pure-sky photograph replaces the expensive procedural sky-noise backdrop and provides a small reflection environment. This is an LDR derivative of the tonemapped source, not an unclipped HDR renderer.

Glass is depth-stable PBR glazing; a warm window recess is not an enterable room. No paid fake-interior or foliage shader is included or represented as our code.

## Source, licenses and production

The curated library contains 27 selected static source models; the first arrangement uses 20 of them. Every shipped third-party art source is CC0. Original Standard license texts and source/archive/derivative hashes are in `assets/street-art/asset-register.json`. This matters because the game and raw art files are publicly redistributed.

Sources:
- https://quaternius.com/packs/downtowncitymegakit.html
- https://quaternius.com/packs/stylizednaturemegakit.html
- https://polyhaven.com/a/aerial_asphalt_01
- https://polyhaven.com/a/concrete_pavement
- https://polyhaven.com/a/rocky_terrain_02
- https://polyhaven.com/a/kloppenheim_06_puresky
- https://polyhaven.com/license

`tools/prepare-street-art.py` reproduces the static library from official Standard ZIPs and the named material metadata. `tools/prepare-sky-art.py` then adds the sky variants and source record. Image limits, geometry combination, transparency handling and Standard-material adaptations are explicit. Three.js GLTFLoader and BufferGeometryUtils are from the same r177 as the existing MIT renderer. The one-time acquisition/import jobs were source-production steps, separate from read-only tests, and are removed from the release tree.

## Preserve the playable game

`model.mjs`, `world.mjs`, `presentation.mjs` and `vehicles.mjs` are byte-identical to base `221844c60d56202bddadeba2bbec1cd204535e7f`. The art version is 0.2.2; the unchanged simulation reports its engine version separately. Controls, camera presets, character scale, routes, collisions and saved progress are preserved. The app only waits for artwork readiness and redraws when artwork arrives. A resource failure explicitly identifies the fallback and retains the original playable scenery. Context recovery remains the original game mechanism.

Before and after are actual HTTP-served WebGL captures. The opening comparison uses identical actor coordinates, heading, viewport and camera—not a zoomed preview or generated concept image. Further views use the same ordinary riding/orbit inputs, with small timing differences in moving traffic. Retained full-delivery and touch/context-loss tests check playability. A first integration missed the sustained emulated-touch performance threshold and exposed polar grass stretching; local batching, a cheaper photographed sky and triplanar grass address those defects. Do not label that failed run as passing. Final acceptance requires fresh reports and visual inspection.

## Remaining visual work

The courier rig, clothing shapes, vehicle model family, distant mountain silhouettes and skyline are not finished-model replacements in this pass. They remain visible quality gaps. Keep the next milestone on those foreground and horizon assets before resuming mechanics expansion. No claim of matching every reference detail or commercial-game quality is made. Physical-device performance needs real hardware playtesting.
