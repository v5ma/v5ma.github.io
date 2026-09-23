# Clear Shoals / Water Optics upgrade in progress

Fresh baseline master: 562999d05f3f70df4b57dfc185d25941c28a1d34.
Latest Prism runtime: ac1771187c57e74621811a078cfbbf0994f49eae, Color Match
0.13.0. Preserve per-hand color switching, 120 base / 40 matching rewards,
separate scoring ledger and the enlarged-fruit badge fix. Historical documents
still describing these as unimplemented are stale. Preserve every existing AR
island/grass/cloud, health, difficulty, late boss, menu and audio path.

This first checkpoint saves a reusable optical-data generator and license
notice only. It is not loaded by index.html yet and changes no live graphics.
Eight new local data tests and all 423 prior tests pass (431 total). Tests and
the actual material integration are saved in the next checkpoint.

Clearwater at 4bc826134321043a25df3c2b6fed16fb7b9241e8 uses raw WebGL2,
float render targets, FFT waves and an opaque scene pipeline, not a drop-in
Three.js or transparent AR module. Its MIT license is retained for the adapted
Fresnel helper. This pass uses original seeded micro-wave/pebble data and a
loading-time refracted-light flux bake, rather than replacing the game renderer.
The bake conserves flux before display clamping and exposes filtered slope
moments for less aliased highlights. Fixed-depth precomputed caustics are an
approximation, not live ray-traced lighting or Clearwater's full simulation.

Do not alter water geometry, input, collision, scoring, saves or the .35-second
stall safeguard. Preserve saved AR opacity and near-viewer room visibility.
No PR, branch, publishing helper, private hub or sibling-game changes.
