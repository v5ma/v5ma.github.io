# Storm Response: integrated mission release

Build: `aaa-vslice-storm-20260911.2`.

Open Menu > Story mission: Storm Response. This eight-stage mission connects a ground-vehicle response at Meridian, on-foot generator work, Northstar rooftop calibration, a cross-island helicopter flight, South Coast interior telemetry recovery and a coastal boat handoff. A selects, B closes, Y boards/exits, X reloads, and the right stick looks/aims. The maintained production checklist is [AAA-ROADMAP.md](AAA-ROADMAP.md), also summarized by Menu > Development roadmap.

The first vehicle destination is a parking bay outside Meridian rather than an unreachable point inside the building. The AIR TRANSFER terminal brings the existing unoccupied helicopter to the nearby pad only when requested. BOAT TRANSFER at South Rescue Pier similarly brings the original patrol boat to its berth. The ranger is not moved or automatically boarded. Offshore story buoys guide the coastal route; they do not replace the 24-buoy racing activity.

Continue saved mission preserves the current stage. Suspend returns to ordinary exploration. Recover at this mission checkpoint is an explicit relocation to a safe stage-specific position and does not reset the journal, cargo or unrelated activities. The story awards 1,800 credits only for its first completion; the reward ledger retains the story ID across reloads and replays.

Rain, fog tint and drifting precipitation blend in during the story. Rain is hidden inside the three main buildings. Lightning flashes are off by default and require an explicit setting; Reduced Motion suppresses them regardless. Delayed thunder respects the existing effects mix and does not generate repeated notification banners. This is procedural presentation, not a fluid simulation or a claim of cinematic weather fidelity.

This release also applies the pending ranch gate-margin repair: inside counts use a consistent safe inset, feeder behavior does not steer a just-returned resident back outside, and closing the pen keeps the residents contained. Crew delivery market pressure is blended into subsequent shifts instead of being discarded immediately.

The existing 64 residents / 30 species, walking expedition, recorder campaign, tools, no-damage vehicles, Ranch & Coast activities, economy and audio controls remain. No new dinosaur species are claimed in this pass. Most models remain stylized, and the roadmap's art/animation, full remapping, hardware, performance and human-playtest gates are still open.

Verification receipts and screenshots are stored in `verification/`. The model suite uses real Rapier, including the complete story coastal route and physical building traversal. Rendered tests use Chromium/WebGL and synthetic Xbox input. Distant travel is repositioned with explicit fixtures; local interaction, walking, transfers, boarding, descent, lifts, navigation, save/reload and completion use production behavior. No physical controller, speaker/headset or consumer-GPU performance certification is claimed.

Rollback: revert the scoped Storm Response merge/fix commit through a new reviewed commit. Do not force-reset the shared repository or clear browser storage. The previous game ignores the separate `dino-atlas.aaa-director.v1` story key; the original save namespaces remain intact. A rollback should preserve the story key for a later forward fix.
