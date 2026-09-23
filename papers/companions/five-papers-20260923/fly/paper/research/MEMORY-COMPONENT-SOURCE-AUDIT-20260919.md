# Huang–Luo memory-component source and implementation audit

19 September 2026. Local authoring/software audit. Not independent scientific review.

## Primary source and version

- Huang, Luo and colleagues, *Dopamine-mediated interactions between short- and long-term memory dynamics*, Nature (2024): https://doi.org/10.1038/s41586-024-07819-w. Local full-text XML: `sources/memory-component-intake-03/download/huang-luo-2024.xml`, SHA-256 `ecab3ebe9fe9917dd911a765e2ccc9d3aedf2a365327a57b51d0df1a474316d9`.
- Authors' repository: https://github.com/schnitzer-lab/Luo_Huang_2024_MB_model/tree/5d7c08a9a88f923169a0c3008aca68af421e9a7f. Commit and individual downloaded blobs are pinned in intake receipts.
- Public `.mat` parameter snapshots contain 16 fitted values in the two-module model and 23 in the three-module model, plus uncertainty samples. Only `para_mu` is used here; no refitting or sample selection occurred.
- Original `Imaging_24hr_data.xlsx`: SHA-256 `45497111f4b49a48c4d85f6ddc898c32a4090320228c27a280f96a6266cbc9d6`. Two sheets, each 18 rows × 16 columns. Unmodified. This is a summary workbook, not raw voltage recordings.

## What was read

The primary full-text model-results section, connectome/physiology discussion, computational methods, Figure 5 caption and relevant extended-data text; the entire repository README; all seven model helpers; the complete fitting script; Figure 5c/Extended Data 10j script; original-data loader; response plotter; uncertainty sampler. The supplementary mathematical derivation and native MATLAB output have **not** been obtained/read or executed here. The primary article explicitly describes a steady-state/discrete-bout approximation to a faster membrane-dynamics model; the local adaptation is that approximation, not the full ODE system.

The article uses the hemibrain v1.2.1 connectome to decide which connections enter the model (contacts below five are excluded), then fits nonzero effective strengths to physiological data rather than making contact count itself the fitted strength. Our small circuit retains those author-provided fitted parameters. It is not a new whole-connectome import, a receptor identification, or an original anatomical reconstruction.

## Observation contract

`load_original_data.m` uses MATLAB's numeric spreadsheet region, beginning at C2. Its numeric columns 1–6 and 9–14 therefore correspond to Excel C:H and K:P. Mean rows are 2, 5, 8, 11, 14 and 17; the following rows hold SEMs. Blank observations stay missing. Six neuron labels, two stimulus roles, six stages and two odour contexts give 144 possible entries, of which 86 are observed. The two-module score excludes the α2 DAN and α2 MBON, leaving 60 entries. Do not compare the two scores as if their targets were identical.

The workbook has 52 observed entries in `ACVvsETA` and 34 in `OCTvsBEN`. Article Figure 5a separately groups 40 non-α3 attractive-odour observations, 24 α3 observations across contexts, and 22 other aversive-odour observations; those are compatible totals, not a 64-versus-22 context split. Six stages are categorical protocol labels, not equally spaced times. Some neuron/context combinations have only pre-training observations. No missing post-training measurement is implied by a plotted model curve.

All observations are linked to exact worksheet cells in [the extracted audit JSON](../../access/ed0d45d98e01f949.md). Bundled openpyxl read the unmodified workbook; a separate ZIP/XML reader checked the numeric cells and blanks. The spreadsheet-reading skill's raw/processed/result separation and missing-value rules governed this intake. No workbook was exported, reformatted or recalculated.

## Algorithmic decisions preserved

1. MATLAB column-major parameter allocation, nine input parameters and each odour-context index selection were retained. Finite, signed effective KC inputs are not replaced by nonnegative synapse counts.
2. MBON firing is bounded around the authors' spontaneous baselines. DAN activity is linear in this reduced model. Negative evoked rate changes are not automatically negative absolute firing or invalid input.
3. Sensory adaptation precedes each activity readout; activity then drives anti-Hebbian weight changes; changes decay under the authors' short/long schedule; recorded activity belongs to the pre-update readout. All of these orders are preserved.
4. The original initial linear solve uses \(I-W\), while ten subsequent activity updates use \(W^T\). Both are retained. A separate topological equation path tests the result. The limited acyclic activity subgraph makes finite settling possible; learning across events remains recurrent. See [M6](../MATHEMATICAL-SUPPLEMENT-03.md).
5. The protocol generator uses the CS+ duration for both stimulus slots. The source defaults give equal CS+/CS− durations, so no difference arises here. No hypothetical unequal-duration result is claimed.
6. The line `%{imaging_curr...` does not open a MATLAB block comment because its delimiter is not alone on the line. The following imaging-selection branch is retained, consistent with [MathWorks' documented delimiter rule](https://www.mathworks.com/help/matlab/ref/blockcomment.html). No source defect is inferred from that line.
7. Rest/ISI events update adaptation and retained weights even without a currently novel input. This illustrates why a current-state transition must not be discarded merely because its external event is familiar.

## Two source timing schedules, not one silently selected protocol

The fitting script uses rest intervals of 3,600, 6,950 and 75,100 seconds, with the default ISIs. The Figure 5c script uses 3,050, 6,950 and 75,350 seconds, and sets events 4, 16, 20 and 32 to 300 seconds. Each schedule has 51 events, six shock-paired presentations and twelve imaging readouts. The local runs preserve both schedules and their complete timestamps. Neither has been declared the correct schedule of every biological measurement.

The maximum change between the schedules' corresponding local predictions is 4.284697690208414 Hz for the two-module model and 4.141917858469821 Hz for the three-module model. This is a source-configuration sensitivity, not a confidence interval or a new experimental finding.

## Results, without promotion beyond their scope

| Model / condition | Observed summaries | SEM-weighted squared error | Standardized residual RMS |
|---|---:|---:|---:|
| Two modules, fitting schedule | 60 | 112.460230 | 1.369064 |
| Two modules, figure schedule | 60 | 136.057845 | 1.505865 |
| Three modules, fitting schedule | 86 | 140.468461 | 1.278027 |
| Three modules, figure schedule | 86 | 168.729921 | 1.400705 |
| Three modules, figure schedule, plasticity removed | 86 | 1109.157823 | 3.591265 |
| Three modules, figure schedule, γ1-MBON→DAN feedback removed | 86 | 728.187697 | 2.909862 |
| Original weights restored and state reset | 86 | 168.729921 | 1.400705 |

Weights and stimulus access are otherwise unchanged in these local removal tests. Removing a mechanism from already optimized parameters is a sensitivity test, not a matched comparison with a separately optimized alternative. The restoration is a fresh deterministic replay, not proof that an ongoing damaged learner repairs itself. Neither test is new biological evidence. The original paper already establishes these model mechanisms; the adaptation is not a novelty claim for SAN.

The source's published figure uses medians and approximately 16–84% intervals from 10,000 parameter samples. Our point run uses the saved optimized parameter vector, which is not generally equal to a median prediction. We neither ran that sweep nor attach its uncertainty to our predictions. No digitized-curve or native-MATLAB comparison is claimed. Thus the status is **checked saved-parameter replay**, not full published-figure reproduction.

## Resource and provenance receipts

Fourteen small context-specific runs saved 714 event states and 1,008 output rows. Numerical replay took 0.097 seconds with one thread, below-normal process priority and a 15-second limit. 44 implementation assertions and 42 separate-readback/replay checks passed. The separate scalar path agreed within 2.842170943040401e-14 across recorded state variables; counts are software checks, not empirical confirmations. No native MATLAB/Octave executable was found on the current command path; no installation search or installation was attempted.

The source repository declares GPL-3.0-or-later. The local adaptation preserves attribution and that license notice. Its full license text remains a packaging requirement before code redistribution. The article and repository have separate provenance/license roles. No external model module was executed, large archive retrieved, provider record edited or public artifact uploaded.

## What this advances and what remains

The paper now has an executable real-model component with imported fitted state, stimulus history, local plasticity and later retention. It strengthens the reproducibility foundation and provides a competent existing model against which a later SAN-specific extension must be compared. It does not implement tonic oscillatory context, PWD phase relations, multimodal episode rendering, a learned self-model, a body-world controller or experience.

Next: recover a native reference/complete figure contract without large computation, verify the supplementary reduction, finish exact SAN genealogy and corpus ownership, specify the joined receiving-state/observation interface, and then test the SAN addition against this and other competent alternatives with frozen evaluation. Stage 4 of the works program is **partial**, not closed.
