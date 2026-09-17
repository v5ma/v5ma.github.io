# Character-centered world portal

Build: ranger-portal-20260917.1. Tidegate entry build: tidegate-20260917.1. Baseline master: 3550a6cbb4b7399f218fb96c0f80b560347194e0; baseline Tidegate release: dino-tidegate-20260915.2 at 62823be5d810ecf2d78fa73f794e86a08e1bfd3c. This supersedes the map-sized crop-volume interpretation in TIDEGATE-CROSSING.md, not its gameplay, save or level-design contracts.

The user wants the ordinary third-person game seen through a box: the controlled character stays at its center, the live world moves past, scenery has depth beyond the side and rear surfaces, and nothing from the game leaks outside the box's projected silhouette. Any enclosure panel between the observer and the character must become transparent. The previous width, proportions, placement and manual placement control remain. The original request is retained in design/DIORAMA-PORTAL-REQUEST-20260917.md.

## Implemented presentation

The same live world is rendered, not a copy, map, video texture, tiled viewport or second simulation. Tidegate and Classic Reserve use the shared portal. Classic adopts its original scene objects into an identity render group; newly added effects are included. The actor's full position, including height and vehicles, is mapped to the display center. Box width and placement are unchanged. Its gameplay framing is now 48 game units across rather than shrinking the entire 136-unit district into the frame.

A per-fragment ray/box aperture supplies stencil-style masking without requiring an XR stencil attachment. It derives the ray from the camera used for that draw, including each ArrayCamera eye. A ray that misses the display is discarded. Geometry before the entry surface is discarded. Geometry beyond the exit surface is deliberately retained: the sides and rear are not world clipping planes. The original sky color also stays inside the aperture. This does not stream assets from a server or extend the authored map; it continuously presents the existing world as the character moves.

The enclosure has a thin outline and lightly tinted far-side panels. Per-eye camera-facing panels become fully transparent. Existing top/front opening preferences and their never-both-closed sanitization remain; automatic transparency takes precedence. Consequently, two opening presets can intentionally look identical from an angle where the differing panel is between the observer and the world. An old screenshot test requiring three distinct image hashes is superseded, not evidence of a regression.

Only rendering receives the display transform. Physics positions, collisions, quests, wildlife, tool ranges, inventory, saves and rewards stay in the normal world. The transform and material mask gate are restored in finally, even if rendering throws. Existing custom material hooks, instancing and sprites pass through the same shader wrapper. The real scene is rendered through the actual camera, not a monoscopic render target. The XR camera rig itself is never scaled. Desktop-only bloom and pool scene capture remain disabled during immersive rendering.

Tracked aiming first intersects the portal, then maps that ray into the original world. The indicated target may guide aim, but the shot still starts at the ranger and obeys its range and real-world collision. Repairs still need ordinary proximity. Controller, hand-panel and Xbox actions are unchanged. First-person VR remains available; Classic preserves first-person as its initial XR default unless a shared presentation preference was already saved.

## Evidence gates

Model tests cover center-follow across heights/positions/rotations, beyond-wall visibility, out-of-aperture rejection, distinct left/right rays, parallel and inside-box cases, automatic wall transparency, pointer mapping, custom-hook preservation and render-failure restoration. The original 173 tests are retained. Model results alone do not establish rendered correctness.

portal-render-browser.py uses production shaders in explicitly labeled oversized-geometry fixtures, rendered through two ArrayCamera eyes. It compares image pixels with CPU ray classification, checks no leaked or missing pixels away from boundaries, rejects foreground geometry and checks automatic shell transparency. This is a graphics fixture, not fabricated mission completion.

portal-game-browser.py runs both actual games, uses synthetic Xbox to start and move the real ranger, checks exact centering with a stationary box, captures multiple viewpoints and tests first-person/portal/desktop transitions. It mocks sessions and inspection eye poses only; no actor/objective state is assigned. The existing Tidegate, service-loop, four Classic and tracked/hand-ray browser suites remain required. Separate public byte matching and live-route tests precede the distinct dino-portal-20260917.1 prerelease.

Local Chromium returned ERR_BLOCKED_BY_ADMINISTRATOR for localhost navigation. Native rendered tests therefore run in the established GitHub Actions environment; no local browser acceptance is claimed. Actual headset stereo compositing, Quest 3 controller/hand tracking, physical Xbox, passthrough, comfort, frame time and human visual acceptance remain open. No surface detection, persistent anchors, physical room occlusion or infinite world is claimed.

## Continuation

This correction is the next XR-DIO-01c engineering subtask; it does not close XR-DIO-02 physical acceptance or LEVEL-PM-03 human place mastery. Preserve dino-atlas.presentation.v1, dino-atlas.tidegate.v1, tidegate-crossing-v1 and all Classic keys. Do not reset or migrate saves or overwrite sibling-game work. Older release tags retain their historical source. The next design question remains whether the observation route earns its detour, now also judged from a character-centered portal instead of a fixed whole-map view.

Technical references: Three.js Material, WebGLRenderer and WebXRManager documentation, inspected against the bundled r177 renderer. No vendor code or assets are replaced. Source URLs: https://threejs.org/docs/pages/Material.html ; https://threejs.org/docs/pages/WebGLRenderer.html ; https://threejs.org/docs/pages/WebXRManager.html .
