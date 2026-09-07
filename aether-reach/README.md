# Aether Reach — public mechanics demo

## v0.4.1: Tactical Relay

The focused tactical patch adds Current and Cinder while the gun remains equipped. Water conducts Current; oil burns under Cinder. Loan the field rig at the bench east of Quay Outfitters. N opens builds, T cycles powers, J surveys, Q casts. Each power has independent energy/cooldown accounting; existing gun ammunition, reload and scope remain.

The optional Atrium collector links preparation to a full fight. Solve the nearby 3x3 conductor puzzle, turn the defender friendly, choose one passive, and defend the collector through three waves and a 48-second minimum. The turret has fourteen shots and cannot win unattended. First completion grants 180 credits once. The original three-relay expedition is still independent of this encounter. See [TACTICAL-PLAYBOOK.md](./TACTICAL-PLAYBOOK.md) for instructions and [TACTICAL-REVIEW.md](./TACTICAL-REVIEW.md) for review and release gates.

Survey each living visible machine class once to earn its 10% gun multiplier and unlock passive options. Insulator reduces self-hazard damage; Capacitor reduces elemental energy costs; Catalyst strengthens guns against afflicted targets; Engineer strengthens the friendly turret. One passive is active at a time. No free trap placement, telekinesis, reflected projectiles or deep photographic research is claimed yet. The unfinished living-city PR62 stays separate.

## Retained expedition, arsenal and Foldwing

This separate original sky-city prototype does not replace any sibling game or wiki. Restore three district relays and return to Arrival Quay to broadcast. Seven bidirectional rails include Gale Market Loop and Prism Detour. Rail sight is independent by default; aimed transfers require an eligible nearby line and a clear approach. The complete foot route and local checkpoints remain.

Four original weapons retain distinct ammunition, cadence, spread, damage, range, reload and meshes. Arc Caster recharges; Tempest Carbine, Horizon Longglass and Foundry Scattergun use finite reserves. Longglass has an actual 4x flat-screen optic. A new expedition starts with 400 local credits; Outfitters sells the carbine for 180, sniper for 300 and scattergun for 220, plus damage/reload tiers and shield upgrades. World caches and defeated-enemy salvage pay once. No real-money or network-authoritative economy is implied.

Release an elevated rail, then G opens/folds the Foldwing. Movement steers; looking alone does not. S/back brakes. Its bounded charge refills on ground or rail. The canopy closes on landing, attachment, depletion or rescue. See [FOLDWING.md](./FOLDWING.md). Scout, armored burst attacker, telegraphing sentry and passive range target remain. Art is an original procedural prototype, not imported franchise assets.

## Controls and device scope

WASD moves; mouse/arrow keys look. E interacts/hooks, Space jumps/releases, G toggles Foldwing, C reverses, Shift sprints/boosts, F/click fires, R reloads, Q uses the selected power, M maps, Esc/P pauses, B opens nearby Outfitters, Z/right mouse aims, and 1–4 selects owned guns. N/T/J control field builds, power cycling and surveys. Touch has matching Field/Power/Survey buttons above the look-drag surface.

Xbox standard mapping retains sticks, A jump, B glide, Y interact, X reload, RT fire, LT aim, LB selected power, RB reverse, View map and Menu pause. D-pad up/down cycles guns, right opens Outfitters and left opens the field kit. Menu A/B retain activate/back. Physical pairing and hardware QA remain unverified.

The experimental Quest 3 adapter keeps head orientation independent of rail steering. Right controller aims the gun; left controller aims Current/Cinder. Its field menu includes the local conductor diagram. The Longglass optic remains flat-screen only. Physical headset tracking, performance, comfort, richer inventory ergonomics, climbing, embodied reload and multiplayer remain separate gates. Private narrative is excluded from all public sources and artifacts.

## Roadmap and recoverable releases

The [Kanban](./roadmap.html) and committed [roadmap.json](./roadmap.json) track 44 tasks and 71 dependency links. The eight new T01–T08 entries distinguish implemented tactics from future debris handling, placed traps, boss encounters and deeper builds. Task status alone is not a publication receipt; check the current PR and native artifacts. Browser-local board edits do not commit GitHub.

The committed [eight-sheet v0.3 workbook](./planning/Aether-Reach-Development-Roadmap-v0.3.xlsx) is a historical snapshot, not silently updated by this patch. After successful hosted-file verification, a tagged GitHub Release archives public source, checksums, workbook, restore tests, flight evidence and source-matching tactical screenshots/reports. These are GitHub-hosted snapshots, not an independent off-site mirror or a backup of browser-local player progress. See [BACKUPS.md](./BACKUPS.md).

## Run and test

Serve the repository root with `python -m http.server 4173`, then visit `/aether-reach/`. Three.js r177 is pinned locally. No account, runtime CDN, external security service or API key is required.

Run `node --test aether-reach/tests/*.test.mjs` and `python aether-reach/tests/backup_test.py`. Native client, arsenal, Foldwing, tactical and device-emulated suites are distinct from seeded model tests. Tactical playthroughs use ordinary keys, native mouse drag-look and UI clicks with read-only observations; no actor, enemy, money, objective or clock injection. The final acceptance workflows are read-only. The post-publication job can create release assets but never rewrites game source.
