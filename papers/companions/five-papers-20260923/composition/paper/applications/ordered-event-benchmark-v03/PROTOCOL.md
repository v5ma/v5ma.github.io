# Counterbalanced ordered-event benchmark v03

September 8, 2026. A new prospective benchmark boundary, motivated by the
already inspected v02 temporal failure. Not a new learned result, external
preregistration, full multimodal application, or replacement for v02.

## Question and construction

Can an artificial system use a relation between two observations in their
presented order, when one observation alone cannot predict the target?
This small component test belongs inside the wider episode program; it does
not operationalize the whole experienced episode.

An episode contains two six-coordinate symbolic observations. Coordinate 4
(zero-based) is the focal variable. The remaining ten coordinates across the
two observations are the background. A background block includes all eight
combinations of old focal value `a` in `{0,1,2,3}` and circular displacement
`d` in `{1,3}`. The new value is `(a+d) mod 4`; the target is 1 for displacement
1 and 0 for displacement 3. These are abstract circular values, not positions
on a linear physical scale or a model of oscillatory phase.

Use 112 distinct background blocks sampled from the finite set of `4^10`
backgrounds with seed 20260908: 64 training, 16 development and 32 held-out
blocks. All eight cases stay in their block. There are 896 episodes: 512, 128
and 256 in the respective splits. Backgrounds are disjoint; all four focal
symbols and the eight ordered focal pairs are deliberately familiar across
splits. This tests a known relation in new background combinations, not
unseen relation rules, new modalities or an independently authored generator.

The generator and split must be frozen before any learning experiment.
Construction checks inspect labels to establish balance, not model
performance. Any revised generator, split or training decision after seeing
learned evaluation results needs a new version and fresh boundary.

## Exact shortcut certificate

Within each block, each old value occurs once with each target; the same is
true of each new value. Each unordered neighboring pair occurs in both
orders, with opposite targets. Each pair of coarse bins
`(floor(old/2), floor(new/2))` also occurs once per target. Consequently, any
decoder restricted to one of those views has best accuracy 1/2 under the
uniform distribution on that block. This remains true even if the complete
background or its identifier is supplied. Averaging complete blocks
preserves the result. Randomization cannot improve a balanced binary choice.
The ordered fine pair determines the target exactly.

This is a counting argument for the declared finite distribution, not a
universal memory bound. All 256 binary readout tables on the eight fine
ordered pairs, and all 16 tables on each four-valued restricted view, are
also checked. The independent grouping calculation tests the full serialized
dataset, each split and each background block. Swapping the two observations
must reverse the target, while the background need not remain the same.

## Allowed learner interface and contamination controls

Only the two observations, their within-episode order and a separately
declared task instruction may enter a learner. Targets belong to the loss or
evaluation channel. Block IDs, case indices, split names, dataset row order,
seed and construction displacement must never be learner inputs. The
`model_view` function exposes only observations. Reset state between
episodes, shuffle training examples, and retain state between the two
observations within an episode. Do not exploit ordered CSV rows as labels.

Later training must report actual active parameter counts, context access,
observation count, memory capacity and inference budget. A cue-deprived
encoder is an information-access ablation, not the sole comparator supporting
architectural superiority. A matched-cue context-conditioned recurrent model
and a learned modulation model are substantive comparators, not gain-only
caricatures. No architecture is trained in this benchmark-construction pass.

## Interpretation of later results

Above-chance performance using the permitted input would show access to some
joint ordered relation under this distribution. It would not identify SAN,
PWDs, phenomenological richness, a persistent engram or a biological circuit.
Failure might reflect optimization, readout, representation or insufficient
training; it would not establish absent memory without additional controls.

Report per-background performance and all errors. Within-task and cross-role
probes, a capacity-matched readout comparison, targeted history interruption
and rescue belong to the larger next experiment. Perturbation scores must
state whether targets describe the original or modified episode. No v02
model is rerun or retrospectively improved by this new construction.

## Resource and evidence boundary

Standard library only; one below-normal-priority CPU process; ten-second
internal budget. No neural training, NumPy, GPU, network, dataset download,
filesystem discovery or background service. Outputs are a small CSV and
check/manifest JSON files in a newly named child folder. Existing output
folders are refused. A second invocation must reproduce the dataset and
evidence digest while retaining both runs. These are internal checks, not
independent scientific review or new Lean verification.
