# Currentworks checkpoint / completed first water pass

The Water 0.1.0 module is implemented, integrated into River Prism, and verified on the live site. Application version remains 0.11.1; unchanged Rotunda/XR component revisions remain 0.11.0. Open the normal Prism main entry, not a separate showcase. Module use and limitations are in README.md; later work is in ROADMAP.md.

Durable direct-master checkpoints: d5e716cd902a62830c3080d0387166cc09eeddb8 saved standalone source; f0a2a9cccfff14e9372b05108edd53cbce0fb59b integrated it and saved documentation/tests; 8ed136e84b9d18dcdfc54ef429ab6ecbaf989047 repaired Prism-local Node package scope; 03ae182699ce98d573da6eed5751341cb8433e14 corrected the test-input producer and recorded the first live results. The final checkpoint is documentation/evidence only. No PR, staging branch or write-enabled CI was created.

The water module SHA-256 is 8f2a03185a6f8de5a971016a38b1cef7372cdff85ce17a7f0ba1b37ff555093b. Integrated river/art.js is 5d66110a6d0e7ed264288a37c8850f080efa4445516051b2bf3e00a3f47c0002. The only altered original browser entries/runtime are index.html, river/art.js and graphics metadata in release.json. The other 41 of 44 audited original runtime/asset files, including app, core, audio, XR/Rotunda and retained modes, remain byte-identical to the baseline.

## Actual live acceptance and the remaining source issue

Public run 35641244480, checked commit 03ae182699ce98d573da6eed5751341cb8433e14, matched all 96 manifest-listed Prism files and passed all 105 public checks: 13 water, 19 delayed-audio interruption, and 73 Rotunda checks. No script or shader errors were captured in the three reports. Both ordinary Arcade chapters were completed through real input handlers. The actual 1440x1000 live entry screenshot was inspected separately from reduced-buffer gameplay testing. PUBLIC-PASS1.json records the exact artifact digest, results and scope.

The source job passed 269 model/lifecycle/integration tests and 37 real bundled-Three object checks. Its water and interruption suites passed. Its first broader Rotunda attempt reached 45 checks then failed at a VR opacity interaction; an unchanged source retry reached 30 checks then failed at an AR music-adjustment interaction. Both failed traces are retained. The same unchanged bytes and script completed all public checks. SOURCE-RETRY-PASS1.md identifies the remaining animation/input synchronization issue and the next reproduction step; no physical-device diagnosis or blanket green CI is claimed.

The earlier root-package and short-input-pulse failures remain in VALIDATION.md and ACCEPTANCE-PASS1.md. All fixes preserved assertions and gameplay. Independent Mesa GLES renders and CPU/GPU wave comparisons are isolated shader evidence, not physical Quest or browser performance certification.

## Resume here

First inspect this file, PUBLIC-PASS1.json, SOURCE-RETRY-PASS1.md and the latest verifier outcomes, then fetch current master. Do not revert or reapply the recovered archive. Water accepts the host THREE namespace, absolute pausable clock and local-space observations; it does not own rendering, input, camera, storage or gameplay state. Keep the existing AR opacity, quality/quiet settings, scene placement, controls and saves.

Before adding visual cost, complete the input-consistent source UI reproduction in SOURCE-RETRY-PASS1.md. The next graphics implementation pass is a separate Fire module with the same explicit update/reset/dispose ownership. Support burst, jet and surface-impact emission without replacing the user's saber-laser mechanics. Integrate only actual host effects, with bounded pools and a clear distinction between decorative fire and gameplay blast radius. Save its standalone usable source before the main-game adapter. Trees follow as a separate seeded geometry/wind/LOD module, then coherent visual refinement and device-informed polish. Fire and trees are not yet implemented by this first water pass.

Physical Quest/Xbox/touch, sustained normal-resolution performance, stereo appearance and owner judgment against the reference images remain open. Five passes are a plan, not a guarantee that additional refinement will be unnecessary. No private hub code, portals, sibling-game rewrite or saved-progress reset is authorized.
