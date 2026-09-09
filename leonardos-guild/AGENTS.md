# Leonardo's Guild continuation guide

Read UPGRADE-CHECKLIST.md, README.md, MARKET-LIFE.md, release.json and the current PR before changing this game. ASSET-REGISTER.json and vendor/gltf-provenance.json document imported art and loader provenance.

Preserve the same town, Stolen Folio, nine side commissions, touch joystick, interiors, parked vehicles, old save namespace and sibling projects. New short encounters have separate additive save state. Do not reset user progress or replace the game to improve its artwork.

UPGRADE-CHECKLIST.md is the durable planning document. Update actual status and evidence, not only the task description. A model test is not a native playthrough. A passing PR is not a public deployment. Use read-only acceptance after committed source; verify served hashes after merge.

Only license-verified redistributable artwork belongs in this public repository. Keep upstream and modified file hashes, local dependencies and readable license text. Do not fetch paid packs or assume a texture that resembles an interior makes a doorway enterable.

The one-time integration recipe refuses any baseline/output hash mismatch; do not rerun it to overwrite later work. Normal maintenance edits the ordinary committed modules. Keep new data in street-data.mjs, validated actions in street-core.mjs, interface in street-ui.mjs, and asset placement in street-art.mjs. Native tests use normal controls, never live actor/quest/currency writes. Declare any initial-save fixture explicitly.

Do not claim piloted flight, multiplayer, paid accounts, mobile hardware performance, new rigged character animations or full NPC schedules unless those systems actually exist and have appropriate evidence. Finish one coherent, tested slice and preserve the open roadmap.

Cycle Works: read CYCLE-WORKS.md. cycle-core.mjs validates equipment/road-test state, cycle-ui.mjs supplies view fragments inside Nearby, and cycle-art.mjs is bounded art. Stock motion and the carriage must not change. New cycle save fields are additive. A source-preparation receipt can create checked Git blobs but acceptance must use ordinary committed output, never rewrite code at test time.
