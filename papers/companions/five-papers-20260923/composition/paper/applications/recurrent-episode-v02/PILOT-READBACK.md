# Development-only execution pilot

September 8, 2026. Both predeclared seed-101 pilots completed their five epochs.
The recurrence-cue pilot took 0.563 seconds and selected epoch 5; the readout-only
cue pilot took 0.578 seconds and selected epoch 4. Development balanced accuracy
was approximately 0.347 and 0.326 respectively. These are execution and learning
sanity checks, not held-out evidence or a scientific comparison result.

All 36 pre-fit checks passed, including 39 finite-difference points distributed
across all 13 parameter tensors. These checks are assistant-authored internal
tests, not independent expert review.

The declared configuration is unchanged: three main seeds, both cue-access
conditions, 40 epochs, development-selected checkpoints, all fine observations,
the common 16-class unmasked response alphabet, and one CPU/BLAS thread at
below-normal priority. The estimated runtime is comfortably below the declared
45-second per-fit cap. No hyperparameter, target, scene split or checkpoint rule
was selected using held-out episodes. No held-out episodes have been generated
by these fitting runs.

Pilot folders are excluded from the six planned fit receipts and evaluation.
Their logs, initial/selected/final weights and receipts remain available for
inspection. These pilots did not test a published bidirectional-recurrent-
gating architecture, neural data, sampling choices or conscious experience.
