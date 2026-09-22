# Currentworks continuation / three module foundations saved

The user authorized five or more iterative passes and periodic durable checkpoints. This is a continuation plan, not background work scheduled after the conversation. Save usable changes directly to fresh master without PRs or staging branches. Keep API, test results and scope beside the implementation.

## Pass 1: Water 0.1.0 implemented and integrated

Independent wave geometry/normals, procedural surface data, authored-depth shading, Fresnel sky approximation, crest/shore/wake foam, splashes, query, pausable time and cleanup are in water.js/water.mjs. The River adapter reads actual boat positions and destruction events without changing actors or scores. PUBLIC-PASS1.json retains the original live evidence and failures. Preserve AR opacity and quiet/quality controls.

## Pass 2: Fire 0.1.3 implemented and integrated

fire.js/fire.mjs support bursts, jets and impact volumes, smoke, embers, quality limits, deduplication and explicit ownership. Prism uses actual destruction bursts; do not add an unrequested flamethrower or imply cosmetic radius is blast damage. FIRE.md and PUBLIC-PASS2.json explain loading-time preparation, per-eye behavior, output-policy compatibility and prior accepted evidence.

## Pass 3: Trees 0.1.3 implemented and integrated

trees.js/trees.mjs create seeded palm/alder/willow skeletons, three prebuilt detail levels, actual leaf geometry, shared root-fixed wind and cleanup. Eight authored trees stay outside the action corridor. Screen/VR Duck Armada shows them; AR and Mothership hide them. TREES.md describes reuse. PUBLIC-PASS3.json records 151 passing public checks, 113 matching files and the separate source reliability failures/retry.

EZ-Tree was researched, including its license, but no code or asset dependency was copied. Keep the small deliberate set and existing sightlines; do not turn the task into a large forest editor or another side demo.

## Pass 4: next coherence and reliability work

Reproduce the remaining source frame/input failures with settled target geometry, actual input-delivery history and draw timing. Separate a driver/test scheduling issue from a production defect before changing code. Preserve first-slice requirements, the 0.35-second stall safeguard and every scoring/health rule. A passing public run does not erase a source failure or the owner's physical feedback.

Then refine water, fire, smoke, tree colors and scene lighting together from owner playtests. Improve fuller but readable tree crowns, bark, shoreline transitions, wake appearance, irregular flame shapes and smoke breakup. Preserve the stationary XR camera, transparent AR and stable UI. Evaluate any larger mesh, weather, real reflections or heat-haze pass against measured cost before enabling it.

## Pass 5: measured polish

Repeat both battles and the full screen/AR/VR Rotunda journey: sound, placement, opacity, pause, exit/re-entry, input recovery and saves. Check allocation limits and disposal. Measure ordinary-resolution frame-time percentiles on named physical devices rather than only low-resolution software rendering. Ask whether effects improve the game instead of merely filling the view.

Extra passes may be necessary for actual defects, weak visuals or physical-device results. Five passes are not a guarantee. New gameplay scoring/color mechanics, full hand-only combat, new soundtracks, WebGPU and FFT fluid simulation remain distinct work unless explicitly selected. Never reset sibling games, expose private hub material or claim future checks have passed.
