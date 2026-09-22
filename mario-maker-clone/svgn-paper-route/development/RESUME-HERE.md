# Sky Cycle: curved 2.5D continuation

The playable runtime is v0.28.0, build sky-cycle-curved-depth-2026.09.22, source b20704756936f59e6c7f9e66b7f0ce04db8c6fb8. It is already published. Forty owned runtime files matched that source at 2026-09-22T20:55:20Z. Run 35781731666 passed all 29 Sky Cycle jobs, including both public curved AR/VR journeys. Read verification/curved-depth-0.28.json for the inspected evidence and remaining limitations. Do not rebuild this feature or revert to the older v0.27.3 handoff.

The owner explicitly requests ongoing notes beside the game so another chat can resume. FUTURE-DIRECTION.md is the durable design document; update it, this handoff and the versioned evidence at meaningful checkpoints. Save notes while working, not only in a final chat message. No background process between chats is implied.

## Play the new direction

Open the existing game with ?xr=1. In Routes choose Waterwheel r2 design preview, then Ride curved 2.5D layout. To enter immersion from the loaded preview, choose AR / VR, then Enter AR or Enter VR, then Resume play. Do not choose the ordinary campaign Waterwheel card and expect its old saved route to be silently replaced.

The initial road is straight. Through Parcel Market the road recedes from the viewer, comes back toward the viewer, and straightens before the express-junction decision. The profile spans source distance 640 to 2840 and has opposite 100-unit depth lobes. At default XR scale that is 0.25 meters each way. Continue using the same forward/back, jump, boost, paper and whip controls; no additional depth steering is required. The existing straight and ground-only preview choices remain available. Screen/2D and both editors stay straight.

The entire Waterwheel document remains editable and non-awarding. Preview credits restore on return to Workshop. All eight official campaign IDs/builders, current saves, remaps, earlier Canal Choice lower return, and existing XR input/session fixes are preserved.

## What was implemented

Only explicit gp.waterwheel.depthPath={version:1,id:'market-sweep-v1'} selects the curved presentation. Missing or unknown metadata leaves old documents straight. The original 2D simulation remains authoritative for movement, gravity, catches, deliveries and rewards. The shared surface map applies to the actual road, rails, scenery, enemies, packets and effects rather than displaying a video or curved-screen copy. The rider uses one rigid tangent frame so the existing proportions and pedal/grip IK contacts are not stretched.

Horizontal framing follows the mapped horizontal coordinate, while depth excursion remains visible. The curve and AR aperture are not driven by the headset. Do not change the tracked camera transform. Menus, controller rays and editor picking remain outside the deformation. A view switch restores original render fields and culling state through the existing shared renderer, not another animation loop.

## Evidence and the current verification refinement

The b207 source archive confirms 432 game-rule tests and 12 original soundtrack tests passed. Both downloaded public curved reports identify https://v5ma.github.io and the exact b207 source, have 17 passing checks and no page or shader errors. They include the separate real GPU position fixture, a genuine right-trigger packet delivery, ordinary riding through both depth lobes, reversal, head-independent geometry/aperture, 2D/3D switches, hand menus, unchanged editor document, XR exit and unchanged protected save/campaign fixtures. They do not claim a complete curved XR chapter finish.

Capture review found the original away/toward images were taken while paused; the menu obscures much of the road. Test-only commit fb9fb95d24cb62bccdd99a2667dcb1a1e32c0bce captures unobstructed actual play using Resume and B, without removing menu objects or assigning gameplay state. Run 35785899514 qualifies this stricter capture sequence. Inspect its curved native/public artifacts and actual images before saying that the refreshed captures passed. This does not invalidate the already matched b207 runtime bytes; it changes no gameplay file. Do not endlessly restart the whole implementation to obtain another screenshot.

## Integration traps

The pinned r177 positionNode executes before native instance placement, not after it. Transform through the real instance matrix before bending and undo that frame before the renderer places the instance. Use explicit TSL mix(a,b,t); the earlier method-chained version emitted the wrong GLSL argument order. Real generated-shader tests and the independent GPU fixture cover these findings. Preserve verification/curved-shader-findings.json.

Keep normals and existing custom normal nodes, prior material identity/hooks, and culling restoration intact. The displacement makes source bounds stale; temporary culling changes are presentation-only and must restore on exit. The legacy 2D/editor paths skip the 3D update, so their existing shared render bridge must restore deformation too. Do not dispose game-owned materials or scene objects during XR cleanup. Do not change published all-button input, fixed-world AR mask, cancellation cleanup or original soundtrack ownership for a rendering-only feature.

## Continue from here

First obtain physical Quest feedback on depth perception, rider/contact alignment, mailbox aiming, the porch approach and comfort. Make curvature reveal useful receivers and landmarks instead of concealing threats. Retune gentle local sweeps before adding extreme turns or independent depth lanes. Next complete the optional Waterwheel high-to-high whip connection with a safe non-whip continuation and useful lower delivery return. Depth-profile editor authoring and separate lane/crossing rules are later work, not completed features.

Keep AAA-ROADMAP.md, ROADMAP-RECONCILIATION.md, the Waterwheel workbook and the shared SKY-CYCLE-LEVEL-DESIGN.md movement-first method. SC-REC-PASSPORT, SC-REC-FIT and SC-REC-EXPLORE remain genuinely unported older obligations. The previous full handoff is archived verbatim in archive/RESUME-HERE-through-0.27.3.md.

Work directly on refreshed master, use non-forced atomic updates, preserve concurrent sibling changes, and use the existing verification workflow. No new PR, branch, temporary pipeline, private hub upload, A-Frame migration or cross-game portal. The rotunda remains a separate proposal. Never clear localStorage or manufacture progress for a test. Physical Quest/Xbox, real passthrough, full curved XR chapters, normal-mapped asset review, large edited geometry, long-session performance and human readability/comfort remain open.
