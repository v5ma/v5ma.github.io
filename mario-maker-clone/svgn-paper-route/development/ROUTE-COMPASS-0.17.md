# Route Compass, v0.17.0

Build: `sky-cycle-route-compass-2026.09.12`. Date: September 12, 2026.

Published through PR [121](https://github.com/v5ma/v5ma.github.io/pull/121), merge commit `5073c98730c4a0746db51ca423cd5f441d083d23`. All six owned public runtime files matched the merged source in the publication report uploaded September 12, 2026 at 18:26 UTC. The companion machine-readable receipt is `verification/route-compass-0.17.json`.

This is a discovery and navigation slice of the canonical `AAA-ROADMAP.md`, not a claim that the route-production milestone or AAA qualification is complete. It upgrades the existing side-scrolling Sky Cycle without replacing any course geometry, rendering mode, physics, music, controller remap, or existing save namespace.

## What changes

The Route Compass identifies the current district, the next district, actual checkpoint distances in road blocks, and nearby optional gold tracks using the loaded ground course metadata. Detailed, compact and off settings are available in the Route Journal. The compass never steers, snaps, teleports or changes the rider. Narrow layouts use compact guidance. District announcements update on transitions rather than every animation frame. The compass is positioned below the measured existing route/speed instruments, not over them.

The Route Journal lists district and optional-rail discoveries for Sunrise Borough, Waterwheel Boulevard and Copperleaf Gardens. It is available through the header, pause menu, Flight Deck and accepted-finish results. Standard controller navigation uses the existing Flight Deck modal owner: directional focus, A select, B back and bumper navigation. Every discovery card is focusable for reading and scrolling without a mouse. Opening from a paused parent does not resume it on close. Visibility loss or a disconnected controller must not cause an automatic resume.

District stamps require an observed simulation step in that district. Rail stamps require the rider to occupy a matching optional track. They remain provisional until the original engine accepts an authored-route finish. Rejected wins, duplicate win calls, editor copies and unobserved late-loaded runs cannot bank new stamps. Checkpoint retries retain provisional discoveries; a new route run resets them. Exploration is never a finish requirement.

## Save and rollback boundary

The new record key is `svgn.skycycle.exploration.v1`; guidance uses `svgn.skycycle.compass.v1`. No medals, career badges, Workshop drafts, account data or input remaps are migrated or cleared. Storage failures are reported. Roll back only the six owned runtime files, including the loader integration; retain the isolated exploration data for a compatible later release. Do not reset repository history or revert other games.

## Acceptance checklist

- [x] Seventeen pure exploration-rule tests pass, alongside twelve existing Flight Deck rule tests.
- [x] New runtime and core pass JavaScript syntax checks.
- [x] Thirteen isolated Compass fixture checks pass, including blocked storage, authored-route eligibility, finish settlement and mobile sizing.
- [x] Fifteen native Compass checks pass against the accepted runtime, with the renderer coverage described below.
- [x] Existing Flight Deck fixture and native 3D controller regression pass on the same accepted runtime commit.
- [x] Review gameplay, journal and narrow-viewport captures; fix content-box overflow and instrument overlap found in earlier candidates.
- [x] Confirm public SHA-256 matches for the six owned runtime files after master publication.
- [ ] Complete a full default-3D long-journal stress test within a defined device performance budget.
- [ ] Test a physical Xbox controller, full native course completions and optional-rail attainability.
- [ ] Complete a full save-migration/rollback rehearsal and device performance matrix.

## Exact evidence and limitations

Accepted runtime commit: `46596db423cb38b5e5e8db34ef51e93673241782`.

The [Compass acceptance run](https://github.com/v5ma/v5ma.github.io/actions/runs/34710312598) passed all 17 rules, 13 fixture checks and 15 native checks. Artifact `10303630169` includes the reports and reviewed captures. Native testing started and moved the real rider in the default 3D scene, verified observed discovery and HUD clearance, then used the game's normal `2D view` button for extended controller journal navigation on the CPU-only runner. No native win was forced. Fixture wins are explicitly not native completion evidence.

The [Flight Deck regression run](https://github.com/v5ma/v5ma.github.io/actions/runs/34710312576) passed its fixture and native 3D controller checks on that same commit. Existing controls, nested dialogs, pause and separate audio settings remained covered by that independent suite.

Commit `17432cb849668c7da28cb334280a70fb6887e50e` changed only the Compass test harness and publication workflow, not the accepted runtime. Its additional [full-3D held-stick test](https://github.com/v5ma/v5ma.github.io/actions/runs/34710705883) passed the first six native checks but exceeded the 90-second wait while traversing the long discovery list toward the guidance control. Its saved diagnostic shows the journal focused on an optional-track card, the game correctly paused, and no uncaught JavaScript exceptions. This is not a passing full-3D journal stress result. The default acceptance script is restored byte-for-byte to the previously passing renderer-explicit harness; the failed experiment remains available in Git history and its retained artifact `10303331912`. The performance gate stays open rather than being silently marked complete.

The [public verification run](https://github.com/v5ma/v5ma.github.io/actions/runs/34710822503) independently confirmed matching SHA-256 values for `route-compass.js`, `route-compass-core.mjs`, `route-compass.css`, `release-status.js`, `release.json` and `sw.js` against merge commit `5073c98730c4a0746db51ca423cd5f441d083d23`. Artifact `10303481151` contains `publication.json` with `verified: true`. Deployment identity does not replace gameplay acceptance.

Repository-wide CI is not claimed to be all green: the older interactive-site browser suite also failed its assertion that the homepage contains exactly three projects, before reaching game-specific browser checks. That unrelated homepage assertion was not modified in this release.

The local managed browser blocked localhost navigation with `ERR_BLOCKED_BY_ADMINISTRATOR`; browser policy was not bypassed. GitHub Actions supplied the browser evidence. No new geometry, new levels, physical-device certification or full-course completion is claimed in this release.

## Next scoped upgrade

Keep Milestone B open. Improve one beginner-to-intermediate chapter with world-space launch/braking cues and a reviewed optional reward branch. Record slower and faster real-input completions, verify every offered discovery and badge is attainable, and preserve existing deliveries through checkpoint retries. Audio lifecycle work remains Milestone D, rather than being silently claimed by this navigation patch.
