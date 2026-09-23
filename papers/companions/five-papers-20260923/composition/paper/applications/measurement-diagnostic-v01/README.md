# Measurement diagnostic: preserved information and usable access

September 8, 2026. Complete bounded exact-arithmetic diagnostic. This is not an
additional trained agent or a new held-out evaluation.

- [Declared protocol and analytic expectations](PROTOCOL.md)
- [Executable source](check_measurement.py)
- [First result](CHECK-01.json)
- [Exact evidence replay](CHECK-REPLAY-01.json)
- [Current manuscript](../../../access/398a19c3fafc1c81.md), Sections 4.8-4.10, 5.14 and 6.6

Both runs pass 24 checks. The substantive evidence payload hashes are
identical: `a750963b7a28feb07972987cdc1f0199d6e9f73a1d7db66d2070ef2769b49c4c`.
Execution times are approximately 0.079 and 0.077 seconds. Only the Python
standard library and one below-normal-priority process were used.

## What the result establishes

The finite optimal-risk calculation matches exhaustive readout enumeration.
All 225 supplied postprocessing comparisons and 225 bounded-risk difference
comparisons satisfy the analytic expectations. They are arithmetic test
cases, not independently sampled scientific observations.

An invertible four-state recoding preserves every distinction but lowers the
best affine-threshold accuracy from one to three quarters. An explicit product
readout restores accuracy one. The universal affine upper bound is a hand
proof from equal convex midpoints; the finite coefficient enumeration only
supplies a witness. Actually dropping the target coordinate gives optimum
one half. Different recording noise can also change observed accuracy while
the represented state remains unchanged.

These are possible explanations to distinguish, not diagnoses of the previous
GRU's probe ranking. No recurrent parameters or outputs changed. The hand
proofs are not new Lean results. The stability bound assumes a common prior,
common target/loss and losses in [0,1]; it does not cover unbounded log loss.

## Reproduce

Run `check_measurement.py` with a fresh local JSON basename as its single
argument. It refuses to overwrite an existing output and does not discover
files, download dependencies, train or create background workers. A five-second
internal deadline bounds the fixed checks. The local paths and channels are
declared in the source, not a general channel-estimation library.
