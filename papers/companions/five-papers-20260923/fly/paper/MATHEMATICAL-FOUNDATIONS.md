# Mathematical foundations: four bounded design results

19 September 2026. Elementary analytic results and executable examples. No claim of novel general mathematics, biological verification, or Lean compilation is made. These statements constrain the research design; they do not establish SAN's physiological hypotheses.

## M1. Equilibrium observations do not identify the clock

Assume a differentiable autonomous system under fixed input, \(\dot x=F(x)\), with unique trajectories, and define \(G_c(x)=cF(x)\) for \(c>0\). An equilibrium satisfies \(F(x_*)=0\) exactly when \(G_c(x_*)=0\). If \(x(t)\) solves the first system, then \(y(t)=x(ct)\) solves the second, since \(\dot y(t)=cF(y(t))\). Thus the equilibria are identical, but any nonconstant trajectory is traversed on a rescaled clock. A periodic orbit of period \(T\) has period \(T/c\), and linearization at an equilibrium scales eigenvalues by \(c\). QED.

This is a restricted non-identifiability result, not a claim that every temporal parameter is arbitrary in a physiologically measured model. Independently known time constants or transient data can distinguish the systems. Scaling a state-dependent or time-varying input without specifying its clock would be a different experiment.

**Consequence:** static hue-response fits alone cannot supply the temporal calibration of an oscillating SAN component. Obtain transient observations and a sensor-response model, or retain an explicitly uncalibrated timing branch. The numeric example uses an exact one-step discretization witness; the analytic proof above concerns continuous flows.

## M2. Sensor equivalence limits single-view reconstruction

Let \(S\in\mathbb R^{m\times n}\) be a spectral sampling operator with rank less than \(n\). Choose nonzero \(v\in\ker S\), a strictly positive spectrum \(L_0\), and sufficiently small \(\epsilon>0\) so that both \(L_0+\epsilon v\) and \(L_0-\epsilon v\) are nonnegative. Their captures are identical:

\[
S(L_0+\epsilon v)=SL_0=S(L_0-\epsilon v).
\]

Consequently any deterministic decoder receiving only that capture and identical prior state returns the same answer for both spectra. A randomized decoder with the same conditional randomness has the same answer distribution. It cannot always identify which spectrum was present. QED.

The theorem does not say active sensing is useless. A different permitted observation operator \(S'\) can separate the pair if \(S'v\ne0\). Context can narrow the admissible spectra. Such additional evidence must be supplied explicitly and equally to the compared models. An RGB-to-spectrum assignment in a simulator is an assumption, not recovery of a uniquely specified original spectrum.

**Consequence:** track alternative compatible scenes, and test whether a chosen action actually separates them. Uncertainty is a correct result where no permitted observation distinguishes the alternatives.

## M3. Gating familiar state updates loses current-state information

Let current displacement satisfy \(h_T=h_0+\sum_{t=1}^{T}d_t\). Let a gated implementation instead compute \(\hat h_T=h_0+\sum_{t=1}^{T}g_td_t\), where \(g_t\in\{0,1\}\). Subtraction gives

\[
h_T-\hat h_T=\sum_{t=1}^{T}(1-g_t)d_t.
\]

For repeated identical nonzero steps \(d\), admitting only the first gives error \((T-1)d\). QED. The error may cancel on a particular trajectory; it is not generally zero.

This does not prove how fly path integration is stored. It establishes that a proposed novelty rule cannot discard state-relevant familiar steps merely because the reusable movement model need not be relearned. Episode-specific state and durable knowledge can both reside in mutable synaptic variables; persistence alone does not identify their computational role.

**Consequence:** separate current-state updating from the gate for revising reusable knowledge. Tests must include predictable but necessary movements, independent repeated evidence, and familiar inputs with changed consequences.

## M4. Readout cancellation is not erasure or universal preservation

Let \(D\) be a fixed linear decoder and let \(a\in\ker D\). For any scalar \(c\),

\[
D(w-ca)=Dw-cDa=Dw.
\]

QED. For four equally spaced directional channels, use

\[
D=\begin{bmatrix}1&0&-1&0\\0&1&0&-1\end{bmatrix},\quad
a=(1,1,1,1)^\top.
\]

A nonzero stored vector \((6,0,6,0)^\top\) has zero directional readout. Opposing contributions cancel in that readout without all stored values disappearing. Removing a common component preserves \(Dw\), but not the total \(\sum_i w_i\). Nor need it preserve \(D\operatorname{diag}(g)w\) when a nonuniform receiving state \(g\) makes the formerly silent component consequential.

For example, \(w=(3,2,1,2)\), \(c=1\), \(g=(2,1,1,1)\). Both \(w\) and \(w-ca\) have readout \((2,0)\) under \(D\); their gated readouts are respectively \((5,0)\) and \((4,0)\). Thus a state-dependent receiving process can expose information discarded by a previously sufficient reduction.

**Consequence:** declare the preserved observable and permitted future receiving states. Mean subtraction may also create negative values, so it is not automatically a valid operation on excitatory synaptic efficacy. A biological implementation needs a reference/opponent or other specified physical mechanism. These results do not justify indiscriminate dissipation.

## Verification and formalization map

[Exact-arithmetic checks](../access/424d59785a206f4c.md) implement constructive instances with rational numbers and a finite exhaustive input grid. Their [result receipt](../access/39f7828d11db4979.md) records actual execution. Finite checks do not prove the universal claims above. No stochastic fitting, connectome loading or biological data analysis occurs.

Future Lean work should formalize the linear-kernel invariance, gated-sum identity, observational equivalence and scoped state-reset contracts. Continuous-time existence and clock reparameterization require a separately declared formal-analysis scope. Do not replace the useful theorem with trivial identity lemmas and call the entire analysis formalized. Compiler exit, theorem names, source hash and axiom audit must accompany any formal-verification claim.
