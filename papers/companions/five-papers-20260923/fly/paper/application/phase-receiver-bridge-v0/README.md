# Connected receiver bridge: implementation, learned reception and limits

19 September 2026. **216 development episodes, 5,184 main events, two additional controlled episodes and five one-observation readout interventions.** All nine planned cases executed. Separate same-agent recomputation passes **8,912/8,912 checks**, including eight deliberate corruption detections. These are software/evidence checks, not independent review or animal observations.

## Start here

- [Architecture, complete state and physiological/engineering assumptions](ARCHITECTURE-AND-ASSUMPTIONS.md)
- [Plan written before the runs](ANALYSIS-PLAN.json)
- [All check results and exact source/output hashes](checks-01/CHECKS.json)
- [Learned-readout interventions](checks-01/CAUSAL-READOUT.json) and [two full-episode controls](checks-01/EXTRA-EPISODES.json)
- [Measured results](figures-02/MEASURED-BRIDGE-RESULTS.png) and [system-context diagram](figures-02/SYSTEM-CONTEXT.png)
- [Two conditional analytic proofs](../../MATHEMATICAL-SUPPLEMENT-06.md)
- [Model](../../tools/phase_receiver_bridge.py), [single-case runner](../../tools/run_phase_receiver_case.py), [separate checker](../../tools/check_phase_receiver_bridge.py)

## What is now connected

The earlier engineered spectral world now feeds a ten-unit directed phase-coordinate receiver. Fifteen reported routes between the ten anatomical seed cells constrain its included adjacency. Normalization, input projection, most signs, dynamics and time units are declared modeling choices; this is not the authors' fitted hue circuit or native fly physiology. Both disputed contact-count choices and both hypothetical settings of unknown signs are retained. Unreported/external routes are excluded by the reduction, not declared nonexistent.

Publicly cued familiarization learns a downstream receiving vector from three intensities of each task exemplar, separately for each permitted spectral mask. Its actual output changes the internally used target relation and therefore movement. No running-world identity, correct answer, position or gain is supplied to the controller. Measured body return updates that relation and retained calibration. The rest of the tracker/calibration mechanism remains conventional. The output is not merely a visualization for the investigator.

This is a partial bridge toward the stated full architecture, not a renamed completed SAN model. The imposed carrier is algebraic; relative-coordinate equations determine the actual dynamics. All patch banks are independently initialized. Native receiving compartments, the endogenous sensory tonic reference, PWD throughout NAPOT, broader multimodal learned content and the full learning hierarchy remain open.

## Findings that must travel together

In the declared one-observation control, intact learned weights select +0.4 movement, erasure gives zero, swapping the two learned associations gives -0.4, and restoring the actual saved weights restores +0.4. Flattening the differential before the learned readout also gives zero. In a full flattened episode, all 24 states remain unresolved and the final standoff error is 3.55 units. This establishes causal use of the particular representation and learned readout, not a unique neural mechanism.

The matched coordinate-only implementation produces **exactly the same 576 actions** as the base phase-labelled case. Its largest signal discrepancy is 1.366e-14. It integrates the same relative-state dynamics without forming an absolute oscillator. Removing recurrence also preserves task performance, even though some internal coordinates change. Neither the absolute carrier nor recurrent coupling is established as necessary by this benchmark. This result concerns this deliberately small reduction; it does not overturn the primary literature's recurrence-dependent hue results or test the full SAN claim.

All candidate variants have zero observed target-binding error on these 24 deterministic cases, with final standoff error below 1e-15. But colored illumination still produces alternating observed/inferred states: 12 observed steps over the 24-step adverse episode, rather than continuous recognition. The legacy adaptive template reference has 5 observed steps in that episode; the full-sampling template reference has 6. Different feature metrics and acceptance rules confound any attribution of that difference to phase. Both the coordinate twin and zero-coupling version reproduce the candidate outcome. There is no biological color-constancy or uniquely oscillatory advantage claim.

Halving the integration step changes endpoint phase by at most 1.1052e-11 radians over the paired cases. A separately written scalar Euler calculation differs by at most 2.2073e-6 radians for two specified full-band observations. These checks concern numerical agreement within this model; no sensory time constant was measured or borrowed from the motor reproduction. Scoped reset preserves the learned readouts and a return-learned gain of 0.625 while clearing temporary relation/cache state. That does not establish biological long-term memory or metaplasticity.

## Every case, without selecting the best one

| Case | Purpose | Exact outputs |
|---|---|---|
| Lower counts, positive unknown signs | Declared reference candidate | [24 episodes](run-01/phase-low-positive/EPISODES.json), [receipt](run-01/phase-low-positive/EXECUTION.json) |
| Upper counts, positive unknown signs | First anatomical uncertainty comparison | [episodes](run-01/phase-high-positive/EPISODES.json), [receipt](run-01/phase-high-positive/EXECUTION.json) |
| Lower counts, negative unknown signs | Hypothetical sign sensitivity | [episodes](run-01/phase-low-negative/EPISODES.json), [receipt](run-01/phase-low-negative/EXECUTION.json) |
| Upper counts, negative unknown signs | Joint count/sign sensitivity | [episodes](run-01/phase-high-negative/EPISODES.json), [receipt](run-01/phase-high-negative/EXECUTION.json) |
| No coupling | Recurrence removal, with its own cued familiarization | [episodes](run-01/phase-no-coupling/EPISODES.json), [receipt](run-01/phase-no-coupling/EXECUTION.json) |
| Half step | Integration sensitivity | [episodes](run-01/phase-half-step/EPISODES.json), [receipt](run-01/phase-half-step/EXECUTION.json) |
| Coordinate twin | Equivalent dynamics without an absolute carrier | [episodes](run-01/coordinate-twin/EPISODES.json), [receipt](run-01/coordinate-twin/EXECUTION.json) |
| Conventional adaptive | Earlier nonoscillatory template comparison | [episodes](run-01/reference-adaptive/EPISODES.json), [receipt](run-01/reference-adaptive/EXECUTION.json) |
| Conventional full sampling | Strong full-information-acquisition reference | [episodes](run-01/reference-full/EPISODES.json), [receipt](run-01/reference-full/EXECUTION.json) |

Recurrence-removal performance is **not** a zero-refit intervention: familiarization runs with that case's altered encoder. It shows that these tasks can be solved without recurrence under matched teaching information. Learned-weight swap/erase/restore and differential flattening instead intervene after familiarization. These are different questions and must not be conflated.

Candidate cases took 1.93–3.96 seconds each; the coordinate twin 2.09 seconds; template cases about 0.05 seconds each. These times include familiarization and different-sized evidence serialization and are not a controlled processor-efficiency study. All used one numerical thread and verified below-normal process priority. The checker took 1.61 seconds. No installation, download, background worker or broad search was needed for the application.

## Visual and scientific review status

The first context diagram had an arrow crossing two labels. It is preserved in `figures-01` with an explicit failed visual readback. The current `figures-02` diagram was rerouted and visually checked; the measured graph is byte-identical to its first version. No data or case output was changed. Mathematical, software and visual checks here belong to the same authoring workflow. Independent reviewers, held-out evaluation, final approved-format PDF and publication clearance remain outstanding.
