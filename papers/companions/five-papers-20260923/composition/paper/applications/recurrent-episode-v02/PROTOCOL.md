# Recurrent episode comparison v02: before-run protocol

September 8, 2026. Local synthetic development experiment, not a biological
study, independent replication or a new SAN-specific neural algorithm.

## Why this experiment

The v01 application learns symbols and macro-plan utilities but supplies its
task heads and stores exact records. This experiment replaces both the hidden
episodic representation and response rule with trained neural parameters.
It asks whether task-dependent encoding can be distinguished from a learned
readout of task-independent recurrent memory under matched observations.
The whole multimodal/temporal SAN proposal is not reduced to this toy benchmark.

The two models share a GRU and nonlinear query readout, allocated parameter
count, training data, initial weights per seed, optimizer and training budget.
`cue_in_recurrence` receives the current task cue at each observation.
`cue_at_readout` receives no task cue during encoding; both receive it at the
readout. Readout is a branch and cannot update the memory state. This is an
explicit **cue-access manipulation**, not an equal-information proof of
algorithmic superiority. Six unused encoder cue columns still count among the
second model's allocated parameters. No model is called a faithful biological
NRCT implementation or a reproduction of a published attention network.

## Observations and targets

Each episode has two scenes, each containing three entities and two four-valued
channels. Twelve observation tokens supply the entity, channel, time and fine
value, in independently permuted order within each scene. These are symbolic
channels, not visual/audio recordings. Both models observe all twelve tokens;
there is no learned sampling policy in this experiment. The separate v01
application retains its learned sampling/retrieval results.

There are two queries. The first follows the reference scene and uses one of
four tasks. A different task applies to the second scene and may be any of six
tasks. The current cue is available at the relevant phase only; the future task
is not disclosed during the first phase. Labels have the v01 interpretation:
fine coordinate 0; fine coordinate 5; three coarse bits at coordinates 2,3,4;
ordered fine pair 1,3; remembered reference pair 0,5; and decrease/equality/
increase of coordinate 4. The network receives a task ID, not a target
coordinate selection, correct answer, task-head formula or program.
Supervised labels teach the mapping. The common output alphabet has sixteen
classes with no task-specific legal-label mask.

## Split, freeze and comparison

One fixed permutation partitions the 4,096 possible scenes into 2,867 training,
614 development and 615 test states. ID episodes sample both scenes from their
assigned pool. Marginal values are familiar, but complete test scenes and
episodes are absent from training. Seed-specific weights are trained on the
same fixed episode sets to make pairing explicit.

A separate **single-entity-edit** challenge starts with an unseen reference
scene and changes one randomly chosen entity's two channels. It is a separately
implemented transition generator, authored by the same assistant, not an
independent external dataset. The edited scene may coincide with a training
scene; exact overlap counts must be reported. Complete challenge episodes are
not training episodes because their reference scenes are held out.

Only training and development data are generated during fitting. Test and
challenge inference occur after a saved frozen model receipt. The epoch with
the highest development balanced task/stage accuracy is selected; ties use
lower development negative log likelihood and then the earlier epoch.
All epochs remain in the log; final-epoch and selected-epoch identities are
distinct. No test-dependent checkpoint or hyperparameter selection is allowed.

The CONFIG declares three fit seeds and forty epochs for each of the two
models. A five-epoch, seed-101 pilot is development-only and checks execution
cost and implementation. It is not part of the final three-seed evidence.
If a fit reaches its resource limit, preserve a partial checkpoint and record
the run as incomplete; do not silently shrink the planned training budget.

## Measurements and interventions

Primary: accuracy and negative log likelihood, separately for each phase/task,
plus balanced averages. Report paired per-episode predictions and all seeds;
query-condition rows are not independent human observations. Include a
training-label-only task prior so common labels do not masquerade as learned
memory. Allocated parameter count, hidden-state bytes, training examples,
updates, runtime and stored bytes are recorded. No source-bit or energy
efficiency claim follows from float-vector size.

After freezing, compare intact inference with hidden reset at the scene switch,
and corruption of earlier or current observation values by a fixed across-
episode permutation. These corruption controls keep original targets to test
reliance on their correct evidence; they are not accurate labels for a newly
changed world. Do not infer destroyed information from one failed response.

Frozen final hidden states may additionally be tested using task-stratified
linear ridge readouts for the twelve old/new coordinates. Fit readouts only on
training states, choose a penalty on development, then test once. Queries must
not reopen the environment or recurrent encoder. These restricted probes
measure usable linear access, not all retained information or Shannon entropy.
The current task can condition the readout in both models. No global claim of
absence follows from a probe failure. If probes are not yet executed, report
that explicitly rather than treating them as part of completed evaluation.

## Implementation acceptance

Before fitting: finite-difference gradients across every parameter tensor;
probability normalization; exact input shapes; independent target tests;
split/episode identity checks; no future cue in the first phase; no target in
the input builder; readout leaves memory unchanged; and restoration from a
checkpoint gives identical predictions. Preserve failed attempts and changes.
There is no PyTorch, GPU, downloaded dataset or background process. The custom
NumPy implementation must not be trusted merely because it runs.

## Scientific comparison boundary

The [publisher methods](https://www.nature.com/articles/s41467-026-72146-9)
and [authors' repository](https://github.com/ssnio/bio-attention) are the route
for a later faithful bidirectional-recurrent-gating comparison. This GRU
benchmark does not implement that architecture, its visual datasets or its
training regimen. Its results cannot be used to claim superiority over it.

The two models here can tie or outperform each other for ordinary learning and
information-access reasons. Any such result must remain visible. More general
learned active sensing, realistic multimodal representations, independent
generators, published-model replication and neural validation remain separate
requirements of the wider paper program.
