\begin{center}

{\LARGE\bfseries SuperTimePosition and Gravitational Phase-Lock\par}

\vspace{0.35em}

{\large\itshape A Conditional Measurement-Dependent Phase Model with an Exact Finite-Lock Benchmark\par}

\vspace{0.8em}

{\small\textbf{Author: Micah Blumberg}\par}

{\small Self Aware Networks Research Institute\par}

{\small\url{https://selfawarenetworks.com}\par}

{\small November 20, 2026 (Version 2 Gauge-Invariant Phase and Transient Symmetry Extension to DOI 10.5281/zenodo.21693909)\par}

\end{center}

\vspace{0.65em}

MICHAHABSTRACTOPENMARKER

SuperTimePosition (STP) and Gravitational Phase-Lock (GPL) are developed as a conditional model program for Bell-type correlations. The proposal retains local response functions and asks whether a hidden phase can become statistically dependent on detector settings through a physical phase-lock process. This changes the measurement-independence premise used in standard Bell arguments; it does not refute Bell's theorem and is not validated merely because Bell inequalities are experimentally violated.

This revision adds an exact, bounded finite-lock benchmark. A phase on the circle follows a setting-conditioned diffusion whose stationary density is an equal mixture of two shifted hyperbolic-cosine components. With explicit local binary response laws, the construction yields exactly unbiased marginals, a closed joint probability law, and a cosine correlation with a Bessel-function visibility. It also admits a deterministic local completion. The mathematical closure comes at a measurable cost: Hall's measurement-dependence fraction falls below one half at the onset of CHSH violation and approaches zero as the singlet visibility is approached. A causal-timing proposition further shows that a strictly retarded detector-to-source mechanism cannot produce a setting-conditioned emission state when the settings are selected outside the emission event's past light cone without an additional common-past, retrocausal, nonlocal, or late-update premise.

The result is therefore two-sided. Version 8 closes the stationary-density, full binary-joint, and binary-marginal obligations for one explicit family, but it does not derive the lock strength from gravity, establish a physical value of the phase-diffusion rate, explain all experimental records, or prove the wider Super Information Theory framework. STP / GPL remains a falsifier-first research program whose next decisive requirement is an independently calibrated map from apparatus and gravitational variables to the model parameters.

MICHAHABSTRACTCLOSEMARKER

# Scope and evidence boundary

**Revision date:** July 27, 2026



# 1. Scope and Claim Boundary

This is a model-development paper. Its contribution is an explicit conditional architecture plus an exactly solvable benchmark - not a claim that the benchmark is nature's mechanism.

| Claim type | Version 8 disposition |
| --- | --- |
| Bell theorem and CHSH mathematics | Standard foundations background [1], [2]. |
| Proposition V-G | Conditional model proposition under explicit hypotheses. |
| Measurement independence | Relaxed by the model. |
| Local response | Retained after the complete hidden state is specified. |
| Binary no-signaling in the exact benchmark | Proved within the stated response and density family. |
| No-signaling for timing, efficiency, loss, postselection, or other records | Open and experimentally required. |
| Finite-lock correlation and Hall cost | Derived and reproducibly computed for the stated family. |
| Gravity-to-lock coupling | Open; no independent parameter map is supplied. |
| Full SIT action, quantum gravity, or empirical confirmation | Not established here. |

The paper does not claim that STP refutes Bell, that existing Bell tests validate GPL, that a mathematical stationary density proves a gravitational mechanism, or that any unspecified anomaly supports the proposal. Those statements would exceed the result.

# 2. Bell Assumption Ledger

Bell's theorem constrains locally causal hidden-variable accounts under a defined set of premises [1]. CHSH supplies an experimentally testable inequality for a corresponding class [2], and loophole-reduced experiments strongly violate that class of inequalities [7], [8], [9]. A setting-conditioned hidden-state distribution changes the assumption ledger rather than defeating the mathematics.

| Bell ingredient | STP / GPL treatment | Consequence |
| --- | --- | --- |
| Hidden state | A phase, with optional independent local response seeds. | Must be fully specified before locality claims are assessed. |
| Conditional response locality | Alice uses only her setting and local hidden variables; Bob uses only his. | Retained in the benchmark. |
| Conditional factorization | Joint responses factor once the complete hidden state is specified. | Retained. |
| Measurement independence | The phase density may depend on both detector settings. | Explicitly relaxed. |
| Operational no-signaling | Must follow for every recorded channel, not just be asserted. | Proved only for modeled binary outcomes. |
| Causal direction | Not fixed by a conditional probability alone. | Must be supplied by a spacetime mechanism. |

The benchmark joint distribution takes the form

\[
P(A,B\mid a,b)=\int P(A\mid a,\lambda)P(B\mid b,\lambda)\,
\rho(\lambda\mid a,b)\,d\lambda .
\tag{1}
\]

The dependence of \(\rho\) on \((a,b)\) is the exact point at which measurement independence is relaxed. Calling the response functions local does not restore the missing independence assumption.

# 3. Proposition V-G

**Proposition V-G (conditional STP / GPL visibility target).** Assume:

1. A weak-field or otherwise explicitly bounded regime for the proposed time-density perturbation.
2. A controlled small-perturbation expansion, including an error bound.
3. A defined event at which the relevant hidden phase is fixed or updated.
4. A declared causal route connecting apparatus history to that event.
5. A phase variable \(\lambda=\phi\bmod 2\pi\) with explicit dynamics.
6. A normalized stationary density derived from those dynamics rather than inserted without a model.
7. Normalized local response factors for \(A,B\in\{-1,+1\}\).
8. Operational no-signaling for all observables claimed to be covered.
9. Finite-lock parameters fixed from independent apparatus or field measurements before comparison with Bell outcomes.

If all nine conditions are satisfied, the resulting model may be evaluated against its stated correlation, marginal, relaxation, and gravity-linked predictions.

The exact family in Section 6 closes conditions 5 through 8 for its binary statistical benchmark. It does not close conditions 1 through 4 or 9. In particular, constructing a diffusion with the desired invariant density is a consistency result; it is not a derivation of that diffusion from gravity.

# 4. Proposed Mechanism and Causal Alternatives

The physical problem comes first. In a Bell experiment, each station chooses a setting and records an outcome. A local-response account must explain how correlated outcomes arise while each response uses only its local setting and a complete hidden state. If the hidden state is already fixed before late settings are chosen, a purely retarded influence from those settings cannot rewrite that earlier state. If the hidden state is instead allowed to depend statistically on both settings, the model has changed the measurement-independence premise and must explain the physical route, timing, cost, and observable side effects of that dependence.

The proposed solution is a hidden phase whose distribution can be steered toward phase relations associated with the apparatus settings while diffusion prevents perfect locking. **SuperTimePosition** names the claim that a faster underlying phase process may be undersampled by ordinary measurements. **Gravitational Phase-Lock** names the stronger physical hypothesis that gravitational or clock-rate conditions help determine the steering, diffusion, or update history of that phase. The exact benchmark below tests the statistical operation without presuming that the gravitational bridge has already been derived.

The STP / GPL mechanism has four proposed layers:

| Layer | Proposed role | Present status |
| --- | --- | --- |
| Fast phase | A hidden phase evolves on a timescale finer than ordinary detector sampling. | Model primitive. |
| Setting-conditioned history | Apparatus configuration changes the sampled phase statistics. | Represented statistically; physical route open. |
| Time-density or clock modulation | GPL connects local gravitational or clock-rate conditions to phase evolution. | Hypothesis needing a coupling equation. |
| Finite-lock response | Competition between steering and diffusion determines visibility. | Exact for the benchmark once its dimensionless parameter is supplied. |

A conditional density does not itself tell us whether the dependence is caused by an early-setting influence, a common-past variable, retrocausality, nonlocality, or a later update of the hidden state. These alternatives are physically different even when they generate the same conditional statistics. Measurement-dependence cost also depends on causal organization [4], [5].

# 5. General No-Signaling Obligation

The two binary marginal conditions are

\[
P(A\mid a,b)=\int P(A\mid a,\lambda)\rho(\lambda\mid a,b)\,d\lambda ,
\tag{2}
\]

\[
P(B\mid a,b)=\int P(B\mid b,\lambda)\rho(\lambda\mid a,b)\,d\lambda .
\tag{3}
\]

Operational no-signaling requires the first expression to be independent of \(b\) and the second to be independent of \(a\). A setting-conditioned density can easily violate this requirement. Exact cancellation can also be structurally fragile, so causal-model analyses motivate testing whether the cancellation survives perturbations and whether it extends to every recorded variable [6].

The relevant equality is therefore not merely a fit to the joint correlation. It is the paired requirement

\[
P(A\mid a,b)=P(A\mid a),\qquad
P(B\mid a,b)=P(B\mid b).
\tag{4}
\]

If outcome, timing, efficiency, loss, or postselection records depend on the remote setting beyond controlled uncertainty, the corresponding version of the model fails.

# 6. Exact Finite-Lock Benchmark and Its Cost

Let \(\lambda,a,b\) be angles modulo \(2\pi\), let \(x\ge 0\), and let \(D_\lambda>0\). Define

\[
Z_x(\lambda;a,b)=2\cosh\!\left[x\cos(\lambda-a)\right]
+2\cosh\!\left[x\cos(\lambda-b)\right].
\tag{5}
\]

Consider the Itô diffusion on the circle

\[
d\lambda_t=D_\lambda\,\partial_\lambda\ln Z_x(\lambda_t;a,b)\,dt
+\sqrt{2D_\lambda}\,dW_t .
\tag{6}
\]

For fixed settings, zero probability current gives the normalized stationary density

\[
\rho_x(\lambda\mid a,b)=
\frac{\cosh[x\cos(\lambda-a)]+\cosh[x\cos(\lambda-b)]}
{4\pi I_0(x)} .
\tag{7}
\]

The density is positive, normalized, and \(\pi\)-periodic. Its drift was selected to realize this density, so the calculation proves mathematical consistency rather than physical origin. Stationary Fokker-Planck methods provide the standard mathematical setting for this construction [10].

For \(s,t\in\{-1,+1\}\), define the local response laws

\[
P(A=s\mid a,\lambda)=\frac{1+s\cos(a-\lambda)}{2},
\tag{8}
\]

\[
P(B=t\mid b,\lambda)=\frac{1-t\cos(b-\lambda)}{2}.
\tag{9}
\]

The opposite sign in Bob's response is part of the model definition. Independent local uniform threshold seeds convert these stochastic responses into deterministic local functions without changing the observed probabilities.

Because the density is \(\pi\)-periodic while each local cosine mean changes sign under \(\lambda\mapsto\lambda+\pi\), the binary marginals cancel pairwise:

\[
P(A=+1\mid a,b)=P(B=+1\mid a,b)=\frac12 .
\tag{10}
\]

Thus the benchmark satisfies exact operational no-signaling for the modeled binary outcomes. The correlation is

\[
P_x(A=s,B=t\mid a,b)
=\frac14\left[1-st\,V(x)\cos(a-b)\right],
\qquad s,t\in\{-1,+1\}.
\tag{11}
\]

This full joint law follows from the two zero local means and the binary correlation. It is nonnegative because \(1/2\le V(x)<1\), and summing over either outcome returns the one-half marginals in Equation 10. The correlation is

\[
E_x(a,b)=-V(x)\cos(a-b),
\tag{12}
\]

with visibility

\[
V(x)=\frac12\left[1+\frac{I_2(x)}{I_0(x)}\right].
\tag{13}
\]

At \(x=0\), \(V=1/2\). As \(x\to\infty\), \(V\to1\). The optimized CHSH calibration for this cosine family is

\[
S_{\max}(x)=2\sqrt{2}\,V(x).
\tag{14}
\]

This value may exceed two because measurement independence has already been relaxed; it is not a violation by a model satisfying the standard Bell premises.

Hall's maximum variation measure and normalized measurement-independence fraction are [3]

\[
M(x)=\sup_{a,b,a',b'}\int_0^{2\pi}
\left|\rho_x(\lambda\mid a,b)-\rho_x(\lambda\mid a',b')\right|d\lambda,
\tag{15}
\]

\[
F(x)=1-\frac{M(x)}{2}.
\tag{16}
\]

For completeness, define the single-channel density

\[
q_\theta(\lambda)=
\frac{\cosh[x\cos(\lambda-\theta)]}{2\pi I_0(x)},
\qquad
\rho_x(\lambda\mid a,b)=\frac{q_a(\lambda)+q_b(\lambda)}{2}.
\tag{17}
\]

The triangle inequality bounds the variation between any two equal-channel mixtures by the largest variation between two translates of \(q_\theta\). The bound is attained by taking \(a=b=\alpha\) and \(a'=b'=\beta\), so the mixture problem reduces exactly to the translate problem. Because \(q_\theta\) is even, \(\pi\)-periodic, and monotone from each mode to its neighboring trough, its translate distance is maximized at \(|\alpha-\beta|=\pi/2\). Splitting the circle at the four crossings then gives

\[
M(x)=\frac{4}{\pi I_0(x)}\int_0^{\pi/4}
\left[\cosh(x\cos t)-\cosh(x\sin t)\right]dt .
\tag{18}
\]

The reproducible benchmark gives

\[
\begin{aligned}
x_{\mathrm{CHSH}}&=2.671336787635287,\\
M(x_{\mathrm{CHSH}})&=1.052496622785648,\\
F(x_{\mathrm{CHSH}})&=0.473751688607176.
\end{aligned}
\tag{19}
\]

As \(x\to\infty\), the model approaches the singlet cosine while \(M\to2\) and \(F\to0\). By comparison, Hall's exact deterministic singlet model has \(F=(4-\sqrt2)/3\approx0.861929\) [3]. The benchmark is therefore mathematically exact but comparatively expensive in this metric. That result does not disprove STP; it sets a performance floor that a stronger physical construction should improve on or justify.

| Parameter | Identifiable role | Required measurement route |
| --- | --- | --- |
| \(x\) | Dimensionless steering-to-noise ratio controlling the stationary density. | Predict from apparatus and field variables before examining outcome correlations. |
| \(D_\lambda\) | Overall phase-dynamics timescale at fixed \(x\); the detailed relaxation spectrum also depends on the drift landscape. | Estimate from time-resolved response after a controlled setting change. |
| \(\tau_e\) | Emission-sensitivity or hidden-state update window. | Define from source and detector timing. |
| Gravity coupling | Proposed map from local gravitational or clock variables to steering. | Supply an equation, units, calibration, and uncertainty budget. |

Static correlations can identify a candidate \(x\) within this family but cannot identify \(D_\lambda\), because the latter cancels from the stationary density. This creates a useful two-stage discriminator: first calibrate the stationary steering ratio independently; then test the transient relaxation time.


# 6A. Gauge-Invariant Physical Phase Observable and Bounded Transient Symmetry Theorem (November 2026)

## 6A.1 Gauge-invariant phase observable requirement

If the phase variable $\phi$ of this paper is intended to descend from a charged complex SIT coherence field $\psi(x) = |\psi(x)| e^{i\theta(x)}$ coupled to a local $U(1)$ connection $A_\mu$ (as in the November 2026 authoritative action `M_NOV2026_AUTH_EFT_V1`), a bare local phase $\theta(x)$ is **not** a physical apparatus observable: under a local gauge transformation $\theta(x) \mapsto \theta(x) + \chi(x)$, $A_\mu \mapsto A_\mu + \hat{q}^{-1}\partial_\mu\chi$, the bare phase shifts by $\chi(x)$. Any physically meaningful phase variable descending from a charged field must therefore be constructed as a **gauge-invariant relative phase, dressed observable, or Wilson-line holonomy** along an explicitly declared spacetime path $\gamma$ from $x$ to $y$:

\[
\Delta\Theta_\gamma(x, y) := \theta(y) - \theta(x) - \hat{q}\int_\gamma A_\mu\,dx^\mu,
\]

whose local gauge variation vanishes identically (verified symbolically in `verify_paper034_v2.py`). Moreover, fitting a phenomenological lock strength $\kappa$ and diffusion scale $D$ to an observed visibility curve establishes only a fit of the conditional model; a discriminating empirical test requires an independently calibrated source-to-lock relation derived from apparatus parameters.

## 6A.2 Bounded mathematical extension: persistence of $\pi$-symmetry through time-dependent transients

**Theorem 6A.1 (Transient $\pi$-symmetry and unbiased binary marginals). [PROVED; numerically verified]** *Consider the time-dependent Fokker--Planck equation on the circle $S^1 = \mathbb{R}/2\pi\mathbb{Z}$,*

\[
\partial_t p(\phi, t) = -\partial_\phi\bigl[v(\phi, t)\,p(\phi, t)\bigr] + D(t)\,\partial_\phi^2 p(\phi, t),
\]

*with smooth $2\pi$-periodic drift $v(\phi, t)$ that is $\pi$-periodic in $\phi$, i.e. $v(\phi + \pi, t) = v(\phi, t)$ for all $(\phi, t) \in S^1 \times [0, T]$ (for example $v(\phi, t) = -\kappa(t)\sin\bigl(2(\phi - \theta(t))\bigr)$ with arbitrary smooth time-dependent lock strength $\kappa(t)$ and setting angle $\theta(t)$), and strictly positive diffusion $D(t) \ge D_{\min} > 0$. Assume classical parabolic well-posedness and uniqueness on $S^1 \times [0, T]$. If the initial conditional distribution is $\pi$-symmetric, $p(\phi + \pi, 0) = p(\phi, 0)$ for all $\phi \in S^1$, then:*

1. *$p(\phi + \pi, t) = p(\phi, t)$ holds identically for all $(\phi, t) \in S^1 \times [0, T]$; and*
2. *for every antipodally antisymmetric binary outcome map $A(\phi, a) \in \{-1, +1\}$ satisfying $A(\phi + \pi, a) = -A(\phi, a)$ (such as $A(\phi, a) = \operatorname{sgn}\cos(\phi - a)$), the transient marginal expectation satisfies $\mathbb{E}_t[A(\phi, a)] = \int_0^{2\pi} A(\phi, a)\,p(\phi, t)\,d\phi = 0$ identically for all $t \in [0, T]$.*

*Proof.* Define the half-turn shift operator $(T_\pi f)(\phi) := f(\phi + \pi)$ and the antisymmetric defect $w(\phi, t) := p(\phi, t) - p(\phi + \pi, t)$. Because $v(\phi + \pi, t) = v(\phi, t)$ and $D(t)$ is independent of $\phi$, the Fokker--Planck operator $\mathcal{L}_t f := -\partial_\phi(v(\cdot, t) f) + D(t)\partial_\phi^2 f$ commutes strictly with $T_\pi$: $\mathcal{L}_t(T_\pi p) = T_\pi(\mathcal{L}_t p)$. Subtracting the shifted PDE from the original PDE gives the homogeneous parabolic equation $\partial_t w = \mathcal{L}_t w$ on $S^1 \times [0, T]$ with initial condition $w(\phi, 0) = 0$. By uniqueness of smooth solutions to uniformly parabolic equations on the compact manifold $S^1$, $w(\phi, t) \equiv 0$ for all $t \in [0, T]$, proving (1). Part (2) follows by changing variables $\phi \mapsto \phi + \pi$: $\int_0^{2\pi} A(\phi, a) p(\phi, t)\,d\phi = \int_0^{2\pi} A(\phi+\pi, a) p(\phi+\pi, t)\,d\phi = -\int_0^{2\pi} A(\phi, a) p(\phi, t)\,d\phi$, forcing the integral to vanish identically. ∎

**Pseudospectral numerical confirmation (`verify_paper034_v2.py`).** Integrating the time-dependent PDE on $N = 64$ Fourier modes over $t \in [0, 2.0]$ ($1{,}600$ RK4 steps) with $\kappa(t) = 2.0 + 0.8\sin(3t)$, $\theta(t) = 0.7\cos(2t)$, and $D(t) = 0.35 + 0.1\cos(1.5t)$ from the $\pi$-symmetric initial density $p_0(\phi) = (1 + 0.4\cos 2\phi)/(2\pi)$ yields maximum $\pi$-symmetry defect $7.77 \times 10^{-16}$ and maximum transient binary marginal $|\mathbb{E}_t[A]| = 2.99 \times 10^{-16}$ (machine precision). By contrast, a negative control starting from the non-$\pi$-symmetric density $(1 + 0.4\cos\phi)/(2\pi)$ exhibits symmetry defect $0.2675$ and transient marginal bias $0.2399$, confirming the sensitivity of the test.

**Scope boundary preserved:** Theorem 6A.1 extends the unbiased binary-marginal result from steady state to finite-time transients under declared $\pi$-symmetric initial preparation. It leaves timing, detection losses, post-selection, and the unresolved causal gravitational preparation mechanism strictly open.


# 7. Causal-Timing Obstruction

Let \(E\) be the event at which the hidden phase is fixed. Assume that all influences on that state propagate within the past light cone of \(E\); settings \(a\) and \(b\) are chosen outside that past light cone; no common-past variable correlates them with the hidden state; and retrocausal and nonlocal influences are excluded. Under those assumptions,

\[
\rho(\lambda_E\mid a,b)=\rho(\lambda_E).
\tag{20}
\]

The setting-conditioned density in Equation 7 therefore cannot be generated at emission for \(x>0\). A physical STP account must declare which premise changes: settings fixed early enough to influence the source, common-past correlations, retrocausality, nonlocality, or a hidden phase fixed at a later event. This proposition does not exclude all measurement-dependent models; it blocks one underspecified retarded detector-to-source story.

# 8. Gravity-Linked Experimental Program

GPL becomes experimentally meaningful only after it predicts a bounded pattern. The minimum protocol should include:

1. an independently calibrated map from gravitational, clock-rate, material, geometry, and timing variables to \(x\) and \(D_\lambda\);
2. settings chosen both early enough and too late for a claimed retarded source influence;
3. fixed-angle apparatus rotations with preregistered period, phase, and amplitude predictions;
4. detector-label and orientation reversals;
5. blind schedules and environmental monitoring;
6. complete outcome, time-tag, efficiency, loss, and postselection records;
7. marginal tests for every recorded channel; and
8. a declared null result and exclusion region.

An orientation effect is not yet a prediction merely because a qualitative dependence is imaginable. The gravity coupling must determine its amplitude and phase before the data are inspected. If visibility fails to scale with the precomputed parameter map, or if the predicted timing boundary is absent at sufficient sensitivity, the corresponding GPL mechanism is weakened.

# 9. Relation to Nearby Foundations Programs

| Framework | Relation to STP / GPL | Boundary |
| --- | --- | --- |
| Measurement-dependent hidden-variable models | Same Bell-ledger category at the statistical level. | STP must add a defensible physical mechanism. |
| Superdeterminism | May use common-past or global setting correlations. | STP cannot claim full measurement independence while using \(\rho(\lambda\mid a,b)\). |
| Retrocausal models | Can make later settings relevant to an earlier hidden state. | STP currently prefers retarded language but must meet the timing obstruction. |
| Nonlocal hidden-variable models | Permit spacelike dependence. | Not the stated local-retarded target. |
| Stochastic mechanics | Supplies diffusion and stationary-density tools. | The STP drift and gravity map must be its own. |

The label attached to a mechanism does not determine its causal content. The spacetime graph, conditional independences, parameter map, and observable consequences do.

# 10. Relation to Super Information Theory

STP / GPL motivates a bounded role for SIT variables without proving the full theory.

| SIT object | Role here | Boundary |
| --- | --- | --- |
| Coherence or phase field | Motivates phase-sensitive state variables. | Does not derive the benchmark density. |
| Local coherence measure | Candidate description of synchronization strength. | Interpretive until tied to the model parameters. |
| Time-density field | Candidate source of clock or phase-rate modulation. | Requires an independently constrained coupling law. |
| Local phase symmetry | Supports phase-language consistency. | Does not settle Bell causality or measurement dependence. |
| Causality constraints | Restrict the admissible GPL mechanism. | The timing proposition must be satisfied or a premise changed. |

This paper does not promote STP / GPL into a completed SIT action, a quantum-gravity theory, or a proof of unrelated mathematical conjectures. It provides a narrow benchmark that a future SIT-derived mechanism would have to reproduce or supersede.

# 11. Claim Ledger

| Claim | Status | Exact boundary |
| --- | --- | --- |
| The finite-lock density is normalized and stationary for Equation 6. | Proved within model. | Finite \(x\), positive \(D_\lambda\), fixed settings. |
| The modeled binary marginals are one half. | Proved within model. | Does not cover side channels or postselection. |
| The full binary joint law, correlation, and Bessel visibility follow. | Proved within model. | Uses Equations 7 through 13. |
| A deterministic local completion exists. | Explicit construction. | Measurement dependence remains in the phase density. |
| The Hall maximum reduces to the orthogonal-translate integral. | Proved within model. | Uses the equal-channel mixture and circular monotone-translate argument. |
| The CHSH threshold and Hall values are fixed outputs. | Reproducibly computed. | They are not empirical fits. |
| The strictly retarded late-setting route is obstructed. | Conditional proposition. | Depends on the stated causal exclusions. |
| Gravity determines \(x\) or \(D_\lambda\). | Open. | No coupling law is supplied. |
| Existing Bell experiments validate GPL. | Excluded. | They establish a foundations constraint, not this mechanism. |
| The benchmark proves full SIT. | Excluded. | No full field theory or empirical bridge is derived. |

# 12. Source and Reproducibility Statement

**Version lineage (updated November 20, 2026):** The July 27, 2026 edition was publicly deposited on July 29, 2026 as Paper 034 (Zenodo DOI 10.5281/zenodo.21693909, https://pub.svgn.io/papers/paper-34/). This November 20, 2026 Version 2 candidate adds Section 6A (gauge-invariant relative-phase requirement and proved/verified Theorem 6A.1 on transient Fokker--Planck $\pi$-symmetry, verified in `verify_paper034_v2.py` / `paper034_v2_verification_results.json`).

The exact benchmark was recovered from the author's STP development corpus and reconstructed in a governed technical companion containing a fixed parameter file, reference implementation, generated numerical results, and fifteen deterministic tests. Those tests reproduce the normalization, binary marginals, correlation, unequal-channel checks, CHSH threshold, Hall maximum, and strong-lock limits. Version 8 additionally states the closed binary joint distribution and the reduction proving where the equal-channel Hall maximum occurs. Private notes and AI conversations are treated as authorship provenance and model-development history, not as independent scientific evidence.

Conventional claims in this manuscript are grounded in the primary literature listed below. The release candidate includes a public-safe claim / source / genealogy atlas and normalized fan-in record while excluding private file paths, private source content, and third-party source PDFs. Independent quantum-foundations review remains valuable future strengthening, not a condition for identifying this manuscript as the author's final local preprint candidate.

# 13. Limitations and Failure Conditions

1. The local response law is postulated, not derived from STP, gravity, or quantum measurement theory.
2. The diffusion drift is constructed from the recovered target density; stationarity is not a gravity derivation.
3. Binary no-signaling does not establish no-signaling for time tags, efficiencies, losses, or selection procedures.
4. The exact Hall-cost formula is for the equal-channel family; asymmetric families need their own full cost analysis.
5. Hall's variation metric is informative but not a complete measure of causal or information-theoretic dependence.
6. No physical coupling fixes \(x\), \(D_\lambda\), or a gravity-linked anisotropy amplitude.
7. No STP-specific experimental dataset is analyzed here.
8. The causal-timing result is conditional and does not exclude common-past, retrocausal, nonlocal, early-setting, or late-update theories.
9. Exact cancellation in one binary model does not establish structural robustness under perturbations.
10. The wider SIT framework remains outside the proved scope of this paper.

# 14. Conclusion

Version 8 replaces an open-ended finite-lock proposal with a sharper result. One explicit phase-diffusion family is normalized, solvable, binary-no-signaling, and reproducible, with a closed joint law and an explicit reduction of the Hall maximum. It approaches the singlet cosine while preserving local response functions after the complete hidden state is specified. The same analysis exposes the cost: the family uses substantial setting dependence, becomes maximally measurement-dependent in the strong-lock limit, and cannot be produced by a strictly retarded detector-to-source influence when the settings are chosen too late.

That combination of construction and obstruction is the paper's strongest defensible contribution. STP / GPL remains viable as a research program only if a successor supplies a physical gravity-to-lock map, a causal history consistent with the experiment's timing, broader no-signaling robustness, and preregistered predictions that can fail. The benchmark makes those obligations quantitative.

# References

1. J. S. Bell, “On the Einstein Podolsky Rosen Paradox,” *Physics Physique Fizika* 1, 195-200 (1964). [doi:10.1103/PhysicsPhysiqueFizika.1.195](https://doi.org/10.1103/PhysicsPhysiqueFizika.1.195).
2. J. F. Clauser, M. A. Horne, A. Shimony, and R. A. Holt, “Proposed Experiment to Test Local Hidden-Variable Theories,” *Physical Review Letters* 23, 880-884 (1969). [doi:10.1103/PhysRevLett.23.880](https://doi.org/10.1103/PhysRevLett.23.880).
3. M. J. W. Hall, “Local Deterministic Model of Singlet State Correlations Based on Relaxing Measurement Independence,” *Physical Review Letters* 105, 250404 (2010); erratum 116, 219902 (2016). [doi:10.1103/PhysRevLett.105.250404](https://doi.org/10.1103/PhysRevLett.105.250404).
4. A. S. Friedman, A. H. Guth, M. J. W. Hall, D. I. Kaiser, and J. Gallicchio, “Relaxed Bell Inequalities with Arbitrary Measurement Dependence for Each Observer,” *Physical Review A* 99, 012121 (2019). [doi:10.1103/PhysRevA.99.012121](https://doi.org/10.1103/PhysRevA.99.012121).
5. M. J. W. Hall and C. Branciard, “Measurement-Dependence Cost for Bell Nonlocality: Causal versus Retrocausal Models,” *Physical Review A* 102, 052228 (2020). [doi:10.1103/PhysRevA.102.052228](https://doi.org/10.1103/PhysRevA.102.052228).
6. E. G. Cavalcanti, “Classical Causal Models for Bell and Kochen-Specker Inequality Violations Require Fine-Tuning,” *Physical Review X* 8, 021018 (2018). [doi:10.1103/PhysRevX.8.021018](https://doi.org/10.1103/PhysRevX.8.021018).
7. B. Hensen et al., “Loophole-Free Bell Inequality Violation Using Electron Spins Separated by 1.3 Kilometres,” *Nature* 526, 682-686 (2015). [doi:10.1038/nature15759](https://doi.org/10.1038/nature15759).
8. M. Giustina et al., “Significant-Loophole-Free Test of Bell's Theorem with Entangled Photons,” *Physical Review Letters* 115, 250401 (2015). [doi:10.1103/PhysRevLett.115.250401](https://doi.org/10.1103/PhysRevLett.115.250401).
9. L. K. Shalm et al., “Strong Loophole-Free Test of Local Realism,” *Physical Review Letters* 115, 250402 (2015). [doi:10.1103/PhysRevLett.115.250402](https://doi.org/10.1103/PhysRevLett.115.250402).
10. H. Risken, *The Fokker-Planck Equation: Methods of Solution and Applications*, 2nd ed. (Springer, 1989). [doi:10.1007/978-3-642-61544-3](https://doi.org/10.1007/978-3-642-61544-3).