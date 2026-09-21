# Prism Current: direct-master maintenance contract

The owner explicitly requires direct writes to the existing master branch for this game. Do not create a pull request, staging branch, temporary transfer script or contents-write verification workflow for your own updates unless the owner specifically requests it. Existing historical branches and pull requests are evidence, not the default workflow.

Read INTEGRATION-AUDIT.md, the current release.json, README.md, AAA_CHECKLIST.md, and the actual files before changing anything. Fetch master immediately before writing. Build a scoped commit on that exact head, update master without force, and reconcile/retry if another writer advanced it. Never reset the repository, replay an old whole-game snapshot, or discard concurrent work.

Scope is prism-current and only its own existing verification workflows when needed. Other games, root launchers, shared infrastructure, private WebXR hub sources/assets/reviews and the combined multi-game brief are outside scope. No Prism travel portals or engine migration are authorized by the current work. Do not publish private or unrelated material as a handoff.

Keep index.html as the main River/Rotunda experience; keep rhythm.html and water-mission/index.html as retained entry points. Preserve original soundtracks, records, namespace separation, stable IDs, menu picking, controller and hand-menu input, actual pause/resume/session end, and matching-mode recovery. Rewriting an entire file from an older branch can silently remove those later fixes even when Git reports no conflict.

Separate integrated code, deployed bytes, passing tests and physical approval. Never claim an open feature was lost in a merge without finding its implementation. Do not silently substitute model fixtures for rendered input tests or emulation for a physical Quest/Xbox/touch test. Preserve revealing failures. Do not weaken scoring, damage, hit windows or completion rules to manufacture acceptance.

Use the existing read-only verification workflow. Source checks run against the checked-out files; public checks compare the expected files before replaying the served game. Keep their results separate. Do not add extra staging/publishing machinery just to move your own code onto master. The source writer performs the direct commit; GitHub Pages still has a separately observable deployment result.

Do not commit generated Python bytecode, caches, local test output or credentials. Save small intentional evidence and the next concrete task near the game. Keep the checklist's unimplemented color-switching, either-blade rewards, color bonuses and hazard feedback visibly open until actually built and tested.
