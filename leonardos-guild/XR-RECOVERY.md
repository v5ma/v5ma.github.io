# XR Recovery / guild-xr-recovery-20260918

Owner bug report: first-person AR/VR is blank; B or menus freeze the diorama. This supersedes earlier software-verification claims for those paths, not the user's report. Baseline is PR178 release f06df1211cfc07c2f32608fd0ce6c77b657f0957, game tree 5b1000ea84674cc6101d52e666cbd94845d115f2, still the Leonardo runtime on master 686a0fd803ea5b0c20b5663fff3d792264428943 at recovery. No new level or A-Frame renderer is introduced.

## Confirmed blank-view defect

WebXR XRRigidTransform.position is a DOMPointReadOnly with inherited accessor fields. The old `fpOrigin={...p.transform.position}` returned an empty object on a real browser, although the old plain-object hardware mock passed it. Both AR and VR then formed NaN world translations. This was reproduced with native Chromium DOMPointReadOnly (empty Object.keys and spread; accessible x/y/z) and with two failing tests through the original full-scene first-person adapter. The failed log is retained in the working evidence package.

The runtime now copies x, y and z explicitly and rejects invalid eye/world transforms rather than counting a blank frame as successful entry. The shared browser hardware fixture now returns native DOMPointReadOnly positions AND orientations. Its old plain-object shortcut no longer conceals this platform-contract bug. Primary platform reference: https://www.w3.org/TR/webxr/#xrrigidtransform .

## Menu repair and recovery

The previous panel was fixed at a side-of-room location, used world depth testing, and native dialog.showModal could capture ordinary 2D modal/inert focus. Opening Nearby with right B paused the simulation even when its panel was outside the current gaze or hidden behind scenery. Those are source-level menu hazards; the user's entire physical freeze has not been independently reproduced on Quest.

A spatial menu is now placed once in front of the current tracked gaze on opening or switching dialogs. It remains stationary while reading, stays visible above world geometry and disappears when returned to play. The original DOM dialog and all its handlers are retained, but during XR it is opened nonmodally for the existing in-headset UI instead of invoking the browser's 2D modal focus layer. Normal desktop modal behavior is restored on exit. B still opens the nearby interaction and a fresh B closes it; left Y still opens Dispatch. No existing mapping or remap record is overwritten.

Three's bundled WebGLAnimation schedules its next frame after calling the application callback. An uncaught UI exception could therefore stop the immersive loop indefinitely. The existing renderer instance now guards its immersive callback: it records an explicit error, restores any pending render-target state and exits to the existing saved game rather than leaving a frozen headset. It does not label exceptions successful, ignore them in tests, or patch the vendor library. Desktop behavior is unchanged.

## Preservation and test scope

This is XR-RECOVERY-04 under F03/NEXT02, not a new roadmap or broader device sign-off. The main save key remains svgn.leonardos-guild.v1, outer version 2. Levels, stable station IDs, rewards, porter custody, audio, original control mappings, complete-scene portal, accepted box size/placement and sibling games are unchanged. The only browser-test pointer adjustment uses the actual panel's world matrix instead of an obsolete hardcoded side-panel position; it supplies hardware aim, never player or quest state.

The focused recovery journey exercises all four direct modes, native browser pose objects, finite transforms, nonblank stereo framebuffer centers, three B open/close cycles per mode after looking away, ongoing headset rendering while paused, resumed real movement, hand-selected map, nested pause/view settings and desktop exit. The seven existing journeys remain separate regressions. Real browser DOM geometry and framebuffer evidence are stronger than successful session entry alone, but do not certify physical Quest compositing, passthrough, comfort or sustained performance.

At the initial implementation checkpoint all 379 CPU/model/input tests and 14 design contracts pass. Local network navigation remains ERR_BLOCKED_BY_ADMINISTRATOR, so local browser navigation is not claimed. Final source/native/public outcomes and failed tests belong in the release PR and an external release receipt. Do not replay old transfer workflows or reset master/storage. The next priority is the owner's four-mode headset retest, particularly B return, readable interaction text and restored movement, before adding any content.
