# Verified sharper artwork and close-view pass

Verified September 23, 2026. Runtime release: ar-closeview-20260922-5.

Play: https://v5ma.github.io/warledger-chess/ar.html?v=ar-closeview-20260922-5

Runtime commit: c26a9fb3ae71976fe3c8dd2bedb4a4b91ba80fe2, published directly to master using a non-forced fast-forward. The diff contains thirteen chess-only files. No PR, staging branch, new workflow, rule-engine replacement, or sibling-game edit was needed. The comparison against later master ac1771187c57e74621811a078cfbbf0994f49eae showed no further changes to this chess runtime.

## Player-facing changes

The actual cuboid pieces now use 128-pixel artwork cells, recropped from the original generated images rather than enlarged from the earlier 64-pixel runtime atlas. The six standard designs were perspective-rectified from the original collection image; the special designs were cropped from the original special-piece sheet. Icon and rendered-portrait faces retain the existing mapping. Four local WebP strips are assembled once into a single shared 512x1024 texture with edge gutters and capped anisotropic filtering. Temporary strip textures are disposed. The original complete atlas is retained as a fallback if any sharper strip cannot load or has invalid dimensions.

Board view provides a more board-focused screen layout. In landscape it moves the status and four main controls beside the board; in portrait it reduces the front tray and page header/footer. It is automatic on narrow or short screens until the user makes a preference. The Board view / Table view button, V key, Xbox right-stick click, and Table options switch the screen layout. View preferences are stored separately from the match in warledger-chess-view-v1 and do not reset the position or undo stack. Immersive XR retains its existing world-space tray; screen-view switching is disabled in XR.

All ten legal types remain illustrated. Engine D remains Chancellor, displayed Cn. Dragon remains an eleventh gallery-only design, not a new legal piece. Local two-player play remains the supported mode; there is no computer opponent or online multiplayer in this pass.

The rule engine, session/save module, original 2D UI, art factory, input helper, original index.html, and old fallback atlas were independently compared with the prior verified release and remain byte-identical. Existing tactical markers, modal input exclusion, promotion economy, shared 2D/AR saves, and undo are preserved.

## Deployment and browser verification

The existing War Ledger Chess checks workflow succeeded on its second attempt, with the exact same runtime and test source:
https://github.com/v5ma/v5ma.github.io/actions/runs/35829585022

Successful job: 107084633433. All sixteen Node test entries passed. Real Chromium with software WebGL passed all twenty-three browser check groups against both the checked-out source and the public GitHub Pages game. Both local-report.json and live-report.json report passed: true for ar-closeview-20260922-5.

The first attempt, job 107078867506, passed the entire source-browser sequence but timed out at the sixteen-file public hash barrier while Pages deployment was queued. That remains a failed verification attempt, not a public pass. Only the failed job was retried. No assertions, expected results, game code, or publisher configuration were changed to obtain the successful retry.

The original runtime commit's Pages run was superseded by concurrent repository work. Successful delivery came through the later descendant ac1771187c57e74621811a078cfbbf0994f49eae. Its build, deploy, and report jobs all succeeded:
https://github.com/v5ma/v5ma.github.io/actions/runs/35830302978

Before running the public browser sequence, the verifier required all sixteen deployed runtime/artwork files to match the checked-out source byte for byte. The downloaded live-hashes.json was then independently compared against the locally retained expected-runtime.json; all sixteen SHA-256 values matched. The source copied into the first attempt's artifact also matched those expected files exactly.

The twenty-three groups cover camera direction; texture decoding; all thirty-two starting cuboids; white and black mouse moves; spatial market/cancel; eleven-design gallery; an occluded promotion destination; licensed Chancellor promotion; shared 2D/AR save and undo; reset confirmation; actual frame-polled simulated Xbox inputs and B cancellation; synthetic XR rays; piece guides and markers; flip preserving tray orientation; exclusive modal targets; marker resource reuse; portrait/landscape play; synthetic two-pointer zoom; sharper original-source texture loading; larger landscape close view; independent view preferences preserving match and undo; portrait close-view play; and an actual blocked texture request followed by fallback play and sharper-texture recovery after reload.

At the tested 844x390 landscape viewport, the public browser measured the projected corner-square span as 112.11277767812152 pixels in Table view and 191.66526781054176 pixels in Board view, a ratio of 1.7095755879032573, or approximately 71 percent wider. This is a measured screen-space span, not a claim about all devices, physical board size, or frame rate. The same measurement was obtained in the source-browser check.

The live-close-landscape.png, live-close-portrait.png, and live-gallery.png screenshots were opened and visually inspected. They show the actual textured cuboids and screen layouts, not concept illustrations. Status text remains small at short landscape sizes, and finer visual/interface polish remains worthwhile. Passing the size and input checks is not a claim of ideal readability on every device.

## Retained evidence

Successful artifact: warledger-chess-browser-evidence, ID 10737765790. ZIP SHA-256: 500b18360881f50caf99dce489e6984d587a139ee1bc24e537a594b99891a0a8. Reported expiry: December 22, 2026. It contains source, reports, deployment hashes, loaded A-Frame library, and actual source/live screenshots. This document preserves the outcome beyond artifact retention.

First-attempt artifact: ID 10737116517. ZIP SHA-256: d28f1e5037b91cad3fb185baae7d782f99e2233cdaa392e4487ff8120376f0ab. The source pass and publication timeout must not be confused with the successful public retry.

ar.html SHA-256: bd7b1c873c8ba8d186610207fd9da95e1f40c94cc8763f40cc8392097cd474b6

warledger-ar.mjs SHA-256: 512c6d118835b35d8b01b7eacabd9be29c6d256fa9f1055e8d6ec776795a9a19

The four HD artwork SHA-256 values and exact source-crop mapping are committed in assets/piece-faces-hd-manifest.json. The old fallback artwork remains unchanged.

## Limits and continuation

No physical Quest 3, Xbox controller, or touch device was available. Controller/gamepad inputs, XR rays, and the two-pointer gesture were simulated. No real immersive session, passthrough, tracked hands/controllers, real-surface placement, headset comfort, or device frame-rate validation is claimed. The local geometry preflight used real A-Frame THREE objects with a mock renderer; the real rendering verification described above ran on GitHub's runner, not that mock.

Read current master, FUTURE-DIRECTION.md, this receipt, and any newer evidence before editing. Higher-resolution textures and the larger optional mobile board view are now implemented and publicly verified; do not recreate those former roadmap items. Prioritize actual headset feedback, AR placement and tracking comfort, then improve remaining status readability and presentation. Preserve the established engine mapping, saves and concurrent work. Publish completed upgrades directly to master and verify the live runtime independently. This documentation-only receipt does not alter the verified game files.
