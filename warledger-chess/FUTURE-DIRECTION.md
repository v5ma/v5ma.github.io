# War Ledger Chess continuation

Current pass: ar-closeview-20260922-5. Read this file, current source, VERIFIED-AR-20260922.md, and newer verification receipts before editing. Older README-AR.md and AR-RELEASE-NOTES.md describe earlier releases; their expanded always-visible toolbar is superseded here.

The user's direction is a real playable A-Frame AR chess game with generated icon and portrait imagery on six-sided rectangular pieces, not concept illustrations. All ten legal types remain illustrated. D remains Chancellor (Cn); Dragon is gallery art only. Preserve the existing rule engine, saves, promotion economy, all scenarios, Xbox play and Quest controller/hand paths. Publish completed changes directly to master with a non-forced fast-forward and verify the public game. Do not create unnecessary PRs, staging branches, or workflows. Reconcile simultaneous repository changes.

## Preserved tactical and comfort pass

The normal spatial tray now has Undo, Market, Flip board, and Table options. Options holds size, height, placement, Fit view, gallery, How to play, New game and Promotion lab. Reset still requires confirmation. Placement retains immediately accessible Higher, Lower, Cancel, and Exit XR controls. Xbox/keyboard toolbar navigation remains supported.

Selection shows the piece name, square, legal move count, and short movement guide. Green dots distinguish quiet moves, coral rings identify captures, gold rings selection, red rings a checked king, and blue rings recent squares. Marker geometry/materials are allocated once and reused. The underlying legal moves are supplied by the unchanged engine.

Flip now rotates the board and its pieces while leaving the readable control tray in place. Menu panels remove board and background-toolbar targets while active, with a dispatcher guard against hidden actions. Portrait/landscape layout reserves room for the page header/help, automatically fits visible controls and board, and clears the desktop camera offset on entering XR. Two-pointer zoom no longer turns gesture releases into piece clicks. Lost hand-joint/ray tracking disarms the custom pinch gesture until it observes an open hand again.

## Sharper artwork and screen-focused board

This pass recrops the six standard designs from the original generated collection and the five special designs from the original special atlas. It does not enlarge the old 64-pixel cells. Twenty-two 128-pixel cells, with four-pixel replicated gutters, are packed as four local 128x1024 WebP strips. The loader assembles one 512x1024 CanvasTexture, uses the same normalized face mapping, and disposes temporary strip textures. Source hashes, crop coordinates, design mapping and output hashes are in assets/piece-faces-hd-manifest.json. The old complete 64-pixel atlas remains unchanged as a load-failure fallback. Dragon is still only gallery art; engine D is Chancellor.

Board view is automatic on narrow or short screens until the user chooses otherwise. In landscape, the four normal controls and wrapped status move beside the board; in portrait, the front tray becomes more compact. The smaller page header/footer reserves more room for the playing surface. Table view retains the earlier overview. The header button, V key, Xbox right-stick click, and Table options switch the screen view. The independent warledger-chess-view-v1 preference never replaces the match save. Immersive XR keeps its existing world-space tray and camera setup; screen-view switching is disabled in XR.

## Verification boundaries

Before publication, all 16 Node test entries passed, including unchanged engine/card tests and new artwork-loader, fallback, layout and preference-storage checks. An offline harness using actual A-Frame THREE geometry, DOM and pointer listeners, but a mock renderer, passed moves and undo in both screen views at 1440x1000, 390x844, 844x390 and 320x568. At 844x390 its projected board width increased from about 109 to 190 pixels. That harness is not rendering or hardware verification. Local Chromium could not create WebGL.

The existing permanent chess workflow is retained without new branches or workflows. The browser driver preserves its prior eighteen check groups and adds HD decode, larger landscape board, preference/save/undo continuity, portrait close view, and a real failed texture-request fallback/recovery check. It requires sixteen deployed runtime/artwork files to match the checked-out source byte for byte, then replays on the public URL. Read its actual result and newer verification receipt before claiming browser or deployment success.

No physical Quest 3, Xbox controller, or touch device was available. Simulated rays, gamepads and multi-pointer gestures are not physical tests. Real passthrough, tracked hands/controllers, real-surface placement, session entry/exit, and headset readability still require device playtesting.

## Next bounded work

Prioritize user headset feedback and check current master before editing. The higher-resolution textures and optional closer mobile view are implemented in this pass; do not recreate the former roadmap items. Review real rendered screenshots and public verification before describing them as verified. Improve XR placement and hand/controller comfort from device feedback. Online multiplayer and a computer opponent remain separate unimplemented projects. Preserve the engine, save key and session format, legal piece mapping, earlier 2D page, and concurrent sibling-game work. Keep notes and evidence beside the game. Publish completed updates directly to master with non-forced fast-forward writes and independent public verification.
