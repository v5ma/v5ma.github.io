# Sky Cycle development: start here

Continue the existing momentum-cycling game, with its original physics, eight campaign routes, saved progress, Workshop and direct controller actions. Do not build a replacement demo.

The current work is Waterwheel delivery quality v0.24. Read `RESUME-HERE.md`, `verification/waterwheel-deliveries-0.24.json` and `GITHUB-RELEASE-PROCESS.md` for exact candidate, test, merge and public-runtime status. The receipt is authoritative; a branch or version label alone is not evidence that a release is live.

For level design, read `LEVEL-DESIGN-METHODOLOGY.md`, `chapters/WATERWHEEL-BOULEVARD-R2.md` and `WATERWHEEL-DELIVERIES-0.24.md`. The next gate is described in `chapters/WATERWHEEL-BRAKING-FORK-NEXT.md`. The 90-case isolated braking experiment is reproducible with `node mario-maker-clone/svgn-paper-route/development/experiments/waterwheel-braking-model.mjs`; it is not a native playthrough or a new automatically controlled game mechanic.

`AAA-ROADMAP.md` is the canonical long-range checklist. Chapter promotion, human playtests and physical-device gates are not complete merely because the Waterwheel preview is released. Keep Waterwheel non-awarding until the explicit revision-aware promotion gate passes.

Play the existing game at `https://v5ma.github.io/mario-maker-clone/svgn-paper-route/`. From Routes choose Waterwheel r2 design preview, then Ride the full preview or its ground-only alternative. For seated tracked XR, use the guarded `?xr=1` entry and explicitly select Quest / XR. Preserve the advanced Bezier pointer-required exception and do not call emulated tracking a physical Quest qualification.

Earlier development history remains verbatim in `archive/README-through-0.23.md` and `archive/RESUME-HERE-through-0.23.md`. Their old current-version sections are historical. Versioned notes and receipts remain in their original locations.
