# Prism Current / Currentworks Water + Fire + Trees

The current application is 0.11.2 with Water 0.1.0, Fire 0.1.3 and Trees 0.1.3. The ordinary index.html entry remains River Prism and its in-scene Rotunda. Duck Armada and Mothership Channel are the existing complete battles, not replaced by a graphics demonstration. The tree-pass public job for runtime 18d83fa4b5aa2f4115d6c602af2bf9a51c06896a passed all five native suites and matched 113 files. modules/environment/PUBLIC-PASS3.json records that result and the separate source failures; it does not claim physical-device approval.

The river has geometric waves, surface detail, authored-depth color, foam, boat wakes and destruction splashes. Fire adds actual-event bursts, hot cores, turbulent orange flame, cooling smoke, embers and bounded warm lighting. Destroyed catapults, boats, aircraft, bombs and bosses trigger those effects without creating new damage rules or weapons.

Trees add eight seeded palms, alders and willows to screen/VR Duck Armada. They stay outside the approach corridor and are hidden in AR and Mothership. Three prebuilt detail levels, shared root-fixed wind and loading-time preparation preserve the existing camera and combat. They are stylized foliage, not photorealistic assets or collision objects.

All three modules are reusable without copying the game. Start at modules/environment/README.md, FIRE.md, TREES.md and CHECKPOINT.md. Each accepts the existing Three.js namespace and host simulation clock with explicit reset/dispose ownership. Fire and trees prepare their graphics inside the existing cancellable loading path before soundtrack playback. Pausing freezes their animation; quiet mode and saved AR water opacity remain supported.

## Play and preservation

Chapter controls offer supported AR, VR and screen play directly. B/Y pauses or resumes in XR. The Rotunda rises when summoned, stows during combat and stays world-anchored when placed. Point and trigger, hand pinch, or thumbstick/A-X selects controls. Placement can be changed without moving the camera. A paused XR thumbstick click recovers it. Score, hull and combo use a compact controller display or an optional floor display, not a head-mounted dashboard.

Screen play retains rendered buttons, keyboard and standard-controller navigation. P or Menu pauses. F2 and Accessible text controls provide the semantic HTML alternative. Ordinary movement does not trigger the former arbitrary small positional pause; genuine tracking and visibility interruptions still pause.

Exit XR ends the actual session and leaves the current encounter paused in page memory. Re-enter its matching AR/VR mode and explicitly resume. Unfinished encounters do not persist across closing or reloading the page. Trees do not alter this lifecycle.

Classic rhythm at rhythm.html preserves the five tracks, lessons and Practice Lab; Floodgate Recovery remains at water-mission/index.html. Score formats, soundtrack, controls and saved progress are unchanged. No private hub implementation, portal or sibling-game modification is included.

## Evidence, unfinished work and continuation

AAA_CHECKLIST.md separates implemented features, exact automated builds and open physical/creative acceptance. QA.md and modules/environment/PUBLIC-PASS3.json hold the current evidence; earlier receipts and failure traces remain intact. The inspected public job passed 151 rendering/input checks including both Arcade chapters. Separate source tests still exposed rendering/input failures, which must not be concealed behind the public result. Reduced software-rendered tests and full-resolution screenshots are not sustained Quest/Xbox/touch benchmarks.

The next pass is combined visual coherence and reliability, not rebuilding the three existing modules. Fuller organic crowns, richer bark, better shoreline grounding, less regular flame turbulence and gentler detail transitions remain polish opportunities. Preserve target visibility and the real AR room. The reference demos remain visual goals, not a claim of equivalent fidelity or performance.

Color-changing blades, either-blade base rewards, color-match bonuses, redesigned missile counterplay and gameplay explosion-radius feedback remain unfinished. Decorative trees, fire and water do not substitute for those mechanics. No new soundtrack, full fluid solver or hand-only combat is claimed.

Prism's package.json preserves CommonJS scope for Node-testable classic/UMD scripts. water.mjs, fire.mjs and trees.mjs are explicit ES-module facades. Do not change the unrelated root Cloudflare package. Earlier dependency, licensing and design history remains in archived README versions and vendor notices.

Updates go directly to freshly reconciled master, without PRs or staging branches. Read AGENTS.md before writing. INTEGRATION-AUDIT.md is historical branch evidence, not a claim that the current site still serves the old build it inspected. Keep the combined user brief and private hub material outside the public repository.
