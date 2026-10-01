# M9–M10: bounded directed reception and an oscillation-identification limit

19 September 2026. Two elementary analytic result families for the explicitly proposed [phase-receiver bridge](application/phase-receiver-bridge-v0/README.md). These results are not new general mathematics, biological proofs, or additional Lean-compiled theorems. The earlier seven compiled M7a/M8 lemmas remain the complete machine-checked inventory.

## M9. A signed directed receiver can be bounded and contracting

Let the receiver state be phi in R^n, and let the fixed-input vector field be

    f_i(phi) = -a sin(phi_i) + u_i
               + g sum_j K_ij sin(phi_j - phi_i).

Assume a>0, g>=0, each absolute row sum of K is at most one, and |u_i|<=U. Negative and asymmetric entries are allowed. For 0<r<pi/2, suppose

    a sin(r) > U + g,                 (inward condition)
    m = a cos(r) - 2g > 0.           (contraction condition)

**Boundedness.** On the upper face phi_i=r, the largest possible derivative is at most -a sin(r)+U+g<0. On the lower face it is at least a sin(r)-U-g>0. Consequently the box [-r,r]^n is forward invariant for the continuous-time system. This uses an absolute coupling bound; it does not assume every edge is excitatory or symmetric. Smooth bounded derivatives give existence and uniqueness.

**Contraction.** The infinity-norm matrix measure of the Jacobian is bounded by

    mu_infinity(Df) <= -a cos(r) + 2g = -m.

To see this, an off-diagonal derivative is g K_ij cos(phi_j-phi_i); the corresponding diagonal coupling contribution is its negative. Their contribution to diagonal-plus-absolute-off-diagonal row sum is at most 2g|K_ij|. Self-coupling contributes zero. The anchor's diagonal term is at most -a cos(r). The mean-value formula on the convex invariant box and the resulting scalar differential inequality give

    ||phi(t)-psi(t)||_infinity <= exp(-m t)||phi(0)-psi(0)||_infinity

for equal fixed input and K. A positive-time flow map is therefore a contraction of the complete invariant box. Its unique fixed point is an equilibrium: every time-shift of that fixed point is also fixed by the same flow map, hence uniqueness forces every time-shift to equal it. All trajectories in the box converge to this one equilibrium.

**Perturbation bound.** Suppose a second vector field satisfies the same common contraction bound, and its difference from the first is uniformly at most delta on the box. Then

    ||phi(t)-psi(t)||_infinity
        <= exp(-m t)||phi(0)-psi(0)||_infinity
           + delta(1-exp(-m t))/m.

For the same input but different normalized coupling matrices, one sufficient bound is delta=g||K-K'||_infinity. This is conservative and requires both trajectories to stay in their common box. It bounds receiver coordinates, not discrete actions near a classification threshold. A bound on action changes would additionally require readout margins and policy regularity.

### Relation to the executed construction

For nonnegative captures normalized on at most four observed bands, subtracting the uniform reference yields |x_j|<=3/4. Missing bands have zero declared difference. The engineered drive matrix B has absolute row sum one, so with u=0.8 Bx, U=0.6. With a=1, g=0.12 and r=1, the inward margin is 0.1214709848 and the contraction rate lower bound is 0.3003023059. The zero-coupling case also satisfies these conditions. These are conditional facts about the chosen model, not measurements of fly dynamics.

The four-unit exposure is **not** an assertion of exact equilibrium. The conservative memory-of-initial-state factor at that time is exp(-4m), about 0.301. Per-patch initialization at zero is an explicit reduction. This contracting fast state does not by itself provide durable learned memory; the implementation's learned readout vectors and actuator calibration are separately retained.

The analytic argument applies to the continuous ODE. RK4 is not formally refined to it. The saved numerical checks establish a maximum endpoint difference of 1.1052e-11 radians when the step is halved on these cases, and 2.2073e-6 radians against a separately coded scalar Euler calculation for two declared full-band observations. They do not prove global discretization error or physiological accuracy.

## M10. Relative readout does not identify an absolute oscillator

Consider any relative-coordinate dynamics

    d phi / dt = F(phi, x),

whose input x contains no independent absolute-phase forcing. Let a common differentiable carrier theta(t) be arbitrary, and define z_i=exp(i[theta+phi_i]) and z_0=exp(i theta). Suppose the learned receiving update and the controller use these signals only through

    z_i conjugate(z_0) = exp(i phi_i).

Then changing theta leaves every received representation unchanged. A system that integrates the same relative-coordinate dynamics and directly emits cos(phi_i),sin(phi_i), without an absolute oscillation, supplies exactly the same representations. If it starts with the same learned weights and episode state, uses the same deterministic learning/policy rules and receives the same inputs, induction over observations, actions and actual returns gives identical closed-loop behavior in exact arithmetic. This is an application of the earlier observation-history contract, not a new information source.

The familiarization update here is a running mean of the relative population signals, so it also respects that invariance. A common carrier's cancellation must therefore be considered at learning time as well as test time. The saved paired experiment matches all 576 actions exactly; its largest floating-point signal discrepancy is 1.366e-14. This does not guarantee identical floating-point decisions for every possible input at a threshold boundary.

### What does, and does not, follow

Relative differences still matter inside this constructed model: flattening them before the learned readout removes recognition in the declared control. Learned weight contents also matter: swapping them changes the selected direction. Those causal results do not show that an **absolute physical oscillation** supplies additional information or capability. Conversely, the equivalence does not say that biological oscillations, relative timing or SAN's broader receiving architecture are dispensable. It applies only to the specified reduction, with no independently timed forcing, delays, waveform-sensitive receptors or other phase-dependent operations outside the quotient.

A later physiology-grounded extension must identify which actual operation is absent from the coordinate-equivalent description and supply the associated measurements. Merely adding a carrier to the same internal coordinates cannot establish that distinction. The no-coupling result similarly restricts this task's evidential strength; it does not erase recurrence-dependent results in the primary hue literature or test their experimental claim.
