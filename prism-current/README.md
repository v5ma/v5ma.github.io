# Prism Current / River Prism 0.10.1

The main entry is [index.html](index.html): Duck Armada and Mothership Channel, the owner's rhythmic action toybox. The river approaches and changes height across musical phases. Slice marked fruit, shoot catapults/boats/aircraft, shield incoming hazards and destroy the boss before the song ends.

The 0.10.1 repair addresses the owner's blocked XR menu. See [XR_MENU_HOTFIX.md](XR_MENU_HOTFIX.md). Point plus trigger selects the actual displayed button with a visible hit cursor. Either thumbstick highlights an option and A/X confirms. B/Y starts or resumes without needing a ray, and pauses during battle. A native-shaped source-list regression replaces the mistaken assumption that inputSources is a normal JavaScript array. Physical Quest confirmation is still a separate gate.

This is a playable first version, not a declaration of AAA completion or human enjoyment. Both chapters use the existing original 132 BPM Undertow soundtrack. Read [RIVER_PRISM.md](RIVER_PRISM.md) for mechanics, controls, limits and save isolation. [AAA_CHECKLIST.md](AAA_CHECKLIST.md) is the active production board. [QA.md](QA.md) and PR #193 preserve the initial release evidence; the XR repair's PR records its own subsequent source/public results.

## Entry points

[index.html](index.html) is the River action game. [rhythm.html](rhythm.html) retains the previous Undertow rhythm game, all five tracks, lessons and Practice Lab. [water-mission/index.html](water-mission/index.html) retains Floodgate Recovery. All prior scripts and score namespaces remain; River battle clears have a separate record key.

## Direct controls

Quest: tracked saber swings slice fruit, triggers fire lasers, grips turn that hand's saber into a shield, and B/Y pauses during combat. The paused spatial menu supports controller pointing and hand pinches, plus thumbstick/A-X navigation and a direct B/Y start-or-resume shortcut. Combat requires both tracked controllers. Lean/crouch within a clear, bounded play position; the rising river never drives the headset camera. AR is a transparent stage, not a scanned-room simulation.

Xbox-style pad: right stick aims; A/X swings left/right; D-pad selects a cut direction; LT/RT fires; LB/RB shields; left stick sidesteps; B or stick-down crouches; Menu pauses. Mouse/keyboard and touch action controls are explained in the game's Controls panel.

## Development and verification

Main implementation: river/core.js, river/app.js, river/art.js and river/xr.js. The pure and native acceptance suites are tests/river*. The XR menu suite reproduces the old error using its old module, then exercises the actual repaired page in AR and VR. Model tests do not replace production-renderer input playthroughs; emulation does not certify physical Quest/Xbox/touch comfort or performance. Failing traces and the exact tested/public commits belong in the release receipt, not hidden behind a test count.

Legacy acceptance explicitly uses rhythm.html and rhythm-release.json; the River main entry has its own two-chapter playthrough. Retain old behavior and saves without claiming that an old-game pass proves a new-game feature. Only completed battles with a defeated boss count as River clears. Cruise mode does not bypass the boss requirement and stores results separately from Arcade.

The prior README and its original credits, dependency licenses and development history are preserved at [README-v090.md](README-v090.md). Vendored A-Frame notices and integrity metadata remain in vendor/. Original soundtrack notes remain in MUSIC_NOTES.md and UNDERTOW.md. No external music, camera feed, analytics or cloud score storage is added by River.

Rollback should revert only the scoped release or repair on current master and redeploy. Do not reset the repository, remove sibling-game upgrades or clear localStorage. The older detailed production board remains at AAA_CHECKLIST-v090.md and its linked archives.
