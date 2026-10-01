# Sequential follow-up frozen before this comparator run

22 September 2026. Draft 4's held-out results are known. This is an explicitly **post-result** stronger-rival test, not an amendment to the original pre-run protocol. Freeze the following design before executing `strong_history_followup.py`.

## Exact repeated generator

Reuse `learned_gate_preflight.episode` with the same independent development and held-out seeds (`41329`, `90731`), sample counts (`2400`, `800`), noise scale (`1.25`), benefit definition, and untouched original three-gate result. Reconstruct the original trajectory gate from development data and require exact agreement with the already recorded held-out accuracy, Brier score and cross-entropy before interpreting a new comparison. Do not select a new test seed, threshold or training budget after viewing the result.

## Two stronger same-information rivals

Let `s=y*x`, `h=mean(history)`, and `c=0.5*s`. Neither rival receives the hidden relation coefficient `beta`, the held-out benefit label, or future observations.

1. **Equal-slot interaction gate:** fit a five-input logistic classifier with features `[s, h, s*h, s*s, h*h]`. This directly exposes an interaction and the candidate's squared magnitude, which the raw-history linear gate lacked. Use the *identical* development-only standardization, 200 batch-gradient epochs, learning rate 0.1 and L2 coefficient 0.01 as the trajectory gate. Five input weights plus intercept match its parameter count. This is a model-informed feature basis, not a generic universal history learner.
2. **Fixed history-based analytic rule:** estimate the hidden coefficient as `h` and compute the prospective squared-loss-improvement proxy `m=2*h*c-c*c`; predict benefit when `m>0`. For probability scoring use `sigmoid(m)` without tuning its scale. This control has no trained parameters but does use the known quadratic candidate-benefit structure. The binary threshold is fixed.

Report accuracy, Brier score, cross-entropy and positive-proposal fraction for both, alongside unchanged Draft 4 trajectory metrics. Record paired decision disagreement and which model wins on cases where their classifications differ. Repeat the exact script to verify byte-identical result output. The code must assert held-out episodes are generated only after the fitted gate is trained.

## Interpretation

If either full-history rival matches or exceeds the trajectory gate, the restricted Draft 4 trajectory lead is not a standalone benefit. If the trajectory still leads, that remains a synthetic feature-inductive-bias finding under one fixed generator, not new Shannon information or continual-learning superiority. Do not erase Draft 4's adverse boundaries. No biological, persistent-learning, or publication claim follows from this follow-up.
