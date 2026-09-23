# Source-shaped spectral receiving application

19 September 2026. An executed extension of the connected development task, not a native fly simulation or biological validation of SAN.

The new sensory layer uses published ERG response shapes instead of four independent ideal bands. The rest of the receiver/action-return path is inherited unchanged. The result is useful construction progress, with no measured SAN-specific advantage.

## Review the evidence

- [Plan fixed before execution](ANALYSIS-PLAN.json)
- [Physiological source, exact cells, units and transfer limits](../../research/PHOTORECEPTOR-SOURCE-AND-TRANSFER-BOUNDARY-20260919.md)
- [342 extracted mean/SD pairs, all seven curves and cell locators](source-extraction-01/CURVES.json)
- [Frozen sensory matrix and constructed reflectances](model-01/MODEL.json)
- [Separate source/event/metric check receipt](checks-01/CHECKS.json) and [all recomputed results](checks-01/RESULTS.json)
- [Published-response plot](figures-02/PUBLISHED-SPECTRAL-CURVES.png), [synthetic outcome plot](figures-02/SPECTRAL-CLOSED-LOOP-RESULTS.png) and [visual readback](figures-02/VISUAL-READBACK.md)
- [M11: mixing, ambiguity and operation-order proofs](../../MATHEMATICAL-SUPPLEMENT-07.md)
- [What coordinate invariance does and does not establish](../../research/RECEIVER-RELATIVE-INVARIANCE-AND-SOURCE-CONTEXT-20260919.md)

## Architecture and source boundaries

Synthetic four-wavelength reflectance and illumination feed an empirically shaped receptor matrix. Only its permitted masked outputs, clock and engineered signed range cross the controller interface. Public cued examples are passed through the same matrix during familiarization. The proposed ten-node receiving dynamics and learned readout then update the internally used target relation. Its conventional action rule changes position; actual displacement returns and changes both the relation and retained actuator calibration. Evaluator scene labels and hidden actuator gain never enter the sensory payload.

The original [system context](../phase-receiver-bridge-v0/figures-02/SYSTEM-CONTEXT.png) still describes the downstream loop. Its ideal input block is replaced here; the original figure is not relabeled as a new physiological system. [Exact implementation](../../tools/spectral_receiver_bridge.py) defines the changed boundary. [One-case runner](../../tools/run_spectral_receiver_case.py), [source extractor](../../tools/extract_spectral_source.py) and [separate scalar/XML checker](../../tools/check_spectral_receiver.py) are locally runnable with the already installed runtime. They do not install anything or launch background workers.

The matrix is relative-response engineering data, not simultaneously measured receptor voltage or calibrated photon catch. Aggregate curves cannot recover individual-animal normalization, covariance, temporal kinetics, adaptation or terminal opponency. Mixing across spectral components is assumed. The access mask is engineered, not a receptor-shutdown claim. The hypothetical downstream phase dynamics, input projection and most connection signs remain exactly as previously disclosed.

## All results, including the stronger conventional reference

Each case has 24 episodes and 576 steps. The same six scenarios and four seeds were used previously, so these are development cases, not held-out evaluation. Five cases give 120 episodes and 2,880 events.

| Case | Fresh observation | Inferred | Unresolved | Exposed channel values | Maximum final standoff error |
|---|---:|---:|---:|---:|---:|
| [Phase coordinates](run-01/spectral-phase/EPISODES.json) | 460 | 92 | 24 | 3,448 | 8.33e-17 |
| [Coordinate twin](run-01/spectral-coordinate/EPISODES.json) | 460 | 92 | 24 | 3,448 | 8.33e-17 |
| [No coupling, relearned](run-01/spectral-no-coupling/EPISODES.json) | 460 | 92 | 24 | 3,448 | 8.33e-17 |
| [Conventional adaptive](run-01/spectral-reference-adaptive/EPISODES.json) | 488 | 64 | 24 | 3,392 | 8.33e-17 |
| [Conventional full](run-01/spectral-reference-full/EPISODES.json) | 456 | 120 | 0 | 4,352 | 8.82e-9 |

All observed target-binding errors are zero. The coordinate twin's 576 actions are identical to the candidate's, with a maximum signal discrepancy of 1.411e-14. The no-coupling model receives its own familiarization; do not call it an acute lesion with fixed downstream weights. The conventional adaptive reference has 28 more fresh-observation steps and uses 56 fewer exposed channel values than the candidate. Feature metrics and thresholds remain unequal, so the table is not an isolated causal test of representational superiority. Reaching the final position is not evidence of uninterrupted recognition.

The two stimuli were deliberately constructed from a coarse-map nullspace. Their coarse equality under reference illumination and full-channel separation are designed properties, not discoveries in unseen natural data. The implementation applies illumination in wavelength space before receptor mixing. Applying those same numbers after mixing gives an error up to 0.0937665 on the specified diagnostic; the wrong ordering is not used for live observations.

## Verification and resources

The checker reads the original Excel XML separately from the extraction library, verifies all 342 mean/SD pairs, and independently recomputes every permitted spectral observation, action, actual return and summary metric. It attempts 92,951 assertions, including the expected rejection points for six deliberately corrupted copies. There are no unexpected failures. Those checks are not 92,951 independent experiments or independent scientific review.

Receiver cases take 2.71–2.79 seconds apiece; the two references take about 0.058 seconds each. All run serially with one numerical thread and verified below-normal priority. The separate checker takes 0.290 seconds. Timings include unequal logging and do not establish compute-efficiency differences. Downloads total about 3 MB; no whole-brain job, model installation or large archive is involved.

The initial result-plot legend touched a bar label; [that output and failed readback](figures-01/VISUAL-READBACK.md) remain preserved. The second plot version fixes layout only. The source-curve PNG is byte-identical across the two versions.

## What is still missing

This spectral surrogate does not supply the sensory temporal reference, native receiving dynamics, full PWD through NAPOT, broader multimodal memory or calibrated uncertainty. It does not change the five sealed sessions, earlier adverse results or prior biological component claims. The next mechanistic work must connect actual receiving/timing evidence to reconstruction and action rather than treating common-coordinate invariance as a defect to defeat.
