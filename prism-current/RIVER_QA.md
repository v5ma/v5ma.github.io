# River Prism release gate

Exact-source results and publication receipts belong in PR #193. Local Node model and legacy tests are recorded separately from native WebGL acceptance. The River browser suite must exercise both real-time chapter clears, directional pointer cuts, aimed shots, shield intersections, retained score isolation, reload, gamepad actions, and simulated XR controls and pinch-menu input. It may not assign scores, actors, health, clocks, or completion to pass.

Original rhythm entry is preserved at rhythm.html. Legacy browser tests are redirected only to that preserved entry and its preserved rhythm-release.json; their gameplay criteria remain. The new main entry and both River chapters have a separate test. Recorded failures must remain visible. A hosted build or asset hash match is not proof of enjoyment.

First native run 35409512833 confirmed the new entry and an actual fruit slice, then exposed a genuine UI bug: a held canvas pointer capture survived keyboard pause, so the modal Resume click did not reach its button. The repair releases all recorded canvas/touch captures on input reset, is covered by new lifecycle fixtures, and adds an explicit native capture-release assertion. No scoring, clock or gameplay state is assigned to bypass the failure. The original trace remains in that workflow's artifact 10574500145.

The same repair aligns XR lasers with the visible blade-tip axis and removes destroyed actors from rendering/snapshots immediately, including a paused post-hit frame. These are actual runtime changes, not claims derived from a screenshot.

Local limitations: Chromium HTTP navigation returned ERR_BLOCKED_BY_ADMINISTRATOR and a blank-page WebGL2 probe returned false. Native production rendering therefore runs on GitHub Actions. The acceptance suite uses small software rendering buffers for input correctness, then captures a separate 1440x1000 view. Physical Quest, standard controller, touchscreen, human musical/level review, and ordinary-resolution performance remain open.
