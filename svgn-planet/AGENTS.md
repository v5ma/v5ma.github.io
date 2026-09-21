# Neighborhood Missions working contract

The owner's current instruction is authoritative: write completed scoped changes directly to master after reconciling its current head. Do not create pull requests, staging branches, source-import workflows, or extra publication pipelines for this game. A direct single-parent commit is sufficient. Never reset or force-push master, and never overwrite sibling-game changes. Older handoffs recommending new PRs or normal merges describe historical operations, not the current process.

The application is svgn-planet/index.html, with main-app.mjs, main-hub.mjs and unified-xr.mjs. Lantern Ward is an integrated district; legacy.html and lantern-ward.html are preserved recovery entries, not replacements for the main game. Keep all eight first/third-person full-world/diorama AR/VR views. Keep the current floor/controller console, mission subtitles and visible focus work.

Audit recovery started from master fda53bedb376d54c3bad3bdacf5a15aba85dba61. Its entire Neighborhood game is unchanged from b38d54f58f98acc9b39c8c9fbd809cfa577ae759, the Mission Focus snapshot. Do not reapply an old branch solely because its PR remains open. Compare the branch changes and current implementation first. The competing Field Desk UI and old Signal City proposal require semantic reconciliation, not whole-file replacement.

Preserve all current and legacy save keys, stable mission IDs, exactly-once reward ledgers, user control preferences and the 102 frozen legacy hashes. Do not clear localStorage or set actor/mission state to manufacture a browser pass. Keep unsuccessful traces and distinguish model, DOM, rendered synthetic-device, public-file and physical-device evidence.

Stay within Neighborhood Missions and its scoped existing test/release records. No private SaaS hub source, cross-site travel portals, A-Frame migration or sibling-game edits. A commit, a queued job and a successful source test are not proof of a live deployment. Read the actual public result independently. Checkpoint work and test evidence frequently; record any remaining unported feature explicitly rather than claiming it is restored.
