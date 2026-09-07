# Aether Reach — public mechanics demo

## v0.4.0: Foldwing and recoverable releases

Release an elevated rail, then **G** opens/folds a controllable glider. Movement keys/stick steer; looking alone does not. S/back brakes. Xbox **B** operates the canopy in gameplay; menus retain B/back. Touch has a Foldwing button. In experimental WebXR, another A action while airborne deploys/folds. Charge lasts approximately eight seconds, refills on ground/rail, and the canopy closes on landing, attachment, depletion or rescue. See [FOLDWING.md](./FOLDWING.md). Physical-device comfort and flight balance remain open.

The public source, tests and roadmap are committed in Git. The [eight-sheet v0.3 workbook](./planning/Aether-Reach-Development-Roadmap-v0.3.xlsx) is now committed too. It is a historical snapshot; [roadmap.json](./roadmap.json) and the [Kanban](./roadmap.html) remain the current plan (36 tasks, 59 dependency links). Browser-local board edits do not write GitHub.

After public-file verification, [versioned GitHub Releases](https://github.com/v5ma/v5ma.github.io/releases) store the source ZIP, workbook, checksums, clean-restore test and deployment receipt. These backups exclude private story, player browser saves and unrelated applications. They are not an independent off-site mirror. See [BACKUPS.md](./BACKUPS.md).

## Retained expedition and arsenal

This separate original sky-city prototype does not replace Paper Delivery, Dino Atlas, Rainward or the Theology Wiki. Restore three district relays and return to Arrival Quay to broadcast. The complete foot route and local checkpoints remain. Seven bidirectional rails include the Gale Market Loop and Prism Detour. Rail look is independent by default, and transfers need a nearby visible target and a clear body approach; no jump assigns a destination position.

Four original weapons retain distinct magazines, cadence, spread, damage, range, reload and meshes. Arc Caster recharges; Tempest Carbine, Horizon Longglass and Foundry Scattergun use finite reserves. Longglass uses actual 4x flat-screen angular magnification. The player starts with 400 local credits; Outfitters sells carbine for 180, sniper for 300 and scattergun for 220, plus damage/reload tiers and shield capacity. World caches and physical defeated-enemy salvage are once-only. This is not a real-money or network-authoritative economy.

Scout, armored burst attacker, telegraphing sentry and passive range target remain. Bazaar, greenhouse, industrial and observatory scenery are original procedural prototype art, not imported franchise assets.

## Controls and device scope

WASD moves; mouse/arrow keys look. E interacts/hooks, Space jumps/releases, G opens/folds the glider, C reverses, Shift sprints/boosts, F/click fires, R reloads, Q pulses, M maps, Esc/P pauses, B opens nearby Outfitters. Z/right mouse aims; 1–4 selects owned weapons.

Xbox standard mapping uses left/right sticks for movement/look, A jump, B glide, Y interact, X reload, RT fire, LT aim, LB pulse, RB reverse, View map and Menu pause. D-pad up/down cycles weapons; right opens Outfitters. Controller menus retain A/activate and B/back. Physical pairing and hardware QA are not certified.

The experimental Quest 3 WebXR adapter keeps head orientation independent of rail steering. The sniper's 4x optic remains flat-screen only. A true tracked magnified optic, two-hand climbing, embodied reload, multiplayer, physical tracking, frame time and comfort are separate work. Read [DEVICE-SUPPORT.md](./DEVICE-SUPPORT.md) and [PUBLIC_BUILD.md](./PUBLIC_BUILD.md); unpublished narrative remains private.

## Run, test and recover

Serve the repository root with `python -m http.server 4173`, then open `/aether-reach/`. Three.js r177 is pinned locally. No account, runtime CDN or service key is required.

Run `node --test aether-reach/tests/*.test.mjs` and `python aether-reach/tests/backup_test.py`. Native client, combat, glider and device-emulated browser suites are separate from pure seeded-model tests. See [REVIEW-03.md](./REVIEW-03.md) for earlier combat/rail design corrections. Ordinary acceptance is read-only. Only the post-publication backup job receives release/tag permission; it never rewrites game source.

A source backup can be restored into an empty folder and tested before use. It contains this game and its planning files, not every project linked by the preserved root chooser. Player checkpoints and kit remain browser-local and are not captured by Git source backups.
