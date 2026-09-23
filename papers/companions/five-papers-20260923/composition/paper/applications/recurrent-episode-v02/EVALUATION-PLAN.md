# Frozen-checkpoint evaluation specification

Written after development-only fitting and before held-out episode generation.
This is a recorded local protocol, not an external preregistration.

All six main fits completed the declared 40 epochs, 640 updates and 81,920
episode presentations per fit. Their selected checkpoints, chosen only from
development data, occur at epochs 38, 38, 39, 40, 39 and 37 in seed/condition
order. They are now frozen. The 5-epoch pilot models are excluded.

Every fit uses the same training and development episodes. Paired conditions
use identical initial arrays, although their permitted encoder cue differs.
Evaluation must verify file hashes, source identities and checkpoint selection
before generating test or challenge episodes. The comparison tests access to
the current cue during recurrent encoding, not an intrinsic advantage of a
named SAN algorithm. In particular the late-cue model has not had its own
separately tuned architecture or longer training schedule. A poorer result
cannot establish its capacity limit or destroy the ordinary-attention
equivalences already demonstrated in the other applications.

Four inference conditions are fixed: intact; hidden reset at the scene switch;
earlier value corruption; current value corruption. For each dataset, one
seed-27001 permutation supplies donor episodes for both value-corruption
conditions; token identities, observation order, task cues and original labels
remain fixed. Any fixed points and actual unchanged value coincidences are
reported. This is a dependence intervention under original labels, not a
counterfactual-world accuracy test. No gradients or checkpoint changes occur.

A task-and-stage prior is fitted from training-label counts with one count per
class added for finite log loss; its label choice is the training mode. This
baseline never receives a scene. Results retain all task/stage cells and all
seeds, with both frequency-weighted and cell-balanced summaries. Paired episode
outputs and log loss are stored as compact numeric arrays. Seeds share test
episodes, so rows or repeated seeds are not independent biological subjects.

Restricted linear probes use only each frozen model's final 48-dimensional
hidden vector. Separate readouts for each current task predict all twelve
old/new coordinates as 48 one-hot targets. The affine intercept is not
penalized. Hidden coordinates are not standardized; the declared penalty grid
is 0.01, 0.1, 1 and 10. Training episodes fit the probe; development mean
coordinate accuracy selects the penalty separately for each task, with ties
choosing the first/smallest listed penalty. Test and challenge episodes are
then read once. Report each coordinate, task, chosen penalty, matched
training-coordinate-mode baseline and aggregate accuracy. Probe training does
not modify the encoder or main response head.

These readouts are supervised restricted access tests, not neutral or exhaustive
decoders, Shannon information estimates, evidence of consciousness or a claim
that unpredicted distinctions are absent. No result will trigger retuning on
these held-out episodes. Follow-up changes would require a new protocol and
fresh evaluation boundary.
