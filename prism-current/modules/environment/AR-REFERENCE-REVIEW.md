# AR reference review / 2026-09-22

This is a source/provenance register, not an endorsement of product performance or a claim to have watched every linked animation. Only primary project, author and licensing pages support the findings below. User descriptions are treated as art-direction input where a link did not expose inspectable implementation. No external cloud, grass, skin or UI source was copied into the new modules.

## Disney cloud data

Disney's official resource page offers a detailed volumetric cloud dataset. Its linked Readme describes VDB data and reduced-resolution versions; the package is listed as 3GB. The linked asset license is Creative Commons Attribution-ShareAlike3.0 Unported. This is a specific released data asset, not blanket permission to use Disney characters or other production assets. Readme/license PDFs were inspected, including their page images.

For reuse, retain creator/source and license attribution and identify conversions or other modifications. Distribute adapted licensed assets under the applicable ShareAlike terms; keep asset and code provenance distinct rather than asserting that a dataset automatically determines every license in a game. Do not imply Disney endorsement. No Disney dataset is included in the current source addition.

A VDB file stores volumetric information; it is not a ready-made Three.js effect. A possible later pipeline crops/downsamples offline, exports bounded density/lighting textures and preserves attribution, then renders them with a tested stereo-aware shader. Raw single-channel 8-bit density at128^3 requires2MiB and at256^3 requires16MiB, before lighting, mips or any other resources. Those are arithmetic estimates, not the downloaded dataset's size or a headset budget. Current Cloudlets uses original opaque geometry, not this pipeline.

https://disneyanimation.com/resources/clouds/
https://media.disneyanimation.com/uploads/production/data_set_asset/1/asset/Cloud_Readme.pdf
https://media.disneyanimation.com/uploads/production/data_set_asset/6/asset/License_Cloud.pdf
https://creativecommons.org/licenses/by-sa/3.0/
https://www.openvdb.org/
https://threejs.org/docs/pages/Data3DTexture.html

## Toon, cel, low-poly and splats are different concepts

Three.js MeshToonMaterial supports a gradient map with nearest filtering and non-color data settings. Toon/cel shading simplifies lighting into a selected palette or bands; contours are a separate choice. Flat-shaded polygon facets concern surface normals and geometry, not the same artistic decision. Anime is broader design of shape, composition, color and movement, not one automatic shader. The new Toon factory wraps the caller's existing Three.js material class without a postprocess pass or engine replacement.

LOD means choosing a representation/detail level. Instancing reuses geometry/materials with transforms to reduce submission overhead. Splats describe projected footprint primitives; Gaussian splatting is a particular representation/rendering family, not automatically a toon shader. Those can be combined, but the cited Michael Moroz post did not expose its implementation in the available retrieval. Do not claim its exact technique, performance or AI tool authorship was verified.

https://threejs.org/docs/pages/MeshToonMaterial.html
https://threejs.org/docs/pages/LOD.html
https://threejs.org/docs/pages/InstancedMesh.html
https://repo-sam.inria.fr/fungraph/3d-gaussian-splatting/
https://sparkjs.dev/docs/
https://x.com/Michael_Moroz_/status/2067059891974402465

## Grassworks

The project's public page describes a commercial WebGPU-oriented grass system. Its stated fallback is not validation of compatibility with Prism's existing A-Frame/WebGLRenderer. Its license prohibits public source distribution and standalone library redistribution; supplying third-party creation/building-block capabilities requires separate written permission. Therefore no Grassworks code, paid preset, model or distribution package belongs in this public shared effects library under an assumed ordinary end-product license.

Grass wind, localized clumps and bounded detail are useful general design goals. Any shared grass module should be independently authored from general rendering methods or use an explicitly compatible open-source dependency, not reconstruct proprietary source. No product was purchased or downloaded.

https://grassworks.techredux.co/
https://grassworks.techredux.co/license

## Three Low Poly / Mad Science

The author's public three-low-poly repository exposes procedural geometry and collection-building utilities. Its LICENSE.md is ISC, requiring the appropriate notice when code is reused. Parametric island rocks and props are a plausible future application. We inspected the repository/license, not a complete frame-time analysis of the Mad Science demo. The quoted '28k' size/performance implication is not verified here. No dependency is added by this pass.

https://github.com/jasonsturges/three-low-poly
https://raw.githubusercontent.com/jasonsturges/three-low-poly/main/LICENSE.md
https://jasonsturges.com/#mad-science

## ThreeUI and the motion-design reference

The author's ThreeUI repository provides a Community catalog with a code license, while premium/Beta material and separately credited assets must be distinguished from that release. A promotional scene is not proof that a component handles Quest rays, input latches or accessible XR navigation. Use the reference for panel hierarchy, deliberate timing and object-level movement. Do not transfer camera fly-throughs, head turns or full-view blur into AR gameplay. No community/premium code or font was imported.

https://github.com/MengTo/threeui
https://raw.githubusercontent.com/MengTo/threeui/main/README.md
https://motion.mengto.here.now/

## Links with incomplete retrieval

The 3ditions Stillwater and Ocean System URLs exposed a JavaScript-driven product shell, not enough implementation to identify the author's shader, exact asset licenses or hardware performance. The skin-rendering demo could not be retrieved; no specific skin, translucency or lighting algorithm is assigned to it. The supplied Chetan post and text supply a useful art-direction checklist, but the exact malformed social link did not yield an independently verified technical source. The Michael Moroz post likewise remains implementation-unverified.

https://3ditions.drop3.app/#stillwater/video
https://3ditions.drop3.app/#ocean-system/video
https://skin-rendering.vercel.app/
https://x.com/chetanankola/s/chetanankola/status/2101595285675970853

## AR-specific inference and design decisions

The owner's focus is augmented reality with the actual room visible. Our proposed adaptation is bounded islands/cloud pockets, restrained local haze, high-contrast gameplay and virtual lighting, not a full skybox, screen fog or assumed room-image reflections. No optional sensing API is assumed merely because WebXR is present. Supported features must be detected and absence handled. Nothing here claims virtual light edits real passthrough pixels or that seeing the room removes the need for safe physical boundaries.

https://www.w3.org/TR/webxr/

This register informs original work; it does not certify licenses not inspected, measure the screenshots' performance, or complete any of the nine proposed levels. Read AR-LIBRARY.md and the AR-first game checklist for the exact shipped-source versus proposed-integration boundary.
