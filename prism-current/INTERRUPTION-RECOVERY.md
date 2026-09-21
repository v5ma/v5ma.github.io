# Rotunda Recovery 0.11.1 / interrupted audio-resume repair

This is a Prism-only reliability patch over the Rotunda interface. It retains the pedestal, controller/floor HUD, actual transformed menu picking, AR opacity, room movement and same-mode paused XR re-entry. It does not introduce another side mode, change music or combat rules, publish private hub code, or touch sibling games.

## Reproduced source failure

In 0.11.0, resume() awaited audio.play() while the game phase was still paused. If XR visibility disappeared or the session ended during that await, pauseRun() returned without cancelling it because the phase was not playing. When the audio promise later completed, the old resume continued into playing. It also cleared busy in finally even when a newer request owned that flag. This was reproduced with actual component methods and controlled audio/session collaborators, not observed on a physical Quest in this session.

The new pending-pause branch invalidates the operation and audio tokens, releases held input, and retains the existing battle. Start and Resume require the same visible, calibrated XR session after asynchronous work, or a visible screen context for screen play. Late success and failure cannot unlock a newer request or replace its message. A visibility recovery does not reuse an interrupted Resume: the player must deliberately resume again.

## Evidence and scope

The ten new lifecycle tests produced seven failures and three passes against the old component, and ten passes after the repair. The entire recovered local model suite passes 250 tests. This is deterministic model evidence, not native-renderer or physical-device acceptance.

The new native transport-browser.py uses the production renderer and audio transport. It deliberately delays resolution of the real AudioContext.resume promise, then delivers emulated headset visibility or session-end events. This is explicitly fault injection into an environmental collaborator. It uses normal B/Y input and never assigns game position, health, score, time, or completion. The same AR/VR battle must remain paused, preserve progress, and resume only after a fresh input. Normal two-chapter, transformed-control, room-movement and save checks remain in rotunda-browser.py.

The read-only Rotunda workflow performs both native suites and verifies exact served files on pushes. Its completed reports, failure traces and release discussion determine actual acceptance; a written test is not a passing result. Local WebGL2 is unavailable, so no local browser or physical-device playtest is claimed.

The application and browser title identify 0.11.1, and the changed app URL is cache-versioned. The unchanged layout and XR-input modules still identify their 0.11.0 component revision. Their controls, transforms, picking geometry, art and shader bytes are unchanged by this repair. Combat core, soundtrack, old rhythm entry, lessons, Practice Lab, Floodgate and save schemas are unchanged. No save migration or clearing is needed.

The earlier incomplete publication and Home-snapshot test work is retained in ROTUNDA-RECOVERY.md and PRs #205/#209. New results should state which exact source and public build were exercised. Physical Quest/Xbox/touch, performance, readability, and the owner's color-bonus/hazard-rule requests remain open. Roll back only this patch on current master, never the repository or saved progress.
