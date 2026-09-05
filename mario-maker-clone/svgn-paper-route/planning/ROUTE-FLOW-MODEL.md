# A state graph for a flowing level

A ramp is not a graph node by itself. A usable motion node contains the surface ID, contact distance along that surface, direction and tangential speed. A peg state additionally needs rope length, angle and angular velocity. A directed edge is a real input sequence, simulated from that incoming state, that reaches a receiving state. Merely drawing a line between two centers never creates an edge.

The implementation uses the game's own GrappleCore.ride, flight and catchRail functions. The entry model explicitly samples an EUC jump with established speeds 7.5 and 9.2 world units/tick and several takeoff offsets. Airborne and rail velocities propagate continuously across the recorded sequence. The state search is finite and quantizes states for tractability. Its witnesses establish the exact sampled sequences, not all player states, all enemy timing, or all possible solutions. The topological projection using independent assumed speeds is retained only as a diagnostic; the composed-state search is the release planning measure.

The recipe builds an upper spine, then fits receiving geometry into a sampled launch corridor. Candidate curves include catchers, straight galleries, bowls, partial vertical turns and C-shaped returns. It rejects centerline crossings, clearance below 76 world units, off-world geometry, unintended interception of an earlier retained transition, and surfaces without an entry-to-contact witness. A previously working route is not sacrificed merely to add a decorative branch. There are 30, 34 and 38 retained surfaces, rather than preserving an arbitrary earlier count.

The ground remains a complete route and missing an upper branch is not a failed level. Each upper surface needs a sampled way onward or down. Higher rewards lie along retained rail/flight witnesses rather than at arbitrary empty coordinates. The existing game still determines whether a real collectible or mailbox is touched. No collection, catch or waypoint is automatically awarded by the planner.

Five, six and seven pegs are placed on reachable outgoing paths in the chapters. The compiler records a cast, wind-up, release and recovery witness for each chosen peg. It does not yet solve arbitrary peg-to-peg motion as part of the general state search. That is an explicit roadmap task. Native input replay of peg chains is a separate gate.

A long route is not automatically the best route. Future route ranking should report a Pareto set for unique rewards, travel time, input precision and recovery cost. Reward must be credited once per object so repeatedly cycling a ring cannot create infinite utility. The current code finds and exposes sampled routes; it does not claim a globally optimal longest path. The desired feel is a set of legible channels with different costs and rewards, not an AI that plays on the user's behalf.

The Workshop's Analyze flow command runs outside the graphics thread. It draws actual simulated trajectories, highlights clearance conflicts, distinguishes sampled access from unresolved access, and invalidates results when positions, terrain or movement assumptions change. Fit a catcher starts from an explicitly assumed entry state on the selected surface and requires success at at least three of four tested incoming speeds. Its translucent result is a proposal, not a silent level change. Accept creates one undoable document edit; reject leaves the original level intact. Source accessibility still needs the composed analysis.

Collision and feasibility limitations remain important. The shared rail/flight model does not fully simulate enemy timing, arbitrary future abilities or every moving platform. Ground entry is a bounded approximation to the complete platform controller. Clearance is a centerline design margin, not a full continuous rigid-body proof for every pose. Native browser playthroughs and human timing tests are therefore retained, not replaced by green graph lines.

## Reproduce and maintain

Run node --test tests/route_flow.test.cjs for the selected model, all three composed layout witnesses and planning dependency checks. scripts/compile-route-flow.cjs regenerates the fitted plans from the recipe, then rejects unsolved or conflicting results. The script's first chapter cache is optional; removing it exercises the same deterministic recipe. Generated plans and detailed reports live in planning/flow-reports. The shipped browser loads precomputed points; it does not optimize the scene every animation frame.

roadmap.json is the shared task baseline. metrics.json summarizes pinned reports. Paper-Delivery-Development.xlsx is an editable planning snapshot; edits to a downloaded spreadsheet are not automatically published to GitHub. The browser board is intentionally read-only. Update the canonical files in a reviewed commit and rebuild the workbook when status or evidence changes. Preserve stable task IDs and explicit acceptance criteria.

## Sources and intellectual context

The supplied Motocross screenshots are the direct visual geometry reference: incomplete road fragments, angular launches and separate receiving surfaces across one scene. No game assets are copied. Prior full-game level maps were not available for this implementation; do not claim a comprehensive reverse engineering of Sonic or Motocross.

Steven M. LaValle's motion-planning publication overview explains the distinction between configuration-space proximity and kinodynamic planning with differential constraints. This implementation uses finite motion primitives and carried velocity, not an implementation claim of RRT: https://www.lavalle.pl/rrtpubs.html

Randomized Kinodynamic Planning, International Journal of Robotics Research, provides primary research context for incorporating dynamic state into motion planning: https://journals.sagepub.com/doi/10.1177/02783640122067453

Nintendo's official Super Mario Maker tutorial describes the edit, playtest and save workflow that informs the authoring loop, not the route physics: https://en-americas-support.nintendo.com/app/answers/detail/a_id/15167/~/how-to-start-and-play-though-the-tutorial-%28super-mario-maker%29

The GDC Vault listing of the Sonic the Hedgehog designers' postmortem is a research lead, not a claim that its full presentation was reviewed: https://www.gdcvault.com/play/1024928/Classic-Game-Postmortem-Sonic-the

Original game research and layout study remains a separate backlog task. Shared-engine reproducibility, native play and user feedback take priority over analogy.
