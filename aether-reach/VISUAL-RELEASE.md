# Prismatic Quay / v0.4.2

This completes the recovered Quay art branch and adds a rendering-focused update to the same game. Publication and backup status are recorded in PR77, not inferred from this document. The gameplay model differs from v0.4.1 only in its version label. No private source or unpublished narrative is included.

## Real artwork and optical effects

The two Quay facades, slate roof components, cast-iron lamps, potted foliage, masonry, paving and HDR environment are the downloaded CC0 assets registered in ART-SOURCES.md and art/manifest.json. Source credits, license text, nineteen payload hashes and desktop/mobile variants are committed. No runtime asset API, CDN or marketplace login is required.

New original geometry adds a faceted suspended jewel above the promenade, smaller gemstone accents, a curved glass-and-brass market canopy, remodeled firearms and a compact articulated sky clamp. These are meshes in the scene, not a promotional image or CSS backdrop. Foreground equipment uses sculpted receivers, collars, separated barrels, ribbed grips, glass energy chambers, scope lenses, curved jaws and instanced fasteners. Gun statistics, ammunition, aiming, rail attachment, collisions and saves are unchanged.

Three.js r177 physical materials provide HDR specular lighting, metallic roughness, clearcoat, iridescence, finite-volume transmission, attenuation and chromatic dispersion. Original additive caustic-like floor patterns and point glints are stylized effects, not ray-traced caustics or a physical diamond simulation. Reflections sample the HDR environment; they are not live mirrors of every moving actor. There is no engine migration or full-screen blur pass.

The visual review also exposed decorative island rocks and an engine ring extending through the walkable deck. That above-floor rock hid paving behind a broad flat blue surface. Only the underside instance matrices are lowered beneath the actual slabs: decks, colliders, player positions and distant scenery do not move. A CPU bounds/ray regression checks that floor-view rays hit paving rather than a protruding rock. Native matching-camera and walk-through captures independently review the result. The original large clamp box is replaced by a compact cylindrical wrist assembly and curved polished jaws.

This is not a full-city, character or interior art replacement. Shiny materials are not an excuse for obscured paths or unreadable silhouettes.

## User-selectable quality

Controls & settings → Materials & effects offers:

- Prismatic: glass/jewel refraction and restrained dispersion, reflective metal, bounded glints and caustic-like accents. Desktop default.
- Balanced: the same models/textures with cheaper reflective/translucent glass, without the scene-refraction pass.
- Light: mobile default; reflections remain, while refraction, decorative point effects and dynamic shadows are disabled.

Immersive XR always uses Light effects without changing the head projection or forcing head rotation. Exiting restores the requested desktop mode. Physical Xbox pairing and Quest 3 tracking, frame time and comfort are unverified. Reduced motion freezes decorative shader clocks and rotations. The preference is local under `aether-reach.visual.v1`, separate from game progress, and denied storage is tolerated.

A 1024 player-local directional shadow map replaces the 2048 whole-city map. This increases local texel coverage while reducing map work; it is not a physical-device FPS guarantee. Instances and effect pools remain bounded. Prismatic rendering costs more: use Balanced or Light on slower hardware.

## Recovery and acceptance

The earlier unmerged recovery fixture defeated every attacker but hit its real-time deadline before the required simulation duration. The same problem remained with the first Balanced software-GPU run. The mission was not shortened, completed by script, or given wider hitboxes. Tactical tools/defense fixtures now select the normal Light option through the visible UI. Expedition/arsenal fixtures select Balanced at 960×640. Their rules, time progression and success assertions remain unchanged.

Separate full-resolution Prismatic camera plates, normal walking/interactions, quality-switching, fallback loading and emulated XR lifecycle checks exercise the high-detail path. Comparison plates use identical before/after cameras and are explicitly not player-progress evidence. Shader compile errors fail visual acceptance. The restricted-storage boot disposes the prior live scene first instead of competing with a second software-WebGL context.

Release only after existing gameplay/device and art tests pass; inspect actual final captures; compare hosted hashes; download and verify the GitHub Release assets. Backups include the CC0 art and actual evidence, not browser player saves or a private manuscript. The Excel workbook remains explicitly a historical v0.3 snapshot.

## Primary references

- Three.js physical materials: https://threejs.org/docs/pages/MeshPhysicalMaterial.html
- Environment prefiltering: https://threejs.org/docs/pages/PMREMGenerator.html
- PlayCanvas PBR/refraction/iridescence: https://developer.playcanvas.com/user-manual/editor/assets/inspectors/material/
- Babylon.js PBR: https://github.com/BabylonJS/Documentation/blob/master/content/features/featuresDeepDive/materials/using/masterPBR.md
- A-Frame material/custom shader reference: https://aframe.io/docs/1.8.0/components/material.html

These communities informed the approach. The game still runs on pinned local Three.js; it does not embed all four engines. No unlicensed showcase shader or commercial-game asset was copied.

## Next visual priorities

Review player feedback on this block before extending its palette. Replace remaining placeholder characters/hands with licensed rigged assets, add interior lighting variety, and measure real headset performance before introducing more render passes or a tracked VR scope. New missions and the private story are outside this graphics release.
