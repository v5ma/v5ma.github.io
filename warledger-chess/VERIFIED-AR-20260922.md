# Verified illustrated AR tabletop release

Verified on September 22, 2026 Pacific time (September 23 UTC). Runtime release: ar-blocks-20260922-3.

Play: https://v5ma.github.io/warledger-chess/ar.html

The implementation is published directly on master, not an unmerged PR. Initial implementation commit: 12b23e08ccf50ca588af089d330a7313225f55a1. Final runtime correction: 413ef77ce1ddc8070710bd95205bc9c1e0716bea. Successful tested commit, including deterministic browser input tests: edd02d2e2969f73c3dabeba99f20ab540bf0fbb8.

## Successful deployment and tests

GitHub Pages build, deploy, and report jobs all succeeded: https://github.com/v5ma/v5ma.github.io/actions/runs/35819913500

The dedicated War Ledger Chess checks workflow succeeded: https://github.com/v5ma/v5ma.github.io/actions/runs/35819914074

Its seven Node test entries passed, covering the existing engine and piece-card tests plus the new artwork, save, and input contracts. Real Chromium with software WebGL then passed the complete browser sequence both against the checked-out source and against the public GitHub Pages game. The verification required all eight deployed runtime/artwork files to match the tested source byte-for-byte.

The actual local-report.json and live-report.json both say passed: true. Checks cover the camera facing the board, texture decoding, all 32 initial cuboid pieces, mouse moves for white and black, world-space market/cancel controls, eleven-design artwork gallery, a promotion target hidden by its selected pawn, licensed Chancellor promotion, shared save and undo across AR and 2D pages, reset confirmation, Xbox frame polling and B cancellation, and synthetic XR ray selection.

The downloaded live-board.png and live-gallery.png screenshots show the real generated artwork on the playable cuboids. These are rendered screenshots, not concept illustrations. Reports, screenshots, exact checked source, the loaded A-Frame library, and deployment hashes are in artifact warledger-chess-browser-evidence, ID 10733091352. The artifact is subject to GitHub retention (reported expiry December 22, 2026); this document preserves the outcome after that artifact expires.

## Scope and limitations

The six standard and four fairy engine piece types have icon front/back textures and rendered portrait side textures, team-colored bases, and top identifiers. The engine D remains Chancellor, displayed Cn. The Dragon is an eleventh artwork preview in the gallery, not a newly invented legal piece. Both pages use the unchanged rule engine and share local saves. Play remains two-player local hotseat; no online opponent or computer AI is claimed.

AR/VR entry, controller tracking/rays, tracked-hand pinch interaction, in-scene menus, board resize/height/placement, and passthrough background handling are implemented. A physical Quest 3 was NOT available. No physical passthrough, immersive session, hand tracking, controller tracking, or real-surface placement validation is claimed. Xbox inputs and XR rays in the automated checks were simulated. The successful test did not invoke the gamepad polling method manually: it supplied a simulated gamepad to the actual A-Frame frame loop and released each button when that loop consumed it.

Earlier failures remain available in Actions. The backwards camera and occluded target were fixed in runtime code. The remaining intermittent gamepad-test misses/repeats were resolved by synchronizing simulated presses to consumed frames instead of wall-clock sleeps; expected gameplay assertions were retained.

## Runtime integrity

ar.html SHA-256: 43c9d592c55935f00783010043ba178432c06a5c235a509cb11c903a74c35cdc

warledger-ar.mjs SHA-256: f0bd340f5f10edd78fcccb612920b09c511681a9a8fd56a5340c535ec59a1310

assets/piece-faces.webp SHA-256: 3c5020402500609b5ed08431d12beb178cd02ba4740b033b1d1ae84b848e55e9

## Continuation

Read current master, README-AR.md, AR-RELEASE-NOTES.md, this verification record, and newer test evidence before editing. README-AR.md's initial release identifier is historical; this runtime is revision 3. Preserve saves, engine rules, and concurrent work on other games. Next priorities are physical Quest playtesting, higher-resolution face textures, smaller-screen framing, and interface refinement. Publish completed upgrades directly to master with safe non-forced updates and verify the public game. This documentation-only receipt does not alter the tested runtime.
