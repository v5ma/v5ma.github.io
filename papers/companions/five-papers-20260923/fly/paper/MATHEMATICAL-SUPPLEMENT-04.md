# M7: observational equivalence in a closed action–feedback loop

19 September 2026. Elementary analytic result tied to the connected reference application. Not claimed as novel general mathematics, a verified biological law or a compiled Lean proof.

## 1. Statement and exact interface

Let the deterministic controller have state \(s_t\), including all retained parameters and temporary memory. Its sensory input is \(o_t\), its internal post-observation relation/state is \(p_t\), its action is \(a_t\), and its subsequently measured body return is \(b_t\). For fixed functions shared by both runs,

\[
p_t=U(s_t,o_t),\qquad a_t=\pi(p_t),\qquad
s_{t+1}=V(p_t,a_t,b_t).
\]

The functions and initial state include the same legitimate task instructions, learned knowledge and controller settings. Hidden environmental state cannot enter through an additional unrecorded argument, global variable, clock side channel or private callback. This last condition is an interface assumption, not something proved by writing down the equations.

**Proposition M7a.** If two runs start with identical controller state and receive identical sensory and body-return inputs for \(0\le t<T\), their post-observation states, actions and next controller states are identical throughout that interval.

**Proof.** At \(t=0\), equality of \(s_0\) and \(o_0\) gives equality of \(p_0\) under the same function \(U\). The same policy \(\pi\) then gives the same action. Equality of \(p_0,a_0,b_0\) gives equality of \(s_1\) under \(V\). Repeating this implication inductively proves the statement for every step before \(T\). QED.

For a randomized controller, the pathwise result applies after coupling the two runs to identical random draws. Without that coupling, the corresponding conditional output distributions are identical. Equal first observations alone do not suffice if prior learned states differ. Active sensing can break equivalence by acquiring a new distinguishing observation; the proposition does not prohibit that.

## 2. A reconstruction error bound

Suppose the two compatible physical relations are \(z_A,z_B\) in a metric space with distance \(d\), while the controller's common reconstruction is \(r\). Let \(\Delta=d(z_A,z_B)\).

**Proposition M7b.** At least one reconstruction error is at least \(\Delta/2\):

\[
\max\{d(z_A,r),d(z_B,r)\}\ge \frac{\Delta}{2}.
\]

**Proof.** The triangle inequality gives
\(\Delta\le d(z_A,r)+d(r,z_B)\le 2\max\{d(z_A,r),d(z_B,r)\}\).
Divide by two. QED.

This is a worst-case bound for two admissible states, not an estimate of animal perceptual error, a Bayesian posterior or a claim that the implemented point controller achieves the minimax optimum. Additional valid prior information can exclude one state; another sensor can distinguish them. Such information must be supplied explicitly and equally in a comparison. A richer internal model alone cannot reveal which of two genuinely indistinguishable permitted histories occurred.

## 3. Executed witness and scope

The [two-world challenge](application/embodied-reference-v0/OBSERVATION-TWIN-PLAN.json) fixes a 0.6-unit hidden target displacement during an occlusion. The controller receives identical observations and body returns and makes identical actions through time 8. The true relations differ at times 6–8, while the inferred relations remain equal. The shifted world's error reaches 0.6; the predicted lower bound on the larger of the two errors is 0.3. New evidence at time 9 changes the internal relation; actions first differ at time 11. All 46 declared checks pass in the [execution receipt](application/embodied-reference-v0/observation-twins-01/EXECUTION.json).

These finite executions illustrate the theorem and test the actual interface; they do not replace the general proof. The first application's overly broad constructor was repaired before making its strict interface claim. The [separate source/event audit](application/embodied-reference-v0/results-02/SEPARATE-CHECKS.json) is evidence about the declared Python boundary, not a machine-verified refinement proof from Python to these equations or a security guarantee.

## 4. Consequence for the SAN construction

The result extends M2's single-view sensor-equivalence limitation to an action–feedback history. An internal reconstruction should distinguish newly observed relations from inferred continuation and should seek a distinguishing observation when one is available and relevant. A controller may act usefully on retained evidence while its present object recognition has failed; arrival alone cannot establish continued correct reconstruction.

Nothing here implies that SAN's full tonic/PWD/NAPOT mechanism is implemented, that a connectome is unnecessary, or that experience is impossible or established. The theorem constrains any implementation using the stated interface, including a conventional comparator and a future SAN model. Its purpose is to prevent hidden evaluator information or unsensed state changes from masquerading as reconstruction.

## Formalization target

Formalize the finite-horizon deterministic state/action equivalence and metric half-separation bound with their assumptions explicit. Then bind the proof to an actual audited interface; compiling the abstract theorem alone will not prove the entire Python application, sensor fidelity or biological interpretation. Lean compilation and independent mathematical review remain open.
