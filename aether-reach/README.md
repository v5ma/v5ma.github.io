# Aether Reach — public mechanics demo

## v0.4.2: Prismatic Quay graphics pass

The same game now loads licensed CC0 artwork for the first city block: modular facades and roof details from Quaternius's free Downtown City MegaKit Standard edition; ornate lamps, modeled foliage, photographed paving/stone and HDR lighting from Poly Haven. Models and material maps are stored locally under `art/`, with lighter mobile variants. There is no runtime asset marketplace, CDN, account or API key.

See [ART-SOURCES.md](./ART-SOURCES.md) for creators, licenses and processing, [art/manifest.json](./art/manifest.json) for exact bytes/hashes, and [QUAY-ART-REVIEW.md](./QUAY-ART-REVIEW.md) for visual review and release gates. Artwork failures retain the old visual fallback rather than making the game unplayable. Two closed Quay buildings are reskinned; this is not a claim of new interiors, finished character/weapon art or a full-city replacement. The four foreground firearms now have separate sculpted receivers, ribbed grips, barrel details, scope/energy lenses and polished metallic materials. A suspended faceted jewel, smaller gemstone accents and curved glass market canopy introduce optical detail without changing navigation. Physical Quest 3 performance and comfort remain unverified.

Choose Prismatic, Balanced or Light in **Controls & settings → Materials & effects**. Desktop defaults to Prismatic; mobile and immersive XR use the lower-cost light path. The high-end setting uses physical refraction/attenuation and restrained chromatic dispersion. Light patterns/glints are stylized shaders, not ray-traced caustics. [VISUAL-RELEASE.md](./VISUAL-RELEASE.md) documents the rendering, references, performance tradeoffs and exact evidence boundaries.

## The existing expedition and combat remain

Restore three district relays and return to Arrival Quay to broadcast. Seven bidirectional rails include Gale Market Loop and Prism Detour. Look independently while riding, release with momentum, catch another eligible line, or deploy the Foldwing. The accessible foot route and local checkpoints remain.

Four original weapons retain distinct ammunition, cadence, spread, damage, reload and meshes. Longglass has a real 4x flat-screen optic. Outfitters sells weapons, per-weapon upgrades, ammunition and shield upgrades for earned local credits. World caches and defeated-machine salvage pay once; no real-money or multiplayer-authoritative economy is implied.

Field Engineering provides Current/Cinder while the gun remains ready. Water conducts electricity; oil burns; gun and power use separate resources. Survey a live visible class once, equip one passive and solve the Atrium conductor puzzle to gain friendly security. The optional six-enemy recovery has a capped fourteen-shot turret, a 48-second minimum and a once-only 180-credit reward. See [TACTICAL-PLAYBOOK.md](./TACTICAL-PLAYBOOK.md). The unmerged living-city PR62 stays separate.

## Controls and devices

WASD moves, mouse/arrow keys look, E interacts/hooks, Space jumps/releases, G opens/folds Foldwing, C reverses rails, Shift sprints/boosts, F/click fires, R reloads, Q casts, M maps, P/Esc pauses. B opens nearby Outfitters, Z/right mouse aims, 1–4 selects owned guns. N opens the field kit, T cycles powers, J surveys. Touch and Xbox-standard adapters retain their bindings; see [DEVICE-SUPPORT.md](./DEVICE-SUPPORT.md).

The experimental WebXR preview has independent head/controller tracking, left-stick movement, snap turning, spatial menus, right-hand gun aim and left-hand power aim. It is not physical Quest 3 certification. Climbing, full embodied reload, a tracked magnified optic and multiplayer remain unfinished. No private narrative or private repository content is included.

## Planning, backups and validation

The [Kanban](./roadmap.html) and committed [roadmap.json](./roadmap.json) track mechanics and their evidence; this release prioritizes art rather than adding missions. Browser edits remain local. The [eight-sheet v0.3 workbook](./planning/Aether-Reach-Development-Roadmap-v0.3.xlsx) is retained as a historical snapshot, not relabeled as a freshly updated plan.

After successful publication, the versioned GitHub Release archives public source including licensed models/textures, checksums, the historical workbook, restore results and source-matching native flight, tactical and graphics evidence. These are same-provider source backups, not backups of browser-local progress or an independent off-site mirror. See [BACKUPS.md](./BACKUPS.md).

Serve the repository root with `python -m http.server 4173`, then open `/aether-reach/`. Three.js r177 and its local glTF/HDR loaders remain pinned. Run `node --test aether-reach/tests/*.test.mjs` and `python aether-reach/tests/backup_test.py`. Normal validation workflows are read-only; one-time asset intake and source-wiring workflows were removed after successful materialization. Fixed-camera comparison plates are labeled renderer fixtures; native game regressions use normal inputs and read-only observations, not actor/mission state assignments.
