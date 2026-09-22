# Curved Depth 0.28: Waterwheel market sweep

The owner's approved direction is a 2.5D gameplay surface curving toward and away from the viewer without new steering controls. This replaces the next content priority temporarily; the optional high-to-high whip connection remains open. Use the existing direct-master process and consolidated Sky Cycle workflow. Do not create a PR, staging branch or new deployment workflow.

## Play and scope

Open Waterwheel r2 design preview, then Ride curved 2.5D layout. The market road sweeps away and returns toward the viewer between source distances 640 and 2840, before the express-junction commitment. Existing straight preview and ground-only choices remain unchanged. Screen/2D and both editors remain straight. The curved document carries gp.waterwheel.depthPath={version:1,id:'market-sweep-v1'} through the existing Workshop codec. Missing or unknown profiles do not opt in. Official campaign IDs/builders, rewards and original saves are unchanged.

This is a bounded movement-first presentation prototype, not an independently steerable third axis or a new campaign. The road, rails, enemies, mailboxes, packets and effects share a distance-based mapping. Paper follows the gameplay surface rather than a new free-space ballistic simulation. Existing jumps, gravity, two-sided catches, whip attachment and delivery collision still use the original physics. No player or save migration is introduced.

## Geometry and rendering contract

The horizontal game coordinate is arc length along a monotonic horizontal centerline. An authored sine-cubed depth profile supplies two opposite lobes with flat entry and exit. Integrating sqrt(1-z'(s)^2) yields the horizontal coordinate; a 2049-sample float lookup supports both CPU reference and GPU mapping. The depth excursion is bounded to 100 source units (0.25m at the default XR scale), with no camera-derived path parameters. This is one shared surface, not independently crossing lanes.

The existing Three node-material position hook runs after instance placement, so instanced projectiles use the same map. The courier is treated as one rigid assembly at its existing root and rotates with the path tangent, preserving its current IK contacts/proportions. Long structural boxes are subdivided only for this preview; existing spatial batches are retained. A bounded transverse frame prevents distant decorative depth from folding through the playable strip. An inverse-transpose Jacobian transports authored normals and existing normal nodes. The original AR mask reads final world position and remains outside camera space.

Only horizontal framing subtracts the mapped rider coordinate. The depth excursion is not cancelled, and no headset camera transform is overwritten. The menus, controller rays, editor canvas and XR reference space are not deformed. GPU displacement temporarily disables source frustum culling on the affected scene meshes; prior fields and culling flags are restored when leaving the curved presentation. Resource/performance cost must be measured on hardware, not inferred from tests.

## Evidence and open observations

Local rules cover constant-distance sampling, stable up, bounded depth, rigid actor distances, positive surface Jacobians, absent/unknown metadata, original document preservation and render-hook ownership restoration. The local browser cannot navigate because administrator policy blocks it; this is not a rendering result and was not bypassed.

The native acceptance script uses the actual game and original controls with explicitly emulated XR hardware. It attempts real 3D packet delivery within the curved market, both depth lobes, reverse travel, head movement, hand menus, 2D switching, Workshop return and exit. A separate GPU fixture compares actual node and instanced-classic rendering positions with the CPU map and checks rotated/scaled exhibit and restoration. Existing route, fork, twelve-delivery and XR-button regressions stay required. Read verification/curved-depth-0.28.json for actual results; script existence does not establish a pass.

Physical Quest/Xbox, real passthrough, readability and comfort, complete curved XR chapter traversal, very large edited geometry, normal-mapped asset review and long-session frame times remain open. No private hub, rotunda, cross-game portal or A-Frame migration is included. The next depth-design question is whether the market bend makes later route relationships clearer without obscuring the next useful landing. Only then extend profiles or introduce independently branching depth paths.

## References and rollback

Pinned local Three r177 NodeMaterial.setupPosition, Position/Normal nodes and NodeLibrary are the integration sources. Three Curve documentation describes the separate distance-sampling requirement. The shared SKY-CYCLE-LEVEL-DESIGN.md remains authoritative for purpose, recovery and real-input tests.

Rollback the new imports, profile option, rendering modules and matching release identifiers only. Do not reset master, overwrite sibling changes, clear storage or remove existing Workshop documents. A curved document without the optional renderer still has its original playable 2D data.
