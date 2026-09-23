# War Ledger Chess continuation

Current pass: ar-tactical-20260922-4. Read this file, current source, VERIFIED-AR-20260922.md, and newer verification receipts before editing. Older README-AR.md and AR-RELEASE-NOTES.md describe earlier releases; their expanded always-visible toolbar is superseded here.

The user's direction is a real playable A-Frame AR chess game with generated icon and portrait imagery on six-sided rectangular pieces, not concept illustrations. All ten legal types remain illustrated. D remains Chancellor (Cn); Dragon is gallery art only. Preserve the existing rule engine, saves, promotion economy, all scenarios, Xbox play and Quest controller/hand paths. Publish completed changes directly to master with a non-forced fast-forward and verify the public game. Do not create unnecessary PRs, staging branches, or workflows. Reconcile simultaneous repository changes.

## Tactical and comfort pass

The normal spatial tray now has Undo, Market, Flip board, and Table options. Options holds size, height, placement, Fit view, gallery, How to play, New game and Promotion lab. Reset still requires confirmation. Placement retains immediately accessible Higher, Lower, Cancel, and Exit XR controls. Xbox/keyboard toolbar navigation remains supported.

Selection shows the piece name, square, legal move count, and short movement guide. Green dots distinguish quiet moves, coral rings identify captures, gold rings selection, red rings a checked king, and blue rings recent squares. Marker geometry/materials are allocated once and reused. The underlying legal moves are supplied by the unchanged engine.

Flip now rotates the board and its pieces while leaving the readable control tray in place. Menu panels remove board and background-toolbar targets while active, with a dispatcher guard against hidden actions. Portrait/landscape layout reserves room for the page header/help, automatically fits visible controls and board, and clears the desktop camera offset on entering XR. Two-pointer zoom no longer turns gesture releases into piece clicks. Lost hand-joint/ray tracking disarms the custom pinch gesture until it observes an open hand again.

## Verification boundaries

Before publication, all 10 Node test entries passed, including the unchanged chess-engine and piece-card contracts and new guide/menu/viewport tests. An offline harness using actual A-Frame 1.7.1 THREE geometry but a mock renderer and storage passed two-sided mouse moves, spatial menus, licensed Chancellor promotion, tray-preserving flip, and play/framing at 390x844, 844x390, 320x568, and 1440x1000. The local Chromium environment could not create WebGL; this harness is not rendering or hardware verification.

The existing permanent chess workflow has been extended, not replaced. It runs real Chromium/software WebGL against checked-out source and the public URL, checks nine runtime/art files byte-for-byte, preserves its original save/promotion/Xbox/XR-ray assertions, and adds rendered options/help, modal exclusion, marker reuse, portrait/landscape play, and synthetic two-pointer zoom. Read its actual result and any subsequent receipt before claiming deployment/browser success.

No physical Quest 3 or physical Xbox controller was available. Synthetic rays, joint/gesture logic, or simulated gamepads must never be described as physical headset testing. Real passthrough, immersive entry/exit, surface placement, tracking recovery, and controller comfort still need device playtesting.

## Next bounded work

Prioritize the user's headset feedback. Then replace the compact 64-pixel artwork cells using the original higher-resolution generated assets, preserving exact piece mapping. This pass keeps the original atlas unchanged; it does not claim sharper image source pixels. Consider an optional closer board-focused view and more compact landscape HUD after physical/mobile feedback. Online multiplayer and a computer opponent remain unimplemented, separate projects. Keep app state and test evidence beside the game after each substantial pass.
