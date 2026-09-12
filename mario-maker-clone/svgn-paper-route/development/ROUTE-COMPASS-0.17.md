# Route Compass, v0.17.0

Build: `sky-cycle-route-compass-2026.09.12`. Date: September 12, 2026.

This is a discovery and navigation slice of the canonical `AAA-ROADMAP.md`, not a claim that the route-production milestone or AAA qualification is complete. It upgrades the existing side-scrolling Sky Cycle without replacing any course geometry, rendering mode, physics, music, controller remap, or existing save namespace.

## What changes

The Route Compass identifies the current district, the next district, actual checkpoint distances in road blocks, and nearby optional gold tracks using the loaded ground course metadata. Detailed, compact and off settings are available in the Route Journal. The compass never steers, snaps, teleports or changes the rider. Narrow layouts use compact guidance. District announcements update on transitions rather than every animation frame.

The Route Journal lists district and optional-rail discoveries for Sunrise Borough, Waterwheel Boulevard and Copperleaf Gardens. It is available through the header, pause menu, Flight Deck and accepted-finish results. Standard controller navigation uses the existing Flight Deck modal owner: directional focus, A select, B back and bumper navigation. Opening from a paused parent does not resume it on close. Visibility loss or a disconnected controller must not cause an automatic resume.

District stamps require an observed simulation step in that district. Rail stamps require the rider to occupy a matching optional track. They remain provisional until the original engine accepts an authored-route finish. Rejected wins, duplicate win calls, editor copies and unobserved late-loaded runs cannot bank new stamps. Checkpoint retries retain provisional discoveries; a new route run resets them. Exploration is never a finish requirement.

## Save and rollback boundary

The new record key is `svgn.skycycle.exploration.v1`; guidance uses `svgn.skycycle.compass.v1`. No medals, career badges, Workshop drafts, account data or input remaps are migrated or cleared. Storage failures are reported. Roll back only the six owned runtime files and loader integration; retain the isolated exploration data for a compatible later release. Do not reset repository history or revert other games.

## Acceptance checklist

- [x] Seventeen pure exploration-rule tests pass in the local authoring environment.
- [x] New runtime and core pass JavaScript syntax checks.
- [x] Separate fixture and native-controller suites are committed; fixture wins are explicitly not native gameplay evidence.
- [ ] Attach passing exact-commit fixture and native browser reports and review their captures.
- [ ] Confirm public SHA-256 matches for the six owned runtime files after master publication.
- [ ] Test a physical Xbox controller, full native course completions and optional-rail attainability.
- [ ] Complete a full save-migration/rollback rehearsal and device performance matrix.

The local managed browser blocked localhost navigation with `ERR_BLOCKED_BY_ADMINISTRATOR`. Browser policy was not bypassed. GitHub Actions runs the browser suites against committed source and retains reports/screenshots as artifacts. A passing fixture does not establish full-course rideability. No new geometry or new levels are claimed in this release.

## Next scoped upgrade

Keep Milestone B open. Improve one beginner-to-intermediate chapter with world-space launch/braking cues and a reviewed optional reward branch. Record slower and faster real-input completions, verify every offered discovery and badge is attainable, and preserve existing deliveries through checkpoint retries. Audio lifecycle work remains Milestone D, rather than being silently claimed by this navigation patch.
