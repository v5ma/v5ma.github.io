# Exact protection versus a first-order projection

Let the fixed empirical protected loss be L_A and let W_0 be the stream's trained initial receiver. The implemented acceptance rule admits W' only if L_A(W') <= L_A(W_t) + delta and L_A(W') <= L_A(W_0) + epsilon, as well as the separately checked new-evidence and budget conditions. Rejection leaves W_t and its version unchanged.

For m accepted changes, induction and telescoping give

    L_A(W_T) - L_A(W_0) <= min(m * delta, epsilon).

With floating-point comparison allowance eta per local test and eta on the absolute cap, the checked numerical bound is min(m * (delta + eta), epsilon + eta). It is a finite, repeatedly tested empirical-set guarantee only. It says nothing by itself about unseen examples, an arbitrarily long independent task sequence, retained future plasticity, or biology. A fixed-capacity learner can hit the protection constraint and cease adapting; the later-task test must expose that result if it occurs.

The A-GEM projection, when g dot g_A < 0 and ||g_A|| > 0, is g_tilde = g - (g dot g_A / ||g_A||^2) g_A. Its inner product with g_A is zero in exact arithmetic. Otherwise leaving g unchanged satisfies the nonnegative-inner-product condition. This is the published Euclidean halfspace projection, not an original SAN theorem.

It does not establish nonincreasing empirical loss for a finite step. For L_A(w)=w^2, w=1, g=10 and learning rate 0.3, g dot grad L_A=20>0, but w'=1-0.3*10=-2 and L_A increases from 1 to 4. This elementary counterexample motivates testing actual candidate loss rather than promoting a first-order check into a global retention guarantee.

The recurrent trajectory remains deterministic given complete generating state and current verified feedback. Providing those same inputs to the history controller preserves the original conditional-information boundary. A trajectory benefit, if any, would concern useful representation under the measured finite computation and fit, not new information beyond its inputs.

These analytic statements need no performance result to hold, but their implementation still requires independent gradient, rollback and precision checks. Compilation of a new Lean formalization has not occurred in this version.
