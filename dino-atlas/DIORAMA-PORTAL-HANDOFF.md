# Character-centered world portal continuation

## Published checkpoint / 2026-09-17

The portal correction is merged, published and release-verified. Release dino-portal-20260917.1 points to d315307210d30736e4c9085e32bbc007a882583b and was published at 2026-09-17T20:06:33Z. Portal build: ranger-portal-20260917.1. Tidegate entry build: tidegate-20260917.1. Do not repeat the merge or recreate the already implemented correction. This remains a prerelease because physical-device and human acceptance are open.

Read verification/portal/publication-20260917.json, DIORAMA-PORTAL.md, design/DIORAMA-PORTAL-REQUEST-20260917.md and AAA-ROADMAP.md. The earlier candidate handoff is retained verbatim at verification/portal/prepublication-handoff-20260917.md. Its pending status is historical.

## User intent implemented

The box is a character-centered window into the ordinary third-person game, not a finite map contained by its walls. Classic Reserve and Tidegate share the same portal implementation. The active ranger or vehicle, including its height, stays at the display center while the existing live world moves relative to that center during rendering. The accepted physical width, proportions and session placement remain unchanged.

The per-eye fragment aperture discards rays outside the projected box and geometry in front of its entry surface. It deliberately retains world depth beyond the side and rear faces. Eye-facing enclosure panels become transparent; far panels are lightly tinted. Existing top/front opening preferences remain valid and never both closed. Automatic cutaway takes precedence. Actual walls in the game remain solid and occluding.

The game is neither a flat video texture nor a second simplified simulation. Only rendering receives the display transform; normal movement, collision, tools, vehicles, wildlife, objectives, inventory, rewards and saves keep their original world coordinates. First-person VR, VR diorama and explicitly requested AR diorama remain available. This is continuous presentation of the existing authored world, not infinite terrain or network asset streaming.

## Completed evidence

Master run 35265511581 passed all 13 jobs, including separate published and release jobs. The source suite passed 181 Node/model/physics tests with no failures or skips. The existing Tidegate, service-loop and four Classic browser jobs also passed.

The separate public job 105354366910 matched all 71 manifest files, passed 15 actual-game portal checks in Classic and 15 in Tidegate, reran the 31-check Tidegate tour and 27 service-loop checks, and produced the three opening-preset captures. Its graphics fixture rendered two ArrayCamera eyes from six viewpoints: front, rear, left, right, above and inside. It reported no leaked, missing or foreground pixels among the evaluated samples outside the explicitly excluded boundary band. This does not prove every possible view or certify a headset compositor.

Pages run 35265509980 deployed the exact release commit successfully at 19:34:08Z. The public job completed at 19:53:31Z. Release job 105358388010 succeeded. The versioned release contains dino-portal-verified-evidence.tgz. Its GitHub-reported hash is in the receipt; the closeout independently downloaded the source and published Actions artifacts, not that aggregate release asset.

Recovery hash-checked both downloaded archives, matched the archived 71-file manifest, reran all 181 tests and syntax-checked all 51 top-level JavaScript files. Front/side production game captures and the mask report were reviewed. No fresh local live-browser run was performed; direct web-reader requests were rejected. The independent public evidence is the completed hosted run, not a claimed local browser result.

## Failures and acceptance boundaries

Keep verification/portal/first-native-20260917.json. The first actual-game driver held movement before the post-entry neutral-input poll had settled. The repaired driver waits for the real neutral state instead of assigning it, teleporting the ranger or weakening the movement criterion. The final source and public journeys passed with that correction.

XR-DIO-01c now has its separate candidate, public and release engineering evidence. This handoff and publication receipt supersede its pending release-time status. XR-DIO-02c remains open for physical Quest 3 controllers/hands, actual stereo/passthrough, near-plane and inside-box behavior, comfort and device performance. Physical Xbox, human art review and LEVEL-PM-03/LEVEL-PM-04 remain open. Actual-game portal runs used real movement and collision driven by synthetic Xbox with mocked sessions and inspection eye poses; graphics fixtures are not manufactured mission completion.

Keep all existing save keys, stable IDs, rewards, controller preferences, vendor licenses and sibling-game work. This closeout changes documentation only. Later documentation is not retroactively part of the release-time manifest. For another runtime change, refresh master, use a distinct release identity and repeat the documented candidate and public gates.

The next level-design question remains whether the observation/feeder route earns its detour through useful information and preparation, now viewed through a character-centered portal. Do not force lookout visits or expand the map merely because presentation tests pass.
