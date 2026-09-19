# Prism Current / River Prism 0.10.0

The main entry is [index.html](index.html): Duck Armada and Mothership Channel, the owner's rhythmic action toybox. The river approaches and changes height across musical phases. Slice marked fruit, shoot catapults/boats/aircraft, shield incoming hazards and destroy the boss before the song ends.

This is a playable first version, not a declaration of AAA completion or human enjoyment. Both chapters use the existing original 132 BPM Undertow soundtrack. Read [RIVER_PRISM.md](RIVER_PRISM.md) for mechanics, controls, limits and save isolation. [AAA_CHECKLIST.md](AAA_CHECKLIST.md) is the active production board. [QA.md](QA.md) and PR #193 identify the source/public evidence and remaining acceptance.

## Entry points

[index.html](index.html) is the River action game. [rhythm.html](rhythm.html) retains the previous Undertow rhythm game, all five tracks, lessons and Practice Lab. [water-mission/index.html](water-mission/index.html) retains Floodgate Recovery. All prior scripts and score namespaces remain; River battle clears have a separate record key.

## Direct controls

Quest: tracked saber swings slice fruit, triggers fire lasers, grips turn that hand's saber into a shield, and B/Y pauses. The paused spatial menu supports controller pointing and hand pinches. Combat requires both tracked controllers. Lean/crouch within a clear, bounded play position; the rising river never drives the headset camera. AR is a transparent stage, not a scanned-room simulation.

Xbox-style pad: right stick aims; A/X swings left/right; D-pad selects a cut direction; LT/RT fires; LB/RB shields; left stick sidesteps; B or stick-down crouches; Menu pauses. Mouse/keyboard and touch action controls are explained in the game's Controls panel.

## Development and verification

Main implementation: river/core.js, river/app.js, river/art.js and river/xr.js. The new pure and native acceptance suites are tests/river*. Model tests do not replace production-renderer input playthroughs; emulation does not certify physical Quest/Xbox/touch comfort or performance. Failing traces and the exact tested/public commits belong in the release receipt, not hidden behind a test count.

Legacy acceptance explicitly uses rhythm.html and rhythm-release.json; the River main entry has its own two-chapter playthrough. Retain old behavior and saves without claiming that an old-game pass proves a new-game feature. Only completed battles with a defeated boss count as River clears. Cruise mode does not bypass the boss requirement and stores results separately from Arcade.

The prior README and its original credits, dependency licenses and development history are preserved at [README-v090.md](README-v090.md). Vendored A-Frame notices and integrity metadata remain in vendor/. Original soundtrack notes remain in MUSIC_NOTES.md and UNDERTOW.md. No external music, camera feed, analytics or cloud score storage is added by River.

Rollback should revert only this scoped release on current master and redeploy. Do not reset the repository, remove sibling-game upgrades or clear localStorage. The older detailed production board remains at AAA_CHECKLIST-v090.md and its linked archives.
