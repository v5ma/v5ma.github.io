# M15 — Selective receiving, distinguishability and actual returned evidence

19 September 2026. Elementary analytic results plus exact finite-matrix
certificates, not novel general mathematics, a biological theorem or a new
Lean compilation. The compiled inventory remains the earlier seven supporting
lemmas. The full SAN construction is not proved by this result.

## 1. The observation operator has an order

Let W be an m-by-n linear receiving map. Its entries here are a normalized,
nonnegative surrogate derived from a particular anatomical-count export.
They are not measured signed conductances. Two source patterns x and x+d are
indistinguishable in this noiseless observation precisely when Wd=0.

A common gain c cannot recover such a contrast: cWd=0. Neither can any
post-mixing linear operator H, because HWd=0. A component-selective change
BEFORE mixing is different. Set D_j=I+e_j e_j^T (double just input j) and let
a_j>0 normalize the Frobenius norm of W D_j back to that of W. Then

    W_j d = a_j W D_j d = a_j (Wd + W e_j d_j).

If Wd=0 but both d_j and column W e_j are nonzero, the changed receiver
exposes the contrast. This is not an assertion that every biological receiver
can independently double a chosen channel. It states exactly what a proposed
implementation must do, and why merely amplifying an already mixed response
does not suffice.

The norm normalizer is

    a_j = sqrt(||W||_F^2 / (||W||_F^2 + 3 ||W e_j||_2^2)).

The denominator follows because only that column changes from squared norm
c_j to 4c_j. Equal Frobenius norm equates average squared linear amplification
under isotropic input; it does not equate metabolic cost, firing rate, output
baseline, or sensitivity to a particular input distribution.

## 2. Repeated receiving states can rotate the invisible subspace

For actual observations under W_0,...,W_k, stack their operators vertically.
A difference remains invisible if and only if it belongs to every kernel:

    ker([W_0; ...; W_k]) = intersection_j ker(W_j).

Proof: the stacked product vanishes exactly when each block product vanishes.
If the baseline and all n single-input doubling states above are available,
this intersection consists exactly of vectors supported on zero columns of
W. Indeed Wd=0 and W D_j d=0 imply (W e_j)d_j=0. Every nonzero column therefore
forces d_j=0. The converse follows by direct multiplication. The stacked
rank is consequently the number of nonzero source columns.

This result explains a limit as well as a possible gain. A channel with no
retained route cannot be made visible by any such gain change. An additional
route, measurement or substantive model change would be needed.

## 3. An exact witness in the preserved export

The 79-by-147 source-by-target matrix has two identical nonzero source rows:

- `720575940645104840`
- `720575940610053827`

Both have only one retained target, `720575940605829297`, with five contacts.
Thus e_22-e_23 (zero-based source ordinals) is an exact null vector for the
transposed count and >=5 binary projections. Row normalization on receiving
cells leaves it null. The equality is over integers, not a numerical SVD
artifact. The metadata's dated-ID table calls both sources LT43 and predicts
GABA, but reports zero left KC contacts in that separate version. The export
must not be described as that earlier circuit. The numerical surrogate is
deliberately not assigned those signs or presented as native physiology.

Finite-field elimination modulo the prime 1,000,003 gives rank 78. A nonzero
minor modulo a prime is nonzero over the rationals, establishing rank at
least 78. The exact nonzero null vector gives rank at most 78, so rank is
exactly 78 over the rationals/reals. The source states and scalar proof checks
are in [CHECKS.json](../access/d9deaa54860a9fa1.md).

The literal notebook preprocessing drops the first receiving column and
discards counts equal to five. Its rank is 75, certified by the same lower-
bound procedure and four independent exact null directions: three zero
source columns and one disjoint equal-column pair. Its joint-state rank can
reach 76, not 79; the three removed input routes stay invisible. This is a
consequence of that particular export/preprocessing, not a claim about the
capacity of the living mushroom body.

The program's smallest singular vector selects one constructed contrast.
The nullspace in the notebook case has dimension four, so that vector is
only a numerical representative, not a unique biological stimulus or a
basis-invariant optimal intervention. Exact rank and zero-route conclusions
do not depend on the chosen SVD basis. Comparisons across the three variants
use different constructed contrasts and must not be called a matched-stimulus
biological comparison.

## 4. Noise makes the boundary operational

Suppose two known response prototypes y_- and y_+ are observed with a
Euclidean disturbance bounded by epsilon. Their closed observation balls
are disjoint exactly when ||y_+-y_-||_2 > 2 epsilon. If the distance is at
most 2 epsilon, the midpoint belongs to both balls; some observations cannot
determine the label. If it exceeds 2 epsilon, an observation cannot lie in
both balls, by the triangle inequality. Touching balls are still ambiguous.

The application constructs a disturbance directed toward the other
prototype, stopping at the midpoint or at epsilon. Its abstentions therefore
implement a specified information limit rather than an estimated population
error rate. A 1e-10 numerical membership allowance is explicit.

The selected count-export state separates the patterns by 0.01941632; it
cannot guarantee distinction at epsilon=0.01. Its zero-noise and epsilon=
0.001 cases do resolve. The >=5 binary and notebook representatives separate
by 0.03998748 and 0.02418095 respectively. All remain unresolved at epsilon=
0.05. These scales are dimensionless model quantities, not biological noise
estimates or perceptual thresholds.

## 5. A request is not an observation

Selecting W_j in an internal plan does not change the received data. If the
environment still delivers W_0 and acknowledges that actual state, the
previous ambiguity remains. Filling in a predicted W_j x as if it were a
measurement would bypass the claimed construction. The ignored-query control
therefore remains unresolved, while delivered queries can change the
internally represented alternatives and the action.

The stored paired prototypes are generous supervised familiarization, not
a fitted plasticity network or the native recurrent memory component. The
retained actuator-gain update is genuine executable adaptation but elementary.
The matched conventional observer has the same behavior, so this test alone
does not distinguish SAN from ordinary active sensing. Native timing, PWD
throughout NAPOT, learned multimodal relations, and experience remain open.
