# Prism Current / Currentworks Water + Fire

The current application is 0.11.2, with Water 0.1.0 and Fire 0.1.3. The normal index.html entry remains River Prism with its in-scene Rotunda. Duck Armada and Mothership Channel are the existing complete battles, not replaced by a graphics demonstration. The source and public jobs for runtime 783236d7bb4e229d8f9c3461f93070f519f90450 both passed; the durable receipt is modules/environment/PUBLIC-PASS2.json.

The river has geometric waves, layered surface detail, authored-depth color, foam, boat wakes and destruction splashes. Fire adds actual-event bursts with a hot core, turbulent orange flame, cooling smoke, embers and bounded warm lighting. Flames are triggered by destroyed catapults, boats, aircraft, bombs and bosses. They do not create new damage rules or weapons.

Both modules are reusable without copying the whole game. Begin at modules/environment/README.md, FIRE.md and CHECKPOINT.md. Each accepts the existing Three.js namespace and host simulation clock, with explicit update/reset/dispose ownership. Fire preparation is awaited before soundtrack playback inside the existing cancellable loading path. Water and fire use the same pausable time; quiet mode and saved AR opacity remain supported. Trees are the next separately planned module and are not yet implemented.

## Play and preservation

Chapter controls offer supported AR, VR and screen play directly. B/Y pauses or resumes in XR. The Rotunda rises when summoned, stows during combat and stays world-anchored when placed. Point and trigger, hand pinch, or thumbstick/A-X selects controls. Placement can be adjusted without moving the camera; a paused XR thumbstick click resets it. Score, hull and combo use a compact controller or optional floor display.

In screen play, use the rendered controls, keyboard navigation or an Xbox-style controller. P or Menu pauses. F2 and Controls retain semantic HTML controls as an alternative. Combat bindings, the original Undertow soundtrack and saved score formats are preserved. Quiet and performance settings do not bypass damage or boss-completion requirements.

Exiting XR ends the actual immersive session and leaves the current battle paused in memory. Re-enter the same AR/VR mode and explicitly resume to continue. This does not persist an unfinished encounter after closing or reloading the browser. Ordinary room movement no longer triggers the old arbitrary position-box pause; genuine tracking and visibility loss still pause.

rhythm.html retains the previous songs, lessons and Practice Lab. Floodgate Recovery remains at water-mission/index.html. No private hub source, portals or sibling-game changes are included. Read AGENTS.md before editing: reconcile fresh master, write directly without force, and preserve concurrent work. No new PR, staging branch or transfer workflow is needed.

## Evidence and unfinished work

At the accepted runtime, 289 Node tests, 64 fire object/lifecycle observations and 37 water object checks passed. Each source/public renderer job passed 129 checks, including both complete Arcade battles, first-destruction fire preparation, water, delayed-audio interruption recovery and the AR/VR Rotunda journey. The public manifest matched 104 files. That is automated evidence with emulated devices and reduced gameplay drawing buffers, not physical Quest/Xbox/touch approval or measured sustained normal-resolution performance.

The active production board is AAA_CHECKLIST.md. FIRE-REFINEMENT.md and FIRE-PASS2-RECOVERY.md retain earlier revealing failures. A successful current run does not erase them or approve every unrelated historical workflow. The earlier integration audit is historical, not a claim that the current live site still serves its older build. The complete supplied multi-game brief is not copied into the public repository.

Color-changing blades, either-blade base rewards, color-match bonuses, redesigned missile counterplay and gameplay explosion-radius feedback remain unfinished. Cosmetic flames are not a substitute for those rules. Further visual polish, real-device performance and owner judgment against the supplied reference videos remain open. Water reflection and fire/surface compositing are approximations, not full fluid simulation or commercial-demo parity.

Prism's own package.json preserves CommonJS scope for the existing Node-testable classic/UMD scripts. water.mjs and fire.mjs are explicit ES-module facades. Do not change the unrelated root Cloudflare package to repair game-local tests. Earlier design and licensing/history notes remain in the archived README versions and vendor notices.
