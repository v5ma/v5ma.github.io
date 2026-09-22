# Field Guide aim repair 0.15.2

This is a bounded repair of X12/X11, not a new world or a replacement for Field Guide. The owner reported that the otherwise promising diorama still needed shooting repair. The reviewed baseline is 7fea55ba3ccec87f1511ef29b87cdb6a3468279e; master adef4fcde698c8f3abdb58248eb6ebdd53956d1b differed only in Prism Current at initial reconciliation. Preserve later sibling changes on integration.

## Hypothesis and findings

The old reticle used a fixed 80-meter ray and a 0.9-meter sphere for every living enemy. Real fire uses the equipped weapon's range, separate humanoid body/head geometry, different drone radii and friendly-override exclusion. This disagreement can advertise a miss as a hit, fail to mark a valid edge/head hit, or stop a long-range marker early. The avatar's short aim line also ignored crouch/recoil and nearby cover.

There was a second, independent input timing defect. XR sampled the avatar's window ray once per rendered frame, but the application can advance multiple simulation steps before the next frame. At high movement speeds that sampled origin can fall outside the existing 2.5-meter muzzle safety distance. The actual fire function then correctly rejects an invalid old origin. The fix updates the avatar-window ray when gameplay requests it, rather than loosening the muzzle safety rule or changing tracked first-person VR.

The primary observation is agreement between the rendered centerline, current avatar origin and existing weapon collision query. Guardrails are unchanged damage, spread, ammunition, critical-hit rules, rewards, dynamic cover, save-v1, remaps, input re-arming, full-depth aperture and first-person tracked rays. Hands remain UI-only. No private hub, travel portal, archived city/water integration, sibling game or new workflow is involved.

## Behavior

Real shots and window previews share traceWeaponRay. The preview is read-only and uses Arc Caster range 85, Carbine 90, Longglass 220 or Scattergun 32 as appropriate. It skips dead enemies and currently friendly overrides, respects real humanoid/head/drone geometry, and stops at the same dynamic solids as bullets. The marker is green for a hostile centerline intersection, coral for solid cover, and gold at the range endpoint. It predicts the centerline, not weapon spread or a guaranteed future hit against a moving target. The separate existing shot-feedback system continues to show actual fired endpoints.

The short avatar line now starts at standing or crouched eye height, follows current recoil and pitch in world coordinates, and stops at the first centerline obstruction when closer than seven meters. Its direction remains correct under the courier mesh's rotation. No filled shell or head-following plane is added.

The window aim getters preserve a null ray after tracking loss; they do not synthesize a tracked controller or bypass the neutral-input requirement. Original life-size first-person VR still uses the real tracked origin/direction. Current-step refresh also applies to the existing window power ray without changing its action or resource cost.

## Verification

Ten new isolated model/Three scene tests cover all weapon ranges, enemy shapes, head and body edge cases, friendly/dead filtering, both Receiver screen states, read-only save/event behavior, missing tracking, unchanged first-person rays, stale-origin rejection and current-origin recovery, crouch/recoil, actual rendered line transforms and near-cover shortening. A separate local differential check compared the complete old/new states and real shot events across 576 deterministic weapon, scope, crouch, enemy and distance combinations; all were identical. These are fixtures, not gameplay completion evidence.

The existing native window journey retains its three playable modes, combined move/aim/fire/reload, hand exit and save checks. It additionally compares the post-movement drawn centerline and firing getter against the live player origin. The failure reporter now preserves the original exception even when navigation fails before the application exposes a snapshot.

Local Chromium could not navigate to the served game: ERR_BLOCKED_BY_ADMINISTRATOR. The first attempt's reporter also failed while trying to capture an unavailable snapshot; both logs were retained locally, and the repaired reporter records the original navigation block. This is not a browser pass. Use the unchanged seven-suite Aether Field Rotunda workflow, independent publication hash check and versioned backup process. A successful older 0.15.1 run does not certify these new bytes.

The local full suite passes 324 Node tests, six backup-input tests and fourteen release-evidence fixtures. All module syntax checks pass and the runtime manifest covers 125 files.

Physical Quest stereo aiming, marker readability, tracking reliability, comfort, performance and Xbox acceptance remain unverified. Owner playtesting should specifically compare near-cover and long-range shots, crouched aim and firing during fast traversal. Roll back with a forward, Aether-scoped revert; never reset master, overwrite an old release tag or clear player storage.
