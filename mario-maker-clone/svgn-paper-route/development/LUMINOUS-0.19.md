# Luminous shaders, v0.19.0

Build: `sky-cycle-luminous-2026.09.12`. This release extends the existing Sky Cycle at `mario-maker-clone/svgn-paper-route/`; it is not Prism Current or a new game prototype.

## New presentation

Luminous enamel gives the existing rail and courier materials a spatially varying thin-film coating. The material's angle response, film thickness and roughness are evaluated by Three.js r177 TSL nodes. Gold edge geometry, signs, physics surfaces and every collision point remain unchanged.

Canal water uses a procedural interference pattern, a normal-map node and restrained emissive highlights. It is decorative water behind the street, not a new traversable surface. The pattern resembles caustic light but is not a ray-traced caustics calculation or a fluid simulation. Canal placements follow actual course district metadata, with at most six patches.

Sky silk is a single feathered procedural band behind the world. Slow color and curvature changes use the same simulation clock as existing Prismatic effects. It has no depth writes, no screen distortion and no vertex displacement. It is stylized atmospheric decoration, not physically simulated aurora or volumetric clouds.

There is no new renderer, external texture download, full-screen postprocessing pass, motion blur or camera shake. The existing pinned r177 renderer and WebGL fallback are retained. Native WebGPU compatibility is not certified merely because the shaders use TSL.

## Controls and safety

Open Materials & FX from the header, pause menu, or Flight Deck. Luminous defaults to Subtle; Vivid strengthens the spectral response and atmospheric color. Off restores the previous Prismatic finish while retaining its glass, metal and existing effects. Classic in the original material-treatment selector removes both presentation layers. Water and sky can be disabled separately.

The existing motion checkbox and operating-system reduced-motion preference suppress animation. Gameplay pause freezes the simulation clock. Opening graphics within an already-paused parent does not resume gameplay on close. B closes the top graphics dialog, not its parent. Losing focus, hiding the document or disconnecting a controller cancels automatic resume from a directly opened graphics panel.

The paused-scene cache added in v0.18 now excludes an open graphics preview. This ensures changing shaders from within Flight Deck is visible, rather than accidentally freezing the scene behind the nested panel. Other paused reading dialogs keep their scene-reuse behavior.

New preferences use only `svgn.skycycle.luminous.v1`. Failed writes are disclosed as session-only settings. Delivery medals, Market Pilot seals, career badges, exploration stamps, Workshop drafts, audio preferences and controller remaps are not reset or migrated.

## Verification boundary

The 19 new pure tests build actual node-material graphs, verify bounds/resource ownership and ensure shader setup leaves the supplied course unchanged. The 69 existing Sunrise, Compass and Flight Deck rule tests remain separate regression evidence.

The native browser suite renders initial rail/sky effects in 3D, cycles all presentation choices, checks cleanup and pause/reduced motion, reaches the canal through ordinary input, renders its water shader in 3D, navigates nested graphics controls with standard Gamepad samples, and finishes the original road route. Full-route movement uses the supported 2D view on the CPU-only runner; these are not complete hardware-accelerated 3D performance runs. A final storage-failure check deliberately injects a quota exception and is labeled separately.

The existing v0.18 Market Pilot browser suite checks the preserved optional branch, seal persistence, and three first-attempt route completions on the same source. Reports, exact source identity and public-file hashes belong in `verification/luminous-0.19.json`. Scheduled tests are not passing evidence. Browser policy blocked local localhost access, so native browser evidence comes from GitHub Actions rather than bypassing the local policy.

The initial shader browser run `34717270587` on integrated runtime `cddc889d8e43335f592a05d36bb0868b30100bd5` passed 17 checks and reported no shader or JavaScript errors before failing a single-step controller-selection expectation. Its two-frame synthetic button hold lasted long enough on the CPU renderer to trigger legitimate menu auto-repeat, advancing past Vivid to Off. That failed report is retained in artifact `10305970559`; it is not counted as a passing run. The separate Market Pilot regression passed in artifact `10305031895`. The initial report's commit field names the workflow-trigger SHA `7482443b3c34c86a7e9a20aef1ae28c5927608bf`, while the test checkout and artifact names identify the integrated runtime; the verification receipt preserves that distinction.

The subsequent test releases only the sampled controller button on the first real change event, keeps the expected Vivid assertion, records `git rev-parse HEAD`, and uses the existing Inspect Scene control for unobscured comparison captures. It does not assign an application setting, alter gameplay or hide a compiler error. CI is now read-only. Exact completed results are retained in the verification receipt.

## Ownership and remaining work

All new geometry and materials are registered with the existing Prismatic resource owner. Off/Classic/rebuild paths use its cleanup routine; water patches are distance-culled. The maximum seven new scenery objects is an allocation/draw-object limit, not a promise of a particular frame rate or total game draw-call count.

Roll back only the eight owned runtime files listed in the verification receipt, and leave the new preference record for a later compatible version. Do not reset repository history or revert other games. Human playtesting, hardware-specific frame-time and memory measurements, physical controller testing, mobile qualification, native WebGPU testing and a complete asset-license audit remain open roadmap items.
