# Waterwheel delivery-quality continuation, v0.24 candidate

This slice continues the published Waterwheel Lab v0.23 preview. It does not promote the preview into the eight-route campaign and does not make mail mandatory for preview completion. Its purpose is narrower: make the lower road feel like a delivery adventure rather than a fallback strip, and prove that all twelve authored targets can be served through the real throw physics and familiar direct controls.

## Design contract

The twelve road targets now carry explicit identities, regions, roles and intentions in `waterwheel-layout-core.mjs`. The sequence moves through teaching, ordinary doorstep, return reward, control, road-choice, discovery and finale roles. Targets remain more than 500 world pixels apart so two 250-pixel nearest-mailbox windows do not overlap. Each mailbox is more than 250 pixels from the authored encounter centers so a paper throw is not competing with a deliberately composed enemy decision. Ground-only and full-sky builds share the exact same delivery journey.

Three targets make the lower route specifically valuable. `express-road-choice` gives a useful objective to a rider who stays beneath the optional express line. `canal-observation-stop` creates a quieter place to read the aerial network. `waterwheel-overlook` ties a road delivery to the chapter landmark and upper route. The final Wheelhouse doorstep sits after the last encounter and before the depot flags. None changes route physics, controller mappings or campaign settlement.

The Workshop preview keeps `quota: 0`. Completing or even serving every target must not create a `canal-choices-r2` campaign record, medal, badge, stamp, ghost or permanent credit change. Earlier `canal-choices` records and every encoded campaign builder remain unchanged. The new delivery intent metadata must survive the existing document codec so it can later support editor annotations and rehearsal tools.

## Normal-input qualification

The delivery acceptance begins through the real Waterwheel preview UI, inspects the real 3D scene, then uses the supported 2D view for a complete CPU route. The rider moves with ordinary rightward input. Each mailbox must become the unambiguous nearest target. The test then uses the normal Xbox B throw; it never assigns rider position or velocity and never writes delivery, score, win, record or document state.

The engine deliberately does not auto-solve a paper throw. It aims toward the nearby mailbox, uses fixed throw speed and inherits rider momentum. The first candidate acceptance fired immediately when each target entered the outer 250-pixel eligibility radius while full throttle remained held. South Quay delivered successfully. The second Parcel Market paper missed even though that mailbox was correctly selected. The runner continued normally to the later Service Bridge target. That failure is retained as level-design evidence, not treated as a reason to grant automatic delivery.

The next exact-source recipe therefore tests a more legible player action: ride toward the target, coast from a forward 35–145-pixel window, press the same Xbox B throw, then resume riding after the real packet lands. This is an ordinary timing/approach decision and matches the chapter methodology: the delivery should reward control without requiring menu friction or invisible steering. If a mailbox still cannot be served reliably from that declared window, move or retune the authored situation rather than assigning delivery state or weakening the physics.

## Acceptance requirements

The candidate is not ready to merge merely because its metadata tests pass. Exact-source acceptance must show all twelve real mailboxes served in one first-attempt road journey, the exact delivered tile set matching the intent ledger, four existing Waterwheel traversal variants still completing, current Waterwheel XR/controller/hand behavior passing, Portal Network/Tideglass/Sunrise regressions passing, and all preview persistence isolation remaining intact. Captures and failed attempts stay attached to their source SHA.

Physical Xbox, physical Quest 3, unfamiliar-player delivery readability, human pacing/enjoyment and default campaign promotion remain separate gates. A software pass demonstrates that the declared route and input recipe work; it does not establish that a new player finds every delivery naturally or that real hardware is comfortable.

## Retained evidence

Run `35041285677`, delivery job `104621559848`, exact source `e25be8ca6a26d2686a3abbf30da5b587c765edc6`, failed at `parcel-market-front` after a genuine successful `south-quay-warmup` throw. Artifact `10425346416` has SHA-256 `28525e6f6643080539b330f7e939f1a421eb9d214019aa7d8350e7a4f6d99570`. At failure there were no page or console errors; one mailbox was genuinely delivered, the rider remained alive/on-ground on the same first attempt, and later mailboxes remained targetable. Preserve the report, screenshots and video.

The same development cycle also exposed a Waterwheel XR test-oracle issue: optional first-page menu membership changes with live Flight Deck control availability. The XR acceptance now derives the six rendered rows from the actual live DOM order while separately requiring the route-return, route-choice, Flight Deck and Sound & music controls. Stereo background, text contrast, scenery-isolation, controller, hands and award-isolation assertions remain unchanged.

## Next gate

After twelve-delivery native acceptance and regression review, merge and independently verify public runtime bytes before describing the slice as published. Then continue the chapter specification in its declared order: the speed/brake-selected fork with a genuinely useful lower result, followed by an optional high-to-high whip connection that retains a non-whip continuation.