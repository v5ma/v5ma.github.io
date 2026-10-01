# Frozen design before outcome: synthetic learned-gate preflight

22 September 2026. This protocol precedes execution of `learned_gate_preflight.py`. It is a small identification and training check, not the paper's held-out continual-learning experiment.

## Question

Can an actually fitted gate predict whether a candidate single-coordinate update will improve a latent future relation, and does a deterministic receiving trajectory add anything over the complete permitted history from which it was calculated? The historical source and full SAN mechanism are **not** being tested here.

## Generator and chronology

Use independent deterministic development and test random-number streams (seeds `41329` and `90731`). Each episode has a hidden relation coefficient `beta ∈ {-2,-1,0,1,2}`, a current feature sign `x ∈ {-1,+1}`, four *previously observed* noisy signed outcomes, and one current verified noisy outcome. The learner starts with zero weight on the relation. A candidate one-coordinate update is `c=0.5*y*x`; its true future noiseless squared-loss improvement is `beta²-(beta-c)²`. The binary benefit label is positive only if this improvement is strictly greater than zero. The gate does not receive `beta` or the benefit label on the held-out split. No model state changes are made during classification.

There are 2,400 development and 800 held-out episodes; each draws `beta` afresh. Noise is Gaussian with fixed standard deviation `1.25`. The current scalar receives `y*x`. The full-history gate receives that scalar plus the four previous signed outcomes. A diagnostic trajectory is a deterministic five-step relaxation of the current residual, with rate `0.2+0.5*sigmoid(mean(history))`; the trajectory gate receives the current scalar plus four successive signed residuals. Thus the full-history input determines the trajectory; any trajectory gain over a finite linear full-history gate is representational convenience, not new Shannon information. All three gates use the same five-slot linear logistic architecture, with absent slots zero-filled in the scalar baseline.

## Training and fixed evaluation

Fit each gate by identical batch gradient descent on the development split only: 200 epochs, learning rate 0.1, L2 coefficient 0.01, feature standardization from development statistics only, no hyperparameter search. Fix classification threshold at 0.5. Report held-out class balance, accuracy, Brier score, binary cross-entropy, and proposal fraction. Also report a majority-class baseline. A full-history *reconstruction control* must reproduce every trajectory exactly from its declared generating inputs; if it fails, the run is invalid. The code must assert independent seed separation, no hidden `beta` in model features, and that all held-out labels remain unopened until training is complete.

## Interpretation locked before run

The result can show that a learned gate is executable and whether trajectories help this restricted linear controller on a synthetic task. It cannot show continual-learning advantage, protection of old tasks, future plasticity, biological dissipation, a PWD, NAPOT, or consciousness. If the full-history gate ties or wins, retain that adverse result. If the trajectory gate wins, do **not** claim extra information: the trajectory is computed from history. A later decisive study must use a persistent learner, actual prospective write decisions, candidate rollback, independent future tests, strong published comparators, equal computation, and a new held-out stream.
