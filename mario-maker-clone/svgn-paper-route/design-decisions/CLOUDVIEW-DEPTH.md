# Playable Cloudview depth and color

The approved image remains an art-direction target, not a gameplay texture or a claim of pixel-identical assets. This revision works in the main live renderer, retaining original procedural art and the existing level creator.

The play camera is genuinely perspective so distant islands and rails recede. The original orthographic camera is still used by the editor and the physics remain on the same side-scrolling plane. Beveled gold/cobalt panels, additional foliage and cliff strata, architectural trim, a directional shadow map, reflected sky lighting and a rebalanced palette improve depth and material separation. Runtime shader use distinguishes matte rock and foliage from reflective metal and the rider. Spatial batches preserve every triangle and every position, normal, color and UV attribute; this is culling, not reduced-detail replacement.

An old rider point light was restoring its intensity every frame after the new lighting initialized. The depth pass now suppresses old lights by visibility and restores both visibility and intensity on leaving the scene. The 1024-pixel shadow map is retained for foreground geometry while distant background chunks outside its intended region skip shadow work. Cloud textures are small procedural weather textures, not prerendered images of the level.

The branch includes the previously unfinished open-ramp/whip course. It completes raw reeling-key mapping and prevents duplicate R-key retries. The whip renderer uses an actual dynamic mesh of three-dimensional links following the animated hand and live peg. A positive instanced-mesh count was insufficient evidence that the old chain was visible; current captures must be inspected. No simulated position jumps, automatic catches or guaranteed hits are introduced.

Verification records separate pure geometry/physics tests from native HTTP 3D playthroughs. All published claims must refer to the exact tested source and its final artifacts. Software WebGL runs are not physical GPU performance certifications. Artwork and runtime performance still warrant testing on the intended desktop/mobile hardware. The separate Studio art, dinosaur application, theology sources and account configuration remain outside this revision.

Rollback is a scoped revert of the release merge, without clearing player saves or resetting unrelated repository history.
