# M11: spectral mixing, restricted observation and operation order

19 September 2026. Elementary conditional linear-algebra results for the explicitly constructed sensory surrogate. Not new general mathematics, formalized Lean results, or physiological laws.

## Declared model

Let S be a nonnegative 4-by-4 matrix of engineering-normalized source coefficients, r a reflectance vector in [0,1]^4, and E a nonnegative four-component illuminant. The synthetic response is

\[
q(r,E)=\tfrac14 S\operatorname{diag}(E)r.
\]

The factor one-quarter is the declared equal-bin convention. S is not a measured conductance matrix or a calibrated photon-catch operator. Let P retain the first three output coordinates and C=PS. All claims below are conditional on this model and observation interface.

## M11a. A restricted metamer construction

Suppose v is nonzero, Cv=0, and Sv is nonzero. Scale v so that its largest absolute component is one. For 0<a<=1/2, define r+ = (1/2)1 + av and r− = (1/2)1 − av. Both lie in [0,1]^4. Under E=1,

\[
P(q(r_+,1)-q(r_-,1))=\tfrac a2 Cv=0,
\qquad q(r_+,1)-q(r_-,1)=\tfrac a2 Sv\ne0.
\]

Proof: subtract the two reflectance vectors and apply linearity. Their component bounds follow directly from |v_j|<=1. Rank-nullity ensures a nonzero kernel for the three-by-four C, but does **not** by itself ensure Sv differs from zero; that extra condition must be checked. The application's selected means satisfy the numerical checks and use a=1/4. Scalar recomputation gives a coarse null residual below 4.08e-17 and a full-response difference norm of approximately 0.09931.

This is a task constructed to contain an observation ambiguity. It is not a novel natural metamer discovery or a held-out biological prediction. The first-three-channel equality can be broken by changed illumination because C diag(E)v need not vanish. It must not be assumed to hold under every lighting condition.

Any deterministic receiving transformation applied to identical coarse observations remains identical, under equal prior state and permitted randomness. This is the special case of M7 already proved for closed-loop observation histories. A phase recoding cannot manufacture a missing distinction. A further channel, changed sampling or legitimate retained evidence may supply an additional constraint.

## M11b. Illumination and receptor mixing do not generally commute

For four-by-four S, equality S diag(E) = diag(E) S holds if and only if

\[
S_{ij}(E_j-E_i)=0 \quad\text{for every }i,j.
\]

Proof: compare the (i,j) entry on both sides. This identity concerns equality for every r. Particular r may conceal the discrepancy, and uniform E is a special commuting case. Reusing wavelength-indexed E as an output-indexed gain is in general physically unjustified as well as algebraically different.

The recorded adverse-illumination example gives a maximum difference of approximately 0.0937665 between these two operations on the fixed target. Only the before-mixing operation supplies live observations. The erroneous ordering is retained as a diagnostic, not as a competing successful result.

## M11c. A conditional coefficient-error bound

If a second matrix has entries S_ij+Delta_ij with |Delta_ij|<=epsilon_ij, then

\[
|\widetilde q_i-q_i|\le\tfrac14\sum_j\epsilon_{ij}E_jr_j.
\]

Proof: expand the difference, use E_j r_j>=0 and apply the triangle inequality. This is a deterministic bound given entrywise coefficient bounds. The source workbook's between-animal SD is **not** such a bound, and does not provide independent coefficient errors or their cross-wavelength covariance. No confidence interval for episode performance is derived from these SDs.

## Connection to the earlier receiver and remaining scope

Nonnegative captures with positive total retain the normalized-input bound assumed by M9. The new sensory transform therefore does not by itself invalidate that conditional continuous-time phase-box argument. It does not certify RK4 execution, native adaptation, temporal integration, receptor-to-seed mapping or perceptual experience.

M10's common-reference invariance likewise remains true. Its coordinate twin is the same reduced dynamics written differently, not a proof against receiver-relative timing. See [the contextual clarification](research/RECEIVER-RELATIVE-INVARIANCE-AND-SOURCE-CONTEXT-20260919.md).

There are now eleven analytic result families in the working inventory. Only the existing seven supporting M7a/M8 lemmas are Lean-compiled. M11 is hand-derived and numerically illustrated here; it has not been machine-checked or independently reviewed.
