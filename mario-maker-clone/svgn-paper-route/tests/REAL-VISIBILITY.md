# Native visibility acceptance

The sensory suite must run with the pinned Playwright 1.57.0 driver, headed Chromium under Xvfb, and `real-visibility.py`. The wrapper changes only Playwright's forced-focus option in its own driver session and restores the original file in a finally block. It does not assign document.hidden, inject visibility events, or modify game state. A changed driver statement fails closed and requires review.

The exact invocation is `xvfb-run -a python mario-maker-clone/svgn-paper-route/tests/real-visibility.py mario-maker-clone/svgn-paper-route/tests/sensory-browser.py`.

The native test requires the real page to become hidden, then visible again; it requires zero ambient sources while hidden and a paused route after return. Empty-tab diagnostics established that the unmodified Playwright focus override prevented real visibility changes. After correcting that test environment, the game revealed a genuine double-toggle defect: blur paused the route and the subsequent hidden handler toggled it back to play. The delivery visibility handler now requests pause only when the route is not already paused. `delivery-visibility.test.mjs` separately evaluates the actual handler in an isolated event-state fixture for both event orders and inactive screens.

Retain the failed headless, headed/forced-focus and corrected-driver candidate reports. A passing native result must establish the runtime correction; it must not be inferred from the helper alone. This does not qualify actual headset suspension, operating-system sleep, or physical-device audio comfort.
