# Leonardo's Guild v0.2 — joystick and visual update

This update is served in the existing `/leonardos-guild/` folder. It preserves the first commission, the homepage card, world collision layout, fictional florin economy, and local save format. It is still a single-player browser game, not a shared MMO server.

## Touch controls

On a touch device the left thumb joystick appears automatically. Its distance from center controls movement strength, not just a digital key. Up moves forward, down brakes/reverses, and sideways steers; on foot it rotates the character. Releasing the stick coasts the bicycle. Use the separate Brake button to stop and Boost to pedal harder.

A second finger can drag the world to orbit/tilt the camera. The action buttons remain independent, so steering and a delivery throw can occur together. Ride/Walk mounts or dismounts when stopped; Hop jumps. Inspect/Use scans and operates nearby mechanisms while held, and opens the merchant when stopped nearby. On foot, Staff and Brace become available. The controls release on cancelled touches, lost capture, pause, mode changes, rotation/resize, or backgrounding.

Settings lets keyboard users show the joystick too, changes camera distance, and switches graphics without restarting the mission. A Center Camera button resets the view. The mission panel collapses on mobile to leave the street visible. Landscape is recommended for more space, with a portrait layout also available.

## Actual scene changes

The spherical tree-canopy models are replaced by seeded branches and instanced alpha-cutout leaf sprays. The town adds terrain-following ambient shading, rider contact shading, warm directional light, tighter sun-shadow coverage, planters, flowers, banners and stone edging. Plaster gains surface variation. The apprentice and townspeople have clearer proportions, tunics, boots, faces and satchels. All textures and geometry are authored locally; no commercial-game assets or generated concept screenshots are shipped.

Quality provides sharper dynamic shadows; Balanced uses a smaller render budget; Battery disables dynamic sun shadows but retains approximate contact shading. These are user-selected budgets, not certified frame-rate promises. Geometry decoration does not change mission contacts or terrain collisions.

## Persistence and boundaries

Existing `svgn.leonardos-guild.v1` saves retain their JSON version 2. Only graphics/control preferences use the new `svgn.leonardos-guild.preferences.v1` key. No prior-game data, Supabase tables, accounts, payments, or multiplayer infrastructure are touched.

## Tests

`npm test` includes original deterministic mission/combat/save tests plus radial deadzone, ownership, cancellation, fractional speed and braking fixtures. The full keyboard-driven commission remains in `tests/browser.py`. `tests/touch-browser.py` uses native Chromium touch input events and the real HTTP WebGL renderer to test simultaneous pointers, menus, safe input resets, resizing, graphics switches and preference reload. A copied read-only inspector is used to observe results, never to reposition the rider or award progress.

A successful software-rendered Chromium run does not certify Safari, gamepads or physical-device frame rates. Manual device testing, deeper encounter animation and more varied town layouts remain future work.
