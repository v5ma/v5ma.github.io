# Control Room v0.3.0 verification record

Release discussion and actual source/publication receipts: [PR #112](https://github.com/v5ma/v5ma.github.io/pull/112). Read the final receipt together with its matching workflow conclusion; an implementation checkbox alone is not proof of test or deployment success.

## Scope

The upgrade adds controller timing practice, controller UI navigation, independent persisted music/effects controls, sound/text density controls and transport cancellation. Existing songs, scoring equations, blade geometry, Jewelbox graphics and the record storage key are preserved. Gamepad timing records use a new input-mode suffix. The unchanged scoring core reports 0.2.0; the application/release version is 0.3.0.

A separate `render-ready.js` helper prepares first-use materials offscreen before the soundtrack starts, restores renderer/XR state, waits for steady render frames and disposes its temporary resources. It never changes the audio clock, timing window, scores or controller poses. A device that remains too slow receives a request to choose Light graphics instead of starting an already-stalled song. The in-play 0.3-second stall guard remains unchanged.

`AAA_CHECKLIST.md` tracks implemented work and open physical acceptance. F-02, F-03 and F-04 are recurring release gates, not permanently completed project features. Their result belongs in the release PR receipt; the next release must run them again.

## Automated source acceptance

The source workflow runs the release manifest, dependency integrity checks and all Node fixtures. The suite covers transport cancellation, a single soundtrack voice, independent volumes, effect cooldown/voice cap, standard-pad edges, XR-pad exclusion, separate score categories, legacy records, async resume/abort and warm-up resource/state restoration.

The native controller suite uses the production renderer and locally synthesized soundtrack in Chromium with an emulated standard controller. It exercises mixer navigation, independent gains, Music only, an audio-timed lane hit, pause/resume, modal focus/background isolation, disconnect/reconnect, aborted-run score isolation and preference reload.

Existing native suites check full-song keyboard completion, pointer slicing, emulated AR transparency/tracking recovery and Jewelbox materials/presets. Tests do not inject scores or accelerate the application clock.

### Software rasterization boundary

These GitHub runners use CPU software WebGL, not a consumer graphics card. Larger Cinematic drawing buffers triggered the game's existing frame-stall protection; the new readiness gate also correctly refused to begin when preparation could not become steady. This is not a passed performance measurement, and no consumer/headset frame-rate claim follows from these tests.

Functional desktop/pointer tests therefore use a one-eighth device pixel ratio with a normal 1280x1000 CSS viewport. Controller tests use a quarter ratio at 1280x900. The visual suite separately captures real 1440x1050 before/after menus, checks all materials and quality presets, and observes active Cinematic play in a 200x150 viewport. Graphics materials and game timing rules are unchanged by these test settings. Physical performance targets remain open checklist items.

An earlier controller test used fixed-duration input pulses that could disappear between slow rendered frames. Input edges are now presented across actual browser frames instead. That does not change gameplay timing windows or award synthetic points.

## Public acceptance

After merge, `Verify published Prism Current` compares committed Prism runtime/documentation hashes with GitHub Pages files. It then exercises the public homepage-to-game path, full original-song keyboard completion and public controller/mixer flow. Shared homepage file hashes are not pinned, allowing concurrent upgrades to other games; the actual homepage card is still tested.

A successful source run is not a successful public run. The final PR receipt records the merge SHA, public workflow and outcome. Workflow artifacts contain manifests, JSON reports and screenshots, subject to their retention period.

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

Real standard controllers over USB/Bluetooth, physical Quest tracking and comfort, sound-output latency, sustained thermal/performance measurements, and the Safari/Firefox/mobile-browser matrix remain OPEN. Browser security may require an initial click or keypress to unlock sound. The current mixer is a browser control; an in-headset sound menu is a future item.

No new commercial music, camera access, room scans, analytics, cloud accounts or remote score storage are added. To roll back this release, revert PR #112 on the current master branch and redeploy; do not reset the entire repository and discard unrelated game upgrades.
