# Leo's Guild - Steady Steps v0.10.0

This continues the existing game after Living Stories. It advances narrow parts of C01-C03 in AAA-ROADMAP.md: an original articulated character sample, distance-driven pose blending, and collision-aware camera follow. It does not close the professional character-animation or complete camera-quality milestones.

## Camera

The follow boom now checks the whole segment between player and camera against expanded solid-wall bounds. A thin wall is detected even when the old and desired camera positions are both outside it. Collision is checked again after smoothing, so a lagging camera cannot stay on the far side of a newly encountered wall. Moving back into open space eases the camera outward rather than snapping it to full length.

Ground floors use the existing city's solid-wall footprints, finite-height obstacles, gates and doorway headroom. Upper rooms, attics and cellars use their own room boundaries. Underground camera space follows the connected union of corridor rectangles; rooftop views are not blocked by invisible street walls below them. Stair and cellar changes reset the camera's floor history instead of interpolating through the intervening floor. The camera code never moves the player or opens a locked route.

At very close range the player alone becomes partially transparent to keep the view usable. Other characters retain their opaque shared materials. Camera collision uses conservative proxy bounds rather than per-triangle checks of every ornamental mesh: foliage, tiny props, arbitrary external assets and every possible camera angle have not received pixel-perfect collision certification.

The close-corner visual review also found a textured bookshelf filling the view despite a numerically clear wall trace. Original and curated bookcases are now individually tagged. Their cached bounds trigger a temporary, object-local cutaway when they lie between camera and player, including when the camera is inside the furniture. Unobstructed shelves and shared source materials remain unchanged, and the shelf fades back when the view clears. This changes no player collision or furniture placement. Rooftop room-name changes also no longer reset camera history.

## Character motion

The original clothed Renaissance character sample now has separate hip, knee, ankle, shoulder, elbow and hand pivots, a moving torso and a head. Courier, master and rival palettes share mesh geometry between instances while keeping their transforms independent. This is original procedural geometry and authored animation, not imported motion capture, an external character pack or a claim of production-quality foot IK.

Walking phase follows actual horizontal displacement. Pressing against a wall without moving does not advance the stride, and stopping blends the limbs back down. Riding keeps its bent-leg pose; aiming, reloading, bracing, striking, jumping, dodging, taking cover and yielding use distinct joint poses. Pause freezes joint motion. Large recovery moves and floor changes do not count as walking distance. Staff and sling presentation use hand sockets; the staff is hidden when another tool is equipped.

The player, existing pedestrians and humanoid rivals use the same rig family. Their original paths, damage, attack timing, collision sizes, rewards and behavior remain unchanged. This release does not add new autonomous NPC schedules or enemy tactics.

## Preservation and controls

Continue through the existing Leonardo's Guild homepage card. The title and HUD identify Steady Steps v0.10.0. Use the same left-stick movement, right-stick camera, LT aiming, RT tool, X interaction/reload, LB equipment wheel, A jump/stairs, Y mount/dismount and B back/dodge controls. Classic, keyboard and touch bindings remain. No additional mandatory button or browser dialog is introduced.

Quiet/Balanced/Full cue density, separate volume settings and one score stream remain unchanged. No new sound events are introduced. Old saves, the original campaign, earlier side work, all 49 houses and floors, roof/underground networks, both Living Stories and all parked vehicles are preserved. Camera and pose memory are transient presentation data, not new progression fields.

## Acceptance

The new camera fixtures cover thin walls, corners, parallel rays, finite-height bounds, all 49 house boundaries on three enclosed layers, corridor unions, floor transitions, immediate inward correction, outward easing and pause stability. Rig fixtures check shared buffers, independent joints, distance-driven gait, standing still, pose transitions, pause and player-only fading. The full existing model suite remains required.

The dedicated fresh-browser journey uses virtual standard Xbox inputs for movement, actual workshop walls, upper stairs, shoulder aiming, reloads, pause/back, rooftop recovery and save reload. No live player position, clock, progression or money is assigned by that journey. Actual screenshots and source hashes are retained by the scoped workflow. Local native browsing is blocked by environment policy, so native acceptance uses GitHub Actions. Physical Xbox/Bluetooth, actual speaker listening and device frame-rate certification are not claimed.

Only a merged release and successful post-deployment public-file comparison establish publication. The release PR records exact commits, passing and failed runs, screenshot review, known limits and the public receipt.
