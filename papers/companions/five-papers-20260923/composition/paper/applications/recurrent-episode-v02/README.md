# Learned recurrent episode comparison v02

Completed local synthetic experiment, September 8, 2026. Six frozen main fits,
two separate development-only pilots, held-out inference, restricted probes and
exact replay. This is not a biological SAN demonstration or a reproduction of a
published recurrent-attention network.

## Read the evidence

- [Before-run protocol](PROTOCOL.md) and [configuration](CONFIG.json).
- [Development-only pilot readback](PILOT-READBACK.md).
- [Post-fit, pre-held-out evaluation plan](EVALUATION-PLAN.md).
- [Before-held-out checkpoint/source identities](evaluation-01/BEFORE-HELDOUT.json).
- [Complete results](evaluation-01/summary.json) and [aggregates](evaluation-01/AGGREGATES.json).
- [Stored paired predictions and targets](evaluation-01/predictions.npz).
- [Restricted probe parameters](evaluation-01/probe-parameters.npz).
- [36 pre-fit checks](TESTS-01.json), [18 pre-evaluation checks](EVALUATION-TESTS-01.json),
  and [15 result/replay checks](evaluation-01/AUDIT.json).
- [Exact replay](evaluation-replay-01/summary.json).
- [Plain-language result report](../../../access/432fadebd4b16ac0.md).

## Main result and its reversal

On the 1,024 primary held-out episodes, cue access during encoding improves
mean task-balanced accuracy from 0.491 to 0.774 under the same allocated size,
initial arrays and training budget. A broader task-stratified linear probe of
the final hidden state reverses the ranking: 0.580 for readout-only cues versus
0.504 for encoding-plus-readout cues. Those endpoints are different; neither
measures all information or conscious experience.

History reset damages a delayed-pair answer but improves several current-scene
answers. Temporal-order accuracy remains weak, and the encoding-cue model's
order log loss is worse than the training-label prior. All these observations
are reported; main-task advantage is not universal success.

Both networks see all fine tokens. Neither learns sampling. The encoder-cue
condition has access the other condition lacks, and the readout-only encoder
has 864 allocated but unused cue weights. This is an explicit access
manipulation, not proof that a new SAN algorithm defeats modern attention.

## Frozen main fits

| Seed | Encoding-plus-readout cue | Readout-only cue |
|---|---|---|
| 1729 | [Epoch 38 selected](fit-1729-cue_in_recurrence/FROZEN.json) | [Epoch 38 selected](fit-1729-cue_at_readout/FROZEN.json) |
| 3253 | [Epoch 39 selected](fit-3253-cue_in_recurrence/FROZEN.json) | [Epoch 40 selected](fit-3253-cue_at_readout/FROZEN.json) |
| 7919 | [Epoch 39 selected](fit-7919-cue_in_recurrence/FROZEN.json) | [Epoch 37 selected](fit-7919-cue_at_readout/FROZEN.json) |

Every main fit completed 40 epochs. Each folder contains initial, selected and
final parameter arrays, a before-fit manifest, development-only epoch logs and
the frozen receipt. The three seeds share episodes and pair their initial
weights; they are not six independent biological samples.

## Source and reproduction

[The recurrent model](net.py), [world and token construction](world.py),
[training](train.py), [evaluation](evaluate.py), [metrics and utilities](support.py),
[pre-fit tests](test_recurrent.py), [evaluation tests](test_evaluation.py) and
[separate stored-result audit](audit.py) are small inspectable programs.
NumPy is the only numerical dependency. Thread counts are fixed to one and
Windows execution lowers its own process priority. There is no background
process, GPU or network call.

To reproduce the existing frozen inference, run `evaluate.py` with a fresh
direct-child `--out` name. It refuses to overwrite results and verifies the
six frozen parameter sets first. The recorded replay was executed this way;
both numeric archives are byte-identical. Training intentionally refuses to
overwrite existing fit folders. A full retraining requires a separate clean
copy of these exact source/configuration files, the same pre-fit test receipt,
and the declared six seed/condition fits, followed by evaluation tests and
post-freeze evaluation. Record new runtime and file identities rather than
silently replacing the present evidence.

The single-entity-edit challenge changes the transition construction but is
same-assistant authored. Its 740 familiar-current-scene rows are explicitly
counted. This is not independent external data. Standalone licensing,
independent implementation review and a public release remain pending.
