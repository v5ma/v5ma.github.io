# Finite measurement diagnostic

September 8, 2026. Analytic expectations fixed before execution. This is a
small exact-arithmetic specification check, not new training, held-out
validation, a biological experiment or an additional learned application.

The comparison addresses a limitation already disclosed in Draft 2D: a
restricted probe does not identify all information preserved in a state.
Existing trained weights, predictions and probes must remain unchanged.

## Declared checks

1. Use finite row-stochastic channels and rational arithmetic. Compute optimal
   bounded-loss risk both by separate output-wise minimization and exhaustive
   enumeration of every deterministic decoder. Randomization cannot improve
   a finite linear decision objective. Validate all dimensions and weights.
2. Compose binary symmetric channels with flip probabilities in
   `{0, 1/8, 1/4, 3/8, 1/2}`. Under three priors and three loss tables, verify
   fine risk is no greater than postprocessed risk. The declared 225 cases are
   checks of a supplied construction, not evidence that arbitrary learned
   conditions are ordered in this way.
3. For all pairs of binary symmetric channels from the same grid, verify the
   prior-weighted total-variation bound on risk difference. Include an
   approximate postprocessing example: identity, postprocessing flip 1/4 and
   comparison flip 1/8. The bound is tight under a balanced prior and zero-one
   loss. An exact postprocessing certificate is supplied, not estimated.
4. For equally likely binary hypotheses, verify optimal accuracy equals
   `(1 + total variation) / 2`. There is no universal minimum detectable
   difference without a declared hypothesis pair, noise model and threshold.
5. On four uniformly weighted bipolar states `(u,v)`, compare identity with
   the invertible recoding `(u,u*v)` for the target `v`. Both support perfect
   unrestricted access. The recoded target is XOR-like and no affine threshold
   can get all four labels correct. Integer coefficients from -2 to 2 supply
   a 3/4 witness; this bounded enumeration is NOT the universal proof. The
   manuscript separately proves the upper bound by equal convex midpoints.
   A product readout recovers accuracy one. Dropping `v` instead has optimum
   one half. No trained-network result is replaced by this construction.
6. Place the same noiseless signal before two different measurement channels.
   Their observed accuracy can differ while the represented state remains
   identical. Observed improvement alone therefore does not locate a change
   inside the representation.

## Boundaries

The risk bound assumes losses in [0,1], identical state priors and targets,
and known channels. It does not bound unclipped logarithmic loss or prove
channel estimation, confidence intervals, neural causal identity or Lean
verification. No label-shuffle or nonlinear learned probe is retroactively
claimed part of the previous held-out evaluation. Tests use the standard
library, one below-normal-priority process and a five-second internal limit.
Outputs are new and exclusive; reruns require a different exact output file.
