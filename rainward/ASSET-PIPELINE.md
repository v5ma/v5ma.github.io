# Rainward visual asset pipeline

## v0.5 — Imported, self-hosted environment assets

Eight credited Poly Haven CC0 sources replace selected procedural surface/rock/plant placeholders. See asset-credits.html and assets/scanned/manifest.json for authors, source identifiers, exact dimensions and shipped hashes. UVs, actual color/normal/roughness textures, and alpha-cutout fern silhouettes are retained; this is not vertex-color conversion. The 13.6 MB binary pack is self-hosted and a player needs no provider account or API key. The source-lock records original checksums. The one-time import workflow is removed before release; checked scripts are manual offline production tools, not runtime dependencies.

A per-tab compressed-byte cache avoids repeated network downloads when chapters change. Each scene owns its own decoded textures, models, instances and HDR conversion. Asset downloads have a timeout and a procedural fallback; late results cannot attach to a disposed scene. Replaced procedural textures are released at scene disposal as well as the imported textures. Scanned environment assets can be switched off in Controls for an honest in-game comparison.

## Rendering budgets

Full quality retains 2K main color textures, 1K normal maps, 512px packed material maps and source-textured models. Reduced Graphics builds independent GPU-side color maps capped at 512px, skips normal/environment lighting work and uses one world-scale color sample. It never resizes or overwrites the original full-quality image or its UV transform. WebP download compression alone does not shrink decoded GPU texture memory.

Scattered scanned instances are culled individually against the actual camera rather than submitting every fern or cliff in a world-spanning batch. Conservative sphere and transformed-box tests preserve visible geometry, and shadow casters remain available. Source model geometry and texture coordinates are not changed by runtime culling.

## Preserved play

New decorative plants are restricted to the existing grass zones away from controls, clues, objectives and shelters. Near mossy stones occupy existing planter footprints; larger boulders remain outside walkable boundaries. Scanned canyon geometry replaces only existing decorative canyon instances. This pass does not alter collision data, movement timing, inventory, enemy statistics, puzzle solutions, chapter routes or save format. Shelter interactions now prefer the closer shelter over a farther supply bag within overlapping interaction ranges, so an incidental nearby bag cannot consume a save interaction.

The renderer now loads glTF/GLB and HDR assets using pinned r177 addons, but no original rigged human character has been added yet. Character modeling/animation is the next major visual gap. New chapters, swimming, climbing, XR and multiplayer are not claimed by this environmental rendering release. Native acceptance checks actual asset loading and shader compilation, comparison/fallback, all three missions and existing controls before merge and publication hashes.
