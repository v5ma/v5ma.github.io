# Mounted Field Operations continuation

## Current checkpoint: candidate, not published

PR 184, branch dino-atlas/field-operations-20260917. This combines the unmerged Express travel/control/navigation work with twelve field assignments and modeled attachments on all existing vehicles. Do not merge the older Express branch separately or repeat the already published character-centered portal.

Read AGENTS.md, FIELD-OPERATIONS.md, EXPRESS-FIELD-CONTROLS.md, AAA-ROADMAP.md and verification/field-ops/animal-sight-recovery-20260917.json. The current local suite has 230 passing model/physics tests, zero failures or skips. Earlier counts describe earlier source snapshots.

## Recovery and failures retained

Recovered b103c8a624aa8c5cdf8c003585ecb31a613e03ca from hash-verified stage artifact10524356279. Its 227-test suite passed. Initial native source run35285832745 passed Classic cooling13 and aerial recovery10 checks. Tidegate cooling/android passed, but the rescue driver stopped at x=-14.107 outside the existing seven-unit boarding reach. The ordinary dock target moved from -14 to -13; no boarding rule, actor or collision changed. Checkpoint dbf26112ece64d8cf66e994dbc89f4ffc8d3173b added the red/green real-physics fixture, bringing the suite to228. Run35287444160 was then queued for complete acceptance.

A broader review subsequently found a real animal target-selection defect: valid oblique aerial rays could hit the original cylinder while missing its smaller spherical proxy. The corrected firstTarget uses the resident's existing collider, still bounded by the world's nearest hit. The calibrated census residents now pass twelve viewpoints, and a solid-wall control still blocks selection. The suite is now230. Keep animal-sight-first-failure.tap; this is not a manufactured mission completion or proof of all census routes.

## Release gates and scope

The established dino-tidegate.yml runs the full model, original tour, both service routes, both Express journeys, three portal cases, four Classic regressions and three new field cases. The field cases cover Classic cooling, Tidegate cooling/android/boat evacuation with secured-cargo reload, and aerial rescue. All twelve missions have progression fixtures; distant census, stand-off, cargo, induction and alternate vehicles still need expanded native coverage under FIELD-OPS-01b.

After final candidate success, refresh master and reconcile sibling changes before normal expected-head PR merge. The master workflow separately verifies served bytes and public journeys before creating dino-field-operations-20260917.1 as a prerelease with its evidence archive. Do not report publication from a branch commit, a queue, local tests or candidate success. No temporary integration workflow should remain.

Local Chromium requests return ERR_BLOCKED_BY_ADMINISTRATOR; no local live-browser pass is claimed. Native rendering runs in the hosted workflow. Physical Xbox/Quest, actual hand tracking/stereo/passthrough, speed/hoist comfort, hardware performance and unfamiliar/returning-player acceptance remain open.

Preserve the original missions, inventory and reward ledgers, all historical save keys, separate scene-specific field records, actual cargo carrier identity, controller presets and the accepted portal dimensions/placement. The mission board gives unique commendations, not repeat payments into the old economy. Friendly crew use assessment/rescue; the fictional android uses induction service, not humanoid combat. Source, failures and recovery checkpoints are saved in the branch and PR.

The next design opportunity is to verify the longer census, stand-off and cargo trips with actual inputs, then assess whether their information, vehicle choice and return routes make familiar places more useful. Do not substitute another map expansion for that work.
