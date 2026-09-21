# Trees Pass 3 / first standalone checkpoint

This checkpoint saves independently usable Currentworks Trees 0.1.0 before changing the main game. Water 0.1.0, Fire 0.1.3 and the host 0.11.2 remain unchanged. The next checkpoint adds the thin riverbank adapter and served-game verification. This first save alone is not a visible Prism upgrade.

The original implementation provides seeded palm, alder and willow forms, tapered curved trunk/branch paths and actual leaf/leaflet geometry rather than billboard images. All three detail levels are generated from one skeleton before gameplay. Detail changes reuse those meshes and preserve stable identities. Two standard materials are shared across the forest; no extra textures, lights, render targets, renderer, input or storage are created. Host-clock wind bends positions and normals with fixed roots. Quiet mode stops it; AR hides the background vegetation by default.

All 303 local Node tests pass: the existing 289 plus 14 new seed, geometry, normal, index, winding, wind derivative, coordinate, LOD and ownership tests. Thirty checks using actual bundled Three r184 objects pass. The local Chromium WebGL2 probe returned null, so no actual local GPU, live battle or physical-device acceptance is claimed. Keep the distinction when continuing.

Research: EZ-Tree's own repository documents reproducible seeds and detail meshes sharing a skeleton; its LICENSE is MIT, copyright Daniel Greenheck. It was reviewed as a design reference, not imported or copied. The original module here introduces no EZ-Tree dependency/assets or second Three.js build. Official Three.js LOD and InstancedMesh docs were reviewed for detail/ownership tradeoffs. This first bounded set uses unique per-tree mesh pairs, not an unmeasured forest of thousands of instances.

https://github.com/dgreenheck/ez-tree
https://github.com/dgreenheck/ez-tree/blob/main/LICENSE
https://threejs.org/docs/pages/LOD.html
https://threejs.org/docs/pages/InstancedMesh.html

Next save the tests/API documentation, integrate only a small bank-side set into current RiverArt, verify approach-lane bounds, hide it in AR and Mothership, and rerun existing water/fire/interruption/Rotunda gates. Do not reapply old game snapshots, alter the soundtrack/combat/score schemas, publish private hub sources or touch sibling games. Direct fresh-master writes only, without PRs or staging branches.
