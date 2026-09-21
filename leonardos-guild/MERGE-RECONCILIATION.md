Leo's Guild conflict and integration reconciliation / September 20, 2026

Scope: leonardos-guild/ only. The owner requests direct writes to master, not new pull requests, staging branches or temporary workflows. Existing sibling games and shared publication configuration are outside this repair. This record distinguishes obsolete branch conflicts, already-recovered features and a reproduced integration defect.

The open conflict

PR134, guild/borderlands-20260912 at 43ce2ca5ab04a976f166953503c6588f89149bab, was open and unmergeable at inspection. Its Steady Steps and Borderlands implementation was recovered by merged PR135, release fb49af11f286f47a17f00d77f846498ec2ef698e. Later Stillwater, Grounded Actions, Quarter, Working Deliveries, XR recovery, full-Vinci and field-status changes extend that recovery. Do not merge the old branch over those changes.

The final PR134 evidence archive 10307141813 from run 34723617057 has SHA-256 84826b5e5dbd4775b1c5a2dd593e2260f5be2c0c8494362bea484b89656926a3. All 409 recorded file hashes were verified. Although its tested commit is a merge preview, its complete game subtree, including file modes, matches the branch's c6836e8240e759b3f8e97702fd27bc34a4183485 exactly. The old source was compared with the present implementation rather than relying on the PR title.

Retained and discarded work

Keep the current safe Vinci, Cinder Hollow contracts/creatures/trails, original households, stories, vehicles, camera obstruction handling, articulated rigs, quiet mixer, water mission, stance IK, complete-scene XR, full-Vinci default and stationary field desk. PR212 and PR221 are already incorporated; they must not be reapplied as missing releases. The field-status and final-Hollow verification branch heads are ancestors of the inspected master. The live-playtest branch has only compositor tests/workflow work, already represented by the later refined compositor implementation; it contains no missing game expansion.

Discard the old PR134 wholesale merge, historical version/title replacements, obsolete source-transfer machinery and earlier runtime variants in favor of the current implementations. Preserve branch history as evidence. Four compared runtime modules are byte-identical (camera-occlusion, guild-art, resonance-art and street-art); other modules contain the later fixes and additions. The audit found no unresolved conflict markers in the inspected application source. A dirty historical PR is not itself proof of missing gameplay.

Recover the useful peaceful-interaction explanations that were present in the old UI but absent from the current generic fallback. The watchman's description again explains the original deliveries/waterwheel prerequisites; former town-rival descriptions explain physical-floor interaction and once-only rewards. frontierDetail observes existing data and does not change a reducer, reward or prerequisite.

Reproduced integration defect and correction

The new field desk's Missions and Inventory buttons invoked the older doors, life and frontier notebook open functions while pause remained active. Those functions required active gameplay, so they silently refused to open. Three isolated fixtures using the actual source open functions reproduced the failures before editing. tests/pause-menu-before.tap preserves that failing trace.

menu-access.mjs separates explicit notebook access from gameplay activity. A started game may open these notebooks during ordinary play or from the actual open pause parent. It cannot open them from the title, an unrelated modal, a hidden parent or an inactive session. The three UI factories retain active as the default; app.mjs supplies the explicit notebook policy. Physical gameplay input remains blocked while paused. Closing the child returns to its existing pause parent rather than advancing simulation.

The existing full-Vinci browser journey now exercises Missions and Inventory using its hand-ray input, verifies the child and parent pause state and unchanged position/currency, then uses Back to return. The existing compositor workflow already runs this driver; no new workflow is introduced.

Evidence and limitations

The complete local suite passes 412 CPU/model/input/scene-graph checks, including nine new reconciliation tests. All 14 design contracts pass. JavaScript syntax and the changed Python driver compile. These are source and isolated-function tests, not a new physical Quest playtest. Local Chromium again refused navigation with net::ERR_BLOCKED_BY_ADMINISTRATOR before the game loaded, so the extended native journey has not passed locally.

The build is guild-menu-reconcile-20260920, retaining version 0.14.0 and the existing outer version-2 save. No progression migration, controller remap, sound asset, world geometry, private launcher or sibling runtime is changed. Current source was reconciled against master before the non-forced direct write. Separate current public-file and native-browser evidence is still required before claiming the new build is publicly verified.

The user's reported broader Quest action freezes, immersive exit, aiming/projectile readability, controller presentation, listening comfort and sustained performance remain open. Farmlands and piloted flight are still planned features, not changes recovered from the conflicting PR. This repair resolves the identified notebook integration conflict and missing explanations; it does not certify every requested improvement.
