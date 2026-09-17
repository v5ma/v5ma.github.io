# Living Portal v0.13.0: current continuation

Read release.json, lantern/LIVING-PORTAL.md and production/evidence/living-portal-0.13.0/candidate.json first. This implementation is on the living-portal work branch, not a claim of publication. Source acceptance and separate live publication must be recorded before saying it is live. The previous Working Quay release remains in the history below.

The user's corrected diorama contract is authoritative: the room-fixed box is a perspective aperture onto the regular third-person game. Actual gameplay moves and rotates the world around the centered courier. Side/rear depth continues beyond the frame, foreground shell faces disappear per eye, and off-aperture/foreground fragments are masked. Never restore an opaque enclosure or a finite map scaled to fit it. The default physical width/depth/height and placement remain as before. The finite playable district is unchanged in extent; this is not new procedural world streaming.

The opaque double-sided enclosure planes and full head-pose-following panel were identified in the old source. The new shell is a thin frame with very faint far-side glass, and native panels use a fixed yaw-only dock. Controller gameplay hides the panel. Physical diagnosis of the user's exact two rectangles is not established by source inspection alone. Retain stereo pixel, translated/rolled head, and real gameplay tests; Quest inspection remains mandatory.

First-person AR explicitly requests immersive-ar with nonopaque blending. It is human-scale, uses the same game, and has no room scanning, physical collision or persistent room anchors. Preserve clear-play-area guidance, native tracked/pinch menus, tracking-loss pause, neutral rearm and session teardown. Hold-release braking applies to the normal speed actions without removing ordinary stick movement.

Eight three-stage resident stories and six new named residents reuse the print shop, radio loft, workshop, waterworks and three opened building interiors: kitchen, storehouse and greenhouse. There are nine named residents total, not a GTA-scale crowd. Stories are selected from Missions/map (D-pad down, View/M/J); selection points to the giver and grants no progress. The persistent minimap, large map, gold scene beacon, compass distance and floor cue agree with the active target. Sluice-dependent targets adapt to water state. Main delivery is still independently trackable.

Keep svgn.lantern-ward.v1 / lantern-ward-01 / layout 1 and the original 600-credit ledger. New city.v1 data is optional on old saves, validated, and has a separate exactly-once credit total. Tracking switches preserve partial stories. Never clear storage to make acceptance pass. Do not downgrade to a serializer that drops city data: a rollback must retain its schema adapter or archive and explicitly export resident progress first. All 102 original-neighborhood file hashes remain pinned and untouched.

Local acceptance has 241 passing tests (222 retained and 19 new), including movement-based completion of all eight stories. The local sandbox did not provide a working WebGL2 context and localhost navigation was administratively blocked; that is not a render pass. Use the established CI/browser harnesses with actual URLs. New suites: city-browser.py with CITY_SUITE=city and portal, plus portal-render-browser.py. Keep all ten existing browser suites. Rendered story coverage and physical device coverage must be reported separately from model coverage.

Update production/roadmap.json and regenerate AAA_ROADMAP.md with production/render-roadmap.py. Keep LEVEL-01, XR-02 and real-device/art gates open until their actual human requirements are met. After normal merge, verify exact public game bytes and live city, portal, stereo-pixel, street, XR and quay tours. Record the final receipt outside the game publication closure under release-receipts and in the merge PR rather than creating recursive evidence-writer deployments.

Next opportunity after the reported defects are resolved: richer resident conversations and consequential work schedules inside these households. Evaluate whether players can find, complete and intentionally switch goals without coaching. Do not add another anonymous district to inflate counts.

## Earlier Working Quay handoff (historical)

# Working Quay v0.12.1: accepted-source release handoff

Read release.json and production/evidence/working-quay-0.12.1/accepted.json first. Runtime 241a2676d3c117da5bbb25293a6ff0555f3f7d05 passed all 222 model tests and all 146 checks across ten browser suites in https://github.com/v5ma/v5ma.github.io/actions/runs/35056702530. All artifact ZIP digests and report contents were independently checked. The earlier candidate.json is a historical incomplete checkpoint, not current source-acceptance status. Public results belong to the merged release PR and ../release-receipts/neighborhood-missions-working-quay-0.12.1.json after deployment; do not infer served bytes from a merge or source test.

## Implemented design, not another district

Working Quay refines existing LEVEL-01 using the public studio library. A local visible loading cycle and continuous cart movement create a short cooperative bicycle crossing, an unsignaled wait and a longer timing-independent north loop. The existing roof previews loading. X at either reached signal relays a request throughout the cycle; L3/L bell remains local and sight-dependent. Occupied-lane yielding and initial cart placement protect recovery without moving a saved courier. No map expansion, new reward, forced dismount, menu-heavy gameplay or combat was added. Read lantern/WORKING-QUAY.md and the applied library note for all five linked descriptions.

## Retained systems and input

Lantern Ward's street, roof, canal, far-side blue-door return, reversible sluice, moving hoist and exactly-once 600-credit outcome remain. Save identity is svgn.lantern-ward.v1 / lantern-ward-01 / layout 1. Routine and comparison counters are transient, not serialized. The original neighborhood at legacy.html retains all 102 pinned file hashes, v1 keys, rewards, Homecoming, Tidewater and the old flat theater. Never migrate old coordinates or duplicate rewards silently.

Xbox keeps A hop, X interact, Y mount/dock, LB throw, RT accelerate, LT/B brake, L3 bell, D-pad down jobs and existing camera/menu controls with neutral rearm. Tracked right-trigger and joint-pinch Interact were exercised at the actual quay signal. First-person stereo VR and diorama VR/AR remain actual geometry with top, front or both openings. Cutaways and scaling do not change collision. Placement is manual, not room scanning or persistent anchors. Physical Quest 3, Touch Plus, hand tracking, Xbox, comfort and named-device frame times remain untested.

## Measured outcomes and revealing failures

The corrected input-only comparison passed all 14 checks, including the previously failing hand-pinch post interaction. Individual controlled crossing observations: plain 6.966 simulated seconds / 11.009 m / 4.567 blocked seconds; signal 2.450 s / 10.997 m / no blocking; north loop 8.417 s / 23.231 m / no blocking. Each stayed mounted without a crossing menu. These are not human averages, performance targets or evidence of enjoyment.

Preserve failed-comparison.json. It exposed a fixed post incorrectly inheriting free-bell occlusion; code was fixed and the assertion retained. Earlier six model route failures exposed courtesy deadlock and returning-cart conflicts, also fixed without removing the route assertions. The first browser driver overshot turns; throttle reduction changed only the input driver, not game physics or arrival tolerances. Source reconstruction initially missed root index.html; recover its exact archived blob rather than weakening the homepage test.

## Resume and next design question

Do not replay completed acceptance or recreate the quay. First read the latest release PR/publication receipt. The established publication workflow verifies every exact game file plus the applied library note, then live street, native synthetic XR and market tours. It accepts the exact game snapshot even if a later sibling-only Pages build supersedes the repository SHA. Preserve all byte and gameplay assertions. Record live completion in a PR comment and the separate release-receipts location; avoid recursive evidence-writer deployments.

LEVEL-01 remains needs-playtest, not certified complete. Its technical measurement/publication steps are tracked by the release evidence; the unresolved quality question is whether unfamiliar riders recognize loading, see the alternatives and deliberately exploit that knowledge on return. Next bounded design opportunity: useful goods-flow information on the existing elevated observation route without mandatory repeat exposition. Review sightlines, braking space and camera intersections before adding geography or final art.

Run node --test svgn-planet/tests/*.test.mjs svgn-planet/design/chapter-contract.test.mjs svgn-planet/lantern/*.test.mjs and all ten suites in neighborhood-lantern.yml. The normal source archive includes root index.html, unlike the temporary quay archive. Preserve the canonical roadmap and all stable identifiers. Use normal merges; a rollback is a new Working-Quay-only revert commit, never reset or force-push shared master. Retain failed and successful evidence.
