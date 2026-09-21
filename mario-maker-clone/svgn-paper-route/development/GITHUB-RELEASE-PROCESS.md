# Sky Cycle direct-master release process

The owner requires direct master updates. Do not create a pull request, staging branch or temporary workflow for an assistant-owned update unless explicitly requested. This supersedes the earlier feature-branch requirement. Existing Git history, verification artifacts and failed evidence remain available.

Read current master, the game handoff and the affected source before editing. Resolve useful changes against the latest game, not an old whole-repository snapshot. Prepare one coherent scoped change, run available local rules, refresh master and verify concurrent game changes. Create an atomic commit on that refreshed master tree and update the master reference without force. A non-fast-forward rejection requires re-reading and reconciling the new master; never reset it or overwrite sibling work.

Automatic Sky Cycle checks use the existing `.github/workflows/sky-cycle-route-entry.yml`. Specialized test scripts remain in the repository and their historical workflow definitions remain in Git history. Obsolete source-staging and pinned-old-release verification workflows have been retired; their history and original results remain in GitHub. Do not add another disposable apply/archive/publication pipeline. Do not change sibling-game workflows or the repository-wide Pages configuration as part of a game patch.

Test the exact committed source and keep rules, isolated models, native browser journeys and physical devices distinct. Native tests must use ordinary input and the real collision, delivery, finish and save logic. Never teleport the rider, assign progress, remove a failed assertion or clear storage to manufacture acceptance. Timing fixes must retain the application requirement and record the original failure.

Keep all eight campaign IDs, old records, controller mappings, original soundtrack and user-created Workshop documents. Waterwheel is an optional non-awarding preview until explicit revision-aware promotion is implemented and qualified. A preview cannot create permanent career or credit awards. Storage failure must remain visibly session-only.

Use one simulation, renderer and audio owner. Preserve the pinned Three compatibility boundary and its tests; detach game-owned scene assets before disposing presentation resources. Check menus, cancellation, recovery, input loss and ordinary movement as well as successful entry. Review actual image output; emulated eye counts are not proof that pixels rendered, and emulated controls are not physical Quest or Xbox approval.

A direct commit is not proof of publication. Allow the existing GitHub Pages publisher to deploy the latest combined master; do not force an obsolete repository snapshot. Independently compare the release-owned public runtime hashes with the exact committed files and exercise relevant public-origin game flows. Keep failures and superseded deployment attempts recorded rather than relabelled as successes.

Update the release manifest, visible build and this game's cache namespace together. Record actual source SHA, jobs, artifacts, failed attempts, scope and limitations in the game verification receipt and handoff. Do not call a release live until matching public bytes were observed. Do not call physical-device, performance, human-playtest or advanced-editor gates complete without performing them.

Rollback only the affected game-owned files, preserving concurrent commits and user storage. Keep useful superseded branch work in history; when resolving an old PR directly on master, explain what was integrated, kept from master or rejected before closing that old PR.
