# Gloamward — browser archery prototype

A separate original A-Frame game in the public SVGN Interactive collection. Open `index.html` through an HTTP server, or use the Gloamward card on the public homepage. No installation, account or private story source is needed. All required runtime code is served from this project, including a pinned, licensed A-Frame 1.8.0 build.

## Play

Cross three connected seeded courtyards. Clear each encounter, choose a run upgrade and reach the final glowing gate. Standard arrows are unlimited. Shatter and snare arrows consume special charges. Teleport arrows must hit accessible clear ground; closed gates and cover obstruct them.

**Desktop:** WASD to move, arrow keys or drag to look, hold/release F or left mouse to shoot, hold T during release for teleport, Q to change arrows, P/Escape to pause. Touch controls provide movement, drag look, draw, teleport and arrow selection. Release a bow before pausing; a pause cancels the draw rather than firing it.

**Quest/WebXR preview:** Open the HTTPS page in a compatible headset browser and select Enter VR preview. The left controller holds the bow by default. Bring the right controller near the string, hold its trigger, draw away, and release. Hold its grip during release to use a teleport arrow. A changes arrow; B pauses. Right-stick snap turning is the default. Slow left-stick movement is optional. Bow-hand swapping and Exit VR are available in the spatial menu. Tracking loss cancels the draw. Physical Quest 3 calibration, performance and comfort are still open checks, not certified by desktop or emulated XR tests. Stop if movement is uncomfortable.

## Persistence and limits

Only local settings, best score and completed/failed run count are saved. Closing the page does **not** save the current encounter. There are three courts in this first version; side cover varies with the seed. It is not an infinite streamed world, multiplayer game, commercial-quality replacement or a copied campaign. The companion Vesperfall development branch is separate and is not merged by this release. Other public apps and private material are unchanged.

## Development

From the repository root: `python3 -m http.server 4173 --bind 127.0.0.1`, then visit `/gloamward/`.
Run model tests with `node --test gloamward/tests/core.test.mjs`. Native browser tests use Playwright and actual HTTP/WebGL in the repository workflow; physical hardware requires a person with the device. The roadmap distinguishes implemented code, automated checks and physical-device acceptance. New releases must pass the exact-source workflow and served-file hash comparison.

Technical reference: https://aframe.io/docs/1.8.0/introduction/installation.html
