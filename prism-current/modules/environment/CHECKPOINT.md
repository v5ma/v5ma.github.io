# Currentworks checkpoint / water integration

Water source was recovered and saved directly to master as d5e716cd902a62830c3080d0387166cc09eeddb8. That initial checkpoint deliberately did not change the entry point. This subsequent checkpoint wires the same versioned module into RiverArt and preserves tests, API documentation and the next-pass plan.

The current water module SHA-256 is 8f2a03185a6f8de5a971016a38b1cef7372cdff85ce17a7f0ba1b37ff555093b. Its saved Git blob 85f37fe643592f88b66d8b37c2dc4846706d6f7b matches the recovered local source exactly. The intended runtime edits are index.html, river/art.js and graphics metadata in release.json; app.js, core.js, audio, XR and Rotunda logic, score formats and retained entries are not changed.

Revalidation this recovery: 266 Node tests pass in the recovered checkout (250 existing plus 16 water checks); the three later source-integration tests already on master are separate from that recovered count. All 37 actual bundled-Three object/ownership checks passed. The actual exported river water GLSL compiled, linked and rendered in Mesa GLES3.2; 9457 GPU vertex samples matched the CPU query within 6.993e-6 metres. Those are isolated shader/object checks, NOT a native browser battle or physical Quest test.

The local Chromium WebGL2 probe returned null. Native rendering and public-file comparison therefore remain the existing GitHub Actions verifier's responsibility. Do not claim a fully verified live upgrade until its actual source and public reports are inspected. Check the current master and workflow outcomes before resuming; source durability and deployment are different facts.

Next: complete water native/public acceptance and handle any revealing failures without weakening gameplay tests. Then implement the independent Fire module, followed by Trees as documented in ROADMAP.md. The earlier Tide + Ember combined patch is recoverable source, not authorization to overwrite newer Prism files. No new PR, staging branch, private hub, portals or sibling-game changes belong in this work.
