# War Ledger Chess: illustrated AR tabletop

Release identifier: ar-blocks-20260922-1.

Play the A-Frame version at https://v5ma.github.io/warledger-chess/ar.html. The original 2D board has a Play AR / 3D button. This is the actual playable game, not a concept-art viewer. Both pages use the unchanged warledger-engine.mjs and share a versioned local save and up to 60 undo states.

## Pieces and artwork

All ten legal piece types use a real six-sided cuboid with cropped generated icon art on front/back and rendered portrait art on its sides, team-colored feet, bronze trim, and readable top labels. The shared WebP atlas contains 22 cropped cells: an icon and portrait for each of eleven designs. The prototype uses compact 64-pixel cells. Higher-resolution replacement artwork can use the same mapping after updating the atlas metadata.

The engine type D is Chancellor (rook plus knight), displayed Cn. Dragon is a separate artwork-only preview in the gallery, not a new engine piece or promotion. Do not silently map D to Dragon or change the established rules. The gallery does not mutate the active game.

The six standard designs were perspective-rectified from the generated collection image in this conversation. The five special designs were cropped from the generated special-pieces texture sheet. These images are now actual local game textures, not remote concept-poster links. assets/piece-faces.webp is 256 by 512 pixels with a four-column, eight-row grid; two cells per design in ART_TYPES order. Its SHA-256 is 3c5020402500609b5ed08431d12beb178cd02ba4740b033b1d1ae84b848e55e9.

## Play and controls

Desktop: click a piece, then a highlighted square. Drag to orbit and scroll to zoom. Arrow keys navigate; Enter or Space selects; Escape cancels; U undoes; M opens the market. F2 switches keyboard focus between board and spatial toolbar.

Xbox: left stick or D-pad navigates, A selects, B cancels, X undoes, Y opens the market, bumpers flip the board, and Start switches toolbar focus. Menus use the same navigation and A button.

Quest/WebXR: choose Enter AR for passthrough, or Enter VR. Point a controller and use its trigger. Tracked hands use an open hand followed by thumb/index pinch to select. Right B cancels; left X opens the market and left Y undoes. Controller rays, hand-joint pinch selection, and scene-space menus use the same raycast targets. Frequently used controls are on the board's spatial tray rather than an HTML overlay or head-locked menu.

Use Place to reposition the board. Surface hit-testing is optional; a ray intersecting the current table height is the fallback. Higher and Lower change that height. Smaller and Larger resize the board. Flip rotates it. New game and Promo lab require confirmation. Buying a license and choosing the promotion both work inside the spatial promotion panel without returning to the 2D page.

AR hides the virtual floor and clears the scene background for passthrough. The board is positioned relative to the first tracked viewer pose, not the desktop camera offset. Exiting XR preserves the game and restores the orbit camera.

AR/VR entry depends on secure-context WebXR support and browser permissions. Unsupported browsers keep the desktop 3D game. A-Frame is pinned to 1.7.1 from aframe.io and requires network access. There is no offline promise, online multiplayer, or computer opponent in this release. Play remains two-player local hotseat.

## Verification and continuation

Run node --test warledger-chess/tests/*.test.mjs from the repository root. The permanent War Ledger Chess checks workflow runs the existing engine and piece-card checks, new atlas/save/input contracts, then real Chromium/WebGL browser checks on the checked-out game and the published Pages URL. It waits for the release marker and exact atlas bytes before testing the public site. Reports and screenshots are uploaded as warledger-chess-browser-evidence.

Browser checks exercise mouse moves, spatial menus, licensed Chancellor promotion, save/undo continuity between 2D and AR, reset confirmation, Xbox polling, and synthetic XR rays. The browser uses software WebGL. Simulated gamepad/ray checks are not physical Quest 3, hand-tracking, passthrough, or immersive-session testing. Those hardware checks remain required; do not relabel automation as a headset test.

This note records implementation scope, not a claim that every workflow has passed. Read the actual Actions run and its evidence before making a verification claim. Unrelated site-wide game failures must not be described as chess failures or silently fixed by this change.

Future sessions: read this note, the current source, and the latest Actions evidence before editing. Reconcile concurrent master changes. Preserve chess rules and saved state, avoid unnecessary PRs or staging branches, and publish completed upgrades directly to master with fast-forward writes. Improve texture resolution and physical-device input/placement after user playtesting. Update this note and retain explicit hardware-test limitations.
