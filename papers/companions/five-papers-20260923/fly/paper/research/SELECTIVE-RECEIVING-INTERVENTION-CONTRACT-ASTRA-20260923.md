# Prospective receiving-operation intervention contract

23 September 2026. A concrete implementation-level test for review finding F04.
This is a prospective protocol and conditional model prediction, not completed
animal research, biological confirmation, an animal-use authorization or a
replacement for the full embodied construction.

## Source-faithful target and preparation boundary

The joined SAN target is learned receiving state -> consequential difference
-> internally used relation -> action -> returned evidence -> revised state.
The present intervention isolates the *first* joining: can a verified local
receiving change expose a difference lost by a fixed integration step?

Amin et al. (2020, DOI 10.7554/eLife.56954) support localized APL activity and
inhibitory consequences. Prisco et al. (2021, DOI 10.7554/eLife.74172) locate a
candidate pre-integration PN–APL–KC interaction in olfactory microglomeruli.
Neither supplies independently addressable visual input ports or the proposed
whole experiment. The [existing primary-method readback](APL-LOCAL-INHIBITION-AND-RECEIVING-CONTRACT-20260920.md)
keeps those boundaries explicit; its acquisition-status paragraph predates the
successful four-file Dryad intake, whose current status is in the manuscript.

Proposed preparation: one anatomically registered pair of PN bouton-to-KC claw
routes converging on the same *olfactory* KC, with local APL activity recorded.
Retain specimen identity and route registration. This is a tractable-source
candidate, not a claim that the exported visual LT43 routes are olfactory PNs.
Feasibility of separate route stimulation, local manipulation and simultaneous
recording must be demonstrated before collecting the confirmatory comparison.

## Claim and frozen quantities

Within a calibrated small-signal regime, let x1,x2 be independently monitored
input increments and let b1(q),b2(q) be their slopes into an early summed KC
receiving current U at fixed local inhibitory state q. U is measured in pA by
a validated current-recording preparation, averaged over a predeclared 10–50
ms post-input window. This is a prospective measurement window, not a claimed
native oscillatory timescale. Input-clamp and spatially resolved claw/APL
recordings verify localization and upstream-drive matching; calcium is not
silently converted to current. Later KC output Y is a separate measurement.

The specific hypothesis is that a verified localized receiving intervention
changes the ratio b1(q)/b2(q), rather than merely a gain or threshold *after*
their contributions have been integrated. Slopes, curvature residual bounds,
drift, measurement noise and the intervention's achieved q are estimated in a
calibration set that excludes all confirmatory paired-mixture trials. Separate
single-route stimulation tests whether the intended intervention is selective.
Reject the proposed preparation if the two routes cannot be manipulated and
measured independently; that is feasibility failure, not falsification of SAN.

Require a nonzero calibrated slope vector. Define
v=(b2(0),−b1(0))/max(|b1(0)|,|b2(0)|). Choose a>0 *during calibration*
so x±=x0±av stay inside the measured locally linear regime and input limits.
Baseline matching predicts b(0)·v=0. Calibration at q1 predicts the signed
held-out current separation

    Delta_pred(q1) = 2*a*[b1(q1)*v1 + b2(q1)*v2].

This is not an SVD-selected population claim. The exact input vector, slopes,
window, stimulation settings and calibration hashes are frozen before paired
testing. No hidden stimulus labels are inputs to the circuit or analysis model.

## Conditions, observables and competing mechanisms

Randomize interleaved x+ and x− presentations within each verified state and
use the following conditions, with washout/recovery and drift probes:

1. Baseline q0 and sham perturbation: U distributions must satisfy the frozen
   matching tolerance, not merely have similar pooled means.
2. Verified local receiving perturbation q1: measure input drives, each local
   response, early summed U, APL q and later Y separately. Do not infer a
   changed presomatic transfer solely from changed output firing.
3. A separately calibrated cell-wide post-integration gain/threshold control:
   under matched U and fixed internal state this can change response magnitude
   or spike probability, but cannot create information absent from U.
4. Feedback-route interruption and restoration, with q externally reproduced
   and measured where possible. Persistence of the early-U contrast with
   matched q tests the local operation's sufficiency; losing it only because
   q changes does not distinguish local modulation from feedback control.

Local and feedback mechanisms may coexist. A context-dependent feedback q
that differs between x+ and x− itself carries information and invalidates a
claim that the common-gain control had the same complete state. Such cases
remain a different mechanism, not a failed post-processing theorem.

The main endpoint is the within-fly paired mean current difference
Delta_U(q)=E[U|x+,q]−E[U|x−,q] in the frozen window, with the calibration-defined
sign. The secondary endpoint is distinguishability in Y and whether it depends
on actual new evidence. Neither is a consciousness measure. Input-drive,
q/state, nonlinear-residual and baseline-match checks are analyzed separately
instead of used to discard unfavorable outcome trials.

## Explicit rejection and underdetermination rules

Define delta before confirmatory collection as the larger of (i) four times
the repeat-baseline SD of the *paired* current difference and (ii) the absolute
calibration-prediction error bound including permitted curvature and drift.
The model is eligible for the discrimination test only if
|Delta_pred(q1)| > 2*delta. Size the experiment from the calibration variance
for the prespecified animal-level confidence interval width; new flies, not
repeated trials or imaging planes, are the replication units. The sample-size
calculation and resampling method must be frozen with the calibration packet.

Provided intervention, localization, state-matching and measurement acceptance
criteria pass, either of these is an explicit adverse result for the chosen
local-linear implementation:

- the animal-level 95% confidence interval for Delta_U(q1) lies within
  [−delta,+delta] despite |Delta_pred(q1)|>2*delta; or
- the confidence interval for Delta_U(q1)−Delta_pred(q1) lies wholly outside
  [−delta,+delta], including a reliably wrong predicted direction.

This rejects the declared quantitative receiving prediction in the tested
regime. It does not establish that all possible cellular SAN implementations
are absent. A failed state/drive control or inadequate precision is an
unresolved experiment, not a positive result or the stated rejection.
Equal fit by a downstream observer means the present observations do not
identify the physical implementation; it is not evidence of its absence.
If measured separation occurs only after integration and follows a changed
output threshold without the predicted early-U change, the proposed
pre-integration explanation is not supported for that preparation.

## What remains outside this operation

The protocol neither assumes a tonic frequency nor relabels calcium locality
as a PWD. A full PWD requires a measured reference and typed departure;
NAPOT requires declared cross-array reconstruction. Native visual mapping,
learned regulation, multisensory content, plasticity, intact feedback and
actual body return remain necessary joins in the whole-fly goal. A positive
local operation cannot substitute for them. The construction and model-fit
failures must remain distinct from phenomenal-experience interpretations.
