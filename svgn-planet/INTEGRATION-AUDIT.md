# Neighborhood Missions integration reconciliation

This audit is about svgn-planet only. It began at master fda53bedb376d54c3bad3bdacf5a15aba85dba61, whose Neighborhood files were unchanged from the already-merged b38d54f Mission Focus build. PR222 and PR223 did not lose their code. There were no unresolved conflict markers in the current source.

## What was already integrated

The audit compared 27 exact branch heads: 26 neighborhood-prefixed heads and PR65's older Signal City proposal. Eighteen are ancestors of master. Nine diverge, but divergence alone does not mean nine missing upgrades. Three carry only obsolete verification machinery. Two Living Portal branches and Coastal Pulse were recovered/reworked into current files under different commits. Their older app, launch, renderer and installer versions must not be merged over the current implementation.

Keep the original city and Lantern Ward together, all eight native full-world/portal first/third-person AR/VR views, Working Quay, resident stories, Signal Hijack, the five-case campaign, and the current floor/controller console. Preserve all original archive hashes, stable IDs, saved ledgers and user defaults.

## What was reconciled now

PR208's Field Desk overlaps the newer spatial console. The duplicate pedestal/renderer is not reinstated. Its useful missing physical left/right vehicle-trigger choice is adapted into the existing Spatial UI settings. Existing saved preferences continue to mean primary-hand trigger; they are not silently remapped. An explicit left or right choice assigns the opposite trigger to braking, while off-hand grip remains usable. On-foot, Courier and Xbox mappings stay as before. Unknown/future preferences remain protected, and the old Field Desk storage namespace is not erased.

Fourteen old writer or redundant workflow wrappers are removed from current master. Three existing read-only workflows retain the 19 source journeys, eight native-console modes, and 21 public journeys including the original archived-game browser path. No test file or original acceptance assertion is discarded. Full suite coverage is recorded in production/workflow-coverage.json. Public checks now include the actual entry and revisioned module requests, correct JavaScript MIME types, and a final complete stable pass.

## What this game still did not receive

The old Signal City proposal in PR65 contains enterable cars, a scout drone, a device-interaction investigation and the Waterfront File. These are not present merely because Night Watch exists. Its old app/model/world/scene replacements conflict with the current city and frozen original files. The decision is to rewrite those features through current adapters under DESIGN-02, preserving its svgn.signal-city.v1 contract. They are not claimed restored here.

The old Tideglass branch contains an indoor pool with depth-based swimming rings, submerged keepsakes, underwater valves and dedicated pool rendering. Current outdoor Tidewater excursions do not replace those exact missions. It likewise requires a current-world/save adapter rewrite under WATER-01, not a wholesale old app/controller/model merge. Its source remains recoverable; this audit does not claim the pool is shipped.

PR43 belongs to the separate svgn-city prototype, not this application. It and every sibling-game file remain outside this repair.

## Evidence and release status

The reconciliation passed 387 local model/input/presentation tests, including five calls through the real unified XR adapter with a fake renderer and synthetic devices. All 102 legacy hashes match. This does not certify rendered or physical Quest behavior. Local browser navigation was blocked by the execution environment; the retained console journey now additionally drives and brakes with both physical trigger selections before restoring the original profile.

The historical Mission Focus source run 35564523386 passed 371 models and 14 rendered checks, but its separate public job failed and the live browser step was skipped. Do not call that failed public run a deployment. Check the current public result separately from commits and source tests. The exact comparison matrix and historical evidence IDs are in production/integration-audit-20260921.json.

Future work is direct on master after reading its newest head. No new PRs, staging branches or transfer writers are required. The root svgn-planet/AGENTS.md supersedes older procedural handoffs. All unported features and physical hardware gates remain explicit. Archive release receipts outside the game runtime directory.
