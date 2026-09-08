# Market Life - v0.4 development pass

This grows the same Leonardo city, not a new game. The original Stolen Folio, nine side commissions, joystick, settings, interiors, Lantern, bicycles and local saves are preserved. V / Neighbourhood work lists 22 new short activities; Y / Work interacts at the corresponding physical location. N / Journal and T / Talk continue to operate the older character stories.

## What the encounters actually do

Repair the cart, crossing bell and cask by following marked mechanisms. Restore a booklet or calibrate a workshop fitting. Carry distinct packets and gather ingredients across existing streets. Hear a musical refrain or read its notes, then play the controls. Collect evidence before resolving a misread address without accusing an innocent apprentice. Learn a restorative recipe. Find Lantern-only inscriptions. Choose a palette for Isabella's exhibition after her original commission. An existing adult partner permits a short optional garden outing; this is not full companion AI or a dating simulation.

These encounters award once, keep their completed state on reload, and record results in Field Notes. Mistakes cost nothing; leaving a panel cancels the current sequence, not completed progress. Proper floor, physical distance, walking/stopping, gate and original-quest prerequisites are checked on every action. The original letter inventory and original mission gates are not rewritten by the new work. Twenty-two counts complete named encounters, not the number of intermediate markers. Many are deliberately short; this is not yet the whole 30-50 activity roadmap.

## Artwork, not a concept image

32 selected Quaternius CC0 Standard models supply textured modular walls, windows, roof tiles, chimneys, vines, stalls, workbenches, bookcases, bottles, barrels, candles and tools. The free subset is curated; the full paid editions are not included. The underlying 49 house positions and usable doorways remain. Each static facade is batched by shared material, and common base-color/normal/ORM textures are reduced to 512px. The selected files total less than 10MB. Characters retain the existing renderer's models; new rigged animation is not claimed.

ASSET-REGISTER.json contains creator, license, original source URLs, upstream archive and individual model hashes, modified file hashes, counts and bounds. License texts remain beside the assets. The glTF loader matches the existing Three.js revision 177; only local import paths are changed. No runtime third-party network requests or paid assets are required. If loading fails, the procedural game remains usable. `?art=baseline` is an explicit comparison switch, not the default online view.

Some outcomes are visual: the cart straightens, collected produce leaves its pickup spots, a community table appears, Nero's bowl fills, and the exhibition uses the chosen palette. Other small encounters are remembered as notes. This is not a schedule/weather/police simulation. Piloted flight, major NPC animation, additional interconnected basement routes and multiplayer remain future work.

## Durable continuation

Start future sessions with [UPGRADE-CHECKLIST.md](./UPGRADE-CHECKLIST.md), release.json, the current branch/PR, and the asset register. Update the checklist only to the stage actually verified. The attached art advice concerned another game; this pass applies its asset-production principles to Renaissance Vinci without modifying Aether Reach.

The asset-preparation and integration workflows only commit their declared outputs on the development branch. Native acceptance is separate and read-only on the resulting exact source. Prior failed attempts are retained. Original full-commission, living-town and multitouch regressions remain required. Public deployment is not complete until served files match the merged source, including the actual glTF/binary/texture files. No Supabase, accounts, payments, private projects or sibling applications are changed.
