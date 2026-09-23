# Persistent receiving, learned cross-view reconstruction and active query

This is a connected engineering testbed and conventional active-sensing comparison, not a completed fly simulation or a full SAN/PWD/NAPOT implementation. It advances an explicit source requirement: use a reconstructed relation to choose a revealing observation, then revise through actual evidence and movement.

## Actual data path

```text
Public calibration + cued multiview teaching
                  |
                  v
      retained receiving readout + cross-view prototypes
                  |                         |
source-shaped samples -> persistent banks -> reconstruction -> movement/query
          ^                   |                  ^                  |
          |                   | prior state      |                  v
          +--- new actual view/body position <-- executed action and return

world truth + complete saved trace -> external evaluator only
```

The same internal candidate relation supplies movement selection and expected query value. Predicted additional views are not inserted as observed data. Changing only the learned unobserved-view associations changes the query while preserving current-view reception; restoration without retraining restores it. This is causal use, not an investigator's decoded picture being fed back as an answer.

## Concrete model ownership

- Input uses the previously audited four-by-four ERG-shaped kernel. The new object surfaces and view geometry are engineered, not the previous artificially aliased spectra and not a measured natural scene.
- Each of two instrument bins has a persistent five-state bank: four population-type rate deviations and one pooled Dm9-like deviation. The four type channels are grouped into pale R7/R8 and yellow R7/R8 pairs. A pooled state is not a reconstructed anatomical cell, and this is not a single ommatidium containing all four types.
- Direct paired inhibition, opposing inputs to the pooled state and positive output are sign-structured hypotheses informed by the audited sensory pathway. Magnitudes, baseline, pooling and all time units are engineering choices. The state does not reset between views. Missing samples supply zero drive without an object-identity update; this is a declared instrument convention.
- Public calibration learns a ten-feature linear receiving inverse from 512 input presentations. Thirty-six cued type/view/intensity presentations learn a four-type, three-view repertoire. This is supervised numerical familiarization, not animal learning or proof of morphological memory. The direct comparator receives the same public evidence and uses learned raw-input view prototypes.
- The inverse sees the bank's previous internal five-state vector and its current four outputs. This generous internal-state access helps it recover the input. It is an engineered interface, not measured downstream biological access. Its invertibility explains the direct comparator's identical behavior.
- A surviving type set, source bin, current range, evidence times and task key form the temporary relation. A bin is an instrument address, not hidden object identity. A changed object can occupy the same bin; the binding-swap condition tests that case.
- A finite-catalog risk-reduction rule proposes a useful view when the current target relation is unusable. That rule is conventional. A separate fixed-cycle survey is a competent baseline; disabling the query route is a causal ablation, not a competing scientific theory.
- A virtual surface sampler supplies different views without pretending to render full three-dimensional optics. Translation uses the existing style of bounded 1D actuator. Issued displacement, actual displacement, requested view and applied view are separately recorded. No drone or device command is issued.
- Retained actuator gain changes through measured movement. Other learned coefficients stay frozen during main episodes. The reacquired Ort case receives a separate teacher session and starts with altered reception; it is not an acute-lesion rescue with otherwise identical history.
- The command-as-return case changes only the displacement used for relation/odometry. It still supplies measured movement to retained gain calibration; it is not an ablation of all body-return information.

## Complete state and authority

Persistent settings: declared receptor/rate coefficients, feature/readout rules, matching tolerances, public task/actuator limits, perception/query/return policy and intervention-controlled receiving mode. Retained knowledge: learned matrix W, cross-view prototypes, key labels and actuator gain. Episode state: two five-state banks, candidate sets, source-bin ranges, evidence clocks/status, current goal, body odometry, query-step counter, query-route switch, latest relation and query-score audit.

The constructor copies only `initialGain`, `maxCommand`, `standoff`, `maxEvidenceAge` and `calibrationRate` from the world configuration. It does not retain world gain changes, scene identities, object positions, future illumination, scenario or seed. Public lesson records are not stored on the controller after W/prototypes are copied. The evaluator never returns an identity or correct answer to the policy. These are checked code/interface boundaries, not a security sandbox or proof that arbitrary future extensions cannot leak information.

## Status and evidence interpretation

The saved legacy-style label `observed` means **the reconstructed relation is supported by a current sample and retained cross-view knowledge**. It does not guarantee that the current sample by itself discriminates the hidden key. The analysis separately counts fresh samples whose compatible learned types all share one key. `inferred` means a previously identified relation is carried during sample absence; `unresolved` cannot support movement. These meanings must not be relabeled as fresh independent recognition on every step.

The eight wrong main-candidate bindings occur while objects exchange positions unseen. No current-sample-supported binding errors occur in the declared grid. That is not universal immunity to feature substitution or an inference that hidden changes are detected. The two-world control verifies exactly the opposite information boundary: before distinguishing evidence arrives, different hidden keys cannot change the permitted computation.

The candidate and direct comparator have equal evidence, public teaching and action limits, but different processing operations and persistent-state use. No exact compute/memory matching or biological efficiency claim is made. The fixed survey uses more queries but has slightly lower mean final standoff error, so no blanket performance dominance is asserted. All outcomes remain available, including the no-effect Ort manipulation and apparently improved aggregate outcomes under one engineered clamp.

## Physiological and broader theory gaps

The state is linear and contractive, with damped complex modes but no supplied native or self-sustained tonic oscillator; the downstream algorithm intentionally learns its inverse. The frozen plan's “not an oscillator” shorthand is qualified by the [mode audit](controls-01/EIGENMODES.json), not silently used to rule out transient ringing. No relative-phase measurement, conductance/receptor fit, real spatial surround, native optical geometry, metaplasticity or complete content-sensitive learning is supplied. This application does not replace the original full construction goal. It adds the missing learned query operation and a stronger comparison contract. Native temporal physiology, restricted biological state access, an identified PWD/NAPOT mechanism, wider learned multimodal content, held-out tests and independent review remain to be supplied.
