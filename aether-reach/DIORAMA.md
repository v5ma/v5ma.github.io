# XR presentation contract

First-person VR remains the default selectable immersive mode. Third-person diorama VR and third-person diorama AR show the same simulated expedition as a miniature, animated 3D world. This is not a screenshot on a virtual panel or a separate simplified game.

## Never a sealed enclosure

The only serialized opening values are both, top and front. They mean open top/open front, open top/closed front and closed top/open front. Configuration cleaning cannot create a sealed box. The pure transition helper opens the other side whenever closing a side would otherwise seal the enclosure. Room ceilings and front shells use presentation-only cutaways; removing a visible wall does not remove its collision or change mission access.

Scale is bounded from 0.02 to 0.055 and table height from 0.35 to 1.15 meters. The default 0.03 scale presents a 1.80 by 1.44 meter footprint. Recenter positions that footprint in front of the current viewer. These are adjustable local-floor coordinates. AR does not claim hit-tested furniture placement, real-room occlusion or persistent room anchors.

## Separation from game state

The game retains its meter-scale floors, weapons, enemies and saved checkpoints. The view rig applies an inverse table transform; the player's physical head and hands remain independent tracked poses. The table follows a bounded neighborhood around the courier, not the user's head. Looking or leaning does not walk or turn the courier. There are no automatic head-orientation cuts. The table moves in response to player travel; physical comfort during this motion still needs headset review.

A render-only courier uses the existing licensed skinned asset, a calibrated 1.76-meter scale, speed-matched walk/run clips and the existing bounded foot-grounding adapter. It is not an extra combat actor and is not saved. In-air motion currently uses an idle pose; authored jump/climb/rail and weapon-specific poses remain future visual work.

Tracked controller rays choose an aim point, with weapon origins kept at the courier so range and occlusion remain meaningful. Table-relative movement does not steal the existing rail brake/reverse or ladder controls. Xbox-compatible input retains user remaps and the same menus, including inside XR. Hands operate UI only and cannot create shooting, movement or power actions.

## Validation and limits

Pure tests cover normalization, all opening transitions, invertible transforms, physical direction consistency and unchanged simulation coordinates. Native HTTP software-WebGL tests exercise the actual renderer, courier, controller menus, first-person restoration, explicit VR/AR requests, head separation, Xbox in XR and tracked-hand settings. Synthetic API frames are not proof of actual Quest stereo, passthrough quality, hand accuracy, comfort or sustained performance. Physical acceptance remains false in release metadata until a real device session is recorded.
