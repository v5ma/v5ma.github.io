# Prism Current / durable future direction and resumption

This file is the main continuation point for Prism. Update it after every substantial implementation, playtest, or release. Record the actual source, deployed result, failures and next bounded task here rather than leaving decisions only in chat. Fetch current master before using any of these historical hashes. Follow AGENTS.md: direct non-forced master writes, no new PR or staging branch unless requested, and preserve concurrent sibling work.

## Product identity and player priorities

Prism is an AR-first rhythmic action toybox in the player's real room, not a VR game with missing scenery or a replacement graphics demonstration. Keep supported screen and VR play, but design and test the full AR path first. The fantasy is a current carrying rubber ducks, toy boats, planes, fruit, cuttable/shootable blocks and late-arriving bosses between small islands, trees and localized clouds. Preserve visible room space, the user's camera control and a clear swinging/target corridor.

Friendly Current rules remain essential: Easy is the new-player default; Normal, Hard and Ultra Hard change quantity, pace and recovery. Ducks and planes move slowly enough to throw multiple fruit/block patterns and offer laser opportunities. Easy/Normal accept either blade and any direction, omit spiked bombs and provide more healing. Mint plus-sign cases increase actual health once, capped at 100. Keep the numeric HEALTH bar and controller/floor display readable. Bosses enter only near the end, never at chapter start. Audio is not sped up to change difficulty. Do not restore the earlier invulnerable red missiles or assigned-hand-only rewards from old snapshots.

Menus belong in the rendered scene. Preserve the adjustable world-anchored Rotunda, visible ray/contact cursor, thumbstick/A-X navigation, direct B/Y start/pause/resume and hand-menu support. Combat still needs tracked controllers; do not advertise hand-only combat. Sound/scenery changes preserve the paused encounter. Genuine tracking/visibility interruptions pause safely. Normal leaning/sidestepping does not trigger the removed arbitrary position box. End XR for real and retain the same paused run for explicit matching-mode re-entry while the page stays open. Existing saved records and difficulty-separated scores remain untouched.

## Recovered implementation, not missing work

AR Tide was saved as runtime 6e1d3b01b4dda3564e1894e0939d52fb44dcde68; diagnostics/tests followed at 3e33aa9cd3a3049078eeabb66b5bd96ee67e3103. That runtime already loads two compact tree islands, two original cloud clusters and the Water Optics extension in Duck Armada AR. The saved Islands + clouds / Minimal control hides decoration only, not targets, health or gameplay. It does not enable the old continuous solid banks in AR. Earlier AR-LIBRARY notes describing these sources as not integrated are historical and superseded by this recovery.

Water 0.1.0, Fire 0.1.3, Trees 0.1.3, Toon 0.1.0, Cloudlets 0.1.0, Islands 0.1.0 and Water Optics 0.1.0 are saved reusable foundations. They use the caller's Three.js r184/WebGL path, clock and explicit ownership; no private hub or other game's code is needed. Fire is actual destruction feedback, not a new flamethrower. Water reflects an analytic sky and shades authored depth; it is not FFT ocean simulation, screen-space room reflection or furniture detection. Clouds are original mesh clusters, not Disney VDB or Gaussian splats.

## Current saved work

Grass0.1.0 was saved independently at a2192a50 and integrated as AR Tide0.1.1 at760e6f0d06adf7858c41f6a0c691f7c1034d1e85. Two small patches follow the island planting positions, saved minimal-scenery setting, quiet clock and near-viewer hiding. They select36 blades and216 triangles total in XR. The current index loads grass and the adapter; do not rebuild them as missing work. Toon, Cloudlets, Islands and Water Optics are also already integrated through river/ar-islands.js, superseding their earlier library-only notes.

The recovered source artifact10727738832 for run35804846139 was downloaded and verified with SHA-2563f831e8951f45ad947e652b2ab23b7c037b369afc10ec86c6832c4d1c4561026. Its AR Tide test passed18 preceding checks before a rendering-stall pause at36.32197s; the tracked-health test paused at19.91127s. The separate public artifact10727557830, SHA-25607f7e06a1fb49b1e1ae65a0ac4f2a7d33551b8e3e5c882d9f4c178c42b7a1e89, failed its145-file match on index.html,release.json andriver/ar-islands.js and did not run its AR playthrough. These are inspected historical outcomes, not a new direct fetch of the currently served game. Preserve them and check later exact receipts before claiming a fully accepted grass release.

The new spatial-UI reference pass starts from that runtime and changes no loaded game script. Source checkpointaf9f00a15f343989a55359bd7ec63a66f498fb6a adds original FlexSurface0.1.0, its ES facade, twelve pure/data tests and a durable module checkpoint. It is library-only, not a curved replacement Rotunda or a new banner visible in the game. It uses the same updated CPU triangles for rendering and picking, with a readable back and bounded local pull. See modules/environment/FLEX-SURFACE.md andUI-EFFECTS-CHECKPOINT.md for native fixture results and limits.

The complete local model suite passes405 tests after six additional registry checks (387 recovered,12 new surface tests,6 new module-index cases). The surface object suite passes25 real Three.js resource/ray observations. No physical headset test is implied. Exact native standalone rendering is separately checked by the existing read-only workflow. Neither module/object success nor its standalone picture closes Friendly Current's remaining frame-pause and playability issues.

## Evidence recovered from the interrupted AR Tide pass

Run 35776630216 checked 3e33aa9c. Source job 106911684879 passed its complete steps, including the full Easy AR Tide journey and the companion tracked, playability, render-policy, water/fire/tree, interruption and Rotunda suites. Source artifact 10717641446 was downloaded and its SHA-256 verified as 88f958735461234f28ab53e185d6eab33501f3dee0a8172b699c3418120407de.

Public job 106911685519 matched the committed files but failed multiple gameplay paths. Public artifact 10716444709 has SHA-256 177e532d126a26ca800f9bb44ce3f644f9f1a7f959f69a5c4e009a8de23c035d. The AR Tide trace reached actual damage and healing then paused at 17.510907 seconds before a required cut; no script/shader error was recorded. A full-frame gap cannot be attributed solely to shader rendering from that trace. The public fire, water and interruption suites passed while other paths failed. Preserve every outcome; source success and a public hash match are not a complete physical or public-playability certificate.

Do not weaken the .35-second safeguard, lower required actions, change difficulty/resolution silently, auto-resume a failed test or assign health/score/actor/time to obtain green results. Inspect bounded frame, render and input evidence before claiming a cause. Physical Quest, ordinary-resolution performance, contrast against real rooms, comfort and enjoyment remain open until tested by a person on a named device.

## Future sequence

First finish and verify the small AR island/grass composition with current Easy gameplay. Seek the owner's AR feedback on target contrast, health placement, scenery density, near-viewer hiding and pauses. Next refine existing crowns, shoreline, foam, flame irregularity and smoke without increasing visual clutter or taking over the camera. Improvements should make the same full game easier to read and more enjoyable, not merely add another showcase.

The proposed nine additional chapters remain designs, not implemented levels: Citrus Creek, Bubblebath Bay, Clockwork Canopy, Emberworks Harbor, Frostfloat Fjord, Sky Parade, Lunar Lagoon, Stardust Conservatory and Prism Confluence. AR-FIRST.md preserves their small-island adaptations. Prototype Citrus Creek only after the two existing Easy chapters are comfortable: one learnable fruit pattern, repeated slow launchers, healing before a late harvester boss and a distinct musical arrangement. Every chapter must keep Easy genuinely approachable, with recovery phrases and no hidden mandatory resources.

Outstanding gameplay commitments are direct per-hand blade-color switching, a color-match bonus on top of the implemented either-blade base reward, clearer spiked-bomb danger-radius feedback and additional authored boss patterns. They are separate from scenic graphics; cosmetic fire/splash radius is not damage. New music, larger chapters and optional rehearsal must have separate scores and honest implementation status.

## Inspiration and reuse boundaries

The supplied Abyssal Ocean repository describes a multi-cascade spectral ocean, foam, reflections and underwater postprocessing. Treat it as visual/method inspiration, not a ready-made AR replacement renderer or a measured Quest performance result. The infinite-liquid-glass site exposed a loading shell in this review, not enough implementation to identify its exact shader. Keep our transparent AR, existing engine, optional opacity and bounded effects. No wholesale renderer import or opaque scene is authorized.

Disney cloud licensing, commercial Grassworks restrictions, toon/cel versus splat distinctions and other references are in modules/environment/AR-REFERENCE-REVIEW.md. Current grass and other newly authored source do not copy commercial assets or algorithms from inaccessible source. Keep code and asset provenance explicit. Do not publish the full multi-game brief, private WebXR SaaS interface, credentials, fonts or unrelated files.

## New UI, glass and lighting references

The latest source review is modules/environment/REFERENCE-REVIEW-SPATIAL-UI.md. It covers r3f-webgpu-perf, Saurow folding, Liquid Fabric, SSGI, use-gesture, a candidate WebGPU glass project, and repalash/three-html-render. Preserve which exact links were accessible and which claims came only from the supplied description. No third-party implementation or license is assumed from a social-media announcement.

Near-term direction: reliable deformable surfaces first, then a deliberately isolated HTML-backed settings/help prototype and explicit gesture ownership. The geometry module alone supplies neither browser text input nor controller/pinch dispatch. Do not replace the working Start/Resume controls or bend a selected target beneath a held ray just for animation. Keep health readable and paused state intact.

The performance reference estimates CPU/GPU shares; use real bounded frame/callback observations instead of treating that split as GPU diagnosis. Existing tests/frame-trace.js already does this, so do not add a duplicate hidden animation loop. Native GPU timestamps, when unavailable, must remain unavailable rather than fabricated. SSGI and multi-pass glass remain separate backend/performance experiments, not automatic replacements for the current WebGL2 renderer. Passthrough is not automatically scene color/depth available to either effect. All adoption requires per-eye, alpha, input and named-device review.

## Resume protocol

Read this file, AGENTS.md, release.json, AR-FIRST.md, PLAYABILITY-CHECKPOINT.md and the current module manifest, then inspect actual scripts and the latest exact CI artifacts. Resolve stale documentation against newer source; never reapply an old archive over current master. Make one bounded change, test it, save directly to fresh master, verify served files and actual AR input separately, and update this file and the checklist with outcomes and remaining work. Keep historical failed receipts intact. Revert only a scoped change if necessary; never reset the repository or clear user saves.
