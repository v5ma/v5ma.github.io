# Aether Reach 0.14.0 World Portal

Start from the latest master and the final release receipt. Reviewed baseline master dd4a9d2a35ea667fd33f3ed2b597aeda15cb27e5 retains the published 0.13.0 runtime. The prior Crosswind release gates are complete at ../release-receipts/aether-v0.13.0-20260915.json; do not rerun historic transfer branches.

X10 implements the owner's corrected diorama request: the same expedition through a full-depth ray aperture rather than six world clipping planes. The player stays exactly centered, including during vertical travel. The physical box dimensions, scale and height are retained. The behind-character view scrolls/turns the world without head-driven character movement. Per-eye full projection inverses support the existing scaled XR rig. Every world material, including custom shaders and sprites, is masked; camera/controller/menu objects are excluded deliberately.

The two head-linked UI planes were attached to camera. In diorama, status is now below the fixed box and explicit pause menus are anchored on opening, not head roll. Custom caustic/water/particle materials were also skipped by the old crop pass; the new aperture includes them. These are code-level findings; physical reproduction is still required to identify which caused the reported device artifact.

First-person AR requests immersive-ar with local-floor and optional hand tracking, removes opaque sky/fog and uses alpha composition. An opaque session is rejected, not relabeled passthrough. This is life-size virtual geometry, not room scanning or real-obstacle detection. A larger last-drawn map goal marker, bearing line labeled as non-pathfinding, distance/elevation text and a depth-tested world beacon use the existing tracked goal without granting progress.

Read WORLD-PORTAL.md, DIORAMA.md, DEVICE-SUPPORT.md and the shared level-design manuals. Run all model tests and portal rendering/app tests. No tests may assign player or mission progress for a gameplay pass. Local Chromium HTTP navigation is blocked by administrator policy; native browser evidence must come from the GitHub runner. Physical Quest/Xbox and human clarity remain open.

Previous handoff (historical context) follows.

# Aether Reach: Receiver Crosswind continuation

Current development: 0.13.0 Receiver Crosswind. Base master 78dad9840163bbacb7308118cde44a1bb4f525f6. The released game at that base is 0.12.0, merged at a6d0e27d349fc69c011a5130b7dff1b6da9f8af2. Its publication and archive are complete, not recovery tasks.

Read ../level-design-library/AGENTS.md and its four uppercase manuals, RECEIVER-CROSSWIND.md, BELLWETHER-REWIRED.md, DIORAMA.md, DEVICE-SUPPORT.md and roadmap.json. V03 refines the existing V01/P01 district, not a new island or replacement game. The missing games/ brief promised by the library README is supplied for Aether only in this update; no other game record is modified.

Receiver Crosswind adds two linked contextual selectors and two mutually exclusive solid screen positions. The gallery setting opens the receiver firing lane; the receiver setting protects from the north longshot but leaves the other boarder active. Cover blocks both directions of fire. An occupied destination is interlocked instead of crushing actors. The existing east stair can be descended to the 22-meter gallery during combat without resetting enemies. Leaving for the street still abandons the attempt and preserves the repaired circuits. The six-second hold and once-only 300-credit reward do not change.

Version-1 saves and all existing namespaces remain. Only windbreak===1 is optionally retained; absent or invalid values use the original open receiver lane. Runtime counters are diagnostic and are not saved. The direct X/E interaction and tracked-controller interaction path remain; hands remain UI-only. XR muzzle reach now checks dynamic solids too. All three legal diorama openings and independent head motion remain unchanged.

Run all Node tests, Python backup tests, the roadmap renderer and the seven-suite aether-rewired workflow. The additional windbreak journey must start from normal gameplay, buy nothing, operate the selector, fight, descend/return with unchanged enemy IDs, finish, receive the reward once, then save/Continue. Browser tests cannot assign player or mission state. Local HTTP Chromium was blocked by environment policy, so native HTTP/WebGL evidence must come from the existing GitHub runner, not a local browser claim.

Check ../release-receipts/aether-v0.13.0-20260915.json for final source, publication, native-review and archive receipts. A handoff or staged commit alone is not a pass. Keep all failed traces. Physical Xbox pairing, Quest tracking/stereo/passthrough/readability/comfort/performance and unfamiliar-player quality remain unverified.

Next: observation-led refinement of the arrival and rail decision sightlines, not another map expansion. A player should be able to explain why they changed the screen, which lane became exposed, and how they recovered on the gallery. Roll back via a forward commit of the prior game subtree, never a reset of master or deletion of player storage. Do not touch private fiction, the living-city experiment, or sibling games.
