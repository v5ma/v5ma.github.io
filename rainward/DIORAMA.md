# Rainward v0.14.0 / Open Diorama

This release continues the unfinished Quest Fieldwork candidate with selectable first-person VR, third-person VR Diorama and third-person AR Diorama. The two miniature views render the actual active game in stereo through a bounded display. They are not a screenshot texture, a duplicate simulation, or a replacement demo. The release also implements the first graybox replacement in the Floodgate clinic-market seam; read LEVEL-DESIGN.md for its scope and the remaining chapter plans.

## Starting a view

Open Rainward in Meta Quest Browser over HTTPS. Choose XR VIEW on the title or pause screen, then choose the controller or hand-tracking entry button. The AR choice requests immersive-ar and requires a transparent compositor; unsupported or denied AR is reported rather than silently relabeled VR. Switching first-person VR and VR Diorama is possible within the existing VR session through the spatial view control. Moving between AR and VR requires exiting and explicitly entering the other session type.

The browser and headset retain control of their permissions and system buttons. Existing Quest-browser shelter saves are used. Saves from a different desktop browser do not automatically synchronize. No clearing of site storage is required.

## Shell and placement

Select TOP + FRONT OPEN, TOP OPEN / FRONT CLOSED, or FRONT OPEN / TOP CLOSED from the spatial field controls or pause pages. There is no closed/closed configuration. Invalid stored values recover to both open. The default display is 1.6 metres wide, 1.2 metres deep and 0.72 metres high in reference-space units. The miniature scale starts at 0.04, with bounded zoom from 0.02 to 0.08. Enlarging the content does not enlarge the physical box.

The display is initially placed ahead of the viewer and below eye height. Recenter places it again around the current survivor. Content-follow scrolls the world only after the character leaves an inner deadband; it can be disabled for a fixed inspection view. Walking or leaning around the box changes the spectator's view, not the controlled character's position. A closed front or top is a real visible shell face; viewing through the other opening can require a different physical viewpoint.

Placement is reference-space based, not automatic tabletop recognition or a persistent spatial anchor. No real-room depth mesh, environment occlusion, camera capture or surface hit-test is requested. Physical Quest 3 placement and comfort still need an actual-device review.

## Controllers, hands and gameplay

The first-person Quest controls in QUEST-FIELDWORK.md remain. In the diorama, left-stick or left-pinch-stick movement controls the survivor. The right ray selects an aim point in the miniature; the firearm still starts at the survivor and obeys original obstruction, range and ammunition rules. Right grip or the hand use action interacts near the survivor, not at an arbitrarily distant object under the viewer's hand. Menus, equipment, reload, posture, tools, crafting and confirmations use the existing native actions mirrored into the spatial interface.

View, shell, zoom, follow and recenter controls are available without removing the headset. Presentation changes require released input before further actions, and new confirmations retain Cancel focus. The separate svgn.rainward.v1.xr-view preference key stores only validated display choices. All seven chapter slots and version-4 checkpoint serialization remain; the new optional clinic gate is stored through the existing completed-task field.

## Rendering and test boundaries

The world is clipped against the display volume before a depth-preserving shell/hand/interface pass. The original custom water, contact and particle ShaderMaterials receive compatible clipping support while retaining their uniforms and motion. The display does not add an offscreen theatre render target. This is not a claim of a measured Quest frame rate or a finalized performance budget.

The browser suites use real Chromium/WebGL and the real game with an explicitly mocked XR session, poses, buttons and joints. The mock tests AR compositor selection but cannot show or validate a physical passthrough camera. The recut geometry suite uses an explicitly enemy-defeated dry-shelter fixture; existing living-enemy mission suites remain separate. Physical Quest 3 and Xbox testing, subjective art/audio, player enjoyment, comfort and full-campaign XR completion remain unapproved.

Publication requires exact-source regression, merge and live-byte verification. A candidate document is not a publication receipt; use the release PR and permanent evidence summary for delivered status.

## Native image-review correction

An open display face also cuts away the world presentation in that direction. Top-open views remove roofs and upper walls above the local survivor clearance; front-open views remove foreground facade sections that would otherwise hide the character. Visible targeting ignores those removed presentation fragments, but firearm traces still start at the survivor and obey the real level walls. These views deliberately provide different information from first-person play; they do not make barriers traversable. The vertical window adjusts to zoom and the focused diver so the survivor is not clipped at the top of a high-zoom display.

The first all-green candidate still had poor camera-matched images: roofs hid the miniature, and large new clinic signs occluded the over-shoulder view. The subsequent visual pass adds these cutaways, lowers the terrace signs, replaces the duplicate generic gate marker with its authored latch, and folds the raised shutter into its lintel. Passing model/browser checks alone was not treated as final art approval.
