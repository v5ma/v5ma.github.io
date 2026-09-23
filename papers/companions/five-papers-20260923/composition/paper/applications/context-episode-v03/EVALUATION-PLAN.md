# Frozen evaluation plan — matched-context episode v03

Written before training and held-out inference. This study uses an already
constructed, inspected-for-balance synthetic benchmark; no learned results
exist at protocol creation. Six models must be fully frozen before testing.

## Main endpoints

Report final-query accuracy and negative log likelihood separately for all
six tasks, their unweighted task mean, and first-query results. Include a
training-label-only smoothed prior. Report each seed; three initializations
are not three independent empirical replications. Retain complete predicted
probabilities and true labels, plus per-background paired scores.

## Input and state controls

- Intact input and history, original labels.
- Hidden-state reset at the second scene, original labels.
- Erase old value channels, leaving coordinate, phase and cues, original labels.
- Erase current value channels, original labels.
- Coarsen both focal values to equal mixtures within their adjacent value
  bins, original labels. Other coordinates remain unchanged.
- Canonically sort the two fine focal values into old <= new, leaving all
  background coordinates and cues unchanged, original labels.
- Reverse the two complete observations and recompute both query targets.
  This is a counterfactual generalization test, not a same-target ablation.

The five destructive controls have an exact maximum of one half for final
task 5 on complete blocks under the allowed input/state boundaries. Verify
this from the actual model inputs, not only the benchmark specification.
The sixteen-class output may score below one half. These are distributional
ceilings, not confidence intervals. Coarse mixtures and masks are outside the
fine-token training distribution, so conclusions concern the declared
intervention rather than a unique cause of biological failure.

Replaying intact inputs must recover identical probabilities and states as a
deterministic consistency check, not a learned biological rescue. Later-scene
perturbations must not change the first-query prediction unless they also
modify the initial observation; answer branches never write into state.

## Frozen-state probes and role transfer

For each final role, fit an affine ridge predictor of all twelve old/new
four-valued coordinates from the frozen final hidden state alone. Use only
training targets. Select one ridge penalty per training role from
{0.01,0.1,1,10} by mean development coordinate accuracy; first grid entry
breaks ties. Fit a single 48-output linear map with an unpenalized intercept.
No hidden-state standardization. Recurrent parameters stay frozen.

Apply every selected predictor to each of the six destination roles using
the same unchanged target coordinates. Report a 6 x 6 cross-role accuracy
matrix, diagonal mean, off-diagonal mean and old/current coordinate scores.
The within-destination-role predictor provides the matched-family comparison.
All roles see the same underlying episodes in each split; this pairing is
explicit. Corresponding source/target episodes never cross split boundaries.
Archive coefficients, development selection scores and coordinate predictions.

These are restricted readout measurements, not total information estimates,
empirical V-information, or measurements of conscious richness. The study
does not include all nonlinear probe families or probe control-task learning.
Failure of affine transfer cannot establish lost content or failed neuronal
communication. Successful transfer supports reuse under this declared family.

## Uncertainty and reporting

For the primary final-task contrast, average paired multiplicative-minus-
additive differences over the three frozen seeds within each held-out
background. Bootstrap those 32 background blocks with replacement, 1,000
draws, using seed 1607; report the 2.5th and 97.5th percentiles. This is a
descriptive conditional interval for these frozen models and this constructed
background family. It omits population-level training/model uncertainty and
does not make 1,536 query instances independent experiments. Also report
the paired seed differences without hiding discordant signs.

Inspect source/model hashes before and after evaluation. Repeat into a fresh
output folder; prediction and probe archives must reproduce exactly. Retain
the first result even if a verification defect is discovered. Never refit a
model or probe using the held-out score to resolve a failed scientific outcome.
