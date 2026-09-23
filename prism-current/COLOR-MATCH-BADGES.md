# Color Match / visible fruit badges

A source/actual-geometry review found a concrete visibility defect independent of the new scoring rules. Friendly Current enlarges fruit bodies with difficulty-dependent radii, but the front direction icon remained fixed at local z0.25. A ray through the badge center in the real bundled Three geometry hit the fruit body first on Easy(radius0.31), Normal(0.28) and Hard(0.26). Only Ultra Hard(0.24) originally put the badge in front. This also obscured the new matching symbol where beginners most need it.

The icon now follows the actual visual fruit radius at n.r+0.025. The badge's size, direction, palette and hit rules are unchanged; no scoring radius, enemy path, timing or collision is enlarged. The existing material still depth-tests. Art's cache token is0.13.0-badge1; host remains Color Match0.13.0. No effect module, shader pass or scene background changes.

The same actual-geometry probe now hits the badge first for all four difficulty profiles. Four added object assertions use real core-spawned fruit and the rendered actor's actual triangles. New Color Match object count is17; all423 Node tests still pass. Those geometry/canvas checks are not a GPU screenshot or physical Quest observation. The full tracked source/public journey remains required and preserves its earlier capture-order correction and every scoring/health/session assertion.

This focused repair is separate from the first native capture/paused-state failure recorded in COLOR-MATCH-TEST-RECOVERY.md. Do not claim moving the badge fixes every frame gap. Preserve native failures, record exact accepted runtime hashes, and keep the existing0.35-second safeguard. Source and test blobs were verified against locally computed Git IDs before direct-master publication.
