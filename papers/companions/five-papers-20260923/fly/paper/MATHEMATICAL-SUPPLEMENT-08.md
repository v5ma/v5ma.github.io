# M12: receptor removal, cell clamping and observation-relative equivalence

19 September 2026. Elementary conditional linear-system result, not new general mathematics, a fitted biological model or new Lean compilation.

## Declared model

Let p=P−P₀ and d=D−D₀ be deviations of two state variables. In dimensionless time, define

τp ṗ = −p + u + c d,

τd ḋ = −d + (e−h)p,

where τp,τd>0, c≥0 and h>e≥0. The two named contributions h and e are kept separate because deleting the inhibitory receiving path is not deleting the other input. This is an illustrative sign-structured system, not an assignment of measured Dm9 conductances or calcium units.

For a constant u, the intact equilibrium is

p* = u / [1+c(h−e)],  d* = (e−h)p*.

The state matrix has negative trace and positive determinant [1+c(h−e)]/(τpτd), so its two eigenvalues have negative real parts. With inhibitory-input removal h=0, stability additionally requires ce<1, and the equilibrium is p*=u/(1−ce), d*=ep*. Removing the output c=0 instead gives p*=u. A maintained cell clamp d=−δ with δ>0 gives p*=u−cδ. These are different interventions even though all could loosely be called “removing inhibition.” Restoring the original coefficients and initial condition restores the original trajectory by uniqueness of the linear initial-value problem; this is not evidence of biological rescue specificity.

## A measurement can hide the difference

Compare output removal with an established cell clamp, keeping τp and u(t) identical. Suppose the initial p values differ by −cδ. Subtract their first equations. Their difference z obeys τp ż=−z−cδ with z(0)=−cδ, hence z(t)=−cδ for every t. Therefore their absolute P states differ by cδ while

P_clamp(t)−P_clamp(0) = P_cut(t)−P_cut(0).

A measurement retaining only its own initial-baseline-subtracted P trace cannot distinguish this pair. An absolute reference, another measured state, a different manipulation or a nonlinear observation map can restore distinguishability. A ratio (R−R₀)/R₀ is not automatically this subtractive map: its denominator and the preceding fluorescence transform must be retained. Thus the result cannot be transferred directly to the source's Twitch-2C recordings.

This is a constructive special case of the observation limitations already discussed in M1/M7. It adds a concrete intervention/state contract, not a theorem that the published experiment is unidentifiable, that all receptor removal equals cell suppression, or that these two models are physiologically complete. Neither a voltage waveform nor an endogenous phase reference is inferred here.

## Executed witness and next use

The [frozen plan](application/receiver-intervention-contract-v0/ANALYSIS-PLAN.json) chooses c=0.6, h=0.4, e=0.1, δ=0.25, τp=1, τd=1.4 and P₀=D₀=0.5. Drives 0.05, 0.2 and 0.5 are evaluated in five conditions, for 15 trajectories. All coefficients are declared engineering choices. Cell clamping is established before the step, not an acute-clamp transient.

An eigen-decomposition-based exact solution and a separately written scalar RK4 implementation agree within 1.72×10⁻¹¹ at steps 0.01/0.005 over 12 time units. The absolute P separation is 0.15, while the specified baseline-subtracted traces coincide to numerical tolerance. A deliberately corrupted saved state is rejected. [Seventy checks](application/receiver-intervention-contract-v0/run-01/CHECKS.json) are same-agent software/numerical checks, not independent scientific review. No learned receiver weights are refitted and no new embodied episode is counted.

The next physiological test must state which input receptor, cell variable or output route is manipulated, when the manipulation begins, and which absolute/reference-relative quantities survive preprocessing. A controller fitted after each lesion answers a reacquisition question; it cannot replace the frozen-readout causal comparison. This result does not close the paper's remaining biological or formal-verification gates.
