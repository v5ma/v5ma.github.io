# Aether Reach conflict reconciliation

Recorded 2026-09-21. Scope: Aether Reach only. Initial master was fda53bedb376d54c3bad3bdacf5a15aba85dba61. The initial audit checkpoint was committed directly to master as 1052c46e6ff4464e48def1aa743e534dae35e4a0. No new PR, staging branch or deployment workflow is needed for this reconciliation. Preserve concurrent master; never force-reset it.

## Kept: the current game

Field Rotunda PR 207 was already merged at 8b6904f734abfd29cfef87880c5fba9ccaa868ac. The initial master's entire Aether subtree, 3951a78298054754a97cf5d0bad369231360e0bb, matched the recovered 0.15.0 source archive exactly. Field Rotunda, guided diorama aiming, actual-shot feedback, Clear Window controls, first-person AR window, full-depth World Portal, foot grounding, Bellwether Rewired and Receiver Crosswind were not missing from master.

This reconciliation deliberately leaves all 121 files in the existing public runtime contract byte-identical to that accepted 0.15.0 source. It does not change gameplay, save-v1, rewards, ammunition, damage, remaps, first-person aiming, the current portal or any sibling game. There is no new playable version number merely for conflict housekeeping.

## Rejected as obsolete merges; substantive work preserved

PR 139 / feat/aether-tideglass-reservoir-20260912, head 0a152577c7fd9636a09568ff1de7324ecfb244fd, diverged at a43d01ddd75ac7c07280e660f7dcba2282214c8f. Tideglass Reservoir, swimming/diving/draining, the regulator repair and calibration survey are genuinely unshipped work. They are not present in the current game and are not made playable by this audit.

Reject wholesale application of its old app.mjs/model.mjs, release metadata and test drivers. Compared with the current game those files omit Bellwether street/deck/shortcut and windbreak integration, restore the unreachable hardcoded rail-reversal speed of 6 instead of the current configured braking threshold, and downgrade the version to 0.11.0. Its old UI lacks the current window/rotunda paths. The water scene also takes ownership of scene fog, conflicting with the current AR/window environment owner. Its B-to-dive instructions conflict with current Touch-window direct B reload. These are semantic regressions, not conflicts to settle by choosing every incoming line.

Preserve Tideglass's five independent modules and specification as inert .reference files in history/unmerged/tideglass. Their complete historical integration remains on the unchanged original branch. Forward-port work belongs to existing P05, not a new duplicate roadmap: retain current Bellwether geometry, add mode-specific swimming controls without stealing reload, connect objectives through the current resolver, preserve save flags and one-time rewards, and validate water through the actual portal renderer and real movement paths. A branch-local water pass does not establish this newer integration.

PR 62 / feat/aether-living-city, head ddf78e852a23077408e6162b7647bac43a9485f8, diverged at ffae9dddf81119d9b809a0fd389a4a6ab3438a41. The additional southern interiors, conversations, story/attribute progression, Mend and Kestrel skiff remain an explicitly excluded experiment. The latest city-specific run 34159221511 failed. Current AGENTS.md and the authored-worlds specification both distinguish the main game from this experiment.

Reject replacing the modern simulation, renderer, input or save reader with that old integration. Preserve the six city/skiff implementation files and both specifications under history/unmerged/living-city, and retain the original branch. Any future P05 port must reconcile collision and interior openings, licensed characters, checkpoint/quest/attribute migration, skiff ownership, and all current controller/XR paths. Closing this obsolete merge proposal does not mark its features shipped or erase their source.

Both old PRs are to be retired as obsolete integration requests, not merged and not marked as implemented. This is a recorded rejection of unsafe merges with preserved future work, not a claim that Tideglass or the skiff has been added to the live game.

## Superseded planning and staging

The authored-worlds branch at 7d55aad8856c6a9807184a44bf2e05b7d601208d contains an unwired policy module and abstract Bellwether graph. Its own specification says neither is connected to the game. Keep its useful design intentions, but do not install its bounded-section tabletop policy over the user's later full-depth world-window requirement. Actual Bellwether geometry, portal controls and their tests remain authoritative.

Aurora Cast at 348068446e43a39fdb84a0bdf185d862127b3de3 is an older alternative character/shader integration. Its role is covered by current Skyglass/Grounded Cast, including the later removal of obstructive window sheets. Do not run a second character renderer or reintroduce old camera-facing clouds. Afterlight at 0ddbf8c56078516ac0b6d62c7b27856b8e7d0f69 and clear-polish at 38bcd8805fbfa053d877bffb4f584c6a4ab8232b contain source-transfer/refinement machinery, not missing launchable feature sets. Their unexecuted payloads are not accepted source. No historical writer is executed or reactivated.

PR 43 is the separate SVGN City/neighborhood project. It and every sibling game, shared Pages workflow, private repository and hub are out of scope.

## Rewritten: direct-master validation and release evidence

The redundant aether-source.yml, aether-tactics-source.yml, hardcoded aether-crosswind-resume.yml and 0.13-only aether-crosswind-published.yml are removed from the active workflow directory. Their source remains in Git history. Durable backups and the current native suites replace these one-off snapshot/recovery jobs; substantive regression test scripts are retained. Shared Pages workflows are untouched.

Existing aether-rotunda.yml now validates direct master changes using the same six native suites, plus release-evidence fixtures. No new workflow is added. Existing aether-published.yml also rechecks served bytes after a successful Pages build or native run; a predeployment failure no longer has to be mistaken for a merge conflict or manually polled as proof of publication.

Existing aether-release-backup.yml no longer requires every source to be a PR merge. The tested release_evidence.py collector prefers a successful native run for the direct source. It retains exact historical PR-merge support. Sibling-only descendants may reuse evidence only after ancestry and an unchanged complete Aether source/test tree, entry files and native workflow are checked. Every archived suite still requires a matching tested commit, empty source diff, complete runtime manifest, valid artifact digest, minimum check count and no reported application/shader/dialog errors. Failed, incomplete, foreign-source and expired evidence is rejected.

The archive can be triggered by either public verification or native completion and keeps pending checks distinct from approval. Workflow-definition identity and tested/public source identity are separate. Existing version tags and release assets are never overwritten. Reusing an existing tag requires a complete identical runtime contract, and the receipt distinguishes the actual archived source from the current requested source. The public rotunda/window/portal journey also accepts the new post-deployment verification trigger rather than silently skipping it. These changes are mapped to existing R04/R03; those roadmap tasks are not relabeled as physically or publicly accepted by this audit.

## Evidence and remaining limits

The recovered current source passed 290 Node tests and six backup-input tests locally before edits. The final local suite passes 294 Node tests, six backup-input tests and fourteen separate release-evidence fixtures. The new temporary-path fixture caught an eager fallback-path evaluation and was fixed before committing; this was a tooling bug, not a game failure. Their logs accompany this audit. All runtime-contract bytes must remain unchanged at closeout. Source-reference SHA-256 and Git blob identities are recorded in history/unmerged/SOURCE-MANIFEST.json.

Tideglass artifact 10323230294 has archive SHA-256 22f44d50143b3a90469f98fa95965cf0de008565a9d0054abd3c326f272b1c8f and actually tested synthetic PR merge d746b4d3d4e78b2d2d63c8f78aa6fffe59a2f07d. All 98 archived runtime hashes were verified. Living-city artifact 10032539814 has SHA-256 439ed93e1138cd41cd269c0aa56a165e1f92127c0717022ed4331b3987400019 and tested merge be58ba4987e2908bcd311ffddb046b516d0b5dee. All 31 archived runtime hashes were verified; its failed workflow is not a pass. Branch head IDs and synthetic tested merge IDs must not be conflated.

A fresh local Chromium attempt was blocked at navigation with ERR_BLOCKED_BY_ADMINISTRATOR. No local browser pass is claimed. Direct public access was unavailable, and the old 0.15.0 byte-verification run 35556486345 failed. Master content and historical native results do not establish current publication. Public receipt, actual HTTPS gameplay, physical Quest/Xbox usability and unfamiliar-player judgment remain independent gates.

Rollback of this housekeeping means reverting only its scoped commits. Do not restore an old game tree, delete the preserved branches, clear localStorage, import a private hub or modify sibling projects. The next gameplay opportunity remains the current controls/arrival/rail-readability work; larger recovered content remains explicitly under P05 until forward-ported and tested.
