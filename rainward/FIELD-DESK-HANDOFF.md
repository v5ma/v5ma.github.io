# Rainward Field Desk / final-source checkpoint

Baseline: published XR Repair v0.16.1, PR194, gameplay merge 6b00ab5246288939c90c08f5442c3678ad8ae1eb. This branch starts at master d539c8e6bdf16339df16d3c514df1a2f4043af15 and preserves intervening sibling changes by normal merge. The branch is feat/rainward-field-desk-20260921.

Source was integrated and saved before native acceptance at 215f5fe465a607c4e1e7b2f3e7df7065c6f09acf. Temporary exact-hash transport, manifest and write-enabled staging workflow are removed in the final source. Use the permanent read-only field-desk workflow; do not restore the transport helpers. Earlier staging run 35555987987 is precursor-source evidence only.

The pass adds a summon-local spatial panel, bounded saved height/distance/size/yaw controls and original virtual pedestal. It stays fixed through head movement and page actions and stows during play. Motion is off by default. Resume, Map, Satchel, acquired-clue recall, latest message and music volume are the first-page controls. The Direct map opens its actual map immediately; legacy pinned presentation remains available. Acquired text survives newer transient hints and can be restored only when a checkpoint already records it as acquired. Placement mode cannot let an idle ray or a hidden reading view consume focused A input.

Local source/model checks pass 414 tests without failures/skips, including eleven new desk/panel tests. Protected physics, characters, rewards, gameplay input, saves, scoped muzzle, scope renderer and compositor files remain byte-identical to published v0.16.1; world.mjs changes only the release version. Native accepted behavior must be established by the real browser/compositor reports, not this checkpoint. Local HTTP browser use is administrator-blocked; no bypass was attempted. Authorized repository runners supply actual WebGL tests.

Keep failed traces. Required journeys include normal start, controller and hand menus, transformed ray selection, focused placement, head-motion stability, actual map and mixer access, acquired text, save/remap preservation, exit and reentry. Existing compatibility and eight v0.16.1 compositor cases remain separate regression. Software poses and GPU images are not physical Quest/Xbox, real passthrough, comfort, performance or final quality approval.

Preserve all seven expeditions, IDs, saves/remaps/rewards, fast running, characters, licenses and concurrent work. No private SaaS hub implementation, assets, configuration, review file or multi-game brief is uploaded. No engine migration, cross-game walking/sphere portal, freely grabbed panel or independently detachable panel system is included. The virtual base is calibrated, not a detected physical floor or persistent room anchor.

Complete normal merge, Pages and independent public-file comparison, then save exact publication status in the release PR and nested evidence. A version label and this handoff do not themselves certify that the upgrade is public.
