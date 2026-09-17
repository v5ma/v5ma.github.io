# World Portal: implementation and acceptance

Owner request: same third-person behind-character game, player centered in a fixed box, full world depth through side/rear faces, automatic transparency toward the viewer, no distracting head-linked planes, clearer next goal and first-person AR. Existing box dimensions and position are acceptable and preserved.

Baseline: master dd4a9d2a35ea667fd33f3ed2b597aeda15cb27e5, released Crosswind 0.13.0. Scoped comparison found no intervening Aether runtime edits. Dino Atlas's same-repository diorama-portal.js supplied the ray/box aperture principle. Aether's implementation uses per-draw inverse projection/view matrices and viewport rather than assuming an unscaled camera. No sibling source is changed.

Diagnosis: xr-session.mjs created two camera-parented planes for menu and status. The previous diorama crop pass also skipped ShaderMaterial, leaving custom effects outside its masking contract. Both mechanisms are corrected. No physical headset was available to attribute the reported rectangles conclusively to one cause.

Implementation: portal-aperture.mjs, revised diorama-view.mjs, room-fixed menu/status placement in xr-session.mjs, first-person ar-view.mjs, and read-only goal-guide.mjs. The aperture reconstructs each rasterized fragment in world space and checks its ray interval against the display box. It rejects a missed aperture and pre-entry geometry but retains arbitrarily deeper geometry up to the normal camera far plane. It does not clip at the far box face. The map's bearing line is explicitly not a traversable route. The existing objective system remains authoritative.

Preserved: version-1 saves and namespaces, saved presentation scale/height/opening preferences, rewards, IDs, Bellwether circuit and cover rules, physics, controller remaps, neutral re-arming and hand UI. No player or objective states are assigned to manufacture a gameplay test pass.

Tests: portal.test.mjs uses labeled model/render fixtures; portal-render.html checks actual framebuffer coverage for distant geometry, camera roll, side views, scaled eye viewports and custom/sprite shaders. portal-browser.py uses ordinary actions on the real application for centering, camera follow, goal map, head isolation, room-fixed UI, hands, AR entry/exit and save preservation. Existing model and relevant device regressions remain required. Local browser navigation was rejected as ERR_BLOCKED_BY_ADMINISTRATOR and is not counted as success.

Publication is a separate gate: compare served files to the selected source and run the application over public HTTPS. See ../release-receipts/aether-v0.14.0-20260917.json for final evidence; this document is not a success assertion. Physical Quest/Xbox, performance/comfort and unfamiliar-player clarity remain open.

Next: test whether the larger map goal and world beacon help a new player choose the right elevation without mistaking a bearing for a route. Review first-person AR and full-depth portal on actual Quest 3, including lateral views, crouching, head roll and menus. Keep arrival/rail sightlines as the next level-design opportunity; do not expand map area automatically.

Technical references: https://threejs.org/docs/pages/WebGLRenderer.html ; https://immersive-web.github.io/webxr/ . Bundled Three source is authoritative for the actual material callback and per-eye viewport behavior.

Pre-release review also found that starting desktop preview before XR could register hand/controller materials in the aperture. The named XR stage and explicitly tagged UI roots now exclude those subtrees even before it becomes the active view rig. A focused preview-to-XR material-ownership regression protects this boundary.

The portal application journey selects the supported Light profile through the real Settings menu while retaining full pixel density. It uses the spatial Exit action after a visibility-loss pause instead of asking Playwright to click a desktop header behind a modal. The isolated GPU fixture separately covers custom and billboard shaders; no input or gameplay assertion is removed.
