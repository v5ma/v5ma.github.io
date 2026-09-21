# Resume Sky Cycle: Route Entry v0.27

Continue the existing game in `mario-maker-clone/svgn-paper-route/`. The last verified live release is v0.26.2. The next candidate is v0.27.0 / `sky-cycle-route-entry-2026.09.20`, on `sky-cycle/route-entry-0.27`, PR 213. Read `verification/route-entry-0.27.json` for the current state; this checkpoint does not claim a public v0.27 deployment.

## First action: inspect the existing exact-source run

Candidate `a2a3eeb06964c4e642a84cf826afe6c955efc99a` is under hosted qualification in run `35556641185`. The nine applicable jobs were queued with runner_id 0 and no executed steps, not failed and not passed. The scheduling cause is not established. Local browser navigation was blocked by administrator policy before the game loaded, so that attempt supplies no native evidence and was not bypassed.

Rules job: `106201424905`. Route-entry AR/VR: `106201424951` / `106201424904`. All-button AR/VR: `106201424879` / `106201424985`. Workspace AR/VR: `106201424943` / `106201424837`. Portal Network: `106201424693`. Waterwheel deliveries: `106201424898`.

Read those existing results and artifacts before changing runtime again. Later development-only commits preserve the tested source. Do not restart the candidate merely because the earlier session ended while jobs were queued. Once successful, verify report source IDs and ZIP digests, inspect actual route-card/stereo captures, normally merge the expected reviewed PR head preserving current master, compare 37 public runtime hashes, and repeat both public route-entry journeys. Do not force a stale Pages deployment or infer live success from a merge/version label.

## What was implemented and additionally refined

The eight original route cards now have semantic sibling AR, VR and Screen buttons. Screen means the supported 2D view; the original large card still offers Play in current view. Starting or changing the selected route waits for the requested immersive session to succeed. Denial and cancellation do not silently choose another presentation. The same immersive mode can use the existing session; a different mode requires explicit exit and fresh entry.

A WebGL reload carries only the intended stable route and mode in transient URL fields. The warning correctly says reloading ends the unfinished run but preserves saved progress. Active/testing/dirty Workshop state blocks replacement. Stable route identity and draft state are checked again after permission returns. Late approval after cancellation closes the acquired session without starting the unwanted route.

An independent `svgn.skycycle.launch.v1` key remembers only the last successful mode. It does not auto-launch XR or change saved gameplay mappings. Storage failure is described as session-only. The headset footer now reads the loaded release identity instead of retaining a hardcoded v0.26.2 label.

The additional accessibility pass removed an inconsistent aria-disabled state from unsupported-mode explanation controls. Those controls remain reachable and explicitly identify themselves as explanations; the entry policy still forbids unsupported session requests. Pending capability checks are labelled checking. An attempted CSS-only refinement was blocked before execution by a tool safety-status check and was not rerouted through another write tool; no unavailable-color styling change is claimed.

## Actual local evidence and limits

The local suite passed 359 game tests and 12 original soundtrack tests. Changed runtime/module/release blobs were reconstructed from the repository and checked against their Git blob identities; the baseline archive is the verified v0.26.2 merge. The hosted exact-source archive and native results are still required for release acceptance.

Four isolated card-update tests execute the actual function. The recovered old function fails three of four; the corrected function passes all four. The unaffected session-only case passes in both. The original function was restored after the local negative comparison.

Six additional isolated lifecycle checks are retained in `experiments/route-entry-lifecycle.mjs`: rejected entry, late cancelled approval, one successful commitment, a newly protected draft, reordered stable IDs and a repeated request while permission is pending. These fixtures do not load the native game, simulate a physical Quest or qualify an actual browser permission dialog.

The native test script covers route-card AR/VR entry, normal riding, same-mode travel, cancelled and confirmed mode change, Screen return, denied and delayed permission, preference-write failure, explicit pending-URL entry and unsupported-mode explanation. The old all-button, Workspace, portal and twelve-delivery regressions remain separate mandatory checks. Do not call them passed until their actual reports exist.

## Preserve these contracts

Keep all eight campaign IDs and indices, original route builders, movement/throw physics, awards, soundtrack ownership and every independent save namespace. Preserve medals, credits, ledgers, ghosts, exploration, Market Pilot, Keeper, audio/graphics settings, remaps and user-authored Workshop documents. Waterwheel remains a non-awarding preview, not a ninth campaign route or a promoted replacement. Never clear localStorage, consolidate saves or assign rider/win state to manufacture test acceptance.

Preserve the published v0.26.2 session-owned menu handler: A/X confirms, B/Y backs out one level, triggers select, grips move among controls, and either stick navigates/adjusts menus. Ordinary riding retains its separate jump, boost, paper, whip and interaction actions and saved mappings. Keep the fixed-world AR aperture, no persistent controller-riding slab, input-loss cleanup and real XR exit. This entry module is not another renderer, duplicate game or A-Frame migration.

No private SaaS hub source/assets/internal review document or attached multi-game brief belongs in this public repository. No cross-game walking or sphere portal is added here. The pedestal/rotunda remains a separate proposed spatial UI, not an implemented feature of these cards.

## Roadmap integration and next opportunity

The canonical `AAA-ROADMAP.md` remains intact. This slice addresses Milestones F/G entry clarity, accessible controls and safe session transitions without closing their broader gates. `ROUTE-ENTRY-0.27.md` records the bounded mapping; `ROUTE-ENTRY-PLAYTEST.md` specifies the remaining physical review, not completed observations.

After the entry release is actually verified, reconcile `sky-cycle/canal-choice-0.25` at `c946e556d1a4d970e4e406d09b7a1f547ae0e8a7` with the newer XR/input files. Preserve its unfinished movement-first work rather than overwrite it. Read the shared library's six references, especially `SKY-CYCLE-LEVEL-DESIGN.md`, and the local Waterwheel chapter workbook. Ground traps, low structures, useful high/low outcomes and connected launch/inverted-curve/receiver flow require real carried-state and ordinary-input testing; the menu checks do not resolve them.

Physical Quest/Xbox, real passthrough, actual WebGPU-to-WebGL handoff, headset readability, controller/hand ergonomics, complete XR chapters and long-session comfort/performance remain open. Previous complete handoff text is preserved unchanged in `archive/RESUME-HERE-before-route-entry-0.27.md`; resolve its references from this original directory and treat its current-version headings as historical.
