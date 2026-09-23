# Rainward future direction and running work log

Update this owner-requested record during implementation and after verification, not just at a chat ending. Read current master, AGENTS.md, DEVELOPMENT-HANDOFF.md, release.json, production-plan.json and the active feature record before editing. Actual source and receipts outrank earlier chat claims. The previous complete history is preserved byte-for-byte in evidence/tactical-throws-20260923/before-FUTURE-DIRECTION.md.

## Current implementation checkpoint

Tactical Throws is committed directly to master at 07035431374d96db4eeacf5c7047fc4686feae1f, build rainward-tactical-throws-20260923, version 0.16.4. Read TACTICAL-THROWS.md. Bottle and Survival smoke use one bounded collision-checked path for aim prediction, launch and visible flight. Blocked full-range endpoints fall back to a nearer clear patch; lower arcs fit below ceilings. Aim-only world-space arcs and landing rings appear for equipped Survival tools and disappear when not relevant. Classic quick smoke remains at the player's feet, and Classic gun aiming does not show a misleading tool guide.

All 496 local model/source tests passed, and both existing continuous model mission scripts still finish. The uploaded runtime/test blob hashes match those tested bytes. Local WebGL2 is unavailable, so no local native rendering is credited. Hosted source/model job 107068362822 passed in run 35826202676. The new earned-supply screen/AR throw journey, existing browser/XR/motion matrix and public-byte verification are still pending at this checkpoint. The key runs are 35826202676 (Field Desk and throws), 35826202795 (publication), and 35826202748 (extended compositor). Do not infer a pass from queued jobs. Replace this pending state only after inspecting actual results.

Planning was saved first in ff0ef75d79a3157b74b5a2558ebe3366d6c5b1e4. Runtime changes are limited to throw-path.mjs, throw-guide.mjs, the bottle/throwSmoke action boundaries, scene flight/guide integration, tests, release build identity and documentation. The existing read-only verification workflow gained one throw journey; no new workflow or branch exists. All previous checks remain.

## Player experience direction

Build a focused survival-stealth adventure through reclaimed places, not a replacement demo or increasingly large empty maps. Use functional rooms, traces of ordinary life, constrained resources, quiet and pressured stretches, observation before commitment, connected interior/exterior routes and recovery after detection. The Last of Us is a general design reference, not a source of copied layouts, characters, fiction, audio or assets.

Each encounter needs a readable destination, an observation opportunity, hard cover distinct from foliage concealment, a meaningful alternate route and an escape. Routes should trade time, exposure, information or resources rather than one being better in every way. Machinery and optional repairs must change actual circulation that enemies can use. Tell environmental stories through rooms and objects before explaining them with text. Avoid sign spam, waypoint dependence and pickups that force menus.

Keep the praised bodies/faces and recovered animation. Preserve seven chapter identities, old/current checkpoints, finite inventory, one-time rewards, existing controller remaps and fast no-fatigue default running with selectable legacy movement. Tension comes from exposure, tactics and resource choices, not forced slow travel. Xbox must operate gameplay and all menus. Retain Quest controller input, hand UI, first-person VR/AR and character-centered portals. Never force the player's gaze or attach a compulsory menu to their face. Keep at least one of the diorama top/front open.

## Already delivered foundations

Reclaimed Places (a1b74d4), its plaque correction (953a187), and playtest discovery/journal work (e361025) are implemented. Floodgate has connected quay pump/evacuation rooms and observation/exposed alternatives. Terminus has its dry-record outer aisle plus dispatch/workshop escape shutters operated by existing optional tasks. Both tasks retain their original resources and prerequisites. The title and journal explain available routes and earned open states. Do not recreate the old solid ruin or conflicting Firebreak layout.

Currentworks Living Garden is implemented in 16a3e092, with source 0dbfb7a verified live against all 199 publication paths before Tactical Throws. Its 482 tests, full Conservatory browser mission, four library XR modes and five inherited controller/hand menu journeys passed within their recorded scopes. The Conservatory contains three shallow Currentworks Water 0.1.0 pools and five seeded Trees 0.1.3 alder/willow trees, pinned under vendor/currentworks and using Rainward's existing Three r177 renderer. The archive catalogue opens its northern maintenance return. Original wading rules, sluice puzzle, lens/core and finite rewards remain. Keep graphics fallback, Light XR budget, Reduced Motion and pausable graphics clock.

Read CURRENTWORKS.md, RECLAIMED-PLACES.md and their exact evidence instead of recreating completed features. The motion audit remains immutable; deliberately revised district/scene rendering is documented by successive render-revision receipts. Do not replace retained characters or run a second foot solver to satisfy historical source hashes. Fire, Toon, Cloudlets, new weapons and arbitrary traversal are not claimed merely because the shared library contains them.

## Known failures and unfinished acceptance

The prior Floodgate browser replay in run 35807625914, job 107012225416, artifact 10729326217 died in the freight aisle with smoke remaining and no medkits. Its Classic quick-smoke action is unchanged by Tactical Throws. Do not claim the new lob planner solves that failed resource/timing journey, erase the failure, grant supplies or remove enemies to force success. Earlier garden north-approach failures are retained alongside the later successful finite-supply route.

Model fixtures, continuous model missions, ordinary-input HTTP/WebGL journeys, synthetic XR attachments, physical hardware and human judgments are separate evidence. Physical Quest/Xbox/Bluetooth, full campaigns with each preset and hand tracking, sustained frame-time/thermal performance, comfort and independent art/pacing review remain open. A green test does not prove AAA quality. Do not set a production task to Approved without a named human review.

## Next bounded tasks

Finish exact-source Tactical Throws browser and publication verification; inspect actual screen and compositor captures, save bytes, held-input behavior and invalid/indoor throws. Then diagnose the failed Floodgate recovery path and clipped world guidance in tight rooms. Do not reduce enemy danger merely to satisfy a scripted route.

Further authored work should deepen Conservatory maintenance/observation relationships beyond its delivered return, Meridian household/service interiors, Breakwater exposed height versus shelter, Whiteout recognizable thresholds and sound landmarks, and Northlight dry observation versus submerged recovery. Preserve old walkable saves rather than silently imposing new swimming requirements. Interior acoustics, useful Foley, dramatic silence, enemy search tactics, weapon handling and hand/traversal contact animation remain separate roadmap work. Relate level work to existing RW-009, RW-011, RW-012, RW-013 and RW-028; tool polish does not complete those whole criteria.

## Delivery contract

At each meaningful checkpoint record exact source, changed paths, tests actually executed, failures and next action here or in linked evidence. Write scoped changes directly to freshly reread master without force or unnecessary PR/staging machinery. Preserve concurrent sibling commits. Verify actual hosted bytes separately from committing. Do not clear localStorage to update. Do not alter pinned vendor modules without compatibility/provenance tests. Update canonical production-plan.json only for genuinely changed status, then regenerate AAA_CHECKLIST.md rather than editing generated task state alone.
