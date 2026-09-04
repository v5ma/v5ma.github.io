# SVGN Paper Route Design Decisions

Source task: `codex://threads/01a05daf-020e-7133-a842-191fdc0b0a62`

This is a readable rendering of the complete feature and design decision records written during the source task. The adjacent `FEATURE-REQUESTS.csv` is the exact structured log. Evidence and status are preserved as recorded; they are not independent runtime or hosted proof.

## Decision Records

### 1. Paperboy throw = fixed/rigid trajectory the player times (not auto-aim)

- Date: 2026-08-07
- Category: physics
- Status: DONE
- Evidence: THROW_V fixed speed + 8-sector arm rotation + dotted arc preview
- Notes: arm auto-rotates toward nearest mailbox on vertical levels

### 2. Procedurally generate many fun beatable levels

- Date: 2026-08-07
- Category: content
- Status: DONE
- Evidence: genMachine(seed) motif/tier arc; bot win rate 94%
- Notes: 

### 3. Procedurally generate rewards / skins

- Date: 2026-08-07
- Category: economy
- Status: DONE
- Evidence: forged skins minted + persisted
- Notes: 

### 4. Supabase verifies players posted links on social

- Date: 2026-08-07
- Category: economy
- Status: DONE
- Evidence: DEPLOYED LIVE: verify-share Edge Function + share_claims table; live tests - unsupported host refused
- Notes: reachable post without link persisted as rejected 0 credits

### 5. iPhone on-screen controls + Bluetooth Xbox controller

- Date: 2026-08-07
- Category: platform
- Status: DONE
- Evidence: touchpad + gamepad bindings
- Notes: 

### 6. Cloud saves to Supabase

- Date: 2026-08-07
- Category: platform
- Status: DONE
- Evidence: cloud shelf round-trip verified
- Notes: 

### 7. Accounts + share links so others can make/save their own

- Date: 2026-08-07
- Category: platform
- Status: DONE
- Evidence: machines table + RLS + magic link
- Notes: 

### 8. Front door at play.svgn.io

- Date: 2026-08-07
- Category: deploy
- Status: DONE
- Evidence: Cloudflare Pages + DNS
- Notes: made public per request

### 9. Grapple hook: whip grabs peg then loop around it for speed

- Date: 2026-08-07
- Category: gameplay
- Status: DONE
- Evidence: stepSwing flywheel; loops counted; release boost
- Notes: 

### 10. More open loops / launch loops / cannons at all angles

- Date: 2026-08-07
- Category: content
- Status: DONE
- Evidence: 6 cannons + 9 fractional pipes
- Notes: 

### 11. Palette category menus with many pipe variants

- Date: 2026-08-07
- Category: ui
- Status: DONE
- Evidence: 9 category tabs / 83 swatches
- Notes: 

### 12. Characters must be in 3D

- Date: 2026-08-07
- Category: art
- Status: DONE
- Evidence: voxel geometry per character; 9 distinct silhouettes
- Notes: 

### 13. New character Photon

- Date: 2026-08-07
- Category: art
- Status: DONE
- Evidence: PHOTON in CHARS
- Notes: 

### 14. All characters have lights that illuminate the play space + signal state

- Date: 2026-08-07
- Category: art
- Status: DONE
- Evidence: lampNow drives the real 3D point light; pip #ffb02e/300 photon #7df3ff/1008 nyx #b28aff/405; bop gold hit red land green nitro 3.0
- Notes: beam characters throw light 1.6x further

### 15. More songs + mute button

- Date: 2026-08-07
- Category: audio
- Status: DONE
- Evidence: 9 songs + MUTED toggle
- Notes: 

### 16. Play next level button

- Date: 2026-08-07
- Category: ui
- Status: DONE
- Evidence: 
- Notes: 

### 17. Editable/savable default levels (each player own copy)

- Date: 2026-08-07
- Category: content
- Status: DONE
- Evidence: FORK makes a personal copy; pack level verified unchanged after edits; fork round-trips exactly
- Notes: 

### 18. Level folders / playlists

- Date: 2026-08-07
- Category: ui
- Status: DONE
- Evidence: LIBRARY panel with folders move rename delete + play-all playlist walker
- Notes: 

### 19. Fix bad level design (buried blocks / springs into ceilings)

- Date: 2026-08-07
- Category: content
- Status: DONE
- Evidence: 48-seed audit: buried blocks 0 springs-into-ceilings 0; levels with no mailbox 24 -> 0 (min 4 per level)
- Notes: genMachine had 3 early returns so the guarantee had to move outside it

### 20. Optimize performance regression; NO adaptive quality

- Date: 2026-08-07
- Category: perf
- Status: DONE
- Evidence: layout thrashing fixed; idle 9.63ms -> 2.76ms
- Notes: 

### 21. Illustrator-style smooth bezier curve tool

- Date: 2026-08-07
- Category: editor
- Status: DONE
- Evidence: pen with anchors+handles; curves stay editable
- Notes: 

### 22. Rotate / flip / transform / scale curve assets

- Date: 2026-08-07
- Category: editor
- Status: DONE
- Evidence: ROT +-15 BIGGER SMALLER FLIP H/V; verified geometrically
- Notes: 

### 23. Scroll horizontally/vertically/diagonally in edit mode

- Date: 2026-08-07
- Category: editor
- Status: DONE
- Evidence: middle-drag space-drag wheel arrows PLUS real scroll bars
- Notes: 

### 24. Increase level size / extend a level

- Date: 2026-08-07
- Category: editor
- Status: DONE
- Evidence: WIDER +20 and TALLER +4; height grows upward
- Notes: 

### 25. Curve asset library (save/stamp reusable curves)

- Date: 2026-08-07
- Category: editor
- Status: DONE
- Evidence: SAVE CURVE / STAMP / scale+rotation; normalised anchors
- Notes: 

### 26. Curves should accelerate the player

- Date: 2026-08-07
- Category: physics
- Status: DONE
- Evidence: CURVE_PULL 1.75; speed 1.41 -> 18.02 on a descent
- Notes: 

### 27. Snappier physics

- Date: 2026-08-07
- Category: physics
- Status: DONE
- Evidence: ACCEL 0.92 FRICTION 0.86
- Notes: 

### 28. Wheel must stay on correct side of curve through loops

- Date: 2026-08-07
- Category: physics
- Status: DONE
- Evidence: continuous normal; side flips per lap 2 -> 0
- Notes: 

### 29. Use Three.js as the actual renderer (not a side demo)

- Date: 2026-08-07
- Category: renderer
- Status: DONE
- Evidence: index.html is the merged 3D build
- Notes: 

### 30. Real WebGPU (no lazy substitution)

- Date: 2026-08-07
- Category: renderer
- Status: DONE
- Evidence: WebGPURenderer + WebGPUBackend confirmed; node materials
- Notes: 

### 31. Convert every 2D asset to 3D (voxels for ~90%)

- Date: 2026-08-07
- Category: art
- Status: DONE
- Evidence: 74 tile types + entities + chars + tracks + particles
- Notes: 

### 32. Run button like Super Mario

- Date: 2026-08-07
- Category: gameplay
- Status: DONE
- Evidence: Shift / J / on-screen RUN; walk 0.164 run 0.208 tiles-per-frame
- Notes: 

### 33. Voxel animations (replacing sprite animation)

- Date: 2026-08-07
- Category: art
- Status: DONE
- Evidence: 6 walk frames + air + land per character; 7 geometries in play
- Notes: 

### 34. SCROLL BARS in edit mode

- Date: 2026-08-07
- Category: editor
- Status: DONE
- Evidence: H+V bars with proportional thumbs; thumb 0->629 across level; page-click scrolls; hidden in play
- Notes: thumb size shows how much of the level is in view

### 35. Keep a CSV workbook of all feature requests

- Date: 2026-08-07
- Category: process
- Status: DONE
- Evidence: this file
- Notes: 

### 36. Enemies must not walk off cliffs toward the player

- Date: 2026-08-07
- Category: ai
- Status: DONE
- Evidence: ledge probe: without it walker reaches x536 and falls; with it turns at x488
- Notes: committed falls are left alone

### 37. Assets must be the right scale

- Date: 2026-08-07
- Category: art
- Status: DONE
- Evidence: 1 voxel = 1 art pixel; entities auto-fit to hitbox
- Notes: 

### 38. Edit mode grid missing / cannot place assets

- Date: 2026-08-07
- Category: bug
- Status: DONE
- Evidence: 3D layer was painting over the editor; 2D owns top in edit
- Notes: 

### 39. Invisible 360 loop in the scene

- Date: 2026-08-07
- Category: bug
- Status: DONE
- Evidence: tracks were 2D-only; now extruded rails; 7784 px painted
- Notes: 

### 40. Collected vehicle stays in scene (two vehicles)

- Date: 2026-08-07
- Category: bug
- Status: DONE
- Evidence: renderer read edit grid not playGrid
- Notes: 

### 41. Player looks too short when riding a vehicle

- Date: 2026-08-07
- Category: bug
- Status: DONE
- Evidence: composite vehicle+rider poses baked at the 2D offsets; bike 48x43 hover 40x50 euc 30x45 vs 30x29 on foot
- Notes: wheel no longer double-drawn

### 42. Shooting packets into mailboxes does not work

- Date: 2026-08-07
- Category: gameplay
- Status: DONE
- Evidence: THROW_V 7.5->11.2 + flat arc; 2 deliveries 20 credits via real FIRE key
- Notes: packet could not physically reach a box at normal range before

### 43. Coins/gears should be postage letters and parcels

- Date: 2026-08-07
- Category: economy
- Status: DONE
- Evidence: 3 tiers 1/3/5 credits; 3 distinct voxel shapes; collection paid 1/3/5 in live play
- Notes: drop rates 58/28/14 percent

### 44. Bake voxel geometry to a data file and ship that

- Date: 2026-08-07
- Category: build
- Status: DONE
- Evidence: voxel-assets.json 660KB (spans not triangles - was 10.36MB); game boots with __bakedAssets true
- Notes: 

### 45. Graphics look dark vs the original art

- Date: 2026-08-07
- Category: art
- Status: DONE
- Evidence: unlit + baked face shading; brightness ratio 0.99 vs art
- Notes: 

### 46. 2D versions still exist / flash on load

- Date: 2026-08-07
- Category: bug
- Status: DONE
- Evidence: 26 draw functions deleted; 0 remain; palette icons render from voxel spans; source shrank 379600->347484 bytes
- Notes: 

### 47. 3D grid coordinate system for edit mode in Three.js

- Date: 2026-08-07
- Category: editor
- Status: DONE
- Evidence: 368-tri grid + tile cursor; screen-to-tile round trip error 0
- Notes: unlocks retiring the 2D world pass

### 48. Curves invisible in edit mode but visible on Play

- Date: 2026-08-07
- Category: bug
- Status: DONE
- Evidence: tracks[] only exists in play; edit now builds rails from customTracks
- Notes: 

### 49. Curve segments editable in edit mode with control handles

- Date: 2026-08-07
- Category: editor
- Status: DONE
- Evidence: anchor + handle gizmos drawn in 3D; handle drag reshapes rail 90->155
- Notes: 

### 50. Flip/rotate/rescale/reposition curves after placement

- Date: 2026-08-07
- Category: editor
- Status: DONE
- Evidence: rot90 307x90->90x307; scale2 307->607; flipV size kept; move verified
- Notes: 

### 51. Character invisible in play mode

- Date: 2026-08-08
- Category: bug
- Status: DONE
- Evidence: occluded by voxel terrain sharing the same z band; actors now use depth-test-off material at renderOrder 5000; verified by playing to MACHINE COMPLETE in 4.3s
- Notes: submitted 990 tris the whole time - it was drawn then hidden

### 52. Frame loop died every session (drawBG is not defined)

- Date: 2026-08-08
- Category: bug
- Status: DONE
- Evidence: 3 stale call sites into deleted 2D draw code; uncaught throw inside rAF kills the loop permanently; all retired draw fns now no-op stubs
- Notes: 

### 53. Curves invisible when placed in edit mode

- Date: 2026-08-08
- Category: bug
- Status: DONE
- Evidence: ribbon rails were backfacing under a FrontSide material; railMat is DoubleSide + depth-test off; gold arc renders where placed
- Notes: same trap the edit grid hit earlier

### 54. PICK selection + transform verified by real clicking

- Date: 2026-08-08
- Category: editor
- Status: DONE
- Evidence: clicked PICK then the curve: selection 0 with cyan anchors and amber handle gizmos; ROT +15 x4 rotated anchors 500/900 -> 600/800 and the arc followed
- Notes: 

### 55. Verify by playing and filming rather than by reading counters

- Date: 2026-08-08
- Category: process
- Status: DONE
- Evidence: switched to Chrome DevTools MCP; every fix in this batch was found by screenshot after an action
- Notes: counters read green while the screen was black

### 56. Levels not traversable - bot completed only 1 of 6 generated levels

- Date: 2026-08-08
- Category: physics
- Status: DONE
- Evidence: fresh unseen seeds now 8/8 won 0 deaths 33 deliveries avg 14.8s
- Notes: three root causes: step-up assist + floorless sky levels + rail softlock

### 57. Zero deliveries measured across a full sweep

- Date: 2026-08-08
- Category: process
- Status: DONE
- Evidence: measurement artifact - the bot never pressed the throw key; mechanic itself verified working earlier
- Notes: bot now presses KeyC near a mailbox

### 58. Knee-high ledges stopped a run dead

- Date: 2026-08-08
- Category: physics
- Status: DONE
- Evidence: step-up assist in moveX; seed 1321185480 went 8 pct -> 96 pct
- Notes: only on the ground and only when the raised spot is actually free

### 59. Sky-motif levels generated with NO floor for 135 columns

- Date: 2026-08-08
- Category: content
- Status: DONE
- Evidence: ensureGroundFloor post-pass; seeds 55219 and 64538327 fell out of the world and died on a loop - now won in 13.9s and 15.8s
- Notes: genMachine early-returns so the guarantee lives outside it like ensureMailRoute

### 60. Catch floor left a cliff where the void met real terrain

- Date: 2026-08-08
- Category: content
- Status: DONE
- Evidence: ramped the deck into neighbouring ground heights; worst step in playable span now <=2 tiles
- Notes: flat slab stalled every sky run at 91 pct

### 61. SOFTLOCK - player trapped forever in a track dip

- Date: 2026-08-08
- Category: physics
- Status: DONE
- Evidence: jump off a rail now sets trackCD 34 so it clears instead of re-railing; seeds 99001 and 7771234 went 26/28 pct -> won
- Notes: the 12-frame detach cooldown let the player re-rail before leaving the curve

### 62. Bot measured the game wrong three separate ways

- Date: 2026-08-08
- Category: process
- Status: DONE
- Evidence: win oracle was an inline style beating the .show class; forward probe keyed off vx which a wall zeroes; jump held too long
- Notes: never trust the instrument before the subject

### 63. CHARACTER INVISIBLE - reported by Micah after the level fixes shipped

- Date: 2026-08-08
- Category: bug
- Status: DONE
- Evidence: two separate root causes found by hiding the whole scene and tinting the actor magenta; character now renders on the EUC and tracks the player
- Notes: neither was a game-logic bug - both were GPU-side

### 64. WebGPU rejected EVERY frame (uniform buffer overflow)

- Date: 2026-08-08
- Category: bug
- Status: DONE
- Evidence: legacy MAXTILES=20000 quad batch asked for 1280000 bytes vs the 65536 limit; invalid bindGroup_object -> invalid CommandBuffer -> canvas froze on the last good image; 505 console errors -> 4
- Notes: count=0 and visible=false do NOT protect you - the buffer is sized from CAPACITY

### 65. Capacity-1 InstancedMesh ignored its per-instance matrix

- Date: 2026-08-08
- Category: bug
- Status: DONE
- Evidence: character drew at world 0
- Notes: 0 (top-left corner) while getMatrixAt reported the right spot; setSingle now drives the OBJECT transform and leaves instance 0 at identity

### 66. Add a boot-time GPU limit audit so this can never be silent again

- Date: 2026-08-08
- Category: process
- Status: DONE
- Evidence: gpuLimitAudit() scans every InstancedMesh capacity against the 65536 limit and console.errors; window.__gpuAudit.ok
- Notes: every counter read green while the screen was frozen

### 67. Collected gears and mail did not vanish (reported by Micah)

- Date: 2026-08-08
- Category: bug
- Status: DONE
- Evidence: drawn gear batch now 20 -> 17 matching the grid on the same frame
- Notes: gridFingerprint strided the grid by 37 so a one-cell pickup was missed ~97% of the time

### 68. Rebuild check ran only every 4th frame in play

- Date: 2026-08-08
- Category: perf
- Status: DONE
- Evidence: now every frame; p50 16.7ms p95 18.1 p99 18.7 unchanged
- Notes: a pickup must vanish on the frame you touch it

### 69. Boot threw drawBG then ATLAS_ON from the deleted 2D render pass

- Date: 2026-08-08
- Category: bug
- Status: DONE
- Evidence: retired-draw stubs moved to the FIRST script block and the dead 2D world pass now returns early; console errors 1 -> 0
- Notes: stubbing names one at a time just moved the error along

### 70. Curve flung the rider backwards and ping-ponged the run

- Date: 2026-08-08
- Category: physics
- Status: DONE
- Evidence: rolling back off a curve is damped 0.35x with a 45-frame rail cooldown; seed 314159 8 pct -> won
- Notes: pre-existing - the live build did it too; earlier wins on such seeds were luck

### 71. Mute the game during all agent test runs

- Date: 2026-08-08
- Category: process
- Status: DONE
- Evidence: localStorage sprocket_muted=1 set before every run; saved to memory
- Notes: Micah is at the machine and should not have to listen to it

### 67. Verify frame budget now that frames actually render

- Date: 2026-08-08
- Category: perf
- Status: DONE
- Evidence: locked 60fps avg 16.68ms p95 17.6 p99 19.3 worst 24ms and ZERO frames over 33ms across 420 frames of play
- Notes: every earlier perf number was invalid - measured while WebGPU discarded frames

### 68. Bot jumped at 1-tile ledges and disabled the step-up assist

- Date: 2026-08-08
- Category: process
- Status: DONE
- Evidence: step-up needs onGround; a constantly-airborne bot never gets it. Jump now only for obstacles step-up cannot solve. 4 seeds went 1/4 -> 4/4 with the GAME UNCHANGED
- Notes: proved by a no-jump run winning seed 246810 outright

### 69. Boot is clean - no uncaught errors

- Date: 2026-08-08
- Category: process
- Status: DONE
- Evidence: 0 window errors captured on load; console has 2 benign warnings; the earlier drawBG ReferenceError is gone
- Notes: 

### 70. Completion rate on a real sample size

- Date: 2026-08-08
- Category: content
- Status: DONE
- Evidence: 10 fresh unseen seeds all won - 40 deliveries 0 deaths median 10.3s; 14/14 counting the earlier set
- Notes: replaces the 4-and-8 seed claims that had already been burned once by seed luck

### 71. DIFFICULTY CONCERN - a bot holding ONE key beats every level with zero deaths

- Date: 2026-08-08
- Category: design
- Status: OPEN
- Evidence: 14/14 wins 0 deaths across all seeds; levels last 6.8-12.8s
- Notes: completable is now proven but challenge is NOT - hazards are avoidable without any skill and the delivery verb is optional

### 72. Regression check - setSingle rewrite touched every editor single (grid cursor gizmos)

- Date: 2026-08-08
- Category: bug
- Status: DONE
- Evidence: edit mode restores with grid+cursor visible; painting works (tile 0->1 at 136
- Notes: 6); paint path and 3D cursor agree exactly at 4 sample points across the canvas

### 73. ROUTE GATE - the goal now stays shut until the round is delivered

- Date: 2026-08-08
- Category: design
- Status: DONE
- Evidence: A/B: bot ignoring mailboxes wins 0/6; same bot running the route wins 6/6 in 6.8-12.8s. Gate unit-checked at 0/quota (refused) quota-1 (refused) quota (wins)
- Notes: the game is called Paper Route and you could previously win while ignoring every mailbox

### 74. Route quota capped so it can never lock a player out

- Date: 2026-08-08
- Category: design
- Status: DONE
- Evidence: quota = min(3
- Notes: total

### 75. Route progress is visible in the HUD and the depot turns you away out loud

- Date: 2026-08-08
- Category: ui
- Status: DONE
- Evidence: hRoute counter goes amber->green at quota; goal prints N MORE DELIVERIES and plays a reject sfx; ROUTE COMPLETE popText on hitting quota
- Notes: a gate the player cannot see is a bad gate

### 76. Drive tick() directly instead of rAF for harness runs

- Date: 2026-08-08
- Category: process
- Status: DONE
- Evidence: 12 full playthroughs in 18.5s wall clock; immune to the occluded-window rAF throttle that had dropped the tab to 1fps
- Notes: tick() IS the frame so the simulation is identical - this should be the default harness from now on

### 77. HALF THE LEVELS GENERATED WITH NO HAZARDS AT ALL

- Date: 2026-08-08
- Category: content
- Status: DONE
- Evidence: census found 3 of 6 seeds with zero enemies zero spikes zero lava; ensureOpposition guarantees 4 walkers spread along the route; now 0 of 8 levels empty and player-near-enemy went 0-2.4pct -> 1.7-11.1pct of frames
- Notes: this - not weak tuning - was why a one-key bot never died

### 78. Opposition must not recreate unwinnable levels

- Date: 2026-08-08
- Category: content
- Status: DONE
- Evidence: 8/8 still won after adding enemies; enemies only (never spikes/lava) because terrain can wall off a route while a walker cannot; start and depot approach left clear
- Notes: same guarantee-as-post-pass shape as ensureMailRoute and ensureGroundFloor

### 79. FRAME-KILLER STILL LIVE - world batches exceeded the uniform limit on busy levels

- Date: 2026-08-08
- Category: bug
- Status: DONE
- Evidence: my own gpuLimitAudit caught it: standard level allocated 1050 instances (67200 bytes) and epic 1747 (111808) vs the 65536 cap; audit.ok was false. Sizing to need was not enough - the ceiling is per-mesh
- Notes: the first fix removed only the dead 20000 batch; real levels still froze on the last good frame

### 80. Chunk per-type instancing at 1000 so no mesh can ever exceed the binding limit

- Date: 2026-08-08
- Category: bug
- Status: DONE
- Evidence: voxMesh keyed by id or id#chunk; audit ok at BOTH standard and epic; epic now places 1594-1629 tiles across chunks instead of dropping them
- Notes: biggest cap now 1024 = exactly 65536 bytes which is allowed

### 81. EPIC level size was unplayable and now works

- Date: 2026-08-08
- Category: content
- Status: DONE
- Evidence: epic (256 wide) previously blew the uniform limit and froze the screen; now 5/6 seeds won with median 17.1s vs 10.3s at standard - up to 9 deliveries and 11 enemies per level
- Notes: CORRECTION: epic is 6/6 - seed 40031 was my bot's jump phase not the level

### 82. CORRECTION - the epic 1-in-6 stall was the bot again not the generator

- Date: 2026-08-08
- Category: process
- Status: DONE
- Evidence: same seed 40031 same build: gap-probe lookAhead 0.0 and 1.0 die 8-9 times at a 2-tile lava pit while 0.5 and 1.5 win it in 18.9s with 0 deaths. Epic re-measured at 6/6 median 17.8s
- Notes: sixth instrument error this session - the probe phase decided the verdict not the game

### 83. Both level sizes verified completable end to end

- Date: 2026-08-08
- Category: content
- Status: DONE
- Evidence: standard 8/8 median 10.2s and epic 6/6 median 17.8s both with 0 deaths and the route gate enforced
- Notes: epic roughly doubles level length and carries more content (up to 9 deliveries 11 enemies)

### 84. Check the route gate cannot soft-lock a level after a death

- Date: 2026-08-08
- Category: bug
- Status: DONE
- Evidence: killed the player mid-route with 3 of 4 boxes served: respawn restores playGrid (4 mailboxes back) and resets deliveries to 0 so quota 2 stays reachable; verdict ok
- Notes: a gate plus consumed mailboxes would have recreated the unwinnable-level class - this was the first thing to check after shipping it

### 85. Death costs the whole route not just position

- Date: 2026-08-08
- Category: design
- Status: DONE
- Evidence: respawn is at a checkpoint (x4181 not the start) but deliveries and score both reset to 0 while the level restores
- Notes: coherent with score resetting but harsh on a 17s epic run - wants Micah's opinion on whether the route should persist past a death

### 86. The route now survives a death

- Date: 2026-08-08
- Category: design
- Status: DONE
- Evidence: spawnWorld runs on BOTH a fresh level and a respawn so zeroing there wiped the round; routeKeep carries deliveries across a respawn only. Verified 2->2 exact across a death with no input
- Notes: tries incremented

### 87. Regression battery after the route-survives-death change

- Date: 2026-08-08
- Category: bug
- Status: DONE
- Evidence: standard 8/8 median 10.1s
- Notes: epic 6/6 median 17.6s

### 88. FRAMING - camera showed ~34 tiles across and the rider was 3pct of frame height

- Date: 2026-08-08
- Category: art
- Status: DONE
- Evidence: PLAY_ZOOM 1.7 -> 20.4 tiles across and the rider is 51px / 4.9pct of frame and legible as a rider on a wheel; mailboxes and pickups now read too
- Notes: I judged this from an actual screenshot instead of deferring it - world pixels were mapped 1:1 to screen pixels with no zoom at all

### 89. Zoom must not touch the editor

- Date: 2026-08-08
- Category: bug
- Status: DONE
- Evidence: play-only zoom; edit returns to exactly 1:1 (editIs1to1 true) and the paint path still agrees with the 3D cursor at 3 sample points
- Notes: screenToTile and the offsetX paint path both assume 1:1 so the editor was left alone by construction

### 90. matchTo2D silently rewrote a 1:1 frustum on every resize

- Date: 2026-08-08
- Category: bug
- Status: DONE
- Evidence: it now invalidates _lastZoom so the next frame re-applies the play zoom instead of running unzoomed after a resize or toolbar reflow
- Notes: would have shown up as the zoom randomly reverting

### 91. Regression battery after the framing change

- Date: 2026-08-08
- Category: bug
- Status: DONE
- Evidence: standard 8/8 median 10.2s unchanged and the route gate still refuses a non-delivering bot 0/3
- Notes: 

### 92. Editor not working - portal placed above a ramp did not appear

- Date: 2026-08-08
- Category: bug
- Status: NOT A BUG
- Evidence: traced the whole chain: PORTAL selects (id 8) placement writes GOAL to the grid it renders in the editor and survives into play (26 in grid = 26 in playGrid = 26 rendered); palette auto-scrolls the swatch into view. Micah confirmed it was a missing hard refresh
- Notes: a tab left open keeps running the build it loaded

### 93. STALE-BUILD NOTICE so an open tab stops silently running an old build

- Date: 2026-08-08
- Category: ui
- Status: DONE
- Evidence: every build stamps window.__BUILD; the page re-fetches itself every 45s with cache no-store and shows a click-to-reload banner when the server is newer. Verified end to end - banner appeared on the real interval not a hand-run copy
- Notes: the most persistent bug in this project per its own service-worker comment and it cost a false editor bug report today

### 94. Update banner covered the palette

- Date: 2026-08-08
- Category: ui
- Status: DONE
- Evidence: anchored bottom:18px it sat on top of the lava/water/gear swatches; moved to top:188px under the toolbar
- Notes: caught by looking at the screenshot rather than trusting bannerPresent:true


