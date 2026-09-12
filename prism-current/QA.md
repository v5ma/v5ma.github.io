# Control Room v0.3.0 verification record

Release discussion and actual source/publication receipts: [PR #112](https://github.com/v5ma/v5ma.github.io/pull/112). Read the final receipt in that discussion together with the matching workflow conclusion; an implementation checkbox alone is not proof of test or deployment success.

## Scope

The upgrade adds controller timing practice, controller UI navigation, independent persisted music/effects controls, sound/text density controls and transport cancellation. Existing songs, scoring equations, blade geometry, Jewelbox graphics and the record storage key are preserved. Gamepad timing records use a new input-mode suffix. The original scoring-core version remains 0.2.0; the application and release version are 0.3.0 because chart/scoring rules were deliberately not revised.

`AAA_CHECKLIST.md` tracks implemented work and open physical acceptance. F-02, F-03 and F-04 are recurring release gates, not permanently completed project features. Their result for each release belongs in its PR receipt. The next release must run them again.

## Automated source acceptance

The source workflow runs the release manifest, dependency integrity checks and all Node fixtures. The suite includes transport cancellation, single soundtrack voice, independent music/effects volumes, effect cooldown and voice cap, standard-pad edges, XR-pad exclusion, separate score categories, legacy-record preservation and async resume/abort behavior.

The new native controller suite uses the production renderer and locally synthesized soundtrack in Chromium with an emulated standard controller. It exercises mixer navigation, independent gains, Music only, a real audio-timed lane hit, pause/resume, modal focus/background isolation, disconnect/reconnect, no records for an aborted run and preference reload.

Existing native suites check full-song keyboard completion, pointer slicing, emulated AR transparency and tracking recovery, and Jewelbox materials/presets. Tests do not inject scores or accelerate the application clock. Software-rendered gameplay tests use a quarter pixel ratio; the art suite separately captures full-resolution menus. These are correctness tests, not consumer GPU or headset frame-rate measurements.

An early controller test used fixed-duration input pulses that could be missed between slow software-rendered frames. The test now presents input edges across actual browser frames. This correction does not change gameplay timing windows or award synthetic points.

## Public acceptance

After merge, `Verify published Prism Current` compares committed Prism runtime/documentation hashes with files served by GitHub Pages. It then exercises the public homepage-to-game path, full original-song keyboard completion, and the public controller/mixer flow. Shared homepage file hashes are intentionally not pinned, so concurrent releases of other games can proceed; the actual homepage card is still tested.

A successful source run is not the same as a successful public run. The final PR receipt records the merge SHA, public workflow and outcome. Receipts include manifests, JSON reports and screenshots as workflow artifacts, subject to their retention period.

## Reproduction

Run from repository root:

```sh
python prism-current/tests/verify.py
node --test prism-current/tests/*.test.cjs
python -m http.server 4173 --bind 127.0.0.1
# In another terminal, with Playwright Chromium installed:
python prism-current/tests/control-browser.py
PRISM_SUITE=desktop python prism-current/tests/browser.py
PRISM_SUITE=xr python prism-current/tests/browser.py
python prism-current/tests/pointer.py
```

## Open hardware and platform gates

Physical acceptance remains OPEN: real standard controllers over USB/Bluetooth, physical Quest tracking and comfort, sound-output latency, sustained thermal/performance measurements, and the Safari/Firefox/mobile-browser matrix. Browser security may require an initial click or keypress to unlock sound. In-headset sound-menu navigation is a future item; the current mixer is a desktop/browser control.

No new commercial music, camera access, room scans, analytics, cloud accounts or remote score storage are added. To roll back this release, revert PR #112 on the current master branch and redeploy; do not reset the entire repository to an old commit and discard unrelated game upgrades.
