# Prism Current / durable future direction and resumption

Update this file after substantial code, playtest or release work. Work directly on freshly reconciled master without force, PRs or staging branches. Preserve concurrent games, saved records, licenses and private boundaries. Read AGENTS.md, release.json and actual source before using historical hashes or old plans.

## Current game, not missing features

Prism is an AR-first rhythmic action toybox inside the real room. Keep screen and VR alternatives, but develop the complete tracked AR path first. The current host is Color Match 0.13.0. Easy is the first-play default; four profiles vary quantity, travel time, recovery and boss endurance without speeding up music. Ducks and aircraft repeatedly throw fruit and purple blocks. Blocks can be cut, lasered or shielded. Mint plus cases heal once to a maximum of 100. The numeric HEALTH bar and controller/floor status remain visible during play. Bosses enter only in the final musical phrase. Do not restore the earlier invulnerable red missiles or assigned-hand-only scoring.

Color switching and matching bonuses ARE implemented, not still planned. Right A and left X switch their tracked saber's color during play; screen keys 1/2 and standard-controller L3/R3 are equivalents. Either color earns the ordinary valid-cut base reward; matching the fruit badge adds a bonus. Symbols distinguish colors. The enlarged Easy-fruit badge fix is also present. New results use prism-current.river.chromatic.records.v1; pacing and all older ledgers remain read-only and preserved. Consult river/core.js and the chromatic tests before altering score rules.

AR Tide 0.1.1 already adds two compact planted islands, two cloud clusters and grass to Duck Armada AR. The saved Minimal scenery option hides decoration, not gameplay or health. Do not re-enable the full screen forest as an AR shortcut. Near-viewer suppression hides intrusive scenery without moving or confining the player. Mothership retains its space presentation.

FlexSurface 0.1.0 is already used by the three AR Field Guide cards above the pre-battle menu and on paused Controls. The cards hide during combat and do not intercept input. Earlier library-only descriptions predate this integration. They are not an HTML-in-canvas runtime or the proposed Liquid Glass renderer.

## Water upgrade / Clear Shoals

Water 0.1.0, Fire 0.1.3, Trees 0.1.3, Toon, Cloudlets, Islands, Grass and FlexSurface remain reusable. Clear Shoals adds Water Detail 0.1.0 and upgrades Water Optics to 0.2.0 through the existing river/ar-islands.js adapter. Runtime checkpoint a3cd5dbac40d330371f78bccd842c91a061fc889 changed only the optical extension, helper, module entry wiring and metadata. Base geometry, CPU height query, wakes, game clock, saved AR opacity, audio, controls, health, difficulty, Color Match and scores are unchanged.

The new appearance uses original pebble-bed data, seeded fine wave slopes, squared-slope highlight filtering, a reference-depth refracted-light atlas and an MIT-attributed dielectric Fresnel helper. Data is generated at attachment, not each frame. Two added RGBA8 mipmapped textures have 327680 base bytes, 436904 with all mip levels before driver overhead. No FFT runtime, reflected-scene pass, float target, postprocess renderer or passthrough-image sample is added.

Clearwater was reviewed at 4bc826134321043a25df3c2b6fed16fb7b9241e8. It is raw WebGL2, not a Three.js package. CLEARWATER-NOTICE.txt retains its MIT notice and identifies the adapted helper. Our spectrum, CPU flux bake, pebble data, adapter and tests are new source, not the complete Clearwater renderer. Caustics are baked at depth 1.25 then advected, not recomputed from every current wave/light state. Analytic sky reflection and authored-bed shading do not reproduce the actual room.

Read modules/environment/CLEAR-SHOALS.md for reuse. Its ES facade loads the data dependency; classic scripts load water-detail.js before water-optics.js. Attachment validates the exact base shader before mutation, owns only two textures/uniforms and restores both original shader sources on disposal. Do not stack duplicate patches or dispose borrowed base resources.

## Evidence and open gates

The optical runtime was deployed by Pages run 35900176762. Clear Shoals source run 35901892136 at 146796cd1a6f26dcc6ed953424a2ce16a722c04e passed 26 native checks, including actual pixels, zero opacity, quiet/transformed water, AR controls, right-hand color switching, pause/volume/opacity preservation, a full Easy late-boss battle and session exit. Source artifact 10769871890 and first public artifact 10769542043 were downloaded and hash-verified. CLEAR-SHOALS-RESULT.md records exact receipts and any later retry.

The first corrected public journey matched all 25 loaded runtime/style/release/notice files and passed 18 preceding checks, then encountered a frame-stall pause at 1.042154s before any enemy appeared. Its recorded gap was 375.5ms; preceding render submission took 1.3ms and tick 0.5ms. The unmeasured gap is not proof that the new shader took that time. This remains a failed complete public journey. This support-file checkpoint permits one unchanged runtime/test retry; record its actual outcome separately, not as first-attempt success.

All 431 local model/data tests and 19 new bundled-Three optical ownership/matrix/cleanup checks pass. Local WebGL2 is unavailable. Object tests are not GPU execution; native framebuffer tests and emulated XR are not physical Quest approval. Existing AR Tide, Friendly Current and Field Guide failures remain separate obligations. A focused source pass does not certify every historical suite.

An earlier new test wrongly treated per-fragment opacity as a global image cap. Diagnostics found the same 64 over-cap wave-overlap pixels in old and new oblique views, no added locations, and none overhead. CLEAR-SHOALS-ALPHA-RESULT.md preserves the failure and corrected same-geometry composition test. Do not promise that distant overlapping fragments can never compound opacity. Zero opacity and the near-viewer fade remain explicit. No geometry, quality or timing guard was weakened to satisfy the test.

## Controls and lifecycle that must survive

Keep the adjustable world-anchored Rotunda, visible ray/contact cursor, thumbstick/A-X selection, direct B/Y start/pause/resume and hand-menu support. Combat still needs tracked controllers. Sound/scenery changes preserve the paused encounter. Genuine tracking/visibility loss pauses safely; ordinary leaning or sidestepping does not trigger the removed arbitrary position box. End XR for real and preserve the same in-memory encounter for explicit matching-mode re-entry. Closing the page is not a persistent unfinished-battle save.

Keep the existing 0.35-second frame safeguard while investigating its causes. Do not auto-resume tests, assign actor/health/time/score, lower required actions or silently reduce resolution. tests/frame-trace.js already records bounded callback, render, input and resize observations. Improve that evidence rather than adding an animation loop or treating estimated GPU numbers as measurements.

## Next bounded work

First review the named Clear Shoals public retry and the owner's Quest appearance/performance. Reproduce remaining frame/input gaps before increasing visual cost. Refine water scale, highlights, foam and authored-bed depth from AR feedback. Dynamic caustics, true scene reflections, stochastic bed sampling or an evolving spectrum each need separate cost, stereo and opacity evidence; do not import an opaque ocean demo wholesale.

Then refine crowns, shoreline grounding, flame irregularity and smoke, preserving the open action corridor and compact health display. Add richer boss phases and understandable spiked-bomb danger-radius feedback separately. Cosmetic fire/splash radius is not damage. Color switching and bonuses are already present; do not schedule them again as absent.

Nine additional chapters remain designs: Citrus Creek, Bubblebath Bay, Clockwork Canopy, Emberworks Harbor, Frostfloat Fjord, Sky Parade, Lunar Lagoon, Stardust Conservatory and Prism Confluence. AR-FIRST.md holds their small-island adaptations. Prototype Citrus Creek only after the two existing Easy chapters are comfortable: a learnable fruit phrase, repeated slow launchers, recovery, late harvester boss and distinct music. New music and rehearsal need explicit implementation and separate full-run records.

## Reusable library and references

Modules accept the existing Three.js namespace, documented coordinates and explicit ownership. Do not import a second engine, private hub or sibling gameplay. Keep shader/version compatibility, real loading requirements, provenance and notices with each module.

AR-REFERENCE-REVIEW.md covers Disney's separately licensed cloud data, Grassworks restrictions, toon/cel versus splats, low-poly geometry and incomplete demo access. REFERENCE-REVIEW-SPATIAL-UI.md covers performance estimates, folding, SSGI, gestures, glass and HTML-in-canvas. LIQUID-GLASS-REFERENCE.md records the later author-grounded review, superseding the earlier inaccessible-shell finding. GlassCard and isolated HTML-backed settings/help remain proposals. Keep HEALTH and Start/Resume stable; do not animate selected targets away from held rays.

Commits, served hashes, native input, artistic quality and physical-device approval are distinct. Preserve failed artifacts and historical receipts. Save actual evidence and the next task here, not only in chat. No portals, full multi-game brief, credentials, font files or private SaaS UI belong in this public game.

## AR scenery shading checkpoint / abb53562d34b

Currentworks Cloudlets 0.2.0 and Trees 0.2.0 refine the existing AR islands without increasing geometry count or adding textures/render targets. Cloud vertices now carry a bounded directional crown/underside tint so the seven-lobe forms read with more volume under existing lighting. Trees keep their existing geometry/LOD/wind but enrich bark with a second procedural ridge scale and foliage with edge/tip/vein variation. The change is decorative only: no targets, health, scores, input, camera, collisions, saves, water geometry or difficulty rules are changed.

Acceptance remains separate. Existing startup frame-gap evidence and physical Quest approval are still open; do not interpret prettier scenery as resolution of those issues. Next visual work should come from owner AR feedback before adding geometry or full-screen effects.

CI note for this pass: the first source run exposed an incorrect new test assumption that treated the pre-existing disposable 24x24 tree loading warmup target as persistent runtime ownership. The test was corrected to require no tree textures, renderTargets:0 in gameplay stats, and explicit disposal of the temporary loading target. No production tree/cloud source changed in this correction.
