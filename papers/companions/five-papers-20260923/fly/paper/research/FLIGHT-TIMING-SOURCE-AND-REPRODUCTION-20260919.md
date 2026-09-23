# Flight timing: primary source, executable equations and claim limits

19 September 2026. Source-faithful construction audit; same authoring workflow, not independent scientific review.

## Primary ownership and reading coverage

Hürkey et al., [*Gap junctions desynchronize a neural circuit to stabilize insect flight*](https://doi.org/10.1038/s41586-023-06099-0), Nature 618, 118–125 (2023), own the biological study, conductance model and mechanism. Their [code record 7740678](https://zenodo.org/records/7740678) supplies the versioned model archive; [record 7737730](https://zenodo.org/records/7737730) supplies a separate experimental dataset that was not downloaded here.

The full article XML was recovered from Europe PMC and pinned as [hurkey-2023.xml](../../access/917cc7af1ca059e1.md), SHA-256 `42ae00280d263428a1d3915020aa1e7cdeb9caf3a7c76cd63e1b66ecf77ecfc4`. Complete relevant-section reads cover Sec3–6 (minimal circuit, electrical coupling, excitability and mechanism), Sec8 (wing-power consequences), and Sec21–26 (conductance model, bifurcations, phase reduction, coupling coefficients and splayness). This is not a claim that every supplemental experiment and reference has been independently reviewed.

The ten source files in the [model intake](../../access/a362a079812496f7.md) and seven in the [numeric-reference intake](../../access/b3d1aa9529edf660.md) were read completely or decoded completely as numeric arrays. No downloaded program was executed. Source Python was used to understand equations, clocks, initialization and measurements; only newly written local code ran. Numeric arrays were loaded with object/pickle execution disabled and exact end-of-file checks.

The 36,297,364-byte ZIP was not fetched whole. Its complete 112-entry/92-file directory required 15,594 received bytes; the model and reference selections required another 25,617 and 958,660 bytes, respectively. Every selected member passed ZIP CRC validation and has a local SHA-256. The advertised whole-ZIP checksum is **not** claimed verified. The [directory receipt](../../access/3301ef40a1b2593e.md) retains the exact partial responses. The archive member list did not expose a LICENSE file; the code/array redistribution license remains unresolved. Article CC BY 4.0 does not automatically settle a separate archive's license.

## What the source actually establishes

The authors combine targeted physiological/genetic experiments with a reduced conductance model of five flight-power motor neurons. In the modeled regime, weak electrical coupling and suitable intrinsic excitability produce staggered firing. Stronger coupling or different intrinsic dynamics can instead favor synchrony. Their experimental wing-power conclusion belongs to their measurements; it is not newly reproduced by this numerical component.

The mechanism is not a claim that gap junctions are chemically inhibitory. The source describes weak, bidirectional, approximately non-rectifying electrical coupling. Phase response and the resulting odd coupling function depend on intrinsic dynamics. Their model supports phase repulsion near the saddle-node-loop (SNL) region and synchronization in the saddle-node-on-invariant-cycle (SNIC) regime. No local bifurcation continuation or phase-response-curve calculation was performed here; those regime names and interpretation are inherited from the source.

The source does not equate every form of desynchronization with information, demonstrate perceptual binding, or implement SAN's whole body-world reconstruction. Its usefulness here is a concrete counterexample to collapsing all coordination into synchronous spikes, plus a source-constrained stateful electrical component. The same voltage coupling can have different timing consequences under different receiving dynamics.

## Equation and parameter contract

State is voltage v, sodium inactivation fraction h and delayed-rectifier activation b. Sodium activation m is instantaneous. In local mV/ms/nS/pA/pF units:

\[
C_m\dot v_i=I_{\rm in}+\sum_jg_{ij}(v_j-v_i)
-g_L(v_i-E_L)-g_{Na}m_\infty(v_i)^3(1-h_i)(v_i-E_{Na})
-g_{Shab}b_i^4(v_i-E_K).
\]

For x = m, h, b, the steady activation/inactivation function is

\[
x_\infty(v)=[1+\exp(-c_Q z_x(v-v_x))]^{-1}.
\]

Only h and b have dynamic gates:

\[
\dot x=(x_\infty(v)-x)/\tau_x(v),\quad
\tau_x(v)=\frac{\exp[-\gamma_xc_Qz_x(v-v_x)]}
{r_x[1+\exp(-c_Qz_x(v-v_x))]}.
\]

The full numeric parameter maps are in the [native execution receipt](../application/flight-timing-component-v0/native-audit-01/EXECUTION.json); the raw JSON files remain preserved. In particular, sodium availability is **1 − h**, not h. Common values include C_m = 130 pF, g_Na = 431.2 nS, g_L = 8.624 nS, E_Na = 55 mV, E_K = −72 mV and E_L = −60 mV. SNL uses g_Shab = 137.68216 nS and I_in = 108.75 pA; SNIC uses 215.6 nS and 175 pA. Both changes belong to that published-regime comparison.

The homogeneous electrical conductance is imported from the saved numeric scalar, 0.043499999686087025 nS, rather than rounded to 0.0435 for execution. Strong coupling is the declared 3 nS control. Five-cell self-coupling is zero. The retrieved heterogeneous matrix is preserved but not used in this development run. There is no adaptation, plasticity, noise, chemical synapse, sensory transduction or muscle mechanics in the executed component.

For symmetric nonnegative gap conductances, let I_i = Σ_j g_ij(v_j − v_i). Pairing i,j terms gives Σ_i I_i = 0 and

\[
\sum_i v_i I_i=-\sum_{i<j}g_{ij}(v_i-v_j)^2\le0.
\]

This elementary identity concerns the electrical contribution to the voltage quadratic form. Its derivation is the pairwise sum g_ij[v_i(v_j−v_i)+v_j(v_i−v_j)] = −g_ij(v_i−v_j)². It does **not** prove synchronization of phases in the full nonlinear, actively driven cell system. The local checker tests the identity on 33 stored state samples per case; no new Lean compilation is claimed. This explanatory calculation is not counted as another novel theorem family.

## Initialization, scheduling and native reference

The saved single-neuron files contain 20,000 time points at 0.1 ms, with voltage in volts and gates in storage order b,h. The local reader converts voltage/time units and uses working order v,h,b. Their actual first state is v = −60 mV, h = b = 0. The source JSON lists nominal gates 0.146, but the inspected initialization loader does not assign them to this native trace. Substituting nominal values would not reproduce the saved run.

The local development plan retained one-step consistency tests at 0.1, 0.05, 0.025 and 0.01 ms. The 0.01 ms path matches adjacent native samples to floating precision. A free-running scalar implementation at that step then matches the complete two-second trajectory and spike list in each regime. The largest full-run discrepancy is 3.01 × 10⁻⁸ mV, below the declared 10⁻⁶ mV tolerance; gates are within 4.13 × 10⁻¹⁰, below 10⁻⁷. This identifies numerical consistency with saved output, not independently measured biological integration constants.

Network initial states use the source Figure 3B's last-interspike-cycle selection and phase fractions 0.9, 0.6, 0.5, 0.7, 0.8. That is one chosen initialization, not randomized coverage of attractors. Threshold is −10 mV with a 10 ms spike-report refractory period; voltage/gates continue evolving, with no reset or refractory state clamp. Local network RK4 holds gap current fixed during each intrinsic step as an explicit interpretation of the separately summed source synaptic variable. Native coupled output is absent from this comparison, so scheduling equivalence remains open.

## Phase measurement and the retained discrepancy

The paper's exact TeX definition matters: splayness is **one minus the square root of mean normalized gap variance**, not one minus mean variance or mean instantaneous splayness. With ordered circular phase gaps ψ_ki among N cells:

\[
\gamma_k=\frac{N}{N-1}\sum_i(\psi_{ki}-1/N)^2,
\qquad s=1-\sqrt{\langle\gamma_k\rangle_k}.
\]

Phase is linearly interpolated between bracketing spikes. The implementation uses the right-sided phase reset at a spike rather than the source helper's 10⁻⁹-second interpolation offset. Only a common valid interval is measured; no invented future spike closes the final interval. An unrelated source randomization helper appears to reuse cell-zero indices inside its loop. It was not used, executed or silently repaired, and no local result relies on it.

All five cases and the half-step differences are in the [application README](../application/flight-timing-component-v0/README.md). The splayness step check passes; exact trajectories are not declared converged. The voltage difference can reach 44.65 mV at a shared clock as narrow spikes move by up to 3.1 ms. One cell gains one boundary spike. These are recorded limitations, not discarded runs or reasons to change the criterion after observing it.

## Full-strength comparison and next decision

The source authors' claim concerns a particular motor circuit and biological interventions; this tranche reproduces only specified saved model traces and deterministic network behavior. It does not reproduce their 200-start coupling sweep, 60-second stochastic ensembles, heterogeneous network results, experimental statistics, bifurcation analysis or muscle-calcium/wing-power curves. The local control rates and phases must not be described as a fresh animal confirmation of SAN.

The necessary next decision is a temporal contract for the **sensory receiving** component. The motor model can constrain a separately typed motor branch or inspire a clearly declared proposed mechanism; it cannot donate measured visual time constants. The remaining hue fit/provenance task is documented in the [bounded archive audit](HUE-ARCHIVE-ACCESS-AND-IDENTITY-20260919.md). This is progress toward the full construction, not substitution of a completed motor model for that construction.
