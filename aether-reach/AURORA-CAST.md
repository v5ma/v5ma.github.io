# Aether Reach 0.10.0: Aurora Cast

A rendering upgrade to the existing game. Bellwether Blackout, the other 13 side adventures, fast sky-rails, weapon damage, hit volumes, checkpoints and controller layouts are retained. This does not add multiplayer or claim AAA/photorealistic characters.

## Freely licensed human models

Three real Quaternius CC0 models now provide nearby humanoid presentation: Ultimate Modular Characters / Swat for Registry enemies, Worker for Surveyor Lio, and Ultimate Modular Women / Adventurer for Tavi. These are stylized low-poly human meshes with faces, hands, clothing, rigged limbs and authored animation, not the previous assembled boxes. Costume colors fit the teal, ivory and brass palette. The guard source includes a skinned pistol; its visual does not imply a change in the game's underlying weapon stats.

Ten clips per model are retained: idle, weapon-ready idle, firing, interaction, running, armed running, walking, wave, hit reaction and death. Clips crossfade through each actor's own AnimationMixer. Cloned skeletons do not share joint state, while immutable geometry is shared. Human origin, scale and facing are adapted to the existing gameplay coordinates. Death display is brief and non-physical; it is not ragdoll simulation.

The three standalone GLBs total 3,488,736 bytes before HTTP compression. Source models contain 8,794, 5,240 and 6,812 triangles respectively. No external texture or runtime model-service account is needed. A manifest records source IDs, original-source SHA-256, output SHA-256, triangle counts, retained clips and modifications. License text from each author's public download folder is retained unchanged. The women's folder ships the same generic male-titled license file; its official product page independently states CC0.

## Shader treatment and quality controls

The original Aurora layer adds a restrained view-dependent fabric rim, a translucent Fresnel/interference-grid rift veil, and a far high-cloud layer over the existing HDR sky. Existing Quay reflective/refractive jewels and glass are not removed. Aurora does not introduce a second scene render, a screen-space blur, or a global headset camera effect.

Settings contains controller-navigable toggles for Animated human models and Aurora cloth/rift/high-cloud shaders. They are saved under the separate `aether-reach.aurora.v1` preference key, not in expedition progress. Light uses at most 5 nearby skinned actors; Balanced/Prismatic at most 10. Immersive XR uses at most 3 nearby skinned actors. Rich fabric/rift/cloud effects are disabled in Light and XR. Beyond the selected range or budget, the existing procedural people remain. Missing or malformed character assets never hide their original fallback bodies. Reduced motion freezes decorative cloud time and quiet friendly idle motion without freezing combat state.

These limits are engineering budgets, not measured physical-device performance certification. Character detail still adds draw calls; the off switch returns to the original actor rendering.

## Reproducible asset preparation

`tools/prepare-aurora-assets.py` accepts only the reviewed SHA-256 inputs, treats them as JSON/binary data, keeps referenced animation/mesh buffers, and repacks glTF into self-contained GLB. It does not execute a downloaded Blender project, engine script or commercial shader. The local game loads only the committed GLBs.

Official author pages:

https://quaternius.com/packs/ultimatemodularcharacters.html

https://quaternius.com/packs/ultimatemodularwomen.html

https://creativecommons.org/publicdomain/zero/1.0/

Implementation references, using the already-vendored Three.js engine rather than upgrading its version:

https://threejs.org/docs/pages/GLTFLoader.html

https://threejs.org/docs/pages/Material.html

https://threejs.org/docs/pages/module-SkeletonUtils.html

## Verification and production plan

`tests/aurora.test.mjs` covers asset integrity, self-contained buffers, skeleton isolation, actual moving bones, action selection, death display, budgets, fallback, saved-state invariance and reduced-motion shader controls. `tests/aurora-gallery.html` is explicitly a test fixture, not an in-game scene. `tests/aurora-browser.py` reviews that fixture and then the real game using controller events to start, change settings, move to Customs, spawn actual arena enemies, open/close dialogs and test disconnect behavior.

Real WebGL compilation/screenshots, release regression, public-file hash verification, physical controller/headset acceptance and player approval remain separate records. The production checklist at `planning/AAA-ROADMAP.md` and board at `roadmap.html` now track the imported cast under AUR01 and P02. They do not mark the whole asset/animation production milestone complete.
