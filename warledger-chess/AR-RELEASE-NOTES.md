# AR tabletop release and continuation

Current runtime identifier: ar-blocks-20260922-3.

The playable A-Frame game is ar.html. Every legal piece has generated icon and portrait artwork mapped to a real cuboid. Ten engine types are supported. D remains Chancellor; Dragon is gallery-only. The unchanged chess engine powers both pages. Shared local save, undo, licensed promotion, market, spatial buttons, controller rays, hand-pinch input, and Xbox navigation are implemented. See README-AR.md for controls and design scope.

The initial release was committed directly to master in 12b23e08ccf50ca588af089d330a7313225f55a1. A camera correction followed in 7d588479dceb4def445270c5fba1f732c1b77b70. This third runtime revision moves the spatial tray down to tabletop height so it does not cover the front pieces, enlarges the desktop presentation, uses a steeper initial view, and resolves legal destination hits hidden by the selected block. It does not click through unrelated pieces or menu targets.

Earlier real-browser failures are retained rather than disguised as successful tests. Run 35817945870 exposed a backwards A-Frame Group camera; run 35818282727 exposed a destination square hidden behind a pawn. Their artifacts preserve screenshots and assertions. Both runs passed the engine, card, art, save, and input contracts before the browser failures.

Before this third revision, seven Node test entries passed locally. An offline geometry harness using the actual A-Frame Three.js classes passed mouse selection for both sides, world-space market and cancel, gallery state preservation, e7-e8 promotion selection, Chancellor license purchase and promotion, undo, reset confirmation, synthetic Xbox inputs, and controller ray selection. That local harness used a mock renderer and is not a WebGL render test. The permanent GitHub workflow separately performs real Chromium/SwiftShader rendering and runs the same browser interactions on the public Pages URL. It now compares all eight live runtime/art files byte-for-byte with the tested source, not just a release label.

The workflow result for this third revision must be read before claiming full verification. Physical Quest 3 passthrough, immersive sessions, tracked hands, controller feel, and real table placement have NOT been tested on hardware. Do not describe mock or synthetic tests as physical-device validation.

Next sessions: reconcile current master before changing anything; preserve concurrent game work and this game's rules and saves; avoid unnecessary PRs or branches. Read latest browser screenshots and reports. Prioritize actual headset feedback, higher-resolution texture replacements, responsive small-screen framing, and controller-friendly interface refinements. Keep Dragon as artwork only until a separate movement specification is approved.
