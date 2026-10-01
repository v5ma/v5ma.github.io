# Persistent receiving and learned multiview query

19 September 2026. Connected engineering evidence, not a native Dm9 fit, full SAN simulation, new animal-data analysis or held-out confirmation.

- [Frozen development specification](ANALYSIS-PLAN.json)
- [Architecture, exact state and assumptions](ARCHITECTURE-AND-ASSUMPTIONS.md)
- [All-case results and per-episode metrics](checks-01/RESULTS.json)
- [Separate scalar checker and eight corruption detections](checks-01/CHECKS.json)
- [Causal query, memory, hidden-world and interface controls](controls-01/CONTROLS.json)
- [Damped-mode clarification](controls-01/EIGENMODES.json)
- [Measured result chart](figures-02/MULTIVIEW-RESULTS.png)
- [System-context diagram](figures-02/SYSTEM-CONTEXT.png) and [visual readback](figures-02/VISUAL-READBACK.md)
- [M13: conditional receiving inverse and query-risk proof](../../MATHEMATICAL-SUPPLEMENT-09.md)
- [Model and controller source](../../tools/multiview_query.py), [runner](../../tools/run_multiview_query.py), [separate scalar audit](../../tools/check_multiview_query.py)

## What now works

Two receiving banks retain state across successive observations. Public calibration learns a state-conditioned readout; cued examples acquire a cross-view repertoire. A partial view supports candidate object relations. The candidate set selects an additional view, whose actual returned sample can resolve the relation and change movement. Actual body movement updates the same relation and retained actuator calibration. Hidden world labels are excluded from policy inputs.

Eleven frozen cases × six scenarios × four seeds produce **264 main development episodes and 6,336 saved steps**. The same-agent scalar audit recomputes receiving updates, readout, candidate sets, query partitions/choice, movement, actual return and recorded state. Its 348,398 assertion calls include the expected failures in eight deliberate corruption tests; this number is not a count of experiments or independent reviews. Forty-two additional control checks include twelve private-label/order permutation pairs and distinct hidden-world and learned-memory tests. These control reruns are not added to the 264-episode count.

The intact candidate's first query chooses the model-informative view in 24/24 development episodes. Swapping only retained unobserved-view associations changes the query; restoration without training restores it. Distinct hidden-key worlds produce identical pre-query states and actions, then diverge after a genuinely informative returned view. These are causal software results.

## Complete comparison, including limits

| Condition | Current-sample/history-supported steps | Inferred | Unresolved | Queries | Mean final standoff error |
|---|---:|---:|---:|---:|---:|
| Persistent receiving + learned query | 473 | 24 | 79 | 53 | 0.593333 |
| Direct learned active-query comparator | 473 | 24 | 79 | 53 | 0.593333 |
| Query route cut | 0 | 0 | 576 | 0 | 3.045833 |
| Query route restored at step 12 | 230 | 0 | 346 | 40 | 0.776563 |
| Fixed survey, stopping on usable relation | 455 | 24 | 97 | 97 | 0.562708 |
| Acute inhibitory-input removal | 473 | 24 | 79 | 53 | 0.593333 |
| Acute cell clamp | 477 | 24 | 75 | 75 | 0.485000 |
| Acute output disconnection | 445 | 24 | 107 | 81 | 0.601667 |
| Input route restored | 473 | 24 | 79 | 53 | 0.593333 |
| Separately reacquired altered-input model | 473 | 24 | 79 | 53 | 0.593333 |
| Command used for relation/odometry return | 473 | 24 | 79 | 53 | 0.593333 |

The candidate and direct learned comparator have **identical actions**, not a candidate advantage. The fixed survey uses more queries but has a slightly lower final distance error. A clamp's favorable aggregate score is not a biological benefit or evidence for silencing neurons. Input removal has no action-level effect in this grid. The scalar checker retains all these outcomes.

The command-as-return case substitutes the command only for relation/odometry integration. Retained gain calibration still uses measured movement. Its equal aggregate outcomes are not a test removing every body-feedback path.

`observed` in the saved status field means support from a current sample **plus retained cross-view history**; it is not necessarily a newly discriminating key observation. Separate fresh-key-sample counts appear in the results. There are no current-sample-supported binding errors in the declared grid, but the intact candidate makes eight wrong inferences during unseen object swaps. Do not merge these statuses or claim universal robustness. Final distance error is in engineered position units, not fly millimetres.

The source-shaped input and proposed receiving map remain generous engineering reductions. The learned linear inverse has maximum teaching error 1.43×10⁻¹⁰ and can undo the intact receiving transform when prior internal state is available. The proof explains why equivalent direct processing is possible; matching performance does not identify an indispensable receptor/phase mechanism. The model has damped complex modes, but no calibrated native clock or sustained tonic oscillation. Its plan's “not an oscillator” shorthand is explicitly qualified rather than used to exclude transient ringing.

## Reproduce without replacing existing results

The recorded preparation and all eleven cases each completed on one numerical thread at verified below-normal priority. Familiarization took 0.398 seconds; each main case took 0.423–0.520 seconds and generated approximately 2.5 MB. The scalar audit took 1.292 seconds. No network, installation, background worker, whole-brain run or sealed session was used.

The training files in [familiarization-01](familiarization-01/EXECUTION.json) are already present and pinned. From the paper root, choose a **new** run folder:

```powershell
& 'C:\Users\micah\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' -B '.\tools\run_multiview_query.py' persistent-query --run run-02-replay
```

Use each of the eleven case IDs from the frozen plan to reproduce the complete grid. Existing case directories cannot be overwritten. Do not rerun `prepare` against the existing preparation directory. These commands reproduce deterministic engineering cases, not independent experimental replications.

Native sensory kinetics, realistically restricted downstream state access, full PWD/NAPOT joining, broader multimodal learned content, metaplasticity, held-out evaluation and independent review remain open. The full research goal is not redefined around this smaller application.
