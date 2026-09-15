# Vesperfall v0.13.0 / Surestep

Surestep continues the existing game in place. The starting master was b87aeacb71d00b73992945daaba2fccdc66ab409, with v0.12.0 Tidelight and the September 13 continuation audit. Runtime, release labels and the canonical production workbook advance together. No sibling game is part of this upgrade.

## Fast arrows

In active Xbox gameplay, D-pad down equips Blink in one press. D-pad left advances through Standard, Cinder, Frost, Volley and Ricochet, skipping empty types and locked Volley/Ricochet. Standard remains available. Coming from Blink or an unavailable type starts at Standard. Blink cooldown does not prevent selecting Blink; existing firing rules still govern the shot.

B keeps the older Blink toggle. Y tap and D-pad right retain full cycling. Directional menu navigation, confirmations and the held-Y tactical quiver take priority over shortcuts. Changing an arrow cancels a held draw rather than firing a stray projectile. No ammo, unlock or damage rule is weakened.

## Quest controller and hand UI

Water profile, ripples and caustics now appear in the shared paginated spatial settings menu. Both controller handedness choices, existing stick/trigger navigation, physical two-controller nock/draw/release, shield, shard, reload, weapon change and Exit VR/AR remain available.

The session requests hand-tracking as an optional WebXR feature. Unsupported devices continue using controllers. Hand sources are read through targetRaySpace and getJointPose for thumb-tip/index-tip; they are not passed off as controllers. A visible ray and cursor identify the target. A new pinch selects one actual button rectangle. Button gaps and missing/emulated/invalid poses do not activate controls. Pinch thresholds use hysteresis and require an open hand before rearming after acquisition, focus loss, tracking loss or screen changes.

Switching to bare hands cancels any draw and pauses combat. Hands can operate paginated menus, settings and exit. Starting a mode through hands leaves it safely paused. Resume requires tracked controllers because hand-only archery/locomotion is not implemented. Controller return clears stale button state and requires neutral input. Browser/system permissions are platform-owned.

## Planted humanoid motion

The 12 outer humanoid archetypes, represented by 16 enemies in the ordinary sector, receive articulated knees and elbows. More restrained helmet/head and torso proportions reduce the oversized upper-body look while keeping armor, robes, weapons, wings and identities. The three original spectral archetypes are not replaced.

A bounded procedural gait follows actual root displacement rather than an AI-state sine timer. Contact feet stay fixed in world space; swing feet follow smooth lifted steps. Two-bone inverse kinematics uses fixed thigh/shin lengths, a stable knee pole and a bounded pelvis adjustment. Foot slope samples use the existing authoritative collision-floor query. Freeze, pause, teleports, large gaps, turns and missing floor support have explicit reset/fallback rules. Art state stays in mesh userData and never enters progression or checkpoints.

Attack telegraphs, AI, hitboxes, damage, collision geometry, world seeds and routes are unchanged. This is procedural articulated low-poly artwork, not motion capture, anatomically validated biomechanics, full animation blending or finished AAA character production. Physical-headset frame time and close-range human art review remain open. Only visible humanoids receive the pose update; shared primitive geometry/materials are reused.

## Preservation and verification

The existing v0.9+ checkpoint/profile keys, envelopes and save compatibility remain intact. No migration is needed. First Bell, Oath, Endless, sparring, practice, Pilgrim recovery, Rosefire/Tidelight and stationary AR restoration remain separate existing systems.

Run node --test vesperfall/tests/*.test.cjs for the complete deterministic suite. The 17 Surestep tests cover damage filtering, 2,000 IK targets, planted contacts at walking/charge speeds, slopes, turns, freeze/warp resets, input hysteresis and no simulation mutation. At initial local review all 170 tests passed.

Run python vesperfall/tests/production-workbook.py and python scripts/check-vesperfall.py. Start a server at port 4173, then run tests/surestep-browser.py and the existing dominions, pilgrim, first-bell, resonant and rosefire browser suites. Surestep browser acceptance drives actual UI through emulated Xbox buttons, tracked-controller poses and hand joints; it also captures the actual procedural models for review. It does not set inventory, health, coordinates or progression to bypass gameplay.

The Vesperfall Surestep acceptance workflow retains exact tested source and diagnostics. Final publication must run tests/verify-live.py to compare every runtime/asset/document/workbook byte, repeat the Surestep browser journey with TEST_BASE_URL=https://v5ma.github.io, and launch the real homepage game card with tests/launch.py. A branch commit alone is not publication. Workflow artifacts and source revisions are the evidence, not this plan's existence.

Physical Quest 3 controller tracking, hand occlusion/pinch reliability, handedness, seated/standing reach, comfort, thermal behavior and sustained performance are not certified by emulation. Physical Xbox reconnect/suspend and human animation/audio review remain open.

## Remaining work and rollback

V41 water-menu parity is the bounded next-roadmap item addressed here. V41 as a whole remains Partial. V14/V54 advance through procedural articulation, not a finished licensed/LOD asset pipeline. V61 full remapping/calibration remains open. Continue V74 water budget/rebuild/contact corrections and V58/V44 sound/music. Do not mark physical or human gates complete from automated runs.

To roll back, revert the scoped Surestep source/release/workbook changes together, or restore the vesperfall directory from the baseline commit while retaining all unrelated master changes. Never clear player localStorage or downgrade saved progress to revert artwork. This release adds no save schema or generator version.

## Design references and provenance

Daniel Holden, Inverse Kinematics and Foot Locking: https://theorangeduck.com/page/inverse-kinematics-foot-locking

Daniel Holden, publications: https://theorangeduck.com/page/publications

W3C WebXR Hand Input Module: https://www.w3.org/TR/webxr-hand-input-1/

These are technical references. The implementation is independently written for Vesperfall's original procedural meshes; it does not import reference character assets or claim to reproduce the complete article's inertialization pipeline.
