# Native author-output reference: fly-memory model

19 September 2026. **240 saved native MATLAB point predictions reproduced**, with a maximum absolute difference of 9.77 × 10⁻¹⁵ Hz. This is an external numerical reference for the local implementation, not a new animal experiment, native MATLAB execution here, or complete reproduction of the paper's uncertainty figure.

## What was compared

The authors' commit-pinned repository contains four April-2024-labelled `.fig` files and matching two-/three-module parameter files under `matlab_code/model_fitting/figures`. The files encode the numerical curves and experimental error bars directly. Their raw MATLAB data structures were decoded without executing embedded callbacks, function workspaces or external code.

Curve identity came from exact neuron titles, red/blue CS+/CS− colours and object type: dashed line objects hold model predictions, and error-bar objects hold observations. No curve was assigned by finding a close numerical match. All six stages, both stimulus roles, both contexts and every included population were retained.

| Matching source configuration | Points | Maximum absolute error (Hz) | RMS error (Hz) |
|---|---:|---:|---:|
| Two modules, fitting schedule | 96 | 9.76996 × 10⁻¹⁵ | 1.35974 × 10⁻¹⁵ |
| Three modules, fitting schedule | 144 | 1.77636 × 10⁻¹⁵ | 1.48030 × 10⁻¹⁶ |

The preregistered local comparison tolerance was 10⁻⁸ Hz. Here “preregistered” means a saved local plan before reading the numerical curves, not a third-party public registration. Sixteen sensitivity runs took 0.112 seconds on one numerical thread. The source figures' means and symmetric SEMs also match the previously extracted workbook values, including missing entries.

The apparent March/April parameter distinction is only a file-version distinction for this calculation: all 16 two-module and 23 three-module `para_mu` values, and their expanded parameter cells, are exactly identical. This is one parameter set per model, not evidence from two independent fits. All source bytes and versions remain preserved.

The Figure 5c timing schedule does **not** reproduce these fitting figures: the maximum point differences are 4.28470 Hz and 4.14192 Hz. Both schedules remain in the comparison. We did not refit parameters or select a protocol by its agreement with experimental observations.

## Evidence

- [Frozen comparison plan](ANALYSIS-PLAN.json)
- [Decoded native curves, parameters and source hashes](../../../access/be448eeabfc80f2a.md)
- [Execution receipt](results-01/EXECUTION.json)
- [All 960 sensitivity-comparison rows](results-01/POINT-COMPARISONS.csv)
- [All eight parameter-label/model/schedule summaries](results-01/STATISTICS.json)
- [Source observation and error-bar readback](results-01/OBSERVATION-READBACK.json)
- [All sixteen saved state trajectories](results-01/TRAJECTORIES.json)
- [Separate readback: 1,428/1,428 checks](results-01/SEPARATE-CHECKS.json)
- [Source files and access receipts](../../../access/271207795b88f439.md)
- [Unchanged original local model and controls](../memory-component-v0/README.md)
- [Source/method interpretation](../../research/NATIVE-MEMORY-REFERENCE-AUDIT-20260919.md)

The separate checker reads the raw `.fig` structures, parameter files, output hashes, saved trajectories and every numerical comparison row without importing either replay script. It is a different software path, not an independent human or scientific review. Existing v0 replay code and results are unchanged.

## Claim boundary

This result closes **point-curve implementation agreement with an author-saved native reference**. It does not close the 10,000-sample median/uncertainty figure, parameter-optimization rerun, full membrane-ODE reproduction, held-out biological validation, complete connectome import, or SAN-specific connected-application gates. The saved files are numerical outputs of the authors' model, not new recordings from flies.

## Re-running without overwriting evidence

The extraction, comparison and separate-check scripts deliberately refuse to overwrite their output files. Reproduce in a copied packet with a fresh output destination, retaining the frozen inputs and code hashes. The extraction/check require the already-installed SciPy environment; replay uses the unchanged v0 model. All small runs were serialized and used one numerical thread. No new installation, optimizer, large dataset or GPU was used.

Source attribution: Junjie Luo, Cheng Huang and Mark J. Schnitzer, [Luo_Huang_2024_MB_model at commit 5d7c08a](https://github.com/schnitzer-lab/Luo_Huang_2024_MB_model/tree/5d7c08a9a88f923169a0c3008aca68af421e9a7f). Source licensing is GPL-3.0-or-later; the final distributable must include the applicable license and adaptation notices. This local packet is not yet a public release.
