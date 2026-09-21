# Neighborhood Missions 0.16.1 / Spatial Console

This upgrade stays inside Neighborhood Missions. No private hub source, cross-site travel, walking/sphere portals or A-Frame wrapper is included. The existing native WebXR renderer and eight views remain. Desktop HTML accessibility controls and historical recovery entries remain; this is the unified main game's spatial UI, not a claim that every desktop control has been converted to canvas.

## Use

Open the usual Menu: Y in the default right-handed Action profile, B with left-handed primary controls, or the deliberate raised-pinch gesture. A floor disc is discoverable when looking down; point and select to summon it. The console rises from a flat floor position, stays fixed as you look or lean, and stows on resume. Changing pages does not reposition it. Place console here deliberately relocates it.

Spatial UI / floor and controller is available from the main menu, district menu and AR/VR options. Adjust height, distance and scale; choose floor or free-controller mounting; select raised-hand, floor or off for the compact objective/map card; disable rise animation. System reduced-motion preference also disables the animation. Local-floor tracking is used when available; otherwise height is estimated and identified as such. This is not room scanning, real obstacle detection or persistent room anchoring.

Buttons have real raised scene geometry, a contact dot and hover/press feedback. Controller trigger and hand pinch use those hit surfaces. Neither menu nor HUD is attached to the headset camera. When the free controller is raised, the compact card shows the current objective, next-step distance, active ride/tool and existing mission map. Lower it to clear the view. The floor-card alternative is revealed by looking down. Mission selection changes the tracked target, not completion or credits.

Action profile offers explicit primary-trigger vehicle speed. Hold to accelerate and release to stop; off-hand grip brakes. On foot the existing aim/strike/tool mapping remains. Disable the preference for prior stick-click driving. Xbox and Courier profile mappings are retained. Presentation preferences use only svgn.neighborhood-spatial-console.v1, separate from every gameplay save and reward ledger.

## Evidence and limits

All 333 integrated model/input tests passed, including 18 new presentation tests. The new mesh tests use real Three mathematics with fake canvas, not physical devices. console-browser.py runs each of the eight modes on the main URL and checkpoints evidence after every step. It covers menu stability, transforms, stow, controller HUD, speed release, floor summon, mission selection, maps, cancel-first save restore, hands, tracking loss and exit.

The first browser attempt rendered the console and passed fixed-transform assertions, then timed out capturing the HTML mirror. Its failed artifacts are retained. The retry reads actual WebGL pixels after a rendered frame and suppresses the obsolete HTML-dialog mirror during XR. It does not assign gameplay state or remove interaction assertions. Actual final outcomes belong in the external release receipt; a test file alone is not a pass.

Physical Quest/Touch Plus/hand tracking, reach, comfort, sustained performance, human readability and mission comprehension remain unverified. Earlier incomplete campaign acceptance remains separate. Next work is owner review of console reach and current-goal clarity in both neighborhoods, followed by focused mission-source/entrance/return guidance rather than more unrelated systems.

A single tracked hand/controller falls back to the floor console even when controller mounting is preferred. The preference is retained for two-handed use. This adds a nineteenth presentation regression (334 total local model/input tests). The browser matrix explicitly tests this recovery and uses the normal low-graphics option for software WebGL; it is not a hardware-performance certification.
