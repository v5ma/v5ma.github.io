# Verified tactical and comfort pass

Runtime release: ar-tactical-20260922-4.

Play: https://v5ma.github.io/warledger-chess/ar.html?v=ar-tactical-20260922-4

Published directly to master in commit 8a897735ba4e85effee42b8f5abb758c33d30ef5. The prepared commit 9417c98b728652e31c316b2d19f46d6ea611a8d0 was not published because master had advanced. The final commit was safely rebuilt on current master, preserving concurrent work. A later comparison against 5e1cb8be69d322046696beffb11e46cc29507092 showed only Rainward changes and no modifications to this tested chess runtime.

## What changed

The normal in-scene toolbar now exposes Undo, Market, Flip board, and Table options. Options retains size, height, placement, Fit view, the artwork gallery, How to play, New game, and Promotion lab. New game and the lab retain confirmation. Placement keeps Higher, Lower, and Cancel immediately accessible. The Flip action rotates the board and pieces without rotating the control tray away from the player.

Selecting a piece shows its name, square, actual legal-move count, and a short movement guide. Reusable markers distinguish quiet moves, captures, selected pieces, recent move squares, and a checked king. Menus exclude the underlying board and hidden toolbar from their ray targets, with a matching dispatch guard. Desktop/mobile framing reserves space for the header and help text. Two-pointer zoom does not turn pointer releases into accidental piece selections. Lost hand-joint or ray tracking disarms custom pinch until an open hand is seen again.

The unchanged engine remains the authority for legal moves. The existing save/session module, original 2D UI, art factory, and artwork atlas are byte-identical to the previous release. All ten legal piece types remain textured cuboids; D is Chancellor (Cn), and Dragon remains gallery-only art. This is still local two-player play, without a computer opponent or online multiplayer. The atlas still has 64-pixel source cells; this pass does not claim increased artwork resolution.

## Verified results

The existing War Ledger Chess checks workflow succeeded on its first run for the published commit:
https://github.com/v5ma/v5ma.github.io/actions/runs/35826114927

All 10 Node test entries passed, including the unchanged engine and piece-card contracts and the new presentation tests. The real Chromium/software-WebGL sequence passed both for the checked-out source and for the public GitHub Pages URL. Both local-report.json and live-report.json report passed: true for release ar-tactical-20260922-4.

The 18 reported check groups cover camera direction, texture decoding, all 32 starting pieces, moves for both players, spatial market/cancel, the 11-design gallery, an occluded promotion destination, licensed Chancellor promotion, shared save/undo between AR and 2D, reset confirmation, frame-polled simulated Xbox controls, synthetic XR rays, piece guides and markers, tray-preserving flip, exclusive modal targets, marker reuse, portrait/landscape play, and synthetic two-pointer zoom. The existing gameplay assertions were retained.

Public verification required all nine runtime/artwork files to match the checked-out source byte-for-byte before executing the browser sequence. The downloaded live-hashes.json was also independently compared with the local expected files; all nine match.

The Pages run associated directly with the runtime commit was 35826114519. Its build and report jobs succeeded, and the deploy step reported success, but the deploy job's overall conclusion was cancelled while concurrent repository work continued. Do not describe that entire Pages run as successful. The independent public hash check and actual public browser sequence establish that this exact chess release was served and playable.

Downloaded artifact: warledger-chess-browser-evidence, ID 10734934929. ZIP SHA-256: 0a5cbe992780157f4c336a8c240d0ead7b9dcce738351082b5a97cab237e98b4. Reported retention expiry: December 22, 2026. It contains the exact source, local and live reports, deployment hashes, loaded A-Frame library, and screenshots. This receipt preserves the result beyond artifact retention.

The live-tactical.png, live-portrait.png, and live-landscape.png screenshots were opened and visually inspected. They show the real illustrated board and compact controls rather than concept artwork. At 390x844 and 844x390 the board is within the usable screen, and the test makes a real mouse-selected move and undoes it. The landscape overview is still visually small; a larger optional board-focused layout and a smaller landscape header remain useful follow-up work. Do not equate in-frame checks with ideal readability on every screen.

## Runtime integrity

ar.html SHA-256: 8647e3c49b5f3f9e66a3479bd445fb3a69bbf7a058f6516bc2c5754a8590ba7d

warledger-ar.mjs SHA-256: c7c39bcc3ae06525b964fe594e2286761e05b8b150981665cd9b2d6c5be3a90a

warledger-presentation.mjs SHA-256: c834af9de202a697bf0361472bfc727d5b917ca5780fe4e7b2692489287a4710

assets/piece-faces.webp SHA-256: 3c5020402500609b5ed08431d12beb178cd02ba4740b033b1d1ae84b848e55e9

## Limits and continuation

No physical Quest 3, Xbox controller, or touch device was available. XR rays, gamepad inputs, and the multi-pointer gesture were simulated. The test did not enter a real immersive session. Actual passthrough, tracked controller/hand comfort, surface placement, tracking recovery, and session entry/exit still require device playtesting. The separate offline geometry harness used a mock renderer and is not the source of the real-WebGL verification claim; that verification ran on GitHub's runner.

Read current master, FUTURE-DIRECTION.md, this receipt, and newer evidence before the next pass. Preserve saves, the engine's established piece mapping, and simultaneous work elsewhere in the repository. Next priorities are user headset feedback, higher-resolution textures from the original assets, and a larger board-focused mobile view. Publish completed changes directly to master with non-forced writes and independently verify the public runtime. This documentation-only commit does not change the verified game files.
