# Rainward v0.14.0 / Grounded

This implements the owner's inverse-kinematics reference as a bounded upgrade to Rainward, not a replacement demo. Linked roadmap: H-02, RW-035, RW-036 and partial RW-014 evidence.

## Motion

The hero and five humanoid patrol roles now use distance-driven visual stride, world-space planted-foot targets, independent two-bone leg solving, soft reach limits and terrain-aligned feet. Contacts release for swing, overreach, sharp turning, unsupported ground, vaulting, prone, swimming, death, chapter replacement and shelter restores. Position/velocity-aware cubic offsets soften target handoffs; source-pose interpolation runs before IK so it does not drag a planted foot. No animation writes player position, posture, health, action duration, hit points or save data.

Land poses blend instead of snapping all joint rotations immediately. Swimming no longer relies solely on the crawl pose: original arm-pull/flutter curves, surface treading, sculling and submerged posture are distinct. These are newly authored procedural curves, not imported motion capture, a neural controller or a physics-based ragdoll. Weapon-hand and arbitrary ledge/stair contacts are not claimed.

## Proportions

The calibrated outfit is less broad at the shoulders, the knee landmark is raised by 0.012 game meters to rebalance thigh/lower-leg lengths, and boot bulk is slightly reduced. Overall standing height and head dimensions remain. The same continuous rest-space map modifies every original garment, decoded imported detail and skeletal bind landmark. Normals are transformed consistently, skin weights remain normalized, all seventeen bones remain, and licensed GLB bytes are unchanged. These are conservative art choices, not universal human proportions or an anthropometric certification.

## Preservation

All seven authored expeditions, both Xbox presets, full native menus, settings, keyboard/touch routes, finite supplies, combat/oxygen rules, checkpoint formats and save keys remain. Feet sample the actual authored terrain height; there is no new collision system. Reduced Graphics and detailed-human fallback remain supported. No new controller bindings, render target, network provider or runtime account are required. The existing original music and source licenses remain intact.

## Validation boundaries

The model suite includes analytic degeneracies, frame-rate-independent plant checks at 30/60/120 Hz, slopes, blocked movement, backward/lateral travel, turns, restore reset, swim/land release, source immutability and proportion mapping. The dedicated WebGL fixture compares fixed-camera original/current poses for the hero and five humanoid roles, and measures actual rendered-skeleton contact positions. It is a synthetic motion/terrain fixture, not a living-enemy playthrough, physical Xbox/Bluetooth check or target-hardware frame-rate result.

The existing living-enemy Natatorium journeys and full controller/save/material/audio/cinematic regression remain separate release gates. The local model suite runs here; local browser navigation is blocked with net::ERR_BLOCKED_BY_ADMINISTRATOR, so native evidence is collected by GitHub Actions without bypassing that local policy. Failed evidence must be retained. Final source/merge hashes and actual public-byte verification belong in the release PR and evidence/grounded-v0.14.0/ before publication is claimed. Named artistic, real-device audio and physical-controller approval remain open.

## Research and next work

Daniel Holden's Inverse Kinematics and Foot Locking (2026-07-30) explains separating a leg-chain solve from a contact target that stays fixed in world space, with soft reach and inertial transitions. Rainward independently implements those mathematical ideas for its existing rig; no code, character assets or motion clips were copied from the article.

https://theorangeduck.com/page/inverse-kinematics-foot-locking
https://theorangeduck.com/page/creating-looping-animations-motion-capture

The linked publications also include Learned Motion Matching and HUMOS: Human Motion Model Conditioned on Body Shape. These are useful future directions for a properly licensed motion database and body-dependent motion. They are not integrated or reproduced by this release.

https://theorangeduck.com/page/publications
https://theorangeduck.com/page/learned-motion-matching
https://arxiv.org/abs/2409.03944

Continue by reviewing captured motion, adding support-hand grips and authored action/stagger transitions, then more complete step/ledge contact handling and physical-device review. Do not mark H-02 or RW-036 fully approved merely because their foot-contact foundation is implemented.
