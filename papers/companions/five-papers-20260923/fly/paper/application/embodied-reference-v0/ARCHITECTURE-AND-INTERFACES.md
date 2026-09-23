# Architecture and interface contract

The executable here is a **conventional nonoscillatory comparison system**. No box is relabelled as a biological neuron, PWD, NAPOT, Metatron or experienced scene. The purpose is to establish the shared connected task and inspectable causal boundaries for a later SAN implementation.

```text
Public task cue and nine controller settings
                    |
                    v
Engineered world -> instrument JSON -> temporary target relation -> action JSON
       ^                                      ^                      |
       |                                      |                      v
       +---------- actual movement ------ measured body return <--- actuator
                                              |
                                              v
                                   retained actuator calibration

World truth + saved controller trace ---> evaluator / figures
                                        (no return route to policy)
```

## Implemented roles

| Component | Actual implementation | Status |
|---|---|---|
| Optical input | Four ideal band captures: reflectance component × illuminant component; three or four bands selected | Engineered, no fly spectral sensitivity asserted |
| Spatial input | Signed distance to each detected source, without its identity | Engineered range instrument; not an inferred native fly depth channel |
| Learned cue repertoire | Two declared four-band templates, one designated as task target | Supplied task knowledge, not acquired from biological recordings |
| Receiving/selection rule | Normalized spectral distance and bounded motion correspondence | Conventional comparator; no oscillatory receiving dynamics |
| Current relation | Target-relative point estimate, observed/inferred/unresolved status, last-observed time and body odometry | Temporary state used in movement selection; no calibrated uncertainty distribution |
| Action | Bounded signed movement and next sensor mode | Engineered actuator/instrument command |
| Actual return | Measured displacement after the command | Separate permitted feedback channel; never replaced by command except in the named ablation |
| Retained calibration | Exponential update of measured displacement / nonzero command | Ordinary engineering adaptation; not the published fly-memory rule |
| Evaluation | World-relative errors, acquisition count and evidence freshness computed outside policy | Not controller input or a consciousness measure |

## Public policy boundary

Constructor settings are exactly: target template, alternative template, initial gain estimate, calibration rate, maximum command, standoff distance, spectral comparison tolerance, motion-association tolerance and maximum age of inferred information usable for movement. Scheduled gain changes, actual gain, object starting distance, occlusion schedule, illumination and scenario/seed are excluded.

An observation contains only time, sampled band indices and samples. A sample contains signed range and capture vector. No label, match, illumination-change flag, hidden position or gain is included. The body-return message contains issued command and measured displacement. An action contains command and next sampling mode. Inputs with extra top-level or sample fields are rejected.

The two reflectance templates coincide on the coarse instrument's first three bands. Selecting a fourth band supplies genuinely new evidence. Reusing a previously acquired relation for motion association is not the same as receiving a hidden identity. The separate twin-world intervention verifies that an unsensed change cannot alter the controller before new evidence arrives.

## State-reset contract

`clear_transient` clears the current relation, its status/clock, last observation, sampling mode and integrated body odometry. It retains the actuator calibration. The retention control then changes only that calibration for the prior/revert and correct/incorrect rescue cases. No optimizer or replay-buffer state exists in this small implementation.

This does not yet implement a repertoire of durable object knowledge or learned regulation of later learning. The two initial templates are supplied and fixed. Four biological memory roles must not be claimed merely because this program has two kinds of stored variable.

## Integration boundary still open

The verified Huang–Luo component is an independent odour-memory reproduction. The current hue computation is an independent published-table diagnostic. Neither is silently converted into a visual motor controller. A later adapter needs a declared physiological interpretation, timing/units, source-registered edges and separate engineering assumptions. The complete SAN model additionally needs actual tonic oscillatory reception, typed PWDs and the proposed array-to-array reconstruction—not a renamed prediction residual or this standard template controller.
