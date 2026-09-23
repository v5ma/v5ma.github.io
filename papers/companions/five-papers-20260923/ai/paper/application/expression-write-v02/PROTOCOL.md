# Route/write generator correction, version 2

23 September 2026. Written before running this corrected diagnostic, after the original results and review defect were known. This is a versioned correction and regression check, not a new blinded hypothesis test.

The original twelve-event protocol specifies one input x per event and y = s*x + Gaussian noise. The first producer independently drew the returned x and the x used for y. The review exactly replayed 52 mismatches in 96 original events. Preserve the original script, protocol and result unchanged.

Version 2 draws x once. It keeps the original four seeds, two noise levels, sign sequence, 1e-12 equivalence threshold and separate three noiseless examples. It imports the original hash-pinned run_stream routine rather than silently changing the route/write algebra. All results are written under this new folder.

Added generator tests:

1. Independently replay one input/noise pair per event and check the entire emitted stream for every fixed seed/noise pair.
2. Inject a deterministic alternating-input, zero-noise source; require exactly twelve input and twelve noise requests, and y = s*x for each event.
3. Apply the same controlled source to the historical generator as a mutation control. The contract must detect its double draw; rejecting this mutant is a passing regression test, not a corrected result for that old generator.
4. Verify deterministic replay and the source identity of the preserved evaluator.

The finite numerical checks illustrate the real-arithmetic equivalence on the corrected sequence. They do not prove the general theorem, test selective-dissipation superiority, or change the separate persistent-learning/frozen-routing performance results. More general floating-point saturation is not tested by twelve-event streams.
