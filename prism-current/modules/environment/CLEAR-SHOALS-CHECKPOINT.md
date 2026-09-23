# Clear Shoals / Water Optics 0.2.0 checkpoint

First durable save: d0fccef13fab90bc420a995f806fc33c533c0ab6 saved optical data
and attribution before integration. This pass now upgrades the existing Water
Optics attachment in the normal Prism entry. Water 0.1.0 geometry, height query,
wakes, splashes, host clock and saved opacity are untouched. Color Match 0.13.0
including badge visibility, base/match points and old record preservation stays
intact. The full game is not replaced by a standalone ocean demonstration.

The extension adds two mipmapped loading-time RGBA8 textures: a 128-square
slope/moment/caustic atlas and a 256-square original pebble-bed texture. Base
texels use 327680 bytes total (about 437000 including mips, before driver
overhead). No float render target, FFT pass, scene reflection, postprocess or
passthrough image sampling is added. Caustics are precomputed refracted-light
flux at reference depth 1.25, then advected by the host clock; they are not
re-simulated from current geometric waves. This is an affordable approximation,
not the complete Clearwater renderer or equal-fidelity/performance claim.

Clearwater commit 4bc826134321043a25df3c2b6fed16fb7b9241e8 is the reviewed
primary source. Its MIT notice and adapted Fresnel attribution are retained in
CLEARWATER-NOTICE.txt. The seed spectrum, data bake, pebble generation and
reversible Three.js material integration are independently authored.

Local checks: all 431 model tests and 19 new actual bundled-Three resource,
shader-contract and cleanup checks pass. The existing AR-island/grass object
suite also passes. Local WebGL2 is unavailable; these are not GPU renders or
physical Quest measurements. A separate Clear Shoals job added to the existing
read-only Prism verifier tests actual pixels and a full Easy tracked AR run.
Original workflow contents are unchanged before that added job. Its source
and public reports must be inspected before calling the new graphics verified.

Known earlier Color Match/AR Tide frame and input failures remain open. Do not
weaken the .35-second safeguard, auto-resume failures or assign game state to
obtain a pass. The old AR optics zero-texture assertion is updated to the new
explicit two-texture budget while retaining zero scene-copy passes; gameplay
assertions remain unchanged. No PR, branch, new workflow, private hub or sibling
game changes. Next inspect source/public artifacts and actual images, record
failures honestly, and retain current controls and room visibility.
