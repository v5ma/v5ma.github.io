# Prism integration reconciliation / 2026-09-21

This is a Prism-only source and publication audit, not another gameplay release. The pinned starting master is 26eb4459f7437415f224c9737c4c507f2d551243; its exact Prism subtree is 72c19c99cbfe8823616d9348edc5dab8b5062cef. The machine-readable evidence, individual branch SHAs and protected runtime hashes are in qa/integration-audit-20260921.json.

## There is no outstanding Prism branch merge to perform

All 14 named Prism branch tips were separately compared with master. Every comparison returned ahead_by 0 and a merge base equal to the branch tip: all are already ancestors of master. The complete Prism-title searches returned no open or unmerged pull requests. The reconstructed master subtree is byte-for-byte and mode-for-mode equal to GitHub's tree, and contains no textual conflict markers.

That includes the original rhythm game, Jewelbox, Control Room, Tidal Bloom, Practice Lab, First Steps, Spectral Observatory, Floodgate Recovery, Undertow, River Prism, the XR menu repair, Rotunda, its verification recovery and the asynchronous interruption patch. There is no unmerged implementation to recover from those branches. Historical refs and archives are retained, not deleted or merged a second time. The similarly named prismatic-materials branch is not treated as a Prism task without file-scope evidence.

## Keep the integrated implementation, not an old snapshot

The canonical main entry is index.html with River/Rotunda. The old tracks, lessons and Practice Lab remain at rhythm.html; Floodgate remains at water-mission/index.html. Do not restore the pre-River index or overwrite the modern XR/Rotunda code with an earlier menu. Those were successive designs, not competing versions awaiting an arbitrary choice.

Keep the 0.11.1 playback cancellation and matching-session checks from 4239cc7570dc780b70e48afcd0b4f2399628a619. Keep the actual paused-screen Resume control correction from direct commit 62793eff4de51154b4b657b787f1e4f4b2248a81. Keep frame-aware XR button input and awaited Home-state observation from d8b5b4189bfb012c28c5c9d929586e0057218c46. These are all already in master.

The source-only PR211 interruption run 35555975982 passed seven real AR interruption checks and then tried to click a hidden chapter-menu Enter AR button. It failed before reaching VR or the full Rotunda replay. The later direct correction uses the visible paused-screen Resume button; restoring the branch's older test would reintroduce that known test error. Its failed artifact remains 10621077679, not relabeled as a successful run.

## The missing live repair is a deployment discrepancy

Public run 35556669422 expected source 62793eff and version 0.11.1. Its downloaded, SHA-256-verified artifact 10621690226 compared 83 Prism files: seven differed. The mismatches were index.html, release.json, river/app.js, AAA_CHECKLIST.md, RELEASE_NOTES.md, and two absent recovery documents. All seven observed results match the older 0.11.0 source/archive, including the missing documents. The native browser steps were skipped after that failure.

The latest successful Pages record at this audit was run 35552816437 for d539c8e, the 0.11.0 release. Therefore the defensible finding is: master contains the interruption repair, while the inspected live-file receipt did not. A commit, pull-request merge or cache-busting link alone does not prove the site has it. This historical receipt is not represented as a new direct HTTP fetch; direct public-site access was unavailable in the local audit environment.

## Requested work that was never implemented

Either blade receiving a base fruit-cut reward and a color-match bonus is still unbuilt. river/core.js currently requires the assigned hand and direction. Per-controller color switching, including direct A/X gameplay actions and redundant symbols, is also unbuilt. These are not features hidden on the audited branches.

Bombs can already be shot at range and shields can intercept and reflect projectiles. However, bolts are excluded from laser targeting, the slice evaluator handles fruit and bombs rather than the requested broader missile counterplay, and there is no visible spatial explosion danger radius. Retain working defenses while designing these missing interactions explicitly; do not describe them as restored by this audit.

Saved AR opacity, water animation, room movement, score/health/combo displays and the adjustable in-scene pedestal are implemented. Both River chapters still use the original Undertow score. Additional music, richer water interaction, full hand-only combat, freeform panel grabbing and persistent mid-battle saves across page closure are not delivered by this reconciliation.

## Adjustments in this direct-master reconciliation

The owner-required direct-master policy is now explicit in Prism's AGENTS.md and active checklist. README.md and QA.md identify the actual 0.11.1 application rather than only the earlier 0.11.0 interface; component revision 0.11.0 remains intentional where bytes did not change. Historical release documents are not rewritten to erase their evidence.

Four committed tests/__pycache__/*.pyc files are discarded as generated Python caches, not game source. A scoped .gitignore prevents their recurrence. New integration tests guard textual conflict markers, separate entry-point wiring and application/cache/release agreement without freezing future gameplay design.

The existing read-only prism-rotunda.yml is adjusted for direct-master updates. Local-source interruption/menu/battle checks no longer depend on the public site already serving the new files. Source and public jobs remain independent and report actual failures; public input testing still requires an exact-file match. Both native suites run independently so a failure in interruption testing does not hide the separate menu/battle outcome. No new workflow, branch, pull request, transfer script or write-enabled CI is added.

No production JavaScript, HTML, CSS, soundtrack, chapter, scoring rule or save schema is changed by this audit. The baseline exact source passed 250 model/lifecycle tests locally; all 253 tests pass with the three added integration checks. All 44 audited runtime/entry/asset hashes remain unchanged. The local WebGL2 probe returned false, so rendered verification remains an existing CI responsibility, not a claimed local or physical test. Later source/public conclusions belong to the resulting direct commit's actual workflow artifacts.
