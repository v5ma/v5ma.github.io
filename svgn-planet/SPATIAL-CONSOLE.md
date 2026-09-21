# Neighborhood Missions 0.16.1 / Spatial Console

This upgrade stays inside Neighborhood Missions. It does not include any private hub implementation, cross-site travel, walking/sphere portals or A-Frame wrapper. The existing native renderer and eight game views remain. Desktop accessible HTML controls and historical recovery entries remain; this is the unified main game's spatial UI, not a claim that every desktop control is converted to canvas.

## Controls and presentation

Open Menu with the off-hand upper face button: Y in the default right-handed Action profile, B with left-handed primary controls. A deliberate raised pinch also opens Menu. Looking down reveals a floor disc; point and select to summon it. The console rises from a flat floor position and stays fixed while you look or lean. Changing pages does not reposition it. Resume stows it. Place console here deliberately relocates it.

Spatial UI / floor and controller is available in the main-city menu, district menu and AR/VR options. Adjust height, distance and scale, select floor or free-controller mounting, choose raised-hand/floor/off objective HUD, or disable rise animation. The system reduced-motion preference also disables animation. Local-floor tracking is used when available; fallback floor height is explicitly estimated, not room scanned or persistently anchored.

Controller mounting requires two tracked sources. With one hand/controller or a missing host pose, the menu falls back to the floor instead of requiring a user to point at their own wrist. The saved mount preference is retained. The compact objective card follows the raised free controller and disappears when lowered. It reads the current objective, distance, ride/tool and existing map, with health for an active Watch case. Neither UI component is a child of the headset camera.

Buttons have raised scene geometry, hover/press feedback and a contact dot. Their actual faces receive controller-ray and hand-pinch selection. Translucent world objects must draw before these UI surfaces; simply disabling depth tests did not prevent water/effects drawing over an opaque-queue menu. The corrected queue ordering is covered by a regression and actual frame captures.

The Action profile offers explicit primary-trigger vehicle speed. Hold to accelerate; release to stop; off-hand grip brakes. On foot the existing aim/strike/tool mapping remains. Disable the option for prior stick-click driving. Xbox and Courier profile mappings are unchanged. Preferences use only svgn.neighborhood-spatial-console.v1 and cannot rewrite any mission-save or reward ledger.

## Verification and recovery

The combined local model/input suite passed 335 tests, including 20 presentation regressions. Real Three mathematics/meshes with a fake canvas are not rendered or physical-device evidence. console-browser.py runs each of eight modes at the actual main entry with normal input paths, low graphics and no mission-state injection. Each successful checkpoint is written immediately to its report. Its screenshots read the actual WebGL framebuffer after rendering, not the HTML mirror.

Historical source runs 35551197282, 35551588021 and 35552082042 retain their exact source and outcomes. The first attempt stalled in Playwright's HTML-mirror screenshot; its retained image exposed the obsolete DOM dialog. The next attempt verified eight milestones in diorama AR but was superseded before its tail completed. Its actual framebuffer also exposed transparent scenery painting over menus; this caused the queue-order repair. None of those partial results is relabelled as a full pass. Final source and public results belong in ../release-receipts/neighborhood-missions-spatial-console-0.16.1.json and PR 204.

The temporary source import/release writers have been removed. Continuing source and publication workflows are read-only. The public workflow retains the existing twelve live journeys and adds eight console journeys after the full file-hash check. Preserve current master and sibling work using a normal merge; never clear real storage or substitute fixtures that assign completion.

Physical Quest/Touch Plus/hand tracking, reach, seated comfort, text legibility and sustained performance remain unverified. Earlier campaign acceptance limitations remain separate. Next design work is owner review of console reach and current-goal comprehension in both neighborhoods, followed by clearer mission entrances/returns rather than unrelated map expansion.
