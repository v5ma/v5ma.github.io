# Flight Deck, v0.16.0

Build: `sky-cycle-flight-deck-2026.09.11`.

This upgrade adds optional replay objectives and controller-safe menu operation to the existing Sky Cycle game. It does not replace routes, alter rail physics, grant a shortcut to a finish, rewrite saved medals, or touch account services. The canonical production checklist is `AAA-ROADMAP.md` in this directory.

Route cleared requires an accepted engine finish. Clean wheels also requires no crash/checkpoint retry. Every doorstep requires every mailbox. Air courier requires a delivery to arrive while the rider is airborne, rather than just throwing a paper from the air. Express delivery uses the route's existing par and accumulated active simulation steps at 60 Hz, including retries and excluding pauses. Mail goals are absent on routes without mailboxes, and express is absent without a positive par. Attainability across every authored route remains a content-audit task, not a claim established by the rule tests.

A run starts only when `startPlay` loads an authored route whose encoded document matches the delivery campaign. A late-loaded optional module does not backfill an unobserved run. An edited copy cannot earn career badges. The original `win` must change the game from not-won to won before settlement. Repeated calls do not add repeated finishes. Career records use `svgn.skycycle.mastery.v1`; existing draft, medal, audio, keymap, and padmap keys are not migrated or cleared. Unavailable storage is reported rather than silently claiming persistence.

Standard-layout controllers keep existing action remaps. Start pauses/resumes; View opens the Flight Deck; menus use directional focus, A confirm, B back, and LB/RB previous/next control. Horizontal input adjusts existing music/effects sliders independently. Native modal order follows actual opening order. A release-to-neutral latch prevents selecting a course from leaking into a jump. Disconnect releases controller-owned keys and pauses the active route. Original tile editing remains; complete controller-only Bezier authoring is explicitly unfinished.

The loader installs a narrow native-dialog keyboard delegate before the legacy pause listener, fixing Escape accidentally unpausing the game behind audio settings. Only native dialog events use that delegate. Gameplay rendering, audio synthesis, and world physics remain owned by their existing modules.

## Evidence and limits

The local pure-rule suite passes 12 tests. The authoring environment could not run local HTTP browser checks because browser policy blocked localhost navigation. It was not weakened or bypassed. GitHub Actions therefore runs the isolated fixture and real-game smoke suite against the committed source, records the SHA, and uploads captures and reports. The fixture's simulated finish is labeled as fixture evidence, not a native route completion. Real-game smoke tests inject only a standard Gamepad API sample and use the game's live menu/control paths; they do not move the player or award a debug win.

Required evidence before the release is marked verified: passing fixture and real-game reports, capture review, and a master-only public SHA-256 comparison for all owned new or changed runtime files. Consult the `Sky Cycle Flight Deck` Actions run for the exact source and publication result. Physical controllers, native GPU performance, complete chapter playthroughs, and actual mobile devices remain untested by this smoke suite.

Rollback is a scoped revert of the Flight Deck release, retaining the isolated career key for a later compatible version. Never reset repository history or clear player saves to roll back.
