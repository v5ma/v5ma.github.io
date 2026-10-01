# Pre-execution review

Before the first simulation or metric computation, the implementation review found that a 1.5-unit initial target distance could let the fixed-full controller arrive before the scheduled actuator perturbation. That would not exercise the intended action-return requirement. The final frozen configuration therefore declares a 3.5-unit base distance (and 3.7 for the other source), preserving perturbation time 5, maximum command 0.4 and the 24-step horizon. No observed performance selected this change.

The initial templates are identical in the first three bands. The controller is therefore not allowed to interpret a lone coarse-band detection as uniquely identifying the target. A full-band observation first establishes identity; later motion association can carry that relation through coarse observations. Absence does not supply an occlusion label, and inferred continuation is not marked observed.

The signed-range sensor, noiseless body-return channel, fixed learned templates, spatial association tolerance and actuator calibration rule are engineering assumptions. They are not fitted fly physiology or a SAN phase mechanism. The adverse coloured illuminant remains in the run even if the controller fails. No success threshold is used to select published-looking episodes.
