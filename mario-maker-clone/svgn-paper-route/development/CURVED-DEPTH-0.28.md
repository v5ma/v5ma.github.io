# Curved Depth 0.28: Waterwheel market sweep

The approved direction is a 2.5D gameplay surface curving toward and away from the viewer without new steering controls. The first implementation is published as v0.28.0 / sky-cycle-curved-depth-2026.09.22, runtime b20704756936f59e6c7f9e66b7f0ce04db8c6fb8. The exact inspected reports and remaining qualification are in verification/curved-depth-0.28.json. FUTURE-DIRECTION.md records the longer-term direction and RESUME-HERE.md is the continuation entry.

## Play and scope

Choose Waterwheel r2 design preview, then Ride curved 2.5D layout. The market road sweeps away and returns toward the viewer between source distances 640 and 2840, before the express-junction commitment. Existing straight and ground-only choices remain unchanged. The profile works in the existing desktop 3D and stereo AR/VR presentation. Screen/2D and both editors remain straight. Explicit gp.waterwheel.depthPath={version:1,id:'market-sweep-v1'} survives the existing Workshop codec. Missing or unknown profiles do not opt in.

This is one bounded shared surface, not independent depth lanes, a new free-steering axis or a new campaign. Roads, rails, enemies, mailboxes, packets and effects share the mapping. Paper follows the gameplay surface, not a new unrestricted ballistic simulation. Jumps, gravity, two-sided rail catches, whip attachment and delivery collision retain the original simulation. All eight official campaign builders, IDs, awards, saves, remaps and user documents are preserved. Preview results are non-awarding and temporary credits restore on Workshop return.

## Geometry and rendering contract

The horizontal coordinate is distance along a monotonic horizontal centerline. An authored sine-cubed depth profile supplies two opposite lobes with flat entry and exit. Integrating sqrt(1-z'(s)^2) gives horizontal position; a 2049-sample float lookup provides shared CPU/GPU mapping. The maximum depth excursion is 100 source units, or 0.25 meters at default XR scale. No head pose or elapsed time defines the path.

The pinned Three r177 positionNode executes BEFORE native instance placement. The implementation accounts for the actual instance transform before world deformation, then removes that frame before native placement. This corrects the earlier implementation and supersedes the earlier note saying the hook runs after placement. Explicit mix(a,b,t) also corrects the method-chaining argument-order error found in generated GLSL. Both findings have actual generated-code regression checks, not just inferred API behavior.

The courier is one rigid tangent-aligned assembly retaining existing IK and proportions. Long structural boxes are subdivided only for the new preview, retaining batching. Bounded transverse mapping prevents distant decorative depth from folding through the playable strip. Vertex-stage geometric-normal transport retains existing custom normal nodes; normal-mapped asset quality is still a separate visual gate. The original AR mask receives the final world position.

Only horizontal framing compensates for the mapped rider coordinate. Bounded depth motion remains visible. The headset camera/reference space, controller rays, menus and editor canvas are not deformed. Temporary culling overrides restore on leaving. The shared render bridge restores curved hooks even on 2D/editor paths that skip the 3D update. No new simulation, renderer or audio owner is introduced.

## Actual evidence

Run 35781731666 passed all 29 scoped jobs on b207: 432 game rules, 12 original soundtrack rules, existing route-entry/buttons/Workspace/fork/delivery regressions and public replays. The downloaded source archive and public report were checksum-verified. All 40 expected runtime hashes independently match the archived source and actual public responses at 2026-09-22T20:55:20Z.

Both downloaded public curved reports identify the exact source and public origin and pass 17 checks each with no page or shader errors. Their separate GPU fixture has five position/restoration checks for node and instanced classic materials, genuine depth displacement and a transformed exhibit. The game journey makes a real trigger-driven paper delivery, rides both depth lobes, reverses, changes 2D/3D views, moves the emulated head, uses hand menus, returns to the same editor document, exits XR and preserves campaign/save fixtures. No rider, delivery, score, win or progression assignments manufacture acceptance.

Ten images across the two public curved artifacts were reviewed, including two GPU-fixture images. The paused stereo captures obscure much of the road with the menu. This is recorded as an evidence-quality limitation, not falsely treated as a view of unobstructed riding. Test-only follow-up fb9fb95d24cb62bccdd99a2667dcb1a1e32c0bce uses actual Resume/B inputs and requires the controller panel absent when capturing. Read the receipt for its final native/public status.

Local browser navigation remains blocked by administrator policy before the game loads; no bypass was attempted and it supplies no rendered acceptance. A passing hosted renderer using emulated tracking is not physical Quest approval. Only selected downloaded artifacts were inspected; no complete review of all suite videos or images is claimed.

## Next observations

Physical Quest/Xbox, real passthrough, contact/readability and comfort, complete curved XR chapter traversal, very large edited geometry, normal-mapped assets and long-session frame times remain open. First use physical playtest feedback to improve the market/porch sightlines and useful landmark reveals. Then extend deliberate curved geography or the existing high-to-high whip continuation while preserving road recovery. Separate depth lanes require explicit identities and transition/collision rules. No private hub, rotunda, walking/sphere portal or A-Frame migration is included.
