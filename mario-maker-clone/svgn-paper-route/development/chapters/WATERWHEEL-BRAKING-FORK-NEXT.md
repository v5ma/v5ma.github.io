# Waterwheel braking fork: next native authoring gate

This is the next gate after the v0.24 delivery release. It is not a declaration that the fork, its cues or rewards are already shipped. Keep the accepted v0.24 candidate and its publication work independent of this experiment.

## Why this fork matters

The lower road now has purposeful delivery stops, rather than acting only as a failure strip. The next chapter lesson should make momentum a visible route choice: retain speed for the mill crescent and the long express line, or deliberately brake for a lower canal collector that returns to a useful delivery neighborhood. Both outcomes need forward progress, readable receivers, and a non-punitive way to rejoin the street. Neither should require a menu, an invisible snap or a different gravity constant.

## Measured hypothesis, not native acceptance

The isolated actual RailGripCore ride/flight/catch model was run on the scoped source from commit `b49ab32cf9122cb7769a61951ce585b7f6744116`. The model varies starting speed 5, 7.5 and 10; one explicit road-jump seed at offsets 90, 120 and 150; Forgiving and Precision grip; and five runway braking thresholds. It carries state after that initial seed. It omits the complete native terrain, enemies, packet collisions, full swept-body/deck checks and human input variability.

In the eighteen no-brake samples, the rider catches runway, crescent, gallery and finish, then reaches the modeled road near x=8927.73. In all eighteen samples that brake during the last 80 units of runway arc length and resume rightward flight after exit, the rider instead catches the canal collector and reaches the modeled road near x=5200.18. That is a candidate for an intentional lower branch, not a newly invented route or a forced landing.

A threshold of 160 produces sixteen collector returns and two direct road returns. At 200 there are six collector returns, six direct road returns and six timeouts still on the runway. At 240 all eighteen samples time out on the runway. The threshold policy switches between left and right according to remaining arc, so a timeout can reflect that artificial control policy rather than an inescapable game trap. Test deliberate brake release and safe road recovery with actual controls before interpreting it.

The reproducible script is `../experiments/waterwheel-braking-model.mjs`. The retained summary is `../experiments/waterwheel-braking-summary.json`. These results do not prove universal reachability or human enjoyment, and they must not be used to check the chapter's native fork gate.

## Next implementation and test

Start from the current master after the v0.24 release. Preserve every accepted porch, road, express and delivery case. Use existing runway and collector identities rather than renumbering the network. First record ordinary-input high and lower trajectories from the actual preview start; do not teleport the rider to the lip.

Add an early route-choice cue before the runway, a readable braking marker on its final section, and a visible lower receiver. Explain that holding speed continues high and braking can reach the canal line. Keep cues out of the riding silhouette and screen HUD; preserve reduced-motion settings. Translate actions through the existing controller mapping and XR UI, not a new gameplay menu.

Verify the lower line's useful outcome. Its modeled return near x=5200 precedes the Millworkers terrace delivery at tile 157, but actual terrain, carried speed and mailbox timing must be tested together. A lower-line reward or exploration observation must use existing non-awarding preview feedback until campaign settlement is deliberately versioned and qualified. Do not add permanent badges just to make the path appear useful.

Record normal-input high, intentional-lower, early-brake/release, no-input coast and road-recovery cases. Record both grip modes and multiple approach speeds without post-start state writes. Confirm forward continuation, no surprise ceiling/underside capture, no checkpoint trap, correct draft restoration and unchanged campaign saves. Repeat the twelve-delivery and existing four traversal cases. Real 3D captures must show the decision and its receiver; CPU 2D completions and tracked-input emulation remain explicitly labeled.

Only after those declared software gates and publication are accepted should the fork be called implemented. The optional high-to-high whip connection follows, with a non-whip continuation required. Physical-device and unfamiliar-player readability, timing and enjoyment remain separate observations.
