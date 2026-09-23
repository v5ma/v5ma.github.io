# Matched-context recurrent episode application

Status: six completed, frozen fits; held-out evaluation and exact replay finished. This is a small synthetic comparison, not a new SAN algorithm, biological experiment or published-model replication.

Both models receive the same observations and role cues, have 14,141 active parameters and complete forty epochs. The additive and multiplicative context adapters are the declared contrast. They use the preserved GRU core; they do not infer an uncued task or choose their own sampling schedule.

## What happened

Mean final-task accuracy is 0.607 additive and 0.621 multiplicative, against a training-label prior of 0.224. One paired seed favors additive; two favor multiplicative. Both remain near chance on the balanced two-event relation, 0.501. Same-role coordinate readouts score 0.501 and 0.514; cross-role transfer falls to 0.306 and 0.314. These endpoints are not interchangeable measures of total information or experience.

The reference-pair response uses earlier evidence but remains weak and poorly calibrated. Its intact accuracy is 0.206/0.225, versus 0.094 for the training-label prior. Its log loss is worse than that prior: 4.773/4.257 versus 3.012. A better accuracy must not be described as uniformly better prediction. The complete task-specific losses remain in the result archive.

## Review in this order

- [Prospective protocol](PROTOCOL.md), [evaluation plan](EVALUATION-PLAN.md) and [fixed settings](CONFIG.json).
- [85 pre-fit checks](TESTS-01.json).
- [All-six-model freeze boundary](evaluation-01/BEFORE-HELDOUT.json).
- [Complete measured results](evaluation-01/RESULT.json) and [compact result summary](SUMMARY-01.json).
- [121 post-result checks](AUDIT-01.json) and [replayed result](evaluation-replay-01/RESULT.json).
- [Plain-language interpretation and claim ledger](../../../access/a35df97977cc3dbf.md).

Full arrays: [probabilities, states and targets](evaluation-01/predictions.npz), [cross-role coordinate predictions](evaluation-01/probes.npz), [probe coefficients](evaluation-01/probe-coefficients.npz). The three archives reproduce byte for byte. Repeated roles and interventions do not make independent samples.

## Frozen fits

Each folder preserves initial, selected and final weights, pre-fit hashes, initial development performance and every epoch log.

- Seed 1729: [additive receipt](fit-1729-additive/FROZEN.json), [multiplicative receipt](fit-1729-multiplicative/FROZEN.json).
- Seed 3253: [additive receipt](fit-3253-additive/FROZEN.json), [multiplicative receipt](fit-3253-multiplicative/FROZEN.json).
- Seed 7919: [additive receipt](fit-7919-additive/FROZEN.json), [multiplicative receipt](fit-7919-multiplicative/FROZEN.json).

Source entry points are [input adapter](world.py), [learned adapter and gradient](net.py), [preserved GRU core](gru_core.py), [training](train.py), [frozen evaluation](evaluate.py), [pre-fit tests](test_study.py) and [result audit](audit.py). The audit was authored after results to independently recompute arrays and arithmetic, not by an independent reviewer. The fitting/evaluation source set was fixed before fitting.

## Reproduction boundary

Do not overwrite any existing fit or evaluation directory. Run the evaluator with a new direct-child output name to reproduce the six frozen models; it checks all model, source and dataset hashes before inference. A prospective new training strategy belongs in another version with a newly frozen evaluation boundary. The test set here is now inspected.

Execution used one numerical-library thread and sequential, below-normal-priority processes, no GPU, downloads or background service. Six fits totaled 49.0 seconds; evaluation took 3.1 seconds, replay 3.0 seconds. No process remains running. Numerical/model verification is not a biological or consciousness proof. Independent scientific, mathematical and implementation review, licensing and release decisions remain open.
