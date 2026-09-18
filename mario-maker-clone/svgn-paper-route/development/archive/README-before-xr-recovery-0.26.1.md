# Sky Cycle development: start here

Continue the existing momentum-cycling game, original physics, eight campaign routes, saved progress, independent Workshop documents and direct controller actions. Do not build a replacement game or introduce a second renderer to wrap the first.

The active user-requested presentation slice is Spatial Workspace v0.26.0, build `sky-cycle-spatial-workspace-2026.09.17`. Read `RESUME-HERE.md`, `SPATIAL-WORKSPACE-0.26.md`, `XR-MENU-CONTRACT.md`, and `verification/spatial-workspace-0.26.json`. The receipt controls exact-source acceptance, merge and public verification. A version label or branch commit is not evidence of publication.

The game uses native WebXR with its existing pinned Three renderer. AR and VR have separate explicit entry actions. Real 3D riding, the supported live 2D canvas, modern Workshop and legacy editor share the game state and DOM-owned menus. Browser-owned file, permission, external navigation and hardware-binding flows use an explicit browser handoff; they are not falsely represented as in-headset completion.

Play at `https://v5ma.github.io/mario-maker-clone/svgn-paper-route/`. For WebGL-ready XR use `?xr=1`, choose AR / VR and then Enter AR or Enter VR on supported hardware. The existing Workshop is available through Edit this world. Recenter, Spatial setup and Exit XR remain available. Exhibit rotation leaves the recovery menu at the seated heading. Physical Quest 3 passthrough, hand/controller ergonomics, comfort and performance are separate open tests.

`AAA-ROADMAP.md` remains the canonical long-range checklist. This release contributes to Milestones F and G without closing physical-device, complete authoring or chapter-promotion gates. The public `level-design-library/SKY-CYCLE-LEVEL-DESIGN.md` and local `LEVEL-DESIGN-METHODOLOGY.md` remain authoritative for movement-first design.

After the XR release, recover and reconcile `sky-cycle/canal-choice-0.25` at `c946e556d1a4d970e4e406d09b7a1f547ae0e8a7`. It was not merged into this presentation branch. Do not overwrite its geometry with the older v0.24 layout or replace the new XR workspace with its earlier xr-play.js. Continue `chapters/WATERWHEEL-BOULEVARD-R2.md` and the native braking-fork/recovery gates before another destination or cosmetic feature series. Waterwheel remains a non-awarding Workshop preview until explicit revision-aware promotion.

Earlier full handoffs are preserved byte-for-byte in `archive/README-before-spatial-0.26.md` and `archive/RESUME-HERE-before-spatial-0.26.md`, alongside the through-v0.23 archives. Resolve their relative references from the original development directory. Their old current-version sections do not override the latest receipt.
