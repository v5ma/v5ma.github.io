# Control Room v0.3.0 verification record

Status: candidate under verification. The checkboxes in AAA_CHECKLIST.md distinguish implemented features from outstanding acceptance.

The current upgrade adds controller timing practice, controller UI navigation, independent persisted music/effects controls, sound/text density controls and transport cancellation. Existing songs, scoring equations, blade geometry, Jewelbox graphics and record storage key are preserved. Gamepad timing records use a new input-mode suffix.

Automated receipts will be attached to the release pull request and GitHub Actions. Pure tests are fixtures, browser gamepads are emulated, and neither establishes physical Xbox/Quest acceptance. A real browser with the production renderer and music is required for the browser acceptance claim. Public deployment requires a separate check after merging.

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

Physical acceptance remains OPEN: real standard controllers over USB/Bluetooth, physical Quest tracking and comfort, sound-output latency, sustained thermal/performance measurements, Safari/Firefox and mobile-browser matrix. Browser security may require an initial click or keypress to unlock sound. In-headset sound-menu navigation is a future item; the current mixer is a desktop/browser control.

No new commercial music, camera access, room scans, analytics, cloud accounts or remote score storage are added.
