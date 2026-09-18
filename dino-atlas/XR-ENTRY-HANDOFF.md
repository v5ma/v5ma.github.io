# Classic Reserve VR and AR entry

Build classic-xr-entry-20260918.1. The user could not find AR/VR in the regular game. Reviewed master 686a0fd803ea5b0c20b5663fff3d792264428943 has the unchanged Dino runtime from ac0ec69882cdca97ca773f1fdc855d0948fc344d. That earlier field-operations release's full public and release jobs have now succeeded in run 35289464270; do not re-merge its old branch.

## Repair

The previous start screen advertised VR/AR on the separate Tidegate link. Classic's entry button was appended below all introductory copy inside a fixed, non-scrolling screen; its actual three-mode selector was appended deep in the pause menu. The engine already supported Classic first-person VR, VR diorama and AR diorama. This repair exposes those existing modes instead of making another game or map.

Classic now has a static three-button headset group immediately below Start, a top-bar AR / VR shortcut, and the same three buttons near the top of the pause menu. The intro can scroll on short displays. Unsupported modes stay visible, disabled with an explanation and a capability recheck. Direct buttons use the shared presentation selector and request the session in the originating click, before awaiting anything that could lose browser user activation. Successful initial entry uses the ordinary Start handler; cancellation leaves it unstarted. No silent AR-to-VR substitution is made.

The import-map adapter classic-xr.js subclasses the existing shared renderer only in Classic. Tidegate, the character-centered portal mask, accepted box dimensions, automatic shell cutaway, first-person rendering, tracked/hand UI, movement, vehicles, missions, rewards and historical saves are not replaced. The existing presentation preference stores the chosen view. No other new storage key is introduced. This change exposes the existing AR diorama; it does not add a first-person AR mode.

## Verification and continuation

All 237 local Node/model/physics tests passed. Local native browser navigation was rejected with ERR_BLOCKED_BY_ADMINISTRATOR, so no local screenshot or headset approval is claimed. The new hosted entry runner checks actual buttons at three viewport sizes, browser activation, rejected permission, all three session choices in the regular world, Xbox focus navigation, unsupported-device messaging, exit and ordinary tool recovery. Existing Classic hand UI, portal movement and Express controls are retained as native regressions. XR session/capability mocks are explicit; no actor, mission, inventory or progress state is assigned to manufacture acceptance.

The scoped dino-xr-entry.yml workflow requires candidate checks, separate public file matching and public entry/portal checks before archival prerelease dino-xr-entry-20260918.1. Its job results and evidence artifacts, not this planned checklist, establish completed acceptance. Do not claim live publication from a branch commit alone. Physical Xbox/Quest, real hand tracking, stereo/passthrough, comfort, sustained performance and human wayfinding remain open. The existing level-design and broader mission-coverage roadmap remains unchanged.

Next: address actual headset feedback about entry, menu readability or camera pose. Do not confuse an absent launcher option with a need to rebuild the existing world portal.
