# Resume Sky Cycle: XR recovery 0.26.1

Continue the existing game in mario-maker-clone/svgn-paper-route. Read verification/xr-recovery-0.26.1.json and XR-RECOVERY-0.26.1.md before interpreting release status. The previous full handoff is preserved unchanged in archive/RESUME-HERE-before-xr-recovery-0.26.1.md. Resolve its relative references from this original development directory. Its older acceptance does not override the new physical playtest failure.

## Immediate priority

The September 18 headset playtest reported unusable AR menus, no controller exit, and a flat plane intersecting the level as the head moved. Fix and publish this regression before adding chapter content. Do not claim that the old stationary-head emulator established physical Quest usability.

The repair starts from master 686a0fd803ea5b0c20b5663fff3d792264428943 on sky-cycle/xr-menu-recovery-0.26.1. The hosted qualification target is 72fa1c6da154881781cff5393f697bd5aba79a4d in run 35402867061. At this documentation checkpoint the hosted suite is queued; this is not accepted or published evidence. Read the versioned receipt for subsequent actual results and publication, not this checkpoint sentence. Later documentation-only commits do not alter that tested runtime.

## Repair boundaries

The visible immersive session, rather than HTML document.hidden, owns XR input and simulation. Hidden and visible-blurred XR sessions still block input. Desktop visibility behavior remains. Menu neutral detection ignores unused XR squeeze buttons; right B uses a stable pause/back identity, available before the general neutral gate, and holding it must not cascade through nested menus. Both tracked-controller sticks navigate. Controller A can activate a pointed virtual menu action instead of an unrelated DOM control.

Controller riding has no persistent UI plane. Paused menus, hand-only controls and editor tools retain their dedicated presentation. Resume play and Resume editing now cancel uncommitted dialogs without approving them. Existing Xbox gameplay mappings, remaps and all save namespaces remain unchanged.

AR uses a fixed exhibit/world-space fragment mask, not view-space ClippingGroup planes or invisible occluder meshes. Classic and node materials retain their identities, appearance and previous masks; XR exit restores their original fields. The original game scene is still detached before temporary XR resources are disposed. Do not change simulation coordinates, collision or rewards to alter the presentation.

## Qualification and release

The local old-code reproduction fails eight of nine targeted input tests; the non-visible-XR blocking test remains correct. The repaired local suite passes 293 game tests and 12 soundtrack tests. The separate pixel fixture exercises both classic and node materials from ten camera/eye poses after an ordinary unmasked render, then disables/restores masking. That fixture is not the real game.

Hosted real-game journeys must cover AR and VR with no assisting Xbox, a hidden/unfocused HTML page, both grips held, B held across menu transitions, both sticks, trigger states plus select events, nested sound menus, direct resume, ordinary riding, changing head poses, blurred-session recovery, hand input and XR exit. Retain the existing Workshop, Portal Network and twelve-delivery suites. No rider-position, delivery, score, win or progression assignments may manufacture acceptance.

Inspect exact report source IDs, errors and actual stereo images before merging. Match 33 public runtime files with the accepted source, then replay both public XR recovery journeys. A queued runner, passing unit suite, merge or version label is not a public-device qualification. A newer combined-master Pages deployment may publish unchanged Sky Cycle bytes; never reset master to force an older deployment. Read GITHUB-RELEASE-PROCESS.md and preserve sibling work.

Physical Quest 3 controller/hand ergonomics, passthrough, headset readability, long sessions and comfort remain open until the user retests. The exact physical origin of every reported plane cannot be proven from a text report; both the persistent controller slab and camera-dependent clipping path are addressed and tested separately.

## After the repair

This is a Milestones F/G regression repair, not AAA or chapter completion. Preserve sky-cycle/canal-choice-0.25 at c946e556d1a4d970e4e406d09b7a1f547ae0e8a7 and reconcile its movement-first chapter work after the XR release. Keep all eight campaign routes, original physics, soundtrack ownership, independent records, remaps and Workshop documents. Waterwheel remains a non-awarding preview. The full long-range checklist remains AAA-ROADMAP.md; no physical or broad editor gate is closed by this patch.

Rollback only this repair's owned files and retain unrelated repository changes. Never clear user storage as a rollback or update procedure.
