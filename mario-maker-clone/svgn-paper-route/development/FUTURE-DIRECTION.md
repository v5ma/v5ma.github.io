# Sky Cycle: future direction and recovery map

This file belongs to the game, not a chat. Update it, RESUME-HERE.md, the current feature note and versioned verification record at meaningful development and acceptance checkpoints. Preserve exact source identities, failures and outstanding work. Git history at 952dd2529332c84bd1a52f6c7fe62f39ba494ff4 retains the complete 0.29 map; earlier text is also archived through 0.28. A later version label does not override a missing acceptance receipt.

## Current intended experience

Sky Cycle is a momentum-driven bicycle/unicycle delivery adventure. The road is a complete experience, and the connected optional aerial network permits expressive jumps, boost, two-sided catches, whip connections and discovery. Mastery means knowing where a line leads, how to approach its receiver, when to brake and how to recover. More disconnected track or scenery is not a substitute for that learning.

The shared gameplay surface bends through genuine depth while controls remain familiar. The optional Waterwheel market sweep uses gp.waterwheel.depthPath={version:1,id:'market-sweep-v1'}. It recedes and approaches between source distances 640 and 2840, then straightens before the express choice. Opposite 100-unit lobes produce 0.25 meters of depth excursion at default XR scale. The user controls the viewpoint; never turn the tracked headset camera to follow a bend.

The verified 0.29 baseline integrates pinned Currentworks Cloudlets, Islands and Toon into the straight and curved 3D preview: six mesh clouds and four floating island gardens behind the porch, market return, bridge and wheelhouse. Local orchard/pennant accents are not the separate Trees module. Garden surfaces are scenic, not gold collision platforms. Its exact successful public and native results remain in verification/currentworks-0.29.json.

## Current development slice: Mill Bell

Runtime 470d56178a6c20191df730d69236cf9be874ab8d implements v0.30.0 / sky-cycle-mill-bell-2026.09.22. The test-only correction is 9b08e5f4fd81c09510b92d2aa55402decb42ef37. Read MILL-BELL-0.30.md, MILL-BELL-DRIVER-REVIEW.md and verification/mill-bell-0.30.json. Hosted rules passed 478 game tests and 12 original soundtrack tests; new native and public relay acceptance remained pending at this checkpoint. Do not call the physical or chapter-quality gate complete.

Newly generated full and curved Waterwheel previews opt into one overhead anchor, peg-143-39 at (5166,1422), connecting the existing ww-crescent to ww-gallery through the original whip. Hold the existing mapped whip near the marked bell and release while rising right. A receiver pennant explains the destination. Keeping speed without whipping retains the original express. The lower road and its terrace delivery remain meaningful recovery rather than a dead end.

This is an optional route expression, not a new ability, steering axis, mandatory grapple, campaign replacement or reward owner. The original seven curves, ground, twelve mailboxes, checkpoints, encounter placement, controls and physics remain. Default/old documents and ground-only previews stay unchanged. Only versioned gp.waterwheel.whipLink metadata opts in; edited-away or unsupported anchors/receivers must not leave false guidance. No new permanent save key is introduced.

The real-game acceptance must show an actual hook, momentum release, gallery arrival, first-attempt depot finish and useful premature-release delivery recovery, not just a model arc. Both grip modes and tracked right-grip AR/VR transfer are required. The current XR test uses 2D travel to the transfer and 2D completion afterward; it must never be described as a full-XR chapter. Physical Quest/Xbox, complete reverse/coasting/short-release recovery and human comprehension remain distinct obligations.

## Architecture that must survive every upgrade

The original two-dimensional simulation owns motion, gravity, collision, catches, throws, rewards and document serialization. Horizontal distance maps to an authored centerline, vertical height retains stable up, and CPU/GPU use the same distance table. Paper packets follow that shared surface, not an unrelated free-space projectile model. Interacting objects must agree about contacts.

The courier remains a rigid tangent-aligned assembly with original proportions and pedal/grip IK. Long structures are subdivided only where curved presentation needs it. Horizontal framing follows the mapped horizontal coordinate while genuine depth excursion remains visible. Head position never reshapes the route or aperture. Menu panels, controller rays, editor canvases and reference spaces stay outside deformation. Two-dimensional and editor presentations stay straight; restore original material hooks and culling on transition.

Pinned r177 applies positionNode before native instance placement. Conjugate the surface map through the real instance matrix; do not double-transform. Preserve explicit TSL mix(a,b,t), prior normal/position hooks and material identity. Generated-shader checks and isolated GPU fixtures supplement, not replace, native gameplay or physical observations. Detach game-owned scene assets before disposing temporary XR resources.

Currentworks is pinned byte-for-byte from c31dd6c56a101aec7c8a890768ae1f845494b294 with provenance. Toon borrows the existing node-material constructor, not a second engine. The adapter owns only new objects, shares the pausable clock, uses the same coarse detail for both eyes, applies near-viewer suppression to deformed centers and disables scenery raycasts. Classic, 2D and Workshop return release the layer; 3D return creates one clean instance. It owns no storage, camera, collision, networking, render pass, music or animation loop.

Water, Fire, Trees, Grass or Flex Surface require deliberate separate node-renderer, curve/aperture and lifecycle work. They are not enabled by the garden pass. Preserve existing water rather than substitute an unqualified shader. Do not modify the sibling library or migrate every game to another renderer for a Sky Cycle adapter.

## Next useful work

Finish exact-source and public Mill Bell qualification before adding another route feature. Observe how an unfamiliar player recognizes the bell, reads the destination and understands hold/release timing without entering a menu. Retune fixed-world cues from real failures; do not silently steer the rider or turn a bad release into a scripted success. Test reverse, short-release and coasting recovery as additional cases beyond the current modeled/native matrix.

Physically review curved sightlines, contact alignment, porch approach and normal-speed/braking/miss behavior on Quest 3. Check island silhouettes at several seated positions and exhibit sizes. Existing VR backdrop edges and long controller-ray clutter still need a composition pass. Actual AR transparency is not evidence of room-camera readability or comfort.

Use bends to reveal useful receivers and landmarks. Returning around a familiar place should make its connections clearer. Keep side-on or shallow-tangent reading zones before demanding catches and throws. Avoid blind high-speed hazards and introductory segments pointing almost directly at the viewer. Strengthen curvature only after current gentle sweeps are understood.

Later implement bounded depth-profile authoring with serialization, undo, unsupported-profile fallback and old-document preservation. Independent depth lanes/crossings require distinct identities and explicit transitions/collision rules. The current shared surface does not implement them. Revision-aware official chapter promotion and rollback also remain separate; never compare new-layout times with old campaign records.

## Roadmap continuity

Keep AAA-ROADMAP.md, ROADMAP-RECONCILIATION.md, the Waterwheel workbook and level-design-library/SKY-CYCLE-LEVEL-DESIGN.md authoritative. Currentworks contributes to art/readability and resources in Milestones C/G. Mill Bell contributes a connected optional movement choice in Milestone B without closing the whole chapter, accessibility, art or performance milestone.

SC-REC-PASSPORT is the genuinely unported ordered-route stamp system, not existing district/individual-rail stamps. SC-REC-FIT is the global motion graph and automatic receiver fitting, not local Ride Lab traces. SC-REC-EXPLORE retains Quarry/Vault concepts for non-awarding Workshop adaptation. Their obsolete PRs were closed, not their design obligations; preserve original source history without restoring incompatible old builders or overwriting campaign slots.

## Spatial UI, saves and private boundaries

The approved interface direction is application-owned spatial interaction, not a head-attached or window-owned slab. A collapsed summonable adjustable pedestal remains a future proposal. Keep immediate feedback near the relevant tool/controller and larger maps/inventory/settings in a stable reachable workspace. Hidden panels cannot receive input. Common riding actions remain direct and remappable; moving a panel does not prove its buttons work.

Preserve session-owned A/B/X/Y/trigger/grip menus, hand select, the fixed-world aperture, unobstructed controller riding, neutral rearming, input-loss handling and late-permission cleanup. Menu and gameplay buttons have distinct roles. Keep all eight official campaign identities and independent save namespaces. Preview credits restore on Workshop return; no medals or permanent progress may be awarded by an authoring experiment.

Never publish private SaaS hub source, internal reviews, assets, credentials or account data. No walking or sphere portals are authorized for Sky Cycle. A future minimal launch/return adapter needs its own review and must not expose whole localStorage or take over progress. No A-Frame migration is part of this pass.

## Release and evidence discipline

Write scoped changes directly to fresh master with non-forced updates, preserving siblings. Reuse the existing Sky Cycle verification and current-master Pages publisher. Do not create PRs, staging branches or disposable pipelines, and do not force stale site snapshots. Keep source rules, isolated models, actual GPU fixtures, native game replay, public HTTP hashes and physical hardware evidence distinct.

Never clear storage, teleport the rider or assign score/win/progression to manufacture a pass. Retain failed attempts and actual report/source/artifact identities. The 0.29 early public failures remain in their original receipt. The Mill Bell driver correction supplies ordinary released input after menus rather than disabling the game's neutral gate. Source/test fixes are not retroactive evidence for earlier commits.

Confirm real public bytes and playable input separately from a commit or build result. Full curved XR traversal, physical Quest/Xbox, actual passthrough, normal-mapped/large edited geometry, sustained frame times, resource growth and unfamiliar-player comfort remain open until tested. Save these notes while working; do not imply work runs between chats.
