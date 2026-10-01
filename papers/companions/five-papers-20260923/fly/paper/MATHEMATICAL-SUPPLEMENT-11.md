# M14: fixed-cardinality observation envelopes

This elementary analytic result supports the observation-contract test. It is
not claimed as new general mathematics, a model of neural selection, a Lean
certificate, or a proof of SAN. The application and its preserved limits are
in the [new packet](application/hue-export-contract-v0/README.md).

## Statement

Let a_1 <= ... <= a_n be a sorted list of finite real observations, and let
1 <= k <= n. For every subset S of exactly k distinct observation indices,

    L_k = (a_1 + ... + a_k)/k
        <= mean(S)
        <= (a_(n-k+1) + ... + a_n)/k = U_k.

Both bounds are attainable. Ties do not invalidate the result: observations
are indexed, so equal values can belong to distinct selected observations.

## Proof

Write the selected indices in increasing order i_1 < ... < i_k. Necessarily
j <= i_j <= n-k+j. Monotonicity of the sorted list implies
a_j <= a_(i_j) <= a_(n-k+j) for every j. Sum these k inequalities and divide
by the positive integer k. Selecting the first k or last k indices attains
the lower or upper bound, respectively. This proves the statement.

For k=n, the interval collapses to the unique whole-pool mean. For k=1 it is
the full minimum-to-maximum interval. These endpoint cases have the same proof.

## Tolerance and observation error

Suppose each measured observation differs from its ideal value by at most
epsilon. Any particular subset mean then differs by at most epsilon, because
the mean of k absolute errors bounded by epsilon is also bounded by epsilon.
Taking the minimum and maximum over the same finite family of subsets changes
each extremum by at most epsilon as well. If a target r is itself known within
eta, a discrepancy greater than epsilon+eta outside [L_k,U_k] rules out the
assumed subset-mean explanation. Numerical checking uses an explicit absolute
tolerance, not a statement that computed floating-point extrema are exact reals.

The present application adopts the previously declared 1e-10 amplitude
comparison tolerance. It does not estimate biological noise or replace the
published noise-corrected score by that tolerance. Separate scalar readback
checks numerical agreement with the supplied trace table.

## Necessity is not sufficiency

The attainable means form a finite set. With observations [0,2], count one,
the target one lies strictly inside [0,2] but is not any allowed subset mean.
Furthermore, a common selector across stimuli is stronger than separate
rowwise selection. With two identical rows [0,2], targets [0,2] and count one
per row, each target is individually attainable, but no single selected column
produces both. Therefore passing the envelope test does not establish even
rowwise attainability, let alone an identified global observation selector.

## Application boundary

The result is conditional on the same observation pool, same stimulus join,
same response units/normalization, a known cardinality, and unweighted
arithmetic averaging. A correlated estimator, rescaling, missing observations,
changed normalization or different count meaning requires a different model.
An incompatible target could locate a violated interface assumption; it would
not by itself identify a flaw in the underlying biological experiment.

An all-compatible result cannot certify the native export or explain experience.
The full history-shaped receiving, PWD/NAPOT, multimodal relation, action-return
and learning construction retains its separate mathematical and empirical work.
