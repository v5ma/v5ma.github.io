# Matched-context recurrent episode study v03

September 8, 2026. Prospective fitting protocol, authored before any fit on
this study. It follows the v02 results and the preserved v03 benchmark
construction. It is not an external preregistration or a published-model
replication. All earlier sources, parameters and results remain untouched.

## Scientific purpose

Test whether two ordinary context-conditioned recurrent implementations can
learn an ordered relation while retaining or making accessible other episode
details. Both receive the same observations and task cues. Their additive
and multiplicative context adapters differ, but active parameter counts and
training opportunities match. Neither is designated a SAN-specific algorithm.

The design joins broad/current-detail/binding/history endpoints to the new
balanced temporal task. Symbolic channels are not actual sensory modalities,
and success is not a measurement of experience, biological PWDs or optimal
neural rendering. The same task family and familiar symbols remain in each
split; this is not held-out task discovery or independent-generator evidence.

## Data and targets

Read the hash-frozen CSV from `../ordered-event-benchmark-v03/check-01`.
Keep its 64 training, 16 development and 32 held-out background blocks.
Each block contains eight balanced old/new focal pairs. Expand every pair
across all six final tasks. Result: 3,072 training, 768 development and 1,536
held-out two-query episodes. First task is a seeded draw in 0-4 assigned to
the whole background block, independent of its focal pair and final task.
It is a legitimate supplied role cue, not an inferred intention.

Each scene contains six symbolic coordinates, each with four values:

- Task 0: current coordinate 0, four classes.
- Task 1: current coordinate 4, four classes.
- Task 2: joint coarse bins of current coordinates 0, 2, 5, eight classes.
- Task 3: fine current pair at coordinates 1, 3, sixteen classes.
- Task 4: fine reference-event pair at coordinates 0, 5, sixteen classes.
- Task 5: direction of the circular relation at coordinate 4, two classes.

At the first query, current and reference both mean the initial observation;
task 5 is excluded because the later observation has not occurred. The final
query follows the second observation and may change the task. The new final
cue is not shown during the initial scene. During each scene, six tokens
present coordinate ID, a four-way one-hot value, a scene-phase indicator and
the current six-way task cue. Tokens follow coordinate order. Targets, row
order, background IDs, displacement and split names are never model inputs.
Reset network state between episodes, not between the two scenes.

The repeated final tasks are paired queries on the same underlying cases,
not independent observations. Neither stage's target is passed back into
the network. No gradients or correctness feedback enter held-out inference.
Task 5 remains exactly label-balanced conditional on the full background,
initial role and either focal observation alone.

## Architecture and equal-information contrast

Use the established GRU/readout equations in the preserved v02 source:
48 recurrent units, 64-unit tanh answer layer, sixteen output classes, and
two branching answer evaluations sharing parameters. Both receive task cues
in the recurrent input and at the answer head. No legal-output mask or
oracle target coordinates are provided to the learned readout.

An extra learned adapter has 66 weights and 11 biases. For physical token
features x and one-hot current task q, compute a = tanh(q W + b).
The additive condition feeds x + 0.5 a to the GRU; the multiplicative
condition feeds x * (1 + 0.5 a), componentwise. Both append unchanged q.
Adapters start at zero, so paired initial predictions and hidden states
match. Every condition has 14,141 active scalar parameters. Equal count is
not proof of equal function classes, optimization difficulty or compute.
The multiplicative input interaction incurs additional operations.

The adapter is deliberately modest, not a reproduction of a published
bidirectional recurrent-gating architecture. Both implementations are strong
enough to represent context-conditioned recurrence; neither is a constant
gain strawman. The comparison cannot prove superiority over all attention
models or identify the biological control operation.

## Fit, selection and stop rule

Three paired seeds; forty epochs; batches of 128; Adam with learning rate
0.003, global gradient clipping at five and weight decay 0.00001 on matrix
parameters. Same dataset ordering per seed across conditions. Select by
development mean final-task accuracy, breaking ties with lower final-query
negative log likelihood and then earlier epoch. First-query performance
remains reported but does not determine the checkpoint. Training loss is
the mean negative log likelihood over both queries.

Before training, check gradients for every parameter tensor, cue timing,
input isolation, task labels, balanced restricted inputs, paired initial
conditions, perturbations and deterministic serialization. Save source,
configuration and dataset hashes before each fit. A fit is eligible only
after all forty epochs. A forty-five-second deadline applies to each fit;
an incomplete fit is retained as partial and cannot enter held-out testing.
No automatic hyperparameter retry or increased training after seeing the
held-out result. Freeze all six selected models before any held-out model
evaluation, retaining initial/final models and development logs.

## Evaluation fixed before learning

The companion [evaluation plan](EVALUATION-PLAN.md) is part of the pre-fit
source snapshot. Evaluate main answers, destructive/information-removing
controls and broad/cross-role probes. The old v02 test is not reopened.
All synthetic failures and ties remain results. Passing software tests does
not certify scientific novelty or a complete paper gate.

## Resources

One below-normal-priority process and one numerical-library thread; no GPU,
downloads, new services or parallel fits. Use the installed NumPy runtime.
No filesystem discovery. Retain compact per-epoch JSON and numeric model /
prediction archives, not raw command or image payloads. Independent scientific,
mathematical and implementation review remain open.
