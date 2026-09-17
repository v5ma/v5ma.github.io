# Living Portal / Neighborhood Missions 0.13.0

## User correction and scope

The diorama is a window onto the regular third-person game, not a level miniaturized within a box. The room-fixed display keeps the accepted default width, depth, stand height and distance. Real player movement translates the entire game under the display so the courier stays horizontally centered. Right-stick camera yaw rotates the world around that center; physical head yaw or tilt does not steer the courier. This supersedes the old stationary-whole-map diorama direction, not the game's single simulation or its save contracts.

The aperture checks each fragment's eye-to-world ray against the display box. A ray that enters the box may continue beyond the rear or side; there is no far-wall crop. Rays missing the box and geometry before the entry face are rejected. The production adapter derives positions from each rendered eye, and includes instanced geometry, sprites, skinning and custom water shaders. It does not depend on a compositor stencil attachment. The implementation adapts the sibling Dino Atlas portal at blob 03dd03ba56795918905d3dec264843ababb3d5fe without adding a cross-game runtime dependency.

## Rectangle diagnosis

The old renderer constructed opaque double-sided left, right and rear enclosure planes. The old XR UI also copied the current headset position and full orientation into its panel group every frame. Both are confirmed source-level causes of view-dependent rectangles. Remove the opaque enclosure entirely, make foreground frame faces automatically transparent per eye, leave only faint far glass and a thin edge frame, and dock the hand panel at a fixed yaw-only position. The pause panel is placed once on opening rather than following every head tilt. Controller gameplay hides it. The physical report does not establish which of these planes was most objectionable; actual headset review remains required.

First-person AR requests immersive-ar explicitly and requires nonopaque environment blending. It uses the same human-scale geometry as first-person VR, with the desktop body hidden and headset pose independent of animation bob. It is manual placement, not room scanning, persistent anchors or real-obstacle detection. Use a clear stationary play area; do not physically walk into unseen furniture.

## A place with work to do

Eight resident stories contain three actionable stages each, after meeting their giver. Ada restarts the press and shares neighborhood news. Bea connects greenhouse herbs to kitchen meals. Otis drains, inspects and restores the canal. Sal traces the rooftop broadcast relay. Tomas connects finished lanterns to repaired service access. Lin gardens on the print terrace and reuses kitchen compost. Letters connect three households. Completing three stories makes the courtyard gathering available. The radio, newspaper, kitchen and garden completions change small scene details rather than only adding credits.

Six new named residents join Mara, Ivo and Neri. The kitchen, north storehouse and greenhouse occupy the three existing formerly solid building footprints, now with physical door openings and furnished rooms. The print shop, workshop and radio loft reuse real interiors and stairs. No new district is added. This is a compact authored set of peaceful neighborhood jobs, not a claim to GTA-scale population, rich branching conversations or finished production art.

The player sees a gold next-objective diamond in the world, an always-available minimap, distance/floor information, a large map with prominent targets, and a mission list accessible with D-pad down, View/M or the on-screen button. XR has a native mission map and tracked/pinch selection. A mission selected before meeting its giver points to that person. Water inspection points to the sluice until draining makes the filter reachable. Main delivery remains independently trackable; changing tracking does not discard another story's progress.

## Control and save invariants

A falling edge on boost applies a short active brake, then ordinary input can resume. Letting go of RT, Shift or the touch speed button no longer acts as cruise control. Existing A/X/Y/LB/LT/B/L3 and menu mappings remain. Head tracking never substitutes for movement input. Session loss clears inputs and preserves progress.

Keep svgn.lantern-ward.v1 / lantern-ward-01 / layout 1, old flags and the original exactly-once 600-credit ledger. A validated optional city field stores resident progress with its own credits, rejecting future versions and inconsistent rewards instead of silently resetting. Old saves without city load an empty resident ledger. Saving creates the existing backup first. Geometry only opens previously solid volumes inside their footprints; it does not relocate old valid positions. The 102 frozen legacy runtime files remain untouched, including legacy.html and its separate original saves.

## Acceptance and remaining work

The 222 retained model tests remain; 19 new model tests cover all eight story outcomes, real traversal into every new interior, old saves, forged/future reward rejection, hold-release stopping, and portal math/eye separation. Actor assignments are confined to the historical labelled fixtures, not the new resident tours. New browser suites drive the actual URL, render pipeline, controller, stories, map, head tilt/roll, AR, hand panel and per-eye pixel masks. Pixel fixtures are explicit isolated geometry, not substitutes for mission completion. Read the versioned candidate and final release receipt for what actually passed.

Physical Quest 3/Touch Plus/hand tracking, Xbox, comfort, frame timing and human comprehension remain open. The user-visible concern overrides earlier synthetic sign-off. Test standing and seated, look around all sides, tilt the head, vary display size, release acceleration, select missions without a mouse, enter each room and return after saving. Next design work should deepen dialogue, observable work routines and mission consequences within these households rather than add more anonymous geography.
