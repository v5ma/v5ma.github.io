# Practice Lab v0.5.0

Choose a track and Flow or Pulse, then change Session to Practice Lab. Select a section and 60%, 75%, 90% or 100% speed. All four existing songs are supported. Tidal Bloom uses its eight named sections; the original three tracks use their existing eight-bar phrase groups. The normal Play control starts the selected session. Menu on a standard Xbox-style pad starts it in gamepad timing mode.

Every attempt has a four-beat count-in. Optional count-in clicks follow the music-volume and mute settings. Slower playback lowers musical pitch; this release does not perform pitch-preserving time stretching. Notes are spread over the same slowed timeline, but physical collision rules and real-time timing windows are unchanged.

Only targets belonging to the selected source section are included. Source charts and cached original audio are not mutated. The section is copied into one temporary stereo buffer with a lower declared sample rate, four count-in beats, an 8 ms edge fade and a short silent tail. This bounded copy is replaced between practice runs and discarded on exit. The existing one-source audio transport still handles pause, resume and cancellation.

A completed practice pass stores its best score, best quality and completion count under prism-current.v1.practice. Keys include song, chart, device mode, section, speed and chart version. Even 100% section practice cannot overwrite a full-song record. Incomplete attempts are not saved. Malformed practice records are ignored; full-song, mixer and graphics preferences are untouched.

The results screen offers Repeat section and Play the full song. A full-song result additionally offers practice of its weakest section. Automatic repeating is off by default. When enabled, each completed pass has a 5-second results review, followed by a new attempt and count-in. Input during review, leaving the window, opening the mixer or losing the controller stops that pending repeat. A disconnected controller also pauses an active gamepad run, and reconnection never automatically resumes it.

The D-pad/left stick, A, B, Menu and View retain their existing roles. New controls remain in the normal controller navigation. Practice Lab is a browser rehearsal mode, not an in-headset settings expansion; entering AR/VR starts a fresh full-song run. Physical Xbox/Quest acceptance, pitch-preserving stretching, arbitrary loop markers, user-file import and first-run interactive teaching are not delivered by this release.

## Verification

The practice fixtures derive every section at all four speeds for both charts of all four tracks, reconcile note positions/times, verify the unchanged scoring window, check copied PCM/count-in/duration, isolate practice saves and test cancellation. Integration fixtures verify that completion bypasses the standard record writer and resume uses the cropped audio id.

The production-browser test uses emulated controller input for two actual-time practice passes, repeat cancellation, mixer/pause, disconnect/reconnect and return to a full song. The Tidal suite additionally exercises the weakest-section shortcut after completing the full song. No browser test writes scores, judgments or clocks. The existing golden audio/chart tests and desktop/pointer/emulated-XR/art suites remain.

Run node --test prism-current/tests/*.test.cjs, then serve the repository and run python prism-current/tests/practice-browser.py with Playwright Chromium. Browser HTTP navigation is blocked in the local development environment, so the actual hosted source/public browser checks run in GitHub Actions. Read their recorded outcome rather than treating this procedure as a pass. Reduced software-renderer drawing buffers are for functional checks, not physical frame-rate certification.
