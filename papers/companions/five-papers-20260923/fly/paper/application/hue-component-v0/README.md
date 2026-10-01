# Hue-component v0: source-interface audit and coordinate diagnostic

19 September 2026. **A reproducible development diagnostic, not a reproduced recurrent circuit, biological replication, or completed SAN application proof.**

The authors' small public export has 6,205 pooled response rows in 14 labels: ten nominal cell types, with four additional Tm output-blocking conditions. It is sufficient to exercise a bounded data/fit/score/plot pipeline, but lacks the animal, session and trial identifiers required for independent biological uncertainty estimates. The exact encoding lineage of its signed receptor-named inputs remains unresolved.

## Review

- [Primary-source and implementation audit](../../research/HUE-COMPONENT-SOURCE-AUDIT-20260919.md)
- [Frozen, explicitly amended analysis plan](ANALYSIS-PLAN.json)
- [Input schema and source identity](TABLE-SCHEMA.json)
- [Accepted execution receipt](results-verified/EXECUTION.json)
- [Scores for all labels and both models](results-verified/scores.json)
- [Every out-of-fold prediction](results-verified/predictions.csv)
- [Partition checks](results-verified/folds.json)
- [Coordinate-invariance proof and boundaries](../../MATHEMATICAL-SUPPLEMENT-02.md)
- [Score plot](figures-reviewed/coordinate-diagnostic-r2.png)
- [All-condition prediction plots](figures-reviewed/coordinate-diagnostic-predictions.png)

## What ran

Weighted least squares on the four supplied signed coordinates was compared with a one-dimensional equal-coordinate-sum control. Neither has an intercept. We did not apply another logarithm. The equal-sum control is not certified as physical luminance. A fixed hash partition produces four folds for each of four repetitions; identical declared coordinate groups cannot cross a training/test boundary. Nearby stimuli can cross it. The already processed and normalized table is shared across folds, so the results are within-table interpolation diagnostics, not untouched experimental holdouts.

All 6,205 rows entered both models. The accepted run checked 224 cell/condition–repetition–fold partitions and saved 49,640 predictions. It passed 14 numerical/interface checks, including coordinate-change equivalence and the distinction between outgoing block and input deletion. These are software checks, not 224 experiments or 14 biological validations. The numerical analysis took 0.409 seconds with one numerical thread; no package or model installation occurred. That time excludes source retrieval, review, plot generation and validation.

The four-coordinate model's mean ordinary count-weighted out-of-fold R² ranges from 0.2521 to 0.7655 across the supplied labels. The equal-sum control ranges from -0.1713 to 0.0129. These are not the article's noise-corrected R² values. A negative ordinary R² means its squared-error denominator benchmark—the weighted mean of the scored responses—would have lower error; that denominator is not a separately trained predictive baseline. No uncertainty interval or significance test across animals is claimed. All mutant conditions were fitted separately, so their scores do not establish a causal prediction of output blockade.

This demonstrates that the local pipeline can preserve a real public-data table and report a fully specified diagnostic. It does not test whether SAN adds explanatory or predictive power. Competent nonlinear models and the original recurrent circuit are still required.

## Preserved unsuccessful steps

1. [Attempt 1](attempt-01/FAILURE.md): assumed raw captures, then stopped before fitting when negative values violated that assumption. No data were clipped or discarded.
2. [Attempt 2](attempt-02/FAILURE.md): completed calculations but failed to serialize a NumPy Boolean into its execution receipt. The incomplete `results/EXECUTION.json` is not accepted. A Boolean-only repair produced `results-verified/`; numerical artifacts must match by hash.
3. The original `figures/` set is retained as an unapproved first render: its score-plot legend overlapped the data area. The reviewed set is `figures-reviewed/`.
4. Source-download receipts preserve unsuccessful network access, the oversized article-PDF attempt and HTML challenge pages returned under PDF/CSV names. HTTP 200 was not treated as proof of a valid scientific file.

## Full component gate still open

Recover the export-generation step, the fitted 12-unit configuration, selected signs, parameter values, input/response scales and exact intervention normalization. Then reproduce a named published response or intervention with the authors' specified estimator and tolerance. This v0 diagnostic does **not** satisfy or replace that gate. If those assets cannot be obtained by bounded public reads, the next already-planned component route is the published Huang–Luo memory-interaction model; its present code-license/readme intake is not yet a reproduction either.

No Book 2, wiki, sealed final sessions, existing paper, Git remote, provider record or public catalog was changed.
