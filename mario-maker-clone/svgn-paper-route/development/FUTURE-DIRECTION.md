# Sky Cycle: future direction and recovery map

Updated September 22, 2026. This file belongs to the game, not to a chat. Keep it beside RESUME-HERE.md and update both at meaningful implementation and verification checkpoints. Record work actually done, the exact runtime source, failures, remaining tests and the next useful change before a handoff. Do not rely on chat history to recover the project.

## Current approved direction

Sky Cycle remains a momentum-driven bicycle/unicycle delivery adventure: a complete ground journey with an optional connected aerial network, jumping, boost, two-sided rail catches, whip connections, discoveries and an editor. The new direction bends that two-dimensional gameplay surface through genuine 3D depth. Keep the familiar controls; do not introduce an extra steering axis just to move toward and away from the viewer.

The first implementation is the optional Waterwheel market sweep, selected through Waterwheel r2 design preview, then Ride curved 2.5D layout. Its versioned document metadata is gp.waterwheel.depthPath={version:1,id:'market-sweep-v1'}. The road recedes and then approaches over source distance 640 to 2840, before the high-speed express decision. It returns to straight presentation. Existing straight and ground-only preview choices and all eight official campaign builders remain independent.

Runtime b20704756936f59e6c7f9e66b7f0ce04db8c6fb8 is v0.28.0 / sky-cycle-curved-depth-2026.09.22. Run 35781731666 reports all 29 scoped jobs successful, including 40 public file hashes and both public curved AR/VR journeys. The downloaded source, public report and public AR/VR reports have matching artifact digests and source identities. The public bytes matched at 2026-09-22T20:55:20Z. Each public curved journey has 17 checks, including a genuine packet delivery, both depth lobes, reverse movement, view switching, hand menus, editor return and unchanged save/campaign fixtures. These are actual application/renderer tests with emulated hardware, not physical Quest approval.

Recovery observation: the retained away/toward captures were taken while paused and the menu obscures much of the curved road. They prove that the menus render but are weak evidence for visual route readability. The next verification correction is to capture actual unobstructed play through normal Resume and B inputs, without hiding menu objects or assigning gameplay state. Keep the existing behavioral assertions. Read verification/curved-depth-0.28.json for the final reviewed release status rather than inferring it from this checkpoint.

## Architecture to preserve

The original 2D simulation, velocities, collision, gravity, throws, catches, progression and document codec remain authoritative. The horizontal coordinate is distance along a fixed authored centerline; vertical height keeps a stable up direction. GPU and CPU mappings share the same distance table. Existing packets follow the curved gameplay surface, not an independently invented free-space projectile model. All interacting objects must agree visually about their contacts.

The courier stays a rigid tangent-aligned assembly so its existing pedal/grip IK and proportions are not stretched. Long structures are subdivided only in the curved preview. The mask and curve are fixed to the exhibit, never derived from head pose. Horizontal framing may follow the rider, but bounded depth excursion remains visible. At default XR scale the authored 100-unit excursion is 0.25 meters each way. Do not automatically turn, roll or move the tracked headset camera.

Menus, controller rays, editor canvas and XR reference spaces stay outside the deformation. The 2D view and editors remain straight. Switching views must remove and restore only the presentation hooks and preserve the running route, delivery count, attempts and document. Keep the fixed-world AR aperture, no persistent controller-riding slab, explicit AR/VR/Screen entry, all-button input, late-permission cleanup and original render/audio owners.

Pinned Three r177 applies positionNode before its native instance transform. Account for the instance before world deformation and undo that frame before native placement. Do not reintroduce the earlier incorrect method-chained mix calls: the generated-code tests require explicit mix(a,b,t). The independent GPU fixture verifies real rendered node and instanced-classic positions; shader compilation alone is not rendering approval. Preserve material identity, prior position/normal hooks and culling flags on exit. Never dispose the original game scene with temporary XR resources.

## Next useful design passes

First, physically retest the gentle market sweep on Quest 3: is the forward road readable while it recedes, do mailboxes and rider contacts align, does the return toward the viewer feel comfortable, and can the player read the porch entry before committing? Observe normal speed, braking, reverse travel and misses, not just ideal inputs. Retune the authored curve or sightlines based on those observations before making the sweep more extreme.

Second, make curvature reveal geography rather than merely change its appearance. A return around the same landmark should teach where an elevated route goes, expose a useful receiving area or make a familiar delivery approach more intentional. Establish straight or shallow-tangent reading zones before demanding catches and throws. Avoid blind high-speed hazards and near-head-on segments in the introductory profile.

Third, complete the optional Waterwheel high-to-high whip connection, preserving its non-whip continuation and useful lower delivery return. The preview remains non-awarding until revision-aware campaign promotion and rollback are deliberately designed and tested. Do not compare new-layout records with older official chapter times.

Later, add explicit editor authoring for depth profiles with clear bounds, unsupported-profile fallback, serialization, undo and old-document preservation. Independent depth lanes, crossings and joins need separate lane identities and transition/collision rules. They are not already implemented by the shared surface. Do not fold distinct playable surfaces together while leaving collision ambiguous.

## Preserved roadmap obligations

The shared level-design-library/SKY-CYCLE-LEVEL-DESIGN.md is authoritative for movement-first design. Retain AAA-ROADMAP.md, ROADMAP-RECONCILIATION.md and the local Waterwheel workbook. SC-REC-PASSPORT is the missing ordered-route stamp system, not the current individual-rail journal. SC-REC-FIT is the missing global motion graph/automatic receiver fitter, not current local Ride Lab traces. SC-REC-EXPLORE retains the unported Quarry/Vault concepts for safe optional Workshop adaptation. Closing older conflicting PRs did not implement those features.

## Spatial UI and private boundaries

The owner wants in-application spatial UI, not head-attached or window-owned panels. A low collapsed, summonable and adjustable pedestal/rotunda is a future proposal; this curved release does not implement it. Common gameplay information should remain close to its relevant controller/tool while larger maps, inventory and settings can use a stable summonable workspace. Hidden panels must not intercept input. Preserve immediate resume/back/exit.

Do not upload private WebXR SaaS hub code, assets, credentials or internal review material. No A-Frame migration is required for this slice. No walking or sphere portals are authorized for Sky Cycle; the earlier walking-portal experiment was limited to Vesperfall. A future public launch/return adapter must be minimal and reviewed separately from the private hub.

## Release and evidence rules

Write directly to refreshed master with non-forced atomic commits, preserving concurrent sibling games. No new PR, staging branch or temporary deployment workflow. Use the existing Sky Cycle verification workflow. Keep runtime, isolated models, actual browser rendering, public bytes and physical device results distinct. Do not clear localStorage or assign rider/score/win/progression state to create a passing replay.

Update the future direction, handoff and versioned receipt at useful checkpoints. Keep original failures and exact artifact/run/source identities. A queued job is not a pass; a published file is not physical-device approval. Device frame times, long-session resources, normal-mapped assets, very large edited geometry, complete curved XR chapter finishes and unfamiliar-player readability remain open until measured. Never claim background work between chats.