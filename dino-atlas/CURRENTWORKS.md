# Dino Atlas / Currentworks reserve graphics

Build currentworks-reserve-20260922.1. This is the requested integration of the reusable Prism environment library into the existing full Classic Reserve, with a bounded First Light guidance polish. It does not replace Dino with Prism, change the engine, add a new chapter or imply all graphical-library features have been integrated.

## What changes

Three existing bounded water areas use Currentworks Water 0.1.0: the woodland pond northwest of the entrance, the main wetland lagoon and the channel-side lagoon. The adapter masks each original shoreline, excludes duplicated overlapping areas and leaves the existing canal surface alone. It adds the library's geometric and normal ripple detail, authored-depth shading, foam and actual boat-observation wakes. Large surfaces filter short geometric wavelengths rather than claiming an unlimited ocean simulation. Water-tool splashes are purely visual and use the actual impact endpoint. Original ocean, pool, marine physics and all missions remain intact.

Selected central forest trees are replaced at their existing trunk positions with deterministic Currentworks Trees 0.1.3 alder, palm and willow geometry. The bounded selection has at most 12 trees, excludes roads, important work areas and the pond, and shares the original trunk collision. All original instance matrices are retained for exact restoration. No new collision, routes, animal behavior, quest state or storage owner is introduced.

Balanced enables the new materials and geometry using the existing Coastal Light settings. Classic restores the original circles and tree instances without restarting or touching progress. Water and canopy-motion toggles remain. Reduced Motion freezes decorative shader time and flattens new water displacement. Low graphics and XR cap new assets to Light detail. No extra renderer, animation loop, camera or full-screen pass is introduced by Currentworks. The existing non-XR Cinematic bloom remains a separate host feature.

The first story-clarity change suppresses unrelated Ranch and Coast dispatch copy while a First Light task is selected, and suppresses mounted-rig advertising only while on foot. It does not hide map, HERE, tool buttons, equipment/ammunition or conversations. Suspending story guidance restores the legacy copy. This is a narrow presentation change, not proof that unfamiliar players understand the whole opening.

## Engine and provenance

Dino retains bundled Three.js r177. Prism's modules target r184, so Dino uses unchanged pinned module files plus an explicit host adapter and real-render validation rather than replacing the engine. The pins are from repository master c31dd6c56a101aec7c8a890768ae1f845494b294 under prism-current/modules/environment/. Git blob identities: water.js 85f37fe643592f88b66d8b37c2dc4846706d6f7b; water.mjs dbe750438d841826231e3ac96c5981d0ba4f3bec; trees.js 4c4ff287382b908865e8cbc941f564c01dc16b23; trees.mjs 2e2a3ac3ceb6f6d6c0ead0cd578aa0ffe6d48a59. Tests enforce these exact bytes. No sibling-game or private hub source is changed.

The adapter is created before the host collects the ordinary game into its portal root. Trees and water remain inside the same stationary character-centered portal and use the existing portal material hooks. Simulation observations use the existing identity world before the host's transient XR render transform. Preparing shaders uses the existing r177 renderer synchronously, not the module's r184-specific asynchronous preparation path. Fire 0.1.3 is deliberately not enabled in this pass: its renderer-specific preparation and a justified Dino gameplay event need their own integration and validation.

## Verification checkpoint

Before commit, the complete local suite passed 305 tests with zero failures or skips, including all 297 retained tests and eight new module/physics/ownership/lifecycle/portal-hook/focus tests. The checker passed 66 JavaScript syntax files and scanned 77 owned runtime/script files. The new Python runner compiles. These model tests use real r177/Rapier objects and a labeled Canvas2D collaborator; they are not GPU draws.

Local native browser navigation returned net::ERR_BLOCKED_BY_ADMINISTRATOR before gameplay. Do not bypass that policy or represent the attempt as a rendering pass. The existing read-only dino-spatial-console.yml now retains every prior source/public journey and additionally runs currentworks-browser.py against the exact source and separately against the served site. Its graphics fixtures are explicitly synthetic camera/mask scenes; ordinary full-game UI actions check story guidance, pause, fallback and suspension. Inspect actual workflow outcomes and screenshots before claiming publication verified. This initial checkpoint does not claim that new hosted checks have passed.

Physical Quest/Xbox, real hands, stereo/passthrough, thermal performance, seated comfort, human onboarding and owner visual approval remain open. First Light is still the only campaign chapter. The Missing Survey/Tidegate chapter, storm investigation and evacuation are preserved future direction, not shipped by this graphical pass. Continue with FUTURE-DIRECTION.md, HANDOFF.md and verification/currentworks/.
