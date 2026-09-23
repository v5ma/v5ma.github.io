# Temporal-access diagnostic, v01

September 8, 2026. Development-only follow-up to the already inspected
matched-context study. This is exploratory diagnosis, not a new held-out
success, external preregistration, or a replacement of its failed order result.
This protocol is fixed before running the diagnostic. No recurrent parameter
will change. All outputs stay in this new directory.

## Question and information boundaries

Does a weak final temporal answer coexist with a learnable rule, readable
components or a successful alternative readout? Examine only the original
training/development blocks. Load only those split arrays. The benchmark
file's whole-byte integrity hash may be checked; do not construct held-out
examples or compute any new held-out model/probe performance.

Use the six existing selected recurrent models, checked against their frozen
source/model receipts before and after execution. Report their original
training and development task scores, including temporal and reference-pair
log loss. Reuse the final-role-5 subset: 512 training and 128 development pairs.
No repeated-role expansion enters this subset. Background blocks remain
disjoint. Target rules and symbols are already familiar.

Compare four explicitly different access conditions:

1. Raw ordered focal pair: eight one-hot features from the two observed
   values. This bypasses learned memory. Run once, not six redundant copies.
2. Earlier recurrent snapshot alone: 48 features at the first scene boundary.
   The order label is exactly balanced conditional on each such state; maximum
   accuracy is 1/2. Verify equality classes of the actual snapshots.
3. Final recurrent snapshot alone: 48 features, matching the original final
   answer's state access but not its multitask supervision or answer family.
4. Both snapshots: 96 concatenated features. This adds retained earlier access,
   not merely a more expressive readout of the same final state. The existing
   model does not itself retrieve or compose this extra snapshot at test time.

Neither last-two-view performance nor dimensionality is an equal-compute
algorithm comparison. The earlier snapshot does not carry the future role,
and targets/background identifiers never enter readout features.

## Readout families

Standardize each feature using training means and population standard deviations
only; replace standard deviations below 1e-8 by one. Apply that same transform
to development data and preserve it in the archive.

- Affine ridge, directly predicting two temporal classes. Four penalties
  {0.01,0.1,1,10}; an unpenalized intercept; select by development accuracy,
  first grid value breaks ties. Ridge scores are not probabilities.
- One-hidden-layer tanh readout, width 32, two-way softmax. Two fixed probe
  seeds, 2718 and 3141, both reported rather than selecting a seed. Full-batch
  Adam for 160 epochs; learning rate 0.01, global gradient clip 5, matrix decay
  0.00001. Select by development accuracy, then lower development log loss,
  then earlier epoch. Record train/dev learning curves at every epoch. No
  extra epochs or architecture changes after this run. This is task-specialized
  readout training, not continued training of the old network.
- Factorized affine ridge: predict old and current four-way focal values
  with one eight-output map. Select the same penalty grid by average development
  component accuracy, not temporal score. Apply the supplied circular relation
  to the two decoded values. Predicted pairs with displacement 0 or 2 abstain
  and count as wrong, not as a convenient default binary answer. Report both
  component errors, pair accuracy, relation accuracy and abstention rate.

The factorized method supplies the relation rule, unlike the direct learned
binary readouts. It is a diagnostic of component accessibility, not an end-to-end
learned comparator. Exact component correctness entails relation correctness;
pointwise relation error is at most the sum of component error indicators.
Check this on all eight legal true pairs and sixteen decoded pairs and on every
reported prediction. This elementary union bound assumes no independent errors.
It does not certify neural or conscious composition.

## Negative control and interpretation

On final-state features, also fit the same two tanh probes to a balanced random
label task: independently shuffle four zeros/four ones within each background,
using seed 911 plus the block ID. Train and development mappings are separately
generated on their disjoint blocks. Do not pass IDs to the learner. This tests
memorization/spurious development performance under that artificial relabeling;
it is not the word-type control-task construction of Hewitt and Liang or their
selectivity measure. There is no external test of any selected diagnostic probe.

The original scientific motivation is the distinction between an episode's
learned components, its present assembly and its available history. A successful
probe can demonstrate a route to an answer under its declared access. A failed
probe cannot establish that all information is absent. A successful raw-pair
probe establishes that this small answer mapping can be learned under the new
specialized readout procedure, not that the original multitask optimizer should
have learned it. Access to both snapshots is an added memory resource, not proof
of a biological rendering or a SAN-specific architecture.

## Resource and verification boundary

One below-normal-priority process, one numerical-library thread, no GPU,
downloads, services or broad file discovery. Five-second cap per small tanh fit
and sixty-second cap for the diagnostic run; incomplete fits are preserved but
not marked complete. Pre-run tests cover the new gradients, normalization,
selection rules, labels, array identity and the relation-error bound. Save
source/model/data identities before fitting, keep full compact predictions and
readout parameters, and replay into a fresh directory. Previous results remain
unaltered. This is a step toward the full application, not closure of that gate.
