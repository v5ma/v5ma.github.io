# Resume Sky Cycle: XR buttons 0.26.2

The latest physical report concerns unresponsive A/B/X/Y, triggers and grips in AR menus. Prior 0.26.1 software acceptance does not close this new report. Read XR-BUTTONS-0.26.2.md and verification/xr-buttons-0.26.2.json for exact source, acceptance, publication and remaining device observations. Do not reconstruct the repair or treat a pending CI job as a pass.

PR 203 / sky-cycle/xr-buttons-0.26.2 is the active repair. The final runtime candidate is f279935ce328485d76f72442ad953aa1dfbacf3f. The direct session-owned menu handler maps A/X confirm, B/Y one-level back, both triggers select, grips previous/next and sticks navigation/adjustment. It ignores unmapped sensor values, deduplicates native/polled triggers, gives buttons priority over concurrent navigation, and independently gates held sticks after a system interruption. Fresh ray motion restores aiming after navigation even within the same row. Uncaptured trigger events remain available to ordinary gameplay.

The visible headset selection, not hidden browser focus, owns virtual footer activation. The button tests include native-style getters, twelve-slot pads, active passive sensors, no-ray grip/A confirmation, nested menus and original gameplay trigger/release checks. The original Workspace, Portal Network, delivery, hidden-document, hand and moved-head tests remain required. The menu reports its build and last detected input locally. No telemetry, new framework, save migration or physics change is introduced.

This is a Milestones F/G input repair. Keep the fixed-world AR aperture and absent controller riding panel, all eight campaign IDs, remaps, soundtrack owner, Workshop drafts and independent save namespaces. Keep the separate Canal Choice branch unchanged until after this repair. The complete long-range roadmap and earlier handoffs remain below; their older current-release labels are historical.

Release gates are exact-source tests and capture review, normal expected-head merge preserving sibling work, 34 public runtime hashes and both public AR/VR all-button journeys. Physical Quest passthrough, controller/hand behavior, headset readability, comfort and long sessions remain separate open observations. Never clear localStorage to obtain an update or a test pass.

---

# Resume Sky Cycle: XR recovery 0.26.1

Continue the existing game in mario-maker-clone/svgn-paper-route. Read verification/xr-recovery-0.26.1.json and XR-RECOVERY-0.26.1.md before interpreting release status. The previous full handoff is preserved unchanged in archive/RESUME-HERE-before-xr-recovery-0.26.1.md. Resolve its relative references from this original development directory. Its older acceptance does not override the new physical playtest failure.

## Immediate priority

The September 18 headset playtest reported unusable AR menus, no controller exit, and a flat plane intersecting the level as the head moved. Fix and publish this regression before adding chapter content. Do not claim that the old stationary-head emulator established physical Quest usability.

The repair starts from master 686a0fd803ea5b0c20b5663fff3d792264428943 on sky-cycle/xr-menu-recovery-0.26.1. PR 190 contains the scoped repair. Final accepted source 355aea4ade530d8e5e71adb70d2347200531ebc7 passed all eight applicable jobs in run 35405532420: 296 game tests, 12 original soundtrack tests, 207 native-game browser checks and 13 separate graphics-fixture checkpoints. All seven browser/fixture report source identities and ZIP digests were verified. All 47 native PNGs and one isolated fixture PNG were reviewed. No complete video or physical-device review is claimed.

The repair is published and software-verified. PR 190 merged normally as f815aee0c39e715a9e65e5403238728c4a882a30. All 33 public runtime files matched the accepted source at 2026-09-18T23:55:53Z in run 35407405673, job 105799908143. Its live AR job 105800327674 passed 27 checks and live VR job 105800327764 passed 26. Both reports identify the exact merged checkout and public origin; their ZIP digests and all 12 PNG captures were reviewed. The combined Pages deployment is run 35406599293, source df953158b17dc197c3f8d9db9ea7db9577f4eac0, preserving the Prism Current update. The main receipt records all hashes, artifacts and the initial failed pre-deployment polling attempt. The full pre-merge acceptance record is preserved verbatim in verification/xr-recovery-0.26.1-accepted.json. Do not reconstruct this repair or treat physical-device gates as closed. The next action is the user's physical Quest retest; then reconcile the preserved Canal Choice branch. The read-only pinned retry workflow is retained as .github/workflows/sky-cycle-xr-public-retry.yml.

## Repair boundaries

The visible immersive session, rather than HTML document.hidden, owns XR input and simulation. Hidden and visible-blurred XR sessions still block input. Desktop visibility behavior remains. Menu neutral detection ignores unused XR squeeze buttons; right B uses a stable pause/back identity, available before the general neutral gate, and holding it must not cascade through nested menus. Both tracked-controller sticks navigate. Controller A can activate a pointed virtual menu action instead of an unrelated DOM control.

Controller riding has no persistent UI plane. Paused menus, hand-only controls and editor tools retain their dedicated presentation. Resume play and Resume editing now cancel uncommitted dialogs without approving them. Existing Xbox gameplay mappings, remaps and all save namespaces remain unchanged.

AR uses a fixed exhibit/world-space fragment mask, not view-space ClippingGroup planes or invisible occluder meshes. Classic and node materials retain their identities, appearance and previous masks; XR exit restores their original fields. The original game scene is still detached before temporary XR resources are disposed. Do not change simulation coordinates, collision or rewards to alter the presentation.

## Qualification and retained failures

The old-code reproduction fails eight of nine targeted input tests; the non-visible-XR blocking test remains correct. The final repaired suite has 296 game and 12 soundtrack tests. The separate pixel fixture exercises both classic and node materials from ten camera/eye poses after an ordinary unmasked render, then disables/restores masking. That fixture is not the real game.

The real-game recovery journeys cover AR and VR with no assisting Xbox, a hidden/unfocused HTML page, both grips held, B held across menu transitions, both sticks, trigger states plus select events, nested sound menus, direct resume, ordinary riding, changing head poses, blurred-session recovery, hand input and XR exit. Existing Workspace, Portal Network and twelve-delivery regressions also passed. No rider-position, delivery, score, win or progression assignments manufacture acceptance.

Retain initial run 35402867061 at 72fa1c6da154881781cff5393f697bd5aba79a4d. Its targeted AR/VR and mask checks passed but Workspace tests tried to click a riding panel that is intentionally no longer present. The corrected test verifies that absence, presses real B, and verifies pause/menu access before returning to the editor. The delivery failure served ten targets but sampled the eleventh throw too late after remote-call latency. The same throttle-release/coast/B recipe now runs coherently in browser animation frames, retaining the original throw window and all real packet, finish and save assertions. These are test-only changes; the runtime remains the recovered repair. Three isolated scheduling tests are explicitly not gameplay acceptance.

The 33-file public match and both public XR recovery journeys now pass, as recorded in the latest receipt. A queued runner, passing unit suite, merge or version label is not public-device qualification. A newer combined-master Pages deployment may publish unchanged Sky Cycle bytes; never reset master to force an older deployment. Read GITHUB-RELEASE-PROCESS.md and preserve sibling work.

Physical Quest 3 controller/hand ergonomics, passthrough, headset readability, long sessions and comfort remain open until the user retests. The exact physical origin of every reported plane cannot be proven from a text report; both the persistent controller slab and camera-dependent clipping path are addressed and tested separately.

## After the repair

This is a Milestones F/G regression repair, not AAA or chapter completion. Preserve sky-cycle/canal-choice-0.25 at c946e556d1a4d970e4e406d09b7a1f547ae0e8a7 and reconcile its movement-first chapter work after the XR release. Keep all eight campaign routes, original physics, soundtrack ownership, independent records, remaps and Workshop documents. Waterwheel remains a non-awarding preview. The full long-range checklist remains AAA-ROADMAP.md; no physical or broad editor gate is closed by this patch.

Rollback only this repair's owned files and retain unrelated repository changes. Never clear user storage as a rollback or update procedure.
