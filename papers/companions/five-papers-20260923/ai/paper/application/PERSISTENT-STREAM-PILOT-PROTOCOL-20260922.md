# Persistent-stream pilot protocol, frozen before first run

22 September 2026. This is a **sequential post-result** application after Draft 4 and the stronger-history follow-up. The held-out gate results above are already known. Do not describe this protocol as a preregistration for the whole research program. Freeze this small pilot before executing `persistent_stream_pilot.py`; record adverse outcomes.

## Question and scope

Does a fitted diagnostic gate from the existing synthetic preflight help a **persistent** shared linear learner under task switches and previously unseen feature directions? The pilot is not a published-method benchmark, model-backed SAN mechanism, physiology or lifelong-learning result. It deliberately tests transfer of the already fitted gate to a different sequential setting. No retraining on pilot outcomes, threshold tuning, or test-seed replacement is allowed.

## Fixed environment

- Shared three-coordinate retained weight vector `w=(0,0,0)` per route; true target `theta=(1.5,-1,2)`. Six fixed unit context vectors: three coordinate axes and three normalized pairwise sums. A context produces `y=x*(theta dot v)+noise`, where `x` is uniformly `-1` or `+1` and noise is Gaussian with SD `1.25`.
- Phase A: contexts 0 and 1, 25 round-robin visits each. Phase B: contexts 2,3,4,5, 25 round-robin visits each. Phase C: all six, 10 round-robin visits each. All routes receive the exact same exogenous observations for each of five test seeds `62101..62105`.
- For each context, store the most recent four observed signed outcomes `yx`. No route may propose a retained change until four **prior** observations of that context exist. At a visit, current prediction is `x*(w dot v)`, signed residual is `(y-prediction)*x`, and the permitted history vector is each prior signed outcome minus current `w dot v`. Proposed update is `w' = w + 0.5*residual*v`. Observation is appended to history only after the proposal decision. No route receives true `theta`, future observations, or the evaluator's benefit labels.
- This deliberately small model has persistent shared weights and cross-context interference, but no replay buffer, nonlinear receiver, phase measurement, explicit energy cost or retention-acceptance transaction. Because contexts are generated from one linear target, old/new errors can trade off temporarily but are not intrinsically inconsistent.

## Frozen routes and metrics

Train the scalar, raw-four-history linear, trajectory, and five-slot history-interaction logistic gates once on the already fixed 2,400 development episodes using their existing scripts/settings. Evaluate them without adaptation in the pilot. Add a fixed analytic history rule, an always-propose control and a never-propose control. Every route has the same four-observation warmup restriction and `0.5` candidate size; threshold `0.5` is fixed.

At each test episode record noiseless pre-update mean squared error across all six contexts, old-context mean squared error for contexts 0-1, new-context mean squared error for contexts 2-5, and whether the route commits the proposal. At phase boundaries record the same three errors and cumulative pre-update error. Report per-seed values and arithmetic mean across the five seeds, write counts, and positive proposal fractions. This is an observed trajectory of one constructed environment, not an estimate of general population risk. No significance test is planned.

Finite checks: exact stream equality across routes; no hidden `theta` in gate inputs; no proposals before four prior context observations; every retained weight transition equals either zero (no commit) or the declared candidate step (commit); no current observation in its own prior-history vector; all routes process identical episode counts and phases; result output byte-identical on immediate rerun. The no-update route should remain at its initial weight; a failure is a code error. Do not force any ranking as a passing check.

If trajectory loses, say so. If it wins, do not infer a general trajectory mechanism from this synthetic pilot; the fixed generator, hand-engineered relaxation and original development-training distribution remain limiting. Publication would still require a realistic learned receiver, strong published comparators, held-out task families, retention/future-plasticity tests and independent review.
