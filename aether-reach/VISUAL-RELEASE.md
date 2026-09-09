# Prismatic Quay / v0.4.2

This completes the recovered Quay art branch and adds a rendering-focused update to the same game. Publication and backup status are recorded in PR77, not inferred from this document. The gameplay model differs from v0.4.1 only in its version label. No private source or unpublished narrative is included.

## What is real artwork and what is a shader

The two Quay facades, slate roof components, cast-iron lamps, potted foliage, masonry, paving and HDR environment are the downloaded CC0 assets registered in ART-SOURCES.md and art/manifest.json. The original source credits, license text, nineteen payload hashes and desktop/mobile variants are committed. No runtime asset API, CDN or marketplace login is required.

New original geometry adds a faceted suspended optical jewel above the main promenade, amethyst and rooftop accents, a curved glass-and-brass market canopy, and remodeled foreground firearms. These are meshes in the real scene, not a promotional image or CSS decoration. The hand-held weapon design uses sculpted receivers, annular collars, separated barrels, ribbed grips, glass energy chambers, scope lenses and instanced fasteners. Gun rules, ammunition, recoil inputs, scope behavior and collisions are unchanged.

Physical materials use the existing Three.js r177 renderer: image-based specular lighting, metallic roughness, clearcoat, iridescence, finite-volume transmission, attenuation and chromatic dispersion. There is no engine migration or full-screen postprocessing blur. The inexpensive additive caustic-like floor patterns and point glints are original GLSL effects. They are stylized, not ray-traced caustics or a physical diamond simulation. Reflections sample the HDR environment; they are not live mirrors of every moving actor.

The original flat materials elsewhere remain where appropriate. This pass is not a full-city/character/interior art replacement. A shiny surface is not permission to hide unreadable silhouettes or weaken navigation.

## User-selectable quality

Controls & settings → Materials & effects:

- Prismatic: glass/jewel refraction and restrained dispersion, reflective metallic equipment, bounded glints and caustic-like accents. Desktop default.
- Balanced: the same models/textures with cheaper reflective/translucent glass, without the scene-refraction pass.
- Light: mobile default; reflections remain, but refraction, decorative point effects and dynamic shadows are disabled.

Immersive XR always uses the light effects path, without changing the head projection or forcing head rotation. Returning to flat play restores the selected presentation mode. Physical Xbox pairing and Quest 3 tracking, frame time and comfort remain unverified. Reduced motion freezes decorative shader clocks and rotations. The preference is local under `aether-reach.visual.v1`, separate from equipment and mission saves; denied storage is tolerated.

The directional shadow map now covers a player-local volume at 1024 rather than rendering a 2048 map over the entire city. This improves local shadow detail per texel while reducing map area; it is not a measured physical-device FPS promise. Geometry/material instances and fixed effect pools remain bounded. Prismatic rendering costs more; select Balanced or Light on slower hardware.

## Recovery and acceptance

The earlier unmerged Quay recovery fixture had already defeated all six attackers but exhausted its wall-clock test deadline before its required simulation duration elapsed. The art was not lost: the source and failed reports were recovered from GitHub. This iteration addresses rendering cost instead of shortening the mission or granting completion.

Long software-GPU expedition/arsenal/defense regressions select the actual user-facing Balanced setting at a 960×640 desktop viewport. They retain the same map, rules, success assertions and normal input. Separate full-resolution Prismatic camera plates and actual game walking/interaction/quality-switch tests verify the high-detail path. Camera plates use identical before/after fixtures; they are not claims of player progress. Shader compile errors fail visual acceptance.

Release only after the existing gameplay/device tests and art tests pass; inspect actual final screenshots; compare hosted hashes; download and checksum the GitHub Release assets. These source backups include the CC0 artwork and actual evidence, not browser saves or a private manuscript. The historical Excel workbook remains explicitly a v0.3 snapshot.

## Primary implementation references

- Three.js physical material properties and costs: https://threejs.org/docs/pages/MeshPhysicalMaterial.html
- Three.js environment prefiltering: https://threejs.org/docs/pages/PMREMGenerator.html
- PlayCanvas physically based material/refraction/iridescence reference: https://developer.playcanvas.com/user-manual/editor/assets/inspectors/material/
- Babylon.js PBR documentation: https://github.com/BabylonJS/Documentation/blob/master/content/features/featuresDeepDive/materials/using/masterPBR.md
- A-Frame custom material/shader reference: https://aframe.io/docs/1.8.0/components/material.html

These communities informed the rendering approach. The game still runs on its pinned local Three.js; it does not claim to embed or depend on all four engines. No unlicensed showcase shader or commercial-game asset was copied.

## Next visual priorities

Inspect player feedback on this block before extending its palette to more districts. Then replace the remaining placeholder characters/hands with licensed rigged production assets, add authored interior light variation, and profile real Quest hardware before adding screen-space reflections or a tracked VR scope. No new missions or private story are claimed by this graphics-only update.
