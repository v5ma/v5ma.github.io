# Sky Cycle: future direction and recovery map

This document belongs to the game, not a chat. Keep it beside RESUME-HERE.md and update both at meaningful implementation and verification checkpoints. Record the exact runtime, real changes, failures, remaining tests and next bounded task. Previous full text is preserved verbatim in archive/FUTURE-DIRECTION-through-0.28.md; the current versioned receipt controls live acceptance.

## Current approved experience

Sky Cycle remains a momentum-driven bicycle/unicycle delivery adventure. The road is a complete experience; the connected optional sky network supports expressive jumps, boost, two-sided catches, whip connections and discovery. Mastery means learning where a line leads, how to reach its receiver, when to brake, and how to recover, not collecting more disconnected map area.

The curved 2.5D direction bends the shared gameplay surface through real depth while retaining the familiar controls. Versioned metadata gp.waterwheel.depthPath={version:1,id:'market-sweep-v1'} selects the optional Waterwheel market sweep. It recedes and approaches between source distances 640 and 2840, then straightens before the fast express choice. Opposite 100-unit lobes produce 0.25 meters of depth excursion at default XR scale. The user controls the viewpoint; the game never turns the tracked headset camera to follow a curve.

Runtime 9bf2dc51ca112e780af3ae78c9ea06a9aa6b28d7 is v0.29.0 / sky-cycle-currentworks-2026.09.22. It adds actual Currentworks Cloudlets, Islands and Toon modules to the straight and curved 3D Waterwheel preview. Six mesh clouds and four floating island gardens give the porch, market return, bridge and wheelhouse recognizable background forms. Garden surfaces are scenic and must not be confused with the gold collision tracks. Small orchard/pennant accents are original local meshes, not a Trees-module port.

The 45-file public-byte comparison succeeded at 2026-09-23T03:59:39Z. The original source has 446 passing game rules and 12 soundtrack tests, plus passing native AR/VR Currentworks journeys with real packet delivery and original movement. Public playthrough results and final capture review belong in verification/currentworks-0.29.json; source success or a version label alone cannot establish them. No physical-device approval is implied.

## Architecture that must survive future upgrades

The original 2D simulation owns motion, gravity, collision, catches, throws, rewards and the document codec. The horizontal coordinate maps to distance along a fixed authored centerline; vertical height keeps a stable up direction. CPU and GPU maps share the same distance table. Packets follow that same curved gameplay surface rather than an invented independent free-space projectile model. All interacting objects must agree visually about contacts.

The courier remains a rigid tangent-aligned assembly, preserving proportions and pedal/grip IK contacts. Long structures are subdivided only where curved presentation needs them. Horizontal framing follows the mapped horizontal position while genuine depth excursion remains visible. Head position never reshapes the route or aperture. Menus, rays, editor canvases and reference spaces stay outside the deformation. 2D and editor presentation stay straight, with original material hooks and culling restored on transitions.

Pinned r177 applies positionNode before native instance placement. Conjugate the surface mapping through the real instance matrix; do not reintroduce a double transform. Generated-code tests require explicit TSL mix(a,b,t). Preserve custom normal/position hooks and material identity. Real generated shaders and independent GPU fixtures supplement, not replace, native gameplay and physical headset observations. Never dispose original scene assets with temporary XR resources.

Currentworks modules are pinned byte-for-byte from c31dd6c56a101aec7c8a890768ae1f845494b294 with attribution and blob IDs in vendor/currentworks/PROVENANCE.json. Their Toon factory borrows the existing r177 node-material constructor, not another engine. The adapter owns only its new objects. It shares the existing clock, uses the same conservative cloud detail for both eyes, applies near-viewer suppression to the actually deformed centers and disables scenery raycasts. Classic, 2D and Workshop transitions release it; returning to 3D rebuilds exactly one instance. It has no independent storage, camera, collision, networking, render pass, music or animation loop.

Future updates to Water, Fire, Trees, Grass or Flex Surface must be selected deliberately after renderer compatibility, curved mapping, world-aperture and lifecycle review. Those modules are not enabled by the current garden slice. Preserve existing water rather than silently substituting an unqualified raw shader. Do not change the sibling library or upgrade all games to another Three version as part of a Sky Cycle adapter.

## Next useful passes

Physically test the gentle market sweep on Quest 3. Observe forward and reverse travel, normal speed, braking, misses, the porch approach, mailbox/contact alignment and the return toward the viewer. Make sure the receiving road remains understandable as it recedes. Check the new garden silhouettes from several seated positions and at different exhibit sizes. Existing VR backdrop edges and controller-ray clutter deserve observation; a small set of screenshots is not full readability or comfort qualification.

Use curvature to reveal useful geography. Returning around the same landmark should expose where an elevated route lands or make a familiar delivery approach more intentional. Keep shallow-tangent or side-on reading zones before demanding catches and throws. Avoid blind high-speed hazards and introductory segments that point nearly straight at the viewer. Retune the profile or landmark placement based on actual confusion before making turns stronger or adding more decoration.

Complete the optional Waterwheel high-to-high whip connection next, retaining a non-whip continuation and the useful lower delivery return. Test early, late, short, coasting and reverse recovery through the real collision system in both grip modes. A successful modeled transfer is not an accepted native route. The preview remains non-awarding until revision-aware campaign promotion and rollback are designed and proven. Never compare new-layout times against old official records.

Later implement explicit depth-profile editor authoring with bounded values, unsupported-profile fallback, serialization, undo and old-document preservation. Independent depth lanes and crossings require distinct lane identities, valid transitions and collision rules; the current shared surface does not implement them. Do not make two visually separate surfaces share ambiguous collision.

## Roadmap continuity

Retain AAA-ROADMAP.md, ROADMAP-RECONCILIATION.md, the Waterwheel chapter workbook and the shared level-design-library/SKY-CYCLE-LEVEL-DESIGN.md movement-first method. Currentworks advances the art/readability and resource-lifecycle portions of Milestones C/G; it does not close the full asset, performance, device or chapter-quality milestones.

SC-REC-PASSPORT remains the unported ordered-route stamp system, not the existing district/individual-rail journal. SC-REC-FIT remains the unported global motion graph and automatic receiver fitting, not the current local Ride Lab traces. SC-REC-EXPLORE retains the Quarry/Vault concepts for optional non-awarding Workshop adaptation. Closing their obsolete PRs did not implement those features. Preserve their source history and do not restore incompatible old builders or overwrite current official slots.

## Spatial interface and private boundaries

The approved UI direction is in-application spatial interaction, not head-attached or window-owned panels. A low collapsed, summonable and adjustable pedestal/rotunda remains a future proposal. Keep immediate feedback near its relevant tool/controller; larger maps, inventory and settings can use a stable summoned workspace. Hidden panels must not receive input. Common riding actions retain direct controls and saved remaps. Back, resume and exit must remain reachable; moving a panel never proves its buttons work.

Keep the session-owned A/B/X/Y/trigger/grip menu paths, hand select, fixed-world aperture, unobstructed controller riding and late-permission cleanup. Menus and physical-game actions have separate roles. Do not add a second XR owner merely to change UI appearance. The current integration is not an A-Frame migration.

Never publish private WebXR SaaS hub code, internal review content, assets, credentials or account state. No walking or sphere portals are authorized for Sky Cycle; the walking-portal experiment was limited to Vesperfall. A future minimal launch/return adapter needs its own review. A hub must not receive whole localStorage or silently take ownership of game progress.

## Release and evidence discipline

Write directly to freshly reconciled master with non-forced atomic commits, preserving concurrent sibling games. No new PR, staging branch or temporary deployment pipeline. Reuse the existing Sky Cycle verification workflow and actual current-master Pages publisher. Do not force an obsolete repository snapshot to finish a game release.

Keep source rules, isolated models, real GPU rendering, native game replay, public-byte evidence and physical devices distinct. Never clear storage, teleport the rider or assign score/win/progression to manufacture a pass. Save failures, exact artifact hashes, source identities and remaining obligations beside the game. The old v0.29 publication attempts failed while only 36 of 45 files matched; the later successful retry does not erase those failures.

Observe full curved XR traversal, real passthrough, normal-mapped/large edited geometry, sustained frame times, resource growth, physical Xbox/Quest controls and unfamiliar-player comfort before claiming those gates complete. Continue updating these notes while working; do not claim background work between chats.
